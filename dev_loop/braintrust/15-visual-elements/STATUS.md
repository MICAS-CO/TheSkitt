# Status — Braintrust 15 — IN PROGRESS

This consultation is **pending a third-reviewer call** and is committed in
its interim state so the working tree stays clean.

## What was done

- **Prompt** authored (`prompt.md`) — visual-elements consultation question
  + 8 surface screenshots + design-system spec.
- **Screenshots** captured (`screenshots/01-..09-..png`) — playwright capture
  of the actual rendered surfaces against the production build at commit
  `05f6acc`. Script preserved as `capture-screens.mjs` for re-use.
- **Gemini Pro reviewer call** — real multimodal API call with the 8
  screenshots attached. Verdict + reasoning in `gemini-take.md`.
- **Opus voice** — orchestrator-written, philosophical register. Verdict
  in `opus-take.md`.
- **Sonnet voice** — orchestrator-written, practical / faster-verdict
  register. Verdict in `sonnet-take.md`. The user later asked to replace
  this with a real OpenAI call as the third reviewer.

## What's pending

- **OpenAI reviewer call.** The user pasted an OpenAI API key in chat
  asking to swap Sonnet for OpenAI as the third reviewer. The container's
  outbound network policy blocked `api.openai.com` (default Trusted
  allowlist doesn't include it).
- Steps for the user to unblock:
  1. **Rotate the leaked OpenAI key** on the OpenAI dashboard (it was
     pasted in plaintext in the chat transcript).
  2. **Open the env settings** (cloud icon → settings) and switch
     **Network access** from `Trusted` to `Custom`.
  3. Add `api.openai.com` to **Allowed domains**, tick "Also include
     default list of common package managers" to retain GitHub / npm /
     Anthropic / Docker Hub etc.
  4. Add `OPENAI_API_KEY=sk-proj-...` to **Environment variables**.
  5. Open a new session (env cache rebuilds ~5min one-off).
- When that lands, the orchestrator will:
  - Run a third reviewer call against `gpt-5` (or current frontier
    OpenAI model with vision) with the same prompt + screenshots,
  - Save the result as `openai-take.md`,
  - Revise `synthesis.md` to reference all three real-API + two
    orchestrator-voice reviewers.

## What the synthesis currently says

The current `synthesis.md` treats Gemini + Opus + Sonnet as the three
reviewers. The substantive convergences are robust (Phaser hub: cut;
semantic colour contract: triumph; encounter density: borderline OK;
typography: keep first three fonts, audit Caveat) and will hold under
the OpenAI revision unless OpenAI surfaces something orthogonal.

The author may choose to ship the M92-M94 sequence on the basis of
the current two-reviewer-plus-one-voice synthesis without waiting for
the OpenAI pass. Both paths are honest.
