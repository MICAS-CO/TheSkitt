import { afterEach, describe, expect, it } from 'vitest';
import { execSync, type ExecSyncOptions } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode } from '../src/content/schema';

const ROOT = process.cwd();

function run(cmd: string): { stdout: string; stderr: string; status: number } {
  const opts: ExecSyncOptions = { cwd: ROOT, stdio: 'pipe' };
  try {
    const stdout = execSync(cmd, opts).toString();
    return { stdout, stderr: '', status: 0 };
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer; status?: number };
    return {
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
      status: err.status ?? 1,
    };
  }
}

const SCRATCH_CASE = 'case_test_scratch_dont_commit';
const SCRATCH_EPISODE = 'ep_test_scratch_dont_commit';

afterEach(() => {
  const casePath = join(ROOT, 'content/cases', `${SCRATCH_CASE}.yaml`);
  if (existsSync(casePath)) unlinkSync(casePath);
  const epPath = join(ROOT, 'content/episodes', `${SCRATCH_EPISODE}.yaml`);
  if (existsSync(epPath)) unlinkSync(epPath);
  // Also clean any leftover croup draft from new-case smoke
  const croup = join(ROOT, 'content/cases', 'case_croup_draft.yaml');
  if (existsSync(croup)) rmSync(croup);
});

describe('new-case CLI', () => {
  it('lists topics from topic-map.yaml', () => {
    const r = run('npx tsx scripts/new-case.ts --list');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('anaphylaxis');
    expect(r.stdout).toContain('ectopic_pregnancy');
  });

  it('refuses an unknown topic', () => {
    const r = run('npx tsx scripts/new-case.ts --topic this_topic_does_not_exist');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('not found');
  });

  it('writes a syntactically-valid Case YAML for a known topic', () => {
    const r = run(`npx tsx scripts/new-case.ts --topic croup --id ${SCRATCH_CASE} --triage 3`);
    expect(r.status).toBe(0);
    const path = join(ROOT, 'content/cases', `${SCRATCH_CASE}.yaml`);
    expect(existsSync(path)).toBe(true);
    const parsed = parseYaml(readFileSync(path, 'utf8'));
    // Skeleton must satisfy the Case schema
    expect(Case.safeParse(parsed).success).toBe(true);
  });

  it('inherits curriculum_tags + slos + sources from the topic map', () => {
    run(`npx tsx scripts/new-case.ts --topic anaphylaxis --id ${SCRATCH_CASE}`);
    const path = join(ROOT, 'content/cases', `${SCRATCH_CASE}.yaml`);
    const parsed = Case.parse(parseYaml(readFileSync(path, 'utf8')));
    expect(parsed.curriculum_tags).toEqual(expect.arrayContaining(['RP2', 'AP1']));
    expect(parsed.slos.length).toBeGreaterThan(0);
    expect(parsed.sources.length).toBeGreaterThan(0);
  });

  it('refuses to overwrite an existing file', () => {
    const r1 = run(`npx tsx scripts/new-case.ts --topic croup --id ${SCRATCH_CASE}`);
    expect(r1.status).toBe(0);
    const r2 = run(`npx tsx scripts/new-case.ts --topic croup --id ${SCRATCH_CASE}`);
    expect(r2.status).not.toBe(0);
    expect(r2.stderr).toContain('already exists');
  });
});

describe('new-episode CLI', () => {
  it('refuses unknown case refs', () => {
    const r = run(
      `npx tsx scripts/new-episode.ts --id ${SCRATCH_EPISODE} --title test --focus case_does_not_exist`,
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('not found');
  });

  it('writes a syntactically-valid Episode YAML wrapping an existing case', () => {
    const r = run(
      `npx tsx scripts/new-episode.ts --id ${SCRATCH_EPISODE} --title test --focus case_anaphylaxis_adult_peanut`,
    );
    expect(r.status).toBe(0);
    const path = join(ROOT, 'content/episodes', `${SCRATCH_EPISODE}.yaml`);
    expect(existsSync(path)).toBe(true);
    const parsed = parseYaml(readFileSync(path, 'utf8'));
    expect(Episode.safeParse(parsed).success).toBe(true);
  });

  it('rejects episode ids missing the ep_ prefix', () => {
    const r = run(
      `npx tsx scripts/new-episode.ts --id bad_id --title test --focus case_anaphylaxis_adult_peanut`,
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('ep_');
  });
});
