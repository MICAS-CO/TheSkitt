import { z } from 'zod';
import { Arc, Case, Episode, type ArcT, type CaseT, type EpisodeT } from './schema';
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
      if ('case_id' in ev && !parsed.cases.has(ev.case_id)) {
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
      if ('in_case_id' in reveal && !parsed.cases.has(reveal.in_case_id)) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → reveal ${reveal.id}`,
          message: `references unknown case "${reveal.in_case_id}"`,
        });
      }
    }
    for (const effect of entry.data.effects) {
      if (!parsed.cases.has(effect.on_case_id)) {
        report.errors.push({
          file: entry.file,
          path: `arc ${entry.data.id} → effect`,
          message: `references unknown case "${effect.on_case_id}"`,
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
  }

  report.ok = report.errors.length === 0;
  return report;
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
