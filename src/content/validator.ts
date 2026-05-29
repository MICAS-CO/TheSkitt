import { z } from 'zod';
import {
  Arc,
  Case,
  Episode,
  type ArcRevealTriggerT,
  type ArcT,
  type CaseT,
  type EpisodeT,
} from './schema';
import { walkYaml, type LoadedFile } from './loader';

export interface ValidationIssue {
  file: string;
  path?: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  cases: number;
  episodes: number;
  arcs: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface ParsedSet {
  cases: Map<string, { file: string; data: CaseT }>;
  episodes: Map<string, { file: string; data: EpisodeT }>;
  arcs: Map<string, { file: string; data: ArcT }>;
}

export function validateContent(rootDir: string): ValidationReport {
  const report: ValidationReport = {
    ok: true,
    cases: 0,
    episodes: 0,
    arcs: 0,
    errors: [],
    warnings: [],
  };

  const parsed: ParsedSet = {
    cases: new Map(),
    episodes: new Map(),
    arcs: new Map(),
  };

  parseInto(walkYaml(rootDir, `${rootDir}/content/cases`), Case, 'case', parsed.cases, report);
  parseInto(
    walkYaml(rootDir, `${rootDir}/content/episodes`),
    Episode,
    'episode',
    parsed.episodes,
    report,
  );
  parseInto(walkYaml(rootDir, `${rootDir}/content/arcs`), Arc, 'arc', parsed.arcs, report);

  report.cases = parsed.cases.size;
  report.episodes = parsed.episodes.size;
  report.arcs = parsed.arcs.size;

  // Cross-reference validation
  for (const [, entry] of parsed.episodes) {
    const ep = entry.data;
    for (const refId of [...ep.focus_cases, ...ep.ambient_cases]) {
      if (!parsed.cases.has(refId)) {
        report.errors.push({
          file: entry.file,
          path: `episode ${ep.id} → case ref`,
          message: `references unknown case "${refId}"`,
        });
      }
    }
    for (const arcRef of ep.arcs) {
      if (!parsed.arcs.has(arcRef)) {
        report.errors.push({
          file: entry.file,
          path: `episode ${ep.id} → arc ref`,
          message: `references unknown arc "${arcRef}"`,
        });
      }
    }
    for (const ev of ep.scheduled_events) {
      const caseEntry = 'case_id' in ev ? parsed.cases.get(ev.case_id) : undefined;
      if ('case_id' in ev && !caseEntry) {
        report.errors.push({
          file: entry.file,
          path: `episode ${ep.id} → scheduled_event ${ev.id}`,
          message: `references unknown case "${ev.case_id}"`,
        });
      }
      if (ev.type === 'arc_reveal' && !parsed.arcs.has(ev.arc_id)) {
        report.errors.push({
          file: entry.file,
          path: `episode ${ep.id} → scheduled_event ${ev.id}`,
          message: `references unknown arc "${ev.arc_id}"`,
        });
      }
      // Investigation-id references must exist on the case.
      if (
        caseEntry &&
        (ev.type === 'results_back' || ev.type === 'lab_callback') &&
        !caseEntry.data.investigations.some((i) => i.id === ev.investigation_id)
      ) {
        report.errors.push({
          file: entry.file,
          path: `episode ${ep.id} → scheduled_event ${ev.id}`,
          message: `references unknown investigation "${ev.investigation_id}" on case "${ev.case_id}"`,
        });
      }
      // Required-action-id references must exist on the case.
      if (caseEntry && ev.type === 'deterioration_if_not_x_by_t') {
        for (const aid of ev.required_action_ids) {
          if (!caseEntry.data.management.some((m) => m.id === aid)) {
            report.errors.push({
              file: entry.file,
              path: `episode ${ep.id} → scheduled_event ${ev.id}`,
              message: `required_action_ids "${aid}" not found in case "${ev.case_id}" management`,
            });
          }
        }
      }
    }
  }

  for (const [, entry] of parsed.arcs) {
    for (const caseRef of entry.data.cases) {
      if (!parsed.cases.has(caseRef)) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → case ref`,
          message: `references unknown case "${caseRef}"`,
        });
      }
    }
    for (const reveal of entry.data.reveals) {
      const refCase = 'in_case_id' in reveal ? parsed.cases.get(reveal.in_case_id) : undefined;
      if ('in_case_id' in reveal && !refCase) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → reveal ${reveal.id}`,
          message: `references unknown case "${reveal.in_case_id}"`,
        });
      }
      if (refCase) {
        const issue = checkRevealRef(reveal, refCase.data);
        if (issue) {
          report.errors.push({
            file: entry.file,
            path: `arc ${entry.data.id} → reveal ${reveal.id}`,
            message: issue,
          });
        }
      }
    }
    for (const effect of entry.data.effects) {
      const refCase = parsed.cases.get(effect.on_case_id);
      if (!refCase) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → effect`,
          message: `references unknown case "${effect.on_case_id}"`,
        });
        continue;
      }
      if (
        effect.unlocks_history_id &&
        !refCase.data.history.some((h) => h.id === effect.unlocks_history_id)
      ) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → effect on ${effect.on_case_id}`,
          message: `unlocks_history_id "${effect.unlocks_history_id}" not in case history`,
        });
      }
    }
  }

  // Per-case integrity: prereq + reveal history ids exist within the same case.
  for (const [, entry] of parsed.cases) {
    const ids = new Set(entry.data.history.map((h) => h.id));
    const diagnoses = new Set(entry.data.differential.map((d) => d.diagnosis));
    const checkSupports = (path: string, supports: string[] | undefined) => {
      for (const dx of supports ?? []) {
        if (!diagnoses.has(dx)) {
          report.errors.push({
            file: entry.file,
            path,
            message: `supports references unknown differential diagnosis "${dx}"`,
          });
        }
      }
    };
    for (const h of entry.data.history) {
      for (const prereqId of h.prereq_history_ids ?? []) {
        if (!ids.has(prereqId)) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → history ${h.id}`,
            message: `prereq_history_ids references unknown history id "${prereqId}"`,
          });
        }
        if (prereqId === h.id) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → history ${h.id}`,
            message: 'history item cannot list itself as a prereq',
          });
        }
      }
      for (const revealId of h.reveals ?? []) {
        if (!ids.has(revealId)) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → history ${h.id}`,
            message: `reveals references unknown history id "${revealId}"`,
          });
        }
      }
      checkSupports(`case ${entry.data.id} → history ${h.id}`, h.supports);
    }
    for (const e of entry.data.examination) {
      for (const f of e.findings) {
        checkSupports(`case ${entry.data.id} → examination ${e.system} → ${f.name}`, f.supports);
      }
    }
    for (const ix of entry.data.investigations) {
      checkSupports(`case ${entry.data.id} → investigation ${ix.id}`, ix.supports);
      // M31: ecg_challenge_id must reference a real entry in the ECG bank.
      if (ix.ecg_challenge_id) {
        const ecgIds = loadEcgChallengeIds(rootDir);
        if (ecgIds.size > 0 && !ecgIds.has(ix.ecg_challenge_id)) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → investigation ${ix.id}`,
            message: `ecg_challenge_id "${ix.ecg_challenge_id}" not found in src/content/ecg-challenges.ts`,
          });
        }
      }
    }
    // Per-case integrity: prereq_action_ids reference real mx in the same case (M20).
    const mxIds = new Set(entry.data.management.map((m) => m.id));
    const hxIds = new Set(entry.data.history.map((h) => h.id));
    for (const m of entry.data.management) {
      for (const p of m.prereq_action_ids ?? []) {
        if (!mxIds.has(p)) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → management ${m.id}`,
            message: `prereq_action_ids references unknown management id "${p}"`,
          });
        }
        if (p === m.id) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → management ${m.id}`,
            message: 'management action cannot list itself as a prereq',
          });
        }
      }
      // M35: gated_by_history references real history items in the case.
      for (const h of m.gated_by_history ?? []) {
        if (!hxIds.has(h)) {
          report.errors.push({
            file: entry.file,
            path: `case ${entry.data.id} → management ${m.id}`,
            message: `gated_by_history references unknown history id "${h}"`,
          });
        }
      }
    }
  }

  // Topic-map cross-check: every case's topic_id must exist in
  // content/topic-map.yaml (M29). Catches typos like 'head_injry'.
  const topicMap = loadTopicMapIds(rootDir);
  if (topicMap.size > 0) {
    for (const [, entry] of parsed.cases) {
      if (!topicMap.has(entry.data.topic_id)) {
        report.errors.push({
          file: entry.file,
          path: `case ${entry.data.id}`,
          message: `topic_id "${entry.data.topic_id}" is not in content/topic-map.yaml`,
        });
      }
    }
  }

  // Soft warnings
  for (const [, entry] of parsed.cases) {
    if (entry.data.sources.length < 1) {
      report.warnings.push({
        file: entry.file,
        path: `case ${entry.data.id}`,
        message: 'no sources — every clinical claim should be cited',
      });
    }
    // Empty npc_voice strings render as orphan italic blanks — warn.
    for (const h of entry.data.history) {
      if (h.npc_voice !== undefined && h.npc_voice.trim().length === 0) {
        report.warnings.push({
          file: entry.file,
          path: `case ${entry.data.id} → history ${h.id}`,
          message: 'npc_voice is present but empty — remove the field or fill it',
        });
      }
    }
  }

  // Orphan-case warning: any case authored but not referenced in an
  // episode's focus_cases or ambient_cases (M29).
  const usedCaseIds = new Set<string>();
  for (const [, entry] of parsed.episodes) {
    for (const id of entry.data.focus_cases) usedCaseIds.add(id);
    for (const id of entry.data.ambient_cases) usedCaseIds.add(id);
  }
  for (const [caseId, entry] of parsed.cases) {
    if (!usedCaseIds.has(caseId)) {
      report.warnings.push({
        file: entry.file,
        path: `case ${caseId}`,
        message: 'orphan case — not referenced by any episode',
      });
    }
  }

  report.ok = report.errors.length === 0;
  return report;
}

function loadEcgChallengeIds(rootDir: string): Set<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    const raw = fs.readFileSync(`${rootDir}/src/content/ecg-challenges.ts`, 'utf8');
    // Scrape `id: 'ecg_xxx_yyy'` declarations — simple enough not to
    // require a TS parser at validate-time.
    const ids = new Set<string>();
    for (const match of raw.matchAll(/id:\s*'(ecg_[a-z0-9_]+)'/g)) {
      ids.add(match[1]!);
    }
    return ids;
  } catch {
    return new Set();
  }
}

function loadTopicMapIds(rootDir: string): Set<string> {
  try {
    // Lazy require so the validator doesn't crash when the topic map
    // file is absent (e.g. test-fixture tmp dirs).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('yaml') as typeof import('yaml');
    const raw = fs.readFileSync(`${rootDir}/content/topic-map.yaml`, 'utf8');
    const parsed = yaml.parse(raw) as { topics?: Array<{ id?: string }> };
    if (!parsed || !Array.isArray(parsed.topics)) return new Set();
    return new Set(parsed.topics.map((t) => t.id).filter((id): id is string => !!id));
  } catch {
    return new Set();
  }
}

function checkRevealRef(reveal: ArcRevealTriggerT, c: CaseT): string | null {
  switch (reveal.on) {
    case 'action':
      return c.management.some((m) => m.id === reveal.action_id)
        ? null
        : `action_id "${reveal.action_id}" not in case "${reveal.in_case_id}" management`;
    case 'history_asked':
      return c.history.some((h) => h.id === reveal.history_id)
        ? null
        : `history_id "${reveal.history_id}" not in case "${reveal.in_case_id}" history`;
    case 'investigation_back':
      return c.investigations.some((i) => i.id === reveal.investigation_id)
        ? null
        : `investigation_id "${reveal.investigation_id}" not in case "${reveal.in_case_id}" investigations`;
    case 'examined':
      return c.examination.some((e) => e.system === reveal.system)
        ? null
        : `examination system "${reveal.system}" not in case "${reveal.in_case_id}"`;
    default:
      return null;
  }
}

function parseInto<TSchema extends z.ZodTypeAny>(
  files: LoadedFile[],
  schema: TSchema,
  kind: string,
  bucket: Map<string, { file: string; data: z.infer<TSchema> }>,
  report: ValidationReport,
): void {
  for (const f of files) {
    const result = schema.safeParse(f.raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        report.errors.push({
          file: f.relPath,
          path: issue.path.join('.') || `(${kind} root)`,
          message: issue.message,
        });
      }
      continue;
    }
    const data = result.data as { id?: string };
    if (typeof data.id !== 'string') {
      report.errors.push({ file: f.relPath, message: `${kind} missing string id` });
      continue;
    }
    if (bucket.has(data.id)) {
      report.errors.push({
        file: f.relPath,
        message: `duplicate ${kind} id "${data.id}" (also in ${bucket.get(data.id)!.file})`,
      });
      continue;
    }
    bucket.set(data.id, { file: f.relPath, data: result.data });
  }
}
