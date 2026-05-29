#!/usr/bin/env node
// Fourth-reviewer call for Braintrust 15 — visual elements consultation.
// Calls GPT-5.5 (current OpenAI frontier vision model as of 2026-05) with
// the same prompt.md + 8 screenshots that Gemini saw. Writes the response
// to openai-take.md and usage metadata to openai-usage.json.
//
// Run from repo root: node dev_loop/braintrust/15-visual-elements/openai-call.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY not set in env. Aborting.');
  process.exit(1);
}

const model = process.env.OPENAI_MODEL ?? 'gpt-5.5';
const prompt = readFileSync(join(here, 'prompt.md'), 'utf8');

const screenshotsDir = join(here, 'screenshots');
const shotFiles = readdirSync(screenshotsDir)
  .filter((f) => f.endsWith('.png'))
  .sort();

console.error(`Model: ${model}`);
console.error(`Screenshots: ${shotFiles.length}`);
shotFiles.forEach((f) => console.error(`  - ${f}`));

const imageContent = shotFiles.map((f) => {
  const b64 = readFileSync(join(screenshotsDir, f)).toString('base64');
  return {
    type: 'input_image',
    image_url: `data:image/png;base64,${b64}`,
  };
});

const body = {
  model,
  input: [
    {
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        ...imageContent,
      ],
    },
  ],
};

console.error(`Calling https://api.openai.com/v1/responses ...`);
const t0 = Date.now();
const res = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(body),
});

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.error(`HTTP ${res.status} in ${elapsed}s`);

if (!res.ok) {
  const errText = await res.text();
  console.error('Error body:', errText.slice(0, 2000));
  process.exit(2);
}

const data = await res.json();

const outputText =
  data.output_text ??
  (Array.isArray(data.output)
    ? data.output
        .flatMap((m) => m.content ?? [])
        .filter((c) => c.type === 'output_text' || c.type === 'text')
        .map((c) => c.text)
        .join('\n')
    : '');

if (!outputText) {
  console.error('No output_text in response. Full body written to openai-raw.json');
  writeFileSync(join(here, 'openai-raw.json'), JSON.stringify(data, null, 2));
  process.exit(3);
}

writeFileSync(join(here, 'openai-take.md'), outputText);

const usage = {
  model: data.model ?? model,
  status: data.status,
  usage: data.usage ?? null,
  id: data.id ?? null,
  elapsed_seconds: Number(elapsed),
};
writeFileSync(
  join(here, 'openai-usage.json'),
  JSON.stringify(usage, null, 2),
);

console.error(`Wrote openai-take.md (${outputText.length} chars) and openai-usage.json`);
