# Plans — mirrored bracket map (Brief 1) and match data + portraits (Brief 2)

Twelve executor-ready implementation plans derived from the two briefs in
`docs/briefs/mirrored-bracket-map/`. Each plan is self-contained: goal, verified
architecture, exact files and symbols, step-by-step order with checkpoints, traps,
automated commands, and manual acceptance criteria. Execute them in rank order
unless a plan explicitly marks itself parallel-safe.

**Program rule:** Brief 1 ends at a served preview + screenshots and a hard stop
for map approval. **No Brief 2 plan starts before that approval.** Nothing in
either graph commits, pushes, deploys, ports to production, or synchronizes
repositories. `/Users/ericlam/Projects/sled-mywcbracket` is read-only reference.

## Brief 1 — `brief-1-mirrored-bracket-map/` (source contract: MIRRORED-BRACKET-MAP-REBUILD-BRIEF.md)

| Rank | Plan | Leverage | Prerequisites |
| --- | --- | --- | --- |
| 1 | `PLAN-bracket-tree-model.md` | The 31-node/30-edge model every other plan consumes; kills whole bug classes up front | none — **execute first** |
| 2 | `PLAN-mirrored-match-cards.md` | Defines the card DOM contract (cards, center stage, `data-match-code`, Brief 2 hooks) all later work targets | 1 |
| 3 | `PLAN-responsive-no-scroll.md` | The no-overflow contract is the likeliest review failure; must land before connectors measure boxes | 1, 2 |
| 4 | `PLAN-feeder-connectors.md` | 30 explicit feeder edges + the full redraw lifecycle (fonts/resize/theme/expand/toggle) | 1, 2, 3 |
| 5 | `PLAN-center-sculpture.md` | Original low-poly cup, lazy Three.js lifecycle, SVG fallback; parallel-safe with 3–4 | 2 (parallel with 3, 4) |
| 6 | `PLAN-map-validation-review.md` | Frozen regression net + full acceptance sweep + screenshots + **hard stop** | 1–5 |

## Brief 2 — `brief-2-match-data-and-portraits/` (source contract: MATCH-DATA-CARD-AND-PORTRAIT-BRIEF.md — gated on map approval)

| Rank | Plan | Leverage | Prerequisites |
| --- | --- | --- | --- |
| 1 | `PLAN-match-details-contract-and-fixtures.md` | Frozen FIFA fixtures + schemas + parser + validator: the contract everything else consumes | map approval |
| 2 | `PLAN-fifa-details-sync-pipeline.md` | Real generated data on the existing 3×/day workflow, validator-gated | B2-1 (parallel with B2-3/4) |
| 3 | `PLAN-fact-card-interaction.md` | Optional loading, compact fact card, team-hover precedence — the surface Plans 4–5 extend | B2-1 |
| 4 | `PLAN-full-match-dialog.md` | Keyboard/touch-equivalent access path; portrait mount point | B2-1, B2-3 |
| 5 | `PLAN-portrait-shell.md` | Permission-gated, strictly allowlisted external portraits (25/25 mapped) | B2-1, B2-3, B2-4 |
| 6 | `PLAN-combined-validation-review.md` | Combined two-brief validation + screenshots + **hard stop** | B2-1–5 |

FotMob analytics remain a **blocked branch** (written authorization + official
access documentation required) recorded inside B2-2; match odds and bookmaker
links are excluded from the entire program.

## Shared-file ownership (Brief 1)

| File | First/primary owner | Later touches |
| --- | --- | --- |
| `docs/js/bracket-tree.js` | Plan 1 (create) | read-only afterwards |
| `docs/js/render.js` | Plan 2 (buildBracket rewrite, cards, center stage, legend labels) | Plan 3 (adds `tcode` span + `renderMiniOverview` at stated insertion points only) |
| `docs/js/interact.js` | Plan 4 only | — |
| `docs/js/main.js` | Plan 5 only (trophy lazy-init/teardown) | Brief 2 Plan 3 (optional loads) |
| `docs/css/dashboard.css` | Plan 2 (cards block) | Plan 3 (layout/overflow rules — owns `.bracket` layout), Plan 4 (≤1 line), Plan 5 (trophy block); all append-only marked blocks |
| `docs/index.html` | untouched in Brief 1 | Brief 2 Plans 3–5 (factcard host, dialog, disclosure host) |
| `docs/js/flags.js` | Plan 3 (TEAM_CODE3) | — |
| `tests/matchcards.mjs` | Plan 2 (create) | Plan 3 (extends) |

Legacy bracket CSS (`.round/.match/.champcol/…`) is intentionally **not deleted**
anywhere in this program — untracked pilot/design pages may reference it.

## Test commands (no framework; run per plan)

```
node tests/bracket-tree.mjs        node tests/matchcards.mjs
node tests/map-frozen.mjs          node tests/match-details.mjs
node tests/scoring.mjs             node tests/builder.mjs
node tests/share.mjs               node tests/parse.mjs
python3 tests/match_details.py     python3 scripts/validate_match_details.py
```

`tests/golden.mjs` is a documented non-gate (external `/tmp/py_sections.json` +
live-results dependency); `tests/map-frozen.mjs` supersedes it for the map surface.
