#!/usr/bin/env tsx
/**
 * scripts/new-case.ts
 *
 * Generate a Case YAML skeleton for a topic from content/topic-map.yaml.
 * The skeleton has every schema-required field, populated with TODO markers
 * where clinical decisions must be made. Pre-fills curriculum tags, SLOs,
 * and sources from the topic map so authors don't have to look them up
 * again.
 *
 * Usage:
 *   pnpm new-case --topic anaphylaxis [--id case_anaphylaxis_v2]
 *                  [--title "Anaphylaxis to wasp sting"]
 *                  [--paeds] [--difficulty CT2] [--triage 2]
 *
 *   pnpm new-case --list   # list available topic ids
 *
 * After the file is written, the script runs the content validator and
 * prints the resulting summary. The skeleton is intentionally minimal —
 * the author fills in vignette, history, exam, ix, ddx, mx, etc.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { execSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

interface CliArgs {
  topic?: string;
  id?: string;
  title?: string;
  paeds: boolean;
  difficulty: string;
  triage: number;
  list: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    paeds: false,
    difficulty: 'CT2',
    triage: 3,
    list: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--topic') out.topic = argv[++i];
    else if (a === '--id') out.id = argv[++i];
    else if (a === '--title') out.title = argv[++i];
    else if (a === '--paeds') out.paeds = true;
    else if (a === '--difficulty') out.difficulty = argv[++i] ?? out.difficulty;
    else if (a === '--triage') out.triage = Number(argv[++i] ?? out.triage);
    else if (a === '--list') out.list = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`${GREEN}new-case${RESET} — author a Case YAML skeleton`);
  console.log('');
  console.log('Usage:');
  console.log('  pnpm new-case --topic <id> [--id <case_id>] [--title <str>]');
  console.log('                [--paeds] [--difficulty <CT1..ST6>] [--triage <1-5>]');
  console.log('  pnpm new-case --list');
}

interface TopicEntry {
  id: string;
  label: string;
  tier: number;
  curriculum_codes: string[];
  slos: string[];
  paeds?: boolean;
  rationale?: string;
  sources?: { type: string; id?: string; ref?: string; url?: string }[];
  arc_hooks?: string[];
}

interface TopicMap {
  version: number;
  topics: TopicEntry[];
}

function loadTopicMap(): TopicMap {
  const path = join(repoRoot, 'content', 'topic-map.yaml');
  const text = readFileSync(path, 'utf8');
  return parseYaml(text) as TopicMap;
}

function isPaeds(t: TopicEntry): boolean {
  // topic-map.yaml may have `paeds: yes` (string under YAML 1.2) — accept both.
  return t.paeds === true || (t.paeds as unknown) === 'yes';
}

function listTopics(map: TopicMap) {
  const byTier = new Map<number, TopicEntry[]>();
  for (const t of map.topics) {
    const arr = byTier.get(t.tier) ?? [];
    arr.push(t);
    byTier.set(t.tier, arr);
  }
  for (const tier of [...byTier.keys()].sort()) {
    console.log(`${GREEN}Tier ${tier}${RESET}`);
    for (const t of byTier.get(tier)!) {
      const flag = isPaeds(t) ? ` ${DIM}[paeds]${RESET}` : '';
      console.log(`  ${t.id.padEnd(28)} ${DIM}${t.label}${RESET}${flag}`);
    }
  }
}

function sloNumber(slo: string): number | null {
  const m = /^SLO(\d{1,2})$/.exec(slo);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

function defaultCaseId(topicId: string): string {
  return `case_${topicId.replace(/-/g, '_')}_draft`;
}

function defaultTitle(topic: TopicEntry): string {
  return `${topic.label} — TODO: refine title`;
}

function formatSourceLine(s: { type: string; id?: string; ref?: string; url?: string }): string {
  const parts: string[] = [`type: ${s.type}`];
  if (s.id) parts.push(`id: '${s.id}'`);
  // ref is required by the Case schema. Topic-map entries sometimes omit
  // it (only id is given), so fill a TODO so the skeleton still validates.
  const ref = s.ref ?? `TODO: cite ${s.id ?? s.type}`;
  parts.push(`ref: '${escapeYaml(ref)}'`);
  if (s.url) parts.push(`url: '${s.url}'`);
  return `  - { ${parts.join(', ')} }`;
}

function escapeYaml(s: string): string {
  return s.replace(/'/g, "''");
}

function renderSkeleton(topic: TopicEntry, args: CliArgs): { caseId: string; yaml: string } {
  const caseId = args.id ?? defaultCaseId(topic.id);
  const title = args.title ?? defaultTitle(topic);
  const slos = topic.slos.map(sloNumber).filter((n): n is number => n !== null);
  if (slos.length === 0) slos.push(1);
  const paeds = args.paeds || isPaeds(topic);
  const tags = topic.curriculum_codes.join(', ');
  const sources = (topic.sources ?? []).map(formatSourceLine).join('\n');
  const arcHooks = (topic.arc_hooks ?? []).map((h) => `#   - ${h}`).join('\n');

  // Skeleton must satisfy the Case schema. Required nonempty fields:
  // differential, management, disposition_options, state_machine.states,
  // sources. Everything has a TODO marker.
  const yaml = `# TODO: SKELETON — author this case end-to-end against:
${(topic.sources ?? []).map((s) => `#   - ${s.type}${s.id ? ' ' + s.id : ''}${s.ref ? ': ' + s.ref : ''}`).join('\n')}
#
# Generated by scripts/new-case.ts from topic-map.yaml::${topic.id} on
# ${new Date().toISOString().slice(0, 10)}.

schema_version: 1
id: ${caseId}
title: '${escapeYaml(title)}'
chief_complaint: 'TODO: short presenting label, e.g. "?Anaphylaxis"'
topic_id: ${topic.id}

vignette: |
  TODO: 4–8 line scene-set. Where in the department, who handed the
  patient over, what the player sees on arrival, one hook that earns
  the case its atmosphere.

curriculum_tags: [${tags}]
slos: [${slos.join(', ')}]
difficulty_band: ${args.difficulty}
paeds: ${paeds}

demographics:
  age_value: 40 # TODO
  age_unit: years
  sex: female # TODO
  weight_kg: 70 # TODO
  pmh: [] # TODO
  medications: [] # TODO
  allergies: ['NKDA'] # TODO
  social: '' # TODO

triage_category: ${args.triage}
initial_state: stable # TODO: 'unseen' if arriving via new_arrival event

history:
  - id: hx_TODO
    source: patient
    topic: 'TODO: what does the player ask?'
    response: 'TODO: what does the patient/family/paramedic say?'

examination:
  - system: general
    findings:
      - { name: 'TODO: general appearance', value: 'TODO', present: true }

investigations:
  - id: ix_TODO
    name: 'TODO: investigation name'
    category: blood # one of: bedside, blood, urine, imaging, ecg, culture, gas, other
    turnaround_min: 30
    result_summary: 'TODO: cited result snippet.'

differential:
  - diagnosis: 'TODO: top diagnosis'
    likelihood: top
    discriminator: 'TODO: what feature rules this in.'
  - diagnosis: 'TODO: must-not-miss alternative'
    likelihood: must_not_miss
    discriminator: 'TODO: what feature rules this in or out.'

working_diagnosis: 'TODO: working dx'

management:
  - id: mx_a_to_e
    category: monitoring
    name: 'ABCDE assessment + monitoring'
    must_do: true
  - id: mx_TODO_drug
    category: drug
    name: 'TODO: first-line drug per the cited guideline'
    must_do: true
    drug:
      amount: 'TODO: dose'
      route: IV # IM, IV, SC, PO, PR, IN, NEB, IO, SL, topical, other
      frequency: 'STAT'
  - id: mx_TODO_trap
    category: drug
    name: 'TODO: examiner-trap action (e.g. wrong first-line drug, wrong route)'
    must_not_do: true

disposition_options:
  - label: 'TODO: correct disposition'
    criteria: 'TODO: why this is right.'
    appropriate: true
  - label: 'TODO: tempting wrong disposition'
    criteria: 'TODO: why it looks reasonable but is not.'
    appropriate: false

state_machine:
  states: [stable, deteriorating, arrested, admitted, discharged]
  transitions:
    - from: stable
      to: admitted
      trigger: { on: action, action_id: mx_TODO_drug, note: 'TODO' }

pearls:
  - 'TODO: pearl 1 (citation in line if a specific guideline number is used)'

pitfalls:
  - 'TODO: common examiner trap 1'

sources:
${sources}

${arcHooks ? `# Arc hooks suggested by topic-map.yaml:\n${arcHooks}\n` : ''}author_notes: |
  Skeleton — author the clinical content against the cited sources above.
  Every TODO marker must be resolved before this case is play-tested.
`;
  return { caseId, yaml };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  const map = loadTopicMap();
  if (args.list) {
    listTopics(map);
    process.exit(0);
  }
  if (!args.topic) {
    console.error(`${RED}✗${RESET} --topic <id> is required. Use --list to see options.`);
    printHelp();
    process.exit(1);
  }
  const topic = map.topics.find((t) => t.id === args.topic);
  if (!topic) {
    console.error(
      `${RED}✗${RESET} topic "${args.topic}" not found in content/topic-map.yaml. Use --list.`,
    );
    process.exit(1);
  }
  const { caseId, yaml } = renderSkeleton(topic, args);
  const outPath = join(repoRoot, 'content', 'cases', `${caseId}.yaml`);
  if (existsSync(outPath)) {
    console.error(
      `${RED}✗${RESET} ${outPath} already exists. Use --id to write to a different file.`,
    );
    process.exit(1);
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, yaml, 'utf8');
  console.log(`${GREEN}✓${RESET} wrote ${outPath}`);
  console.log(`${YELLOW}!${RESET} TODO markers remain — fill them in then re-run:`);
  console.log(`    pnpm validate-content`);
  console.log('');

  // Run validator immediately to surface schema issues from defaults.
  try {
    execSync('npm run validate-content', { cwd: repoRoot, stdio: 'inherit' });
  } catch {
    console.error(`${YELLOW}!${RESET} Validator surfaced issues — expected, this is a skeleton.`);
  }
}

main();
