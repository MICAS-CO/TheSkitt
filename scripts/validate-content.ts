#!/usr/bin/env tsx
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateContent } from '../src/content/validator';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const report = validateContent(repoRoot);

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

if (report.errors.length > 0) {
  console.error(`${RED}✗${RESET} ${report.errors.length} error(s):`);
  for (const e of report.errors) {
    const where = e.path ? `${e.file}  ${DIM}[${e.path}]${RESET}` : e.file;
    console.error(`  ${RED}•${RESET} ${where}`);
    console.error(`      ${e.message}`);
  }
}

if (report.warnings.length > 0) {
  console.error(`${YELLOW}!${RESET} ${report.warnings.length} warning(s):`);
  for (const w of report.warnings) {
    const where = w.path ? `${w.file}  ${DIM}[${w.path}]${RESET}` : w.file;
    console.error(`  ${YELLOW}•${RESET} ${where}`);
    console.error(`      ${w.message}`);
  }
}

const summary = `${report.cases} case(s), ${report.episodes} episode(s), ${report.arcs} arc(s)`;
if (report.ok) {
  console.log(`${GREEN}✓${RESET} ${summary}`);
  process.exit(0);
} else {
  console.error(`${RED}✗${RESET} ${summary} — validation failed`);
  process.exit(1);
}
