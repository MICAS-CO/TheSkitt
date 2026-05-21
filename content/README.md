# Content

Authored case data lives here. Populated from Milestone 2 onwards.

## Structure (planned)

```
content/
  episodes/         # Episode YAMLs (one shift each)
  cases/            # Case YAMLs (one patient encounter each)
  arcs/             # Arc YAMLs (narrative threads spanning cases)
  sources/          # Cached source summaries (NICE, RCEM, Resus Council)
  topic-map.yaml    # RCEMLearning-informed topic priority map
```

## Rules

- Every clinical fact, dose, threshold, or guideline reference must carry an
  inline citation in the YAML. If unsourced, mark `# TODO: verify`.
- Do not paste copyrighted text from books or RCEMLearning into cases.
  Vignettes are original; citations link to the source.
- Conflicts between sources (e.g. older textbook vs current NICE) are flagged,
  not silently resolved.
