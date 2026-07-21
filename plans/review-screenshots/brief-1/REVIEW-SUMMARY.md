# Brief 1 dual-layout bracket map review

Date: July 10, 2026

Status: Ready for human map approval. Brief 2 remains locked.

## Revision after first review

The first review found the desktop map too cramped. The revised desktop shell:

- expands from a 1280px cap to a 1580px cap
- moves the contents rail from x=80 to x=22 at a 1440px viewport
- reduces the rail from 186px to 164px
- gives the bracket 1212px instead of 1026px at 1440px
- collapses the contents rail through 1320px so the map gets the full content width
- gives the center track more room and grows the visible sculpture from about
  122px to 187px at 1440px
- places the champion country directly below the sculpture in both views

The revised layout passed the complete automated and browser review again.

## Revision after second review

The second review reduced mirror-map density and restored the previous layout as
an option:

- mirrored desktop and tablet cards now show flags plus three-letter country codes
- seed labels such as `1L` and `2I` are removed from both bracket layouts
- phone cards retain full country names because hover is unavailable
- a persistent Mirrored or Sideways toggle is available above 860px
- Sideways restores the six-column individual-country-box tree
- Sideways country boxes include flags and 31 left-to-right connector paths
- Sideways has a wider Champion column with the same interactive 3D sculpture
  directly above the champion country
- the sculpture turn time changes from 36 seconds to 32 seconds

Both layouts and both data views passed the complete review again.

## Revision after third review

The third review reduces visual noise, exposes the progression lines, and turns
`Expand map` into a true one-screen overview:

- controls read Actual/My picks, Expand map, then Mirrored/Sideways
- `Expand map` hides dashboard chrome and the fixed viewer bar; Collapse map or
  Escape restores the page and keyboard focus without animated page travel
- both expanded layouts fit inside one viewport at 1024–1800px widths and
  600–1080px heights with no clipped cards or page overflow
- Mirrored uses a narrower center track and Final card, compact neutral match
  cards, gray losing teams, aligned score/result columns, and untruncated codes
- every resolved Mirrored feeder starts at the exact advancing country row;
  unresolved feeders still start at their source game
- expanded Sideways uses short, square-cornered country boxes, larger responsive
  text, progressively taller late-round cards, and smooth country-to-country curves
- the champion card is larger in Sideways; both layouts add a gold Final-to-winner
  path with a soft glow
- expanded Mirrored hides the redundant champion note and Final label, nudges the
  trophy and champion upward, and leaves a clean centered gold channel to M104;
  the normal map retains those labels
- expansion is unavailable at 860px and below, where the responsive Mirrored
  layout remains the only map

Normal and expanded states passed the complete automated and browser review.

## What changed

The demo now provides Mirrored and Sideways layouts in both Actual path and My
picks. Mirrored uses 31 two-country match cards and 30 explicit feeder lines.
Sideways restores the six-column country-box tree with flags and 31 connector
paths. Both include the champion and original local Three.js tournament sculpture.
Phones use the responsive mirrored overview and card flow.

Start review with:

1. `expanded-mirror-actual-dark-1440.png`
2. `expanded-sideways-actual-dark-1440.png`
3. `actual-dark-1440.png`
4. `sideways-actual-dark-1440.png`
5. `picked-light-1024.png`
6. `actual-dark-375.png`
7. `sculpture-front.png`, `sculpture-three-quarter.png`, and `sculpture-side.png`
8. `reduced-motion-static-1280.png` and `webgl-failure-fallback-1280.png`

Local preview:

`http://127.0.0.1:8080/index.html`

Choose `See a demo bracket`, then scroll to `Your bracket, marked up`.

## 16-point acceptance matrix

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Mirrored Actual path and My picks each contain 31 unique coded cards. Sideways contains six legacy columns and 32 country-box groups in each view. |
| 2 | PASS | Mirrored draws 30 feeder connections from country row to country row plus one separate gold champion path. Sideways draws 31 smooth country-to-country curves, including a gold Final-to-champion curve. No invalid coordinates appeared. |
| 3 | PASS | M104 rows declare M101 and M102 as their two feeders. |
| 4 | PASS | Left R32 order is M74, M77, M73, M75, M83, M84, M81, M82. Right order is M76, M78, M79, M80, M86, M88, M85, M87. |
| 5 | PASS | Normal Mirrored geometry passed at 320, 375, 600, 768, 1024, 1280, 1440, and 1800 px. Both expanded layouts fit one viewport at 1024–1800px widths and 600–1080px heights with no clipped boxes. |
| 6 | PASS | Mirrored uses flags and untruncated country codes above phone width, full names on phones, and full names in hover and accessible labels. Scores and result marks align in fixed right columns. Normal Sideways keeps flags and full country names. |
| 7 | PASS | Won, lost, pending, actual replacement, advancing, gone, penalty, and champion states remain present. Losing rows are neutral gray while the X remains legible. |
| 8 | PASS | The shared legend contains all eight meanings and the three feeder-line labels. |
| 9 | PASS | The original self-hosted sculpture appears above the champion country in both layouts and remains non-essential to bracket comprehension. |
| 10 | PASS | Reduced motion produces a still interactive canvas. WebGL context loss and phone widths use the local SVG fallback without breaking the dashboard. |
| 11 | PASS | Ten alternating data-view switches and ten alternating layout switches produced one visible bracket, the correct connector count, and no stale paths. Expand, instant Collapse, Escape, responsive auto-collapse, and layout changes while expanded all redraw correctly. |
| 12 | PASS | Mirrored, Sideways, and both one-screen expanded views passed the width and height fit audits. No horizontal panning or hidden-scrollbar workaround is present. |
| 13 | PASS | Phone mode shows 31 overview nodes, 30 overview edges, and all 31 readable cards in the planned round flow. |
| 14 | PASS | All seven focused and legacy suites pass. A real share-link roundtrip rebuilt 31 cards and 30 lines. The builder opened and closed cleanly. |
| 15 | PASS | The browser recorded 45 requests from initial load through all completed-card hovers. Every request was same-origin. No match facts, portrait iframe, FotMob surface, external request, or console error appeared. |
| 16 | PASS | The final 31-image screenshot packet is present in this folder. |

Result: 16 of 16 passed.

## Automated checks

Passing:

- `node tests/map-frozen.mjs`
- `node tests/bracket-tree.mjs`
- `node tests/matchcards.mjs`
- `node tests/scoring.mjs`
- `node tests/builder.mjs`
- `node tests/share.mjs`
- `node tests/parse.mjs`
- Syntax checks for all changed JavaScript modules

The frozen test byte-locks both layouts, both data views, and the legend. It was
also proven to report the exact first divergence when the contract changes.

## Screenshot packet

Responsive view and theme coverage:

- Actual and picked, dark and light, at 1440, 1024, 768, and 375 px
- `actual-easy-768.png`
- `actual-winxp-1280.png`
- Sideways actual and picked, dark and light, at 1440px
- `sideways-actual-dark-1024.png`
- `expanded-mirror-actual-dark-1440.png`
- `expanded-sideways-actual-dark-1440.png`

Sculpture and fallback coverage:

- `sculpture-front.png`
- `sculpture-three-quarter.png`
- `sculpture-side.png`
- `sculpture-winxp.png`
- `reduced-motion-static-1280.png`
- `webgl-failure-fallback-1280.png`

The folder also preserves nine baseline and intermediate images.

## Performance and asset weight

- Three.js r170 module: 691,648 bytes
- Three.js MIT license: 1,081 bytes
- Sculpture module: 15,151 bytes
- SVG fallback: 1,212 bytes
- Enlarged visible-canvas frame sample: 120 frames, 8.33 ms mean, 8.50 ms p95

## Known accepted limitations

- `tests/golden.mjs` remains a non-gate because it requires changing live results
  and `/tmp/py_sections.json`.
- Phone mode hides the measured connector SVG and uses the complete miniature
  overview instead.
- Sideways is a desktop and larger-tablet option. At 860px and below, the toggle
  hides and Mirrored becomes the active responsive layout.
- Expanded Sideways is intentionally an overview-density view so all 32 country
  boxes fit one screen. Collapse the map for its larger full-name presentation.
- Expanded mode hides the repeated legend and section heading to reserve the
  viewport for the complete tree; both remain directly above the normal map.
- Expanded Mirrored also hides its repeated champion note and Final label. M104
  retains its match code and date, while the winner box and gold path carry the
  center progression visually.
- Legacy bracket CSS is retained for Sideways and for existing pilot and design
  pages that could still reference it.

## Deviations and hygiene

- The Plan 5 license URL omitted `.js` and returned 404. With human permission to
  unblock the task, the official Three.js r170 license was vendored from
  `https://raw.githubusercontent.com/mrdoob/three.js/r170/LICENSE`.
- The writable sandbox remains on commit `5e1b393`. No commit, push, branch,
  deployment, or Brief 2 work occurred. All protected dirty and untracked files
  remain present.
- The read-only `sled-mywcbracket` repository was not clean at the gate. It had
  existing and concurrent changes in `JOURNEY.html`, dashboard CSS, fonts, and
  several JavaScript files. This executor made no writes there and did not alter
  or clean that worktree.

## Approval gate

Brief 2 remains locked until the human explicitly approves this map. Silence,
partial feedback, or a thank you does not unlock it.
