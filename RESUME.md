# Resume plan — pick up here

Last activity: 2026-05-18 ~14:31 UTC. Paused at user request.

---

## Where we are

**Branch:** `claude/add-necessary-files-4THUA` (2 commits ahead of `main`,
no PR open). Branch HEAD at the time of the pause: see `git log -1`.

**What's done:**

- ✅ **Milestone 1 — scaffold.** Vite 6 + TS 5 + React 19 + Phaser 3, ESLint
  flat config, Prettier, Vitest jsdom, "Hello, ED" placeholder department
  layout, 4 passing unit tests, all docs (`README.md`, `CHANGELOG.md`,
  `DECISIONS.md`). `npm install && npm run dev` boots; `typecheck` / `test`
  / `lint` / `format:check` / `build` all green.
- ✅ **Pre-Milestone 2 content survey.** Read RCEM Curriculum 2021 v1.5
  (SLOs, full Clinical Syllabus, assessment blueprint) and surveyed the
  three project books for editorial structure and topic coverage.
  Synthesised into `content/topic-map.yaml` (27 prioritised topics, three
  tiers, tagged to RCEM codes / SLOs / UK sources / arc hooks) and three
  source summaries in `content/sources/`. No substantive text reproduced
  from books.

**What's NOT done:** everything from Milestone 2 onwards.

---

## Open items requiring user input (do NOT proceed past these without checking)

1. **Q-001 PDFs at repo root.** Four z-library scans (Wenzel, Kosoko, Oxford
   Handbook, RCEM curriculum ×2) still sit at the repo root. User said
   "I'll delete or move once you've finished processing them, let me worry
   about that." I have finished processing them for topic calibration and
   schema design (see `content/sources/`). On resume, ask: are they ready
   to move/delete now, and do they want help with the move (move to
   `.gitignore`d `sources-local/` plus a `git filter-repo` to purge
   history)?

2. **RCEMLearning credential rotation.** `mohm4216` and the email
   `mohammed.hamza@outlook.ie` are in chat history. User should rotate
   that password. I did not use the credentials (WebFetch can't form-login
   anyway; build prompt's scope for RCEMLearning is public-facing).
   Remind on resume.

3. **GitHub integration permission.** First two push attempts hit HTTP 403
   ("Resource not accessible by integration"). User pre-created the
   branch, then permissions opened and `git push` worked. **On resume,
   first action should be a no-op push test (e.g. an empty commit or a
   benign README touch) to confirm write access is still live** before
   doing real Milestone 2 work and finding out at commit time.

---

## Pickup options (ranked by my recommendation)

### Option A — Milestone 2: schemas (recommended)

Per build prompt §"Scope for this session", Milestone 2 is:

> Zod schemas for Episode + Case + Arc; sample YAML for each; validator
> CLI (`pnpm validate-content`). Schemas must accommodate everything in
> the content model — including arcs and scheduled events — from day one.

Concrete plan:

1. **Add deps** (likely): `zod`, `yaml` (or `js-yaml`), `commander` (or
   minimist) for the CLI. Maybe `chalk` for output. Keep minimal.
2. **`src/content/schema.ts`** — Zod schemas:
   - `CaseSchema` mirroring the Kosoko chapter template per DECISIONS D-006:
     `id`, `title`, `chief_complaint`, `curriculum_tags[]` (RCEM codes),
     `slos[]` (1–12), `difficulty_band` (`CT1|CT2|ST3|ST4|ST5|ST6`),
     `paeds` (bool), `sources[]` (typed citations), `vignette`,
     `history` (structured Q&A tree), `examination` (system-by-system),
     `investigations[]` (with realistic `turnaround_min`),
     `differential[]`, `working_diagnosis`, `management[]` (drugs with
     doses + procedures + disposition), `pearls[]`, `pitfalls[]` (SAQ
     examiner traps), `state_machine` (states + transitions tied to time
     and player actions).
   - `EpisodeSchema`: `id`, `title`, `learning_objectives[]`,
     `curriculum_tags[]`, `focus_cases[]` (refs), `ambient_cases[]`,
     `scheduled_events[]` (with `t_min` on shift clock, `type`,
     `payload`), `arcs[]` (refs), `difficulty_band`.
   - `ArcSchema`: `id`, `type` (enum: `family_relation` | `shared_incident`
     | `hidden_identity` | `frequent_flyer_new_pathology` |
     `recurring_npc` | other), `cases[]` (refs), `reveal_triggers[]`
     (clock-time | action | finding), `effects_on_cases[]`.
   - `ScheduledEventSchema`: `t_min` (number, mins from shift start),
     `type` (enum: `results_back` | `news2_escalation` | `new_arrival` |
     `family_arrival` | `bed_manager` | `deterioration_if_not_x_by_t` |
     ...), `payload` (discriminated union).
   - `CitationSchema`: discriminated union — `nice` / `rcem` /
     `resus_council_uk` / `bts_sign` / `rcog` / `bsped` / `jbds` /
     `toxbase` / `textbook` / `nice_cks` / `nhs` / `legislation` /
     `other` (with `ref` and optional `id`, `url`, `page`).
3. **`content/cases/anaphylaxis-adult.yaml`** — a deliberately minimal
   skeleton (not the full Milestone 3 case yet) that exercises every
   schema field, with `# TODO: verify` markers everywhere a clinical fact
   would normally go. Goal: prove the schema can hold a real case.
4. **`content/episodes/example-single-case.yaml`** and
   **`content/arcs/example-family-relation.yaml`** — same idea: exercise
   the schema, not the clinical content.
5. **`src/content/validate.ts` + `scripts/validate-content.ts`** —
   loader that walks `content/**/*.yaml`, parses with `yaml`, validates
   against schemas, resolves cross-refs (case IDs referenced in
   episodes/arcs exist), prints results, exits non-zero on any failure.
6. **`package.json` script:** `"validate-content": "tsx scripts/validate-content.ts"`
   (or use `node --experimental-strip-types` if Node 22; or compile with
   esbuild). Add `tsx` as devDep if needed.
7. **Tests:** Vitest for the schema — `tests/schema.test.ts` asserts that
   the sample YAMLs round-trip, and that deliberately-broken fixtures
   fail with helpful errors.
8. **Smoke test the CLI** via Bash before commit.
9. Update `CHANGELOG.md` and `DECISIONS.md` (the chosen schema shape,
   citation taxonomy choices, why YAML over JSON).
10. **Stop and show user.** Per build prompt rule.

**Estimated effort:** medium. Heaviest lifting is schema design — the
Kosoko template and the topic-map already constrain it heavily, so
should be tractable in one session.

### Option B — Address the open items first

If the user wants to:

- move the PDFs out of git (do this with `git filter-repo` or BFG —
  rewrites history, **needs explicit consent**, and a coordinated push
  since it force-updates `main`),
- or rotate credentials (no work from me — confirm and move on),
- or anything else surfaced in the pause.

### Option C — Repo polish before Milestone 2

Small follow-ups that aren't blocking:

- Add a GitHub Actions workflow (typecheck + test + lint + build on PRs).
- Add a `.github/PULL_REQUEST_TEMPLATE.md`.
- Add a `LICENSE` (probably proprietary "all rights reserved" given the
  source-material situation — confirm).
- Hook bundle-size budgets in `vite.config.ts` and split Phaser into a
  dynamic import to address the 1.7 MB main chunk warning.
- Add Playwright E2E config + one smoke spec (open dev server, check
  canvas renders). Currently deferred to Milestone 3 per DECISIONS D-005.

Recommend doing **A** unless the user redirects.

---

## Gotchas / reminders for resume

- **Container is ephemeral.** First action after `cd /home/user/TheSkitt`
  is `git fetch && git pull` (or fresh clone). The container at the time
  of the pause already had `npm install` run and the four PDFs in place,
  but the next container won't.
- **Lockfile is on the remote** (`package-lock.json`, 242 KB). Use
  `npm ci` rather than `npm install` for reproducible installs on resume.
- **Don't push to `main`.** All work continues on
  `claude/add-necessary-files-4THUA` (or a fresh branch off it, per
  user direction).
- **Vite + Vitest config split.** They are deliberately separate
  (`vite.config.ts` for build, `vitest.config.ts` for tests) to dodge a
  duplicate-Vite-types issue with `@vitejs/plugin-react`. Don't merge them.
- **Phaser scene tests use pure data, not jsdom Phaser.** Layout data
  lives in `src/game/layout.ts`; new game logic should follow the same
  pattern — pure module + thin scene wrapper — to keep things testable.
- **Citation rule.** Every clinical fact in a Case YAML must carry an
  inline citation. Unsourced → `# TODO: verify`. Cross-check protocol is
  in `content/sources/source-books.md`.
- **Anaphylaxis is the agreed first end-to-end case** (DECISIONS D-007).
  Milestone 2 sample YAMLs can be anaphylaxis-shaped skeletons; full
  authoring lands in Milestone 3.
- **Build prompt §"How to work with me":** stop and show the user each
  milestone before continuing. Don't run past Milestone 2 in one go.

---

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then check `npm run typecheck && npm run test && npm run lint` still
pass (sanity), and ask the user which option (A / B / C) they want.
