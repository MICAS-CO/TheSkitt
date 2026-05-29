import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface LoadedFile<T = unknown> {
  /** Path relative to repo root, e.g. "content/cases/anaphylaxis.yaml". */
  relPath: string;
  /** Absolute path on disk. */
  absPath: string;
  /** Parsed YAML body. */
  raw: T;
}

export function walkYaml(rootDir: string, baseDir: string): LoadedFile[] {
  const absRoot = resolve(rootDir);
  const start = resolve(baseDir);
  const out: LoadedFile[] = [];
  walk(start);
  return out;

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return; // missing directory is not fatal
    }
    for (const entry of entries) {
      const abs = join(dir, entry);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        const text = readFileSync(abs, 'utf8');
        let raw: unknown;
        try {
          raw = parseYaml(text);
        } catch (err) {
          throw new Error(
            `YAML parse failed in ${relative(absRoot, abs)}: ${(err as Error).message}`,
          );
        }
        out.push({
          relPath: relative(absRoot, abs),
          absPath: abs,
          raw,
        });
      }
    }
  }
}
