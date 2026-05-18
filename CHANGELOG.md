# Changelog

Format: one line per change, newest first.

## [Unreleased]

### Pre-Milestone 2 — Content survey

- Read RCEM Curriculum 2021 v1.5 (Aug 2025): TOC, all 12 SLOs (pp.17–58),
  full Clinical Syllabus (pp.59–68), assessment blueprint (pp.75–78).
  Confirmed the Clinical Syllabus is the canonical exam topic universe.
- Surveyed Oxford Handbook 5e (Wyatt et al, 2020), Wenzel Case Studies in EM
  (Springer 2023), Kosoko Obstetric Emergencies Case-Based Guide (Springer
  2024) — TOCs and editorial flavour captured in `content/sources/`.
- Attempted RCEMLearning public catalogue fetch — site returned HTTP 503 to
  automated requests; calibration relied on search-indexed page titles
  ("FRCEM SBA blueprint" guidance). The build prompt's own scope for
  RCEMLearning is public-facing topic calibration; no member content used.
- Authored `content/topic-map.yaml` — 27 prioritised topics across three
  tiers, each tagged to RCEM curriculum codes, SLOs, paeds status,
  authoritative UK sources, and narrative arc hooks.
- Authored `content/sources/rcem-curriculum-2021.md` — curriculum summary
  with the 12 SLOs and procedural skills lists.
- Authored `content/sources/rcem-clinical-syllabus-codes.md` — the full
  Clinical Syllabus topic-code list (228 codes across 26 systems).
- Authored `content/sources/source-books.md` — bibliographic metadata and
  cross-check protocol for the three project books. Kosoko's per-chapter
  structure (Case → Hx → Exam → Tests → DDx → Working Dx → Mx → Pearls) is
  flagged as the 1:1 template for the Milestone 2 Case schema.
- Recommended first end-to-end case (Milestone 3): **anaphylaxis** (codes
  RP2, AP1, AP2, AC1; SLOs 1/3/5; protocolised single-pathway management).

### Milestone 1 — Scaffold

- Add Vite + TypeScript + React 19 + Phaser 3 project skeleton.
- Add ESLint (flat config) and Prettier with EditorConfig.
- Add Vitest with jsdom environment; one smoke test for `src/game/layout.ts`.
- Add `EDScene` Phaser scene rendering a placeholder top-down ED with
  resus / majors / paeds / relatives / nurses' station / minors / triage /
  ambulatory zones, a title, a shift-start clock label, and a non-clinical-advice
  disclaimer.
- Add `PhaserGame` React component that mounts a single Phaser game instance
  via `useEffect`.
- Add `content/` directory tree (`cases/`, `episodes/`, `arcs/`, `sources/`) with
  a `topic-map.yaml` stub.
- Add `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `.gitignore`,
  `.editorconfig`, `.nvmrc`.
