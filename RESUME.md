# Resume — current state

Last activity: 2026-05-18 ~19:30 UTC. All eight build-prompt milestones
shipped on `claude/add-necessary-files-4THUA`. Continuing autonomously
per user direction ("keep going with everything you need to do … I'll be
at my pc in the morning, can check it then").

---

## What's done

### Build-prompt milestones (all 8)

| #   | Milestone               | Sha (commit subject)                                       |
| --- | ----------------------- | ---------------------------------------------------------- |
| 1   | Scaffold                | `287e00b` Milestone 1: scaffold Vite + TS + React + Phaser |
| 2   | Schemas + validator     | `9852114` Content survey + `849038c` Milestone 2           |
| 3   | First playable case     | `7bc9833` Milestone 3: adult anaphylaxis end-to-end        |
| 4   | Simulation kernel       | `372db78` Milestone 4: simulation kernel + episode shell   |
| 5   | Second case + arc       | `5ebf880` Milestone 5: ectopic + hen-do arc                |
| 6   | Episode debrief         | `43bc389` Milestone 6: episode-level debrief & scoring     |
| 7   | Content CLI             | `a7cc0fa` Milestone 7: new-case + new-episode              |
| 8   | Ambient board (stretch) | `875b4cd` Milestone 8: ambient board pressure              |

### Post-milestone polish

- `2a6f321` Code-split Phaser; CI workflow; mobile + a11y pass.
- `b462621` Playwright E2E smoke; CI runs it; report artifact on failure.

### Numbers

- 107 / 107 unit tests passing (Vitest)
- 1 / 1 E2E test passing (Playwright)
- Initial JS bundle: 479 KB (gzip 145 KB). Phaser lazy-loaded.
- Content: 6 cases, 3 episodes, 2 arcs, 27-topic high-yield map.
- All authored clinical content cites UK guidelines inline.

---

## Open items for the user

1. **Q-001 PDFs**: removed from HEAD. History still contains the blobs.
   A full purge requires `git filter-repo` + coordinated force-push —
   left gated behind explicit confirmation. Decision: history rewrite
   yes/no?
2. **Q-003 RCEMLearning credentials**: `mohm4216` is in chat history;
   rotate it.
3. **License**: no `LICENSE` file. Recommend deciding before any public
   share. Probably "proprietary, all rights reserved" given the
   topic-map references commercial textbooks.
4. **Re-validate the Hen-do shift in a real browser**: I can run
   Playwright headless, but you'll catch UX issues I can't (visual
   layout, real-time pacing, content tone) once you're at the PC.

---

## Where to pick up

If you (or future-me) want to keep building, the highest-value next
things from the build-prompt's "Defer for later sessions" list:

1. **Save system** (localStorage). Persist the kernel's `KernelState`
   between page reloads so the player can pause and resume. Map<>/Set<>
   serialisation needs a custom JSON pass; the kernel API is already
   designed deterministic, so replay is straightforward.

2. **Hub → encounter wire-up**. The Phaser ED-hub scene is still a
   static placeholder. Make the resus / minors / paeds zones clickable;
   click a bay → enter the relevant case via the same `enterCase()` the
   shift board uses. This is the "diegetic UI" the build prompt
   envisions.

3. **More cases**. The topic-map.yaml has 27 entries (9 Tier 1, 15
   Tier 2, 3 Tier 3). Sepsis / STEMI / DKA / status epilepticus all
   share the anaphylaxis-shape and would author quickly using the new
   `pnpm new-case` skeleton. Three more Tier 1 cases would justify a
   `pnpm new-shift` random-roster mode.

4. **LLM-driven flavour dialogue**. Build prompt expressly defers to
   "after the scripted experience is solid". We are now there.
   Boundaries: never on critical clinical path (dx, dose, disposition).
   Patient mood/replies for the dialogue tree only.

5. **Accessibility audit**. I've done first-pass focus styles and 600 px
   mobile breakpoint; a proper audit (screen reader, keyboard nav for
   every interaction, contrast for every state chip) would lift this
   into a publishable study tool.

6. **Bundle further**: 1.5 MB of Phaser still loads when the hub is
   opened. Could shrink by enabling Phaser's tree-shake-friendly entry
   build or vendoring only the modules in use.

---

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then `npm run dev` → http://localhost:5173 → "The hen-do" to confirm
the playthrough works.
