# Mirrored Bracket Map Rebuild Brief

Status: Ready for review

Target: `my-wc26-bracket` feature sandbox

Production: No changes to `sled-mywcbracket`

Planning consumer: Fable

Folder: `docs/briefs/mirrored-bracket-map/`

Publication note: this folder is inside the GitHub Pages `docs` tree and becomes
public if committed and deployed.

## Goal

Rebuild the bracket map into a full mirrored tournament tree inspired by the
supplied reference image.

The map should let you understand the tournament in one glance:

- every game is one outlined card containing both countries
- the left and right branches converge on the Final
- connector lines show exactly how winners feed into later games
- the center holds the Final, champion state, and a gently spinning, distinct
  World Cup-inspired 3D sculpture
- Actual path and My picks remain separate views of the same structure
- the legend continues to explain colors, symbols, and lines

This milestone is the map only. Match-fact hover cards, FIFA detail data, and
Bogachev portraits start after the map is approved.

## Context

The current bracket is a left-to-right sequence of round columns. Each country has
its own border, while the two countries in a game do not read as one object.
Connectors follow repeated team names between columns.

The requested design changes the visual grammar:

- game first, not team row first
- symmetrical tournament shape
- clear Final focal point
- richer visual identity without weakening scoring or pick meaning

The app remains:

- static GitHub Pages
- no build step
- vanilla HTML, CSS, and ES modules
- self-hosted assets
- client-side rendering

## Sources

### Visual source

The attached bracket screenshot provides the composition reference:

- mirrored branches
- compact two-country cards
- flags and final scores inside the card
- subdued eliminated teams
- visible elbow connectors
- center trophy and Final composition

It is a direction, not a pixel-copy requirement. The finished map must still use
this app's themes, status language, Actual path, My picks, scoring meaning, and
responsive needs.

### Code source

Current sandbox components to preserve or adapt:

| Component | Current role |
| --- | --- |
| `docs/js/render.js` | Computes bracket state and emits both bracket views |
| `docs/js/interact.js` | Toggles views and draws SVG connectors |
| `docs/css/dashboard.css` | Bracket, team, status, legend, and theme styles |
| `docs/js/flags.js` | Local SVG flag mapping |
| `docs/data/topology.json` | `ko_feed` relationships for all knockout games |
| `tests/scoring.mjs` | Scoring behavior |
| `tests/builder.mjs` | Valid bracket construction |

### Decision source

Technical Taste Council calls:

- Karpathy: derive one simple tree model from `ko_feed`.
- Hanselman: make placeholders and status meaning clear.
- Russinovich: measure connector and WebGL cost, then pause unused work.
- Willison and Hamel: verify every node and edge with tests.
- Sean Grove: treat this brief as the stable behavior contract.
- Yegge: stop for visual review before adding data hover.
- Litt: keep the model and files understandable without a framework.

## Tournament structure

The Final is M104. Its two feeder branches define the mirrored halves.

### Left branch

| Round | Matches |
| --- | --- |
| Semifinal | M101 |
| Quarterfinals | M97, M98 |
| Round of 16 | M89, M90, M93, M94 |
| Round of 32 | M74, M77, M73, M75, M83, M84, M81, M82 |

### Right branch

| Round | Matches |
| --- | --- |
| Semifinal | M102 |
| Quarterfinals | M99, M100 |
| Round of 16 | M91, M92, M95, M96 |
| Round of 32 | M76, M78, M79, M80, M86, M88, M85, M87 |

The renderer must derive these branches from `topology.ko_feed`. The lists above are
test expectations, not hardcoded layout data.

Expected graph:

- 31 match nodes
- 30 feeder edges
- one center Final
- no duplicate or orphaned match

## Desktop composition

The wide layout uses nine columns:

```text
R32 | R16 | QF | SF | FINAL + TROPHY | SF | QF | R16 | R32
```

The outer Round-of-32 cards stack vertically. Each later card sits at the midpoint
of its two feeder cards. Both sides flow inward.

The center column contains:

1. the spinning World Cup-inspired sculpture
2. the Final card
3. the champion state

The trophy is visual emphasis. The Final remains readable when WebGL is unavailable.

## Lightweight rough preview

The HTML review brief includes a small planning schematic before implementation.
It shows:

- all 31 two-row match-card placeholders
- all 30 feeder elbows
- the complete nine-column mirrored shape
- every match code
- approximate Final, champion, and trophy placement

The preview uses one local inline SVG and a small vanilla JavaScript data list. It
contains no production renderer, Three.js runtime, flags, results, or responsive
layout logic. It is a shape and hierarchy check, not final spacing or visual
approval.

## Match-card anatomy

Each match uses one outer card.

### Header

- match code
- round or date
- completed or upcoming state

### Team rows

- local SVG flag
- country name
- score when completed
- Winner MXX placeholder when unresolved
- existing pick and actual-path symbol

### State treatment

- winner is clear and high contrast
- loser is subdued
- correct user pick keeps the current success meaning
- missed user pick keeps the current failure meaning
- actual replacement keeps the current blue triangle meaning
- pending remains neutral
- champion pick retains gold treatment

The card must not rely on color alone.

## Connector model

The existing connector code finds the same team in adjacent rounds. The rebuilt
map should connect matches by explicit feeder relationships instead.

For each parent:

- feeder A draws one elbow line into the parent
- feeder B draws one elbow line into the parent
- left-side lines travel right
- right-side lines travel left
- both semifinal lines meet the center Final

The connector SVG:

- sits behind cards
- receives no pointer input
- redraws after resize
- redraws after font loading
- redraws after theme changes
- redraws after section expand or collapse
- redraws after Actual path or My picks toggles

Line colors and styles remain explained by the legend.

## Actual path, My picks, and legend contract

The mirrored rebuild must preserve both existing bracket stories.

### Actual path

- uses the realized tournament route
- resolves later-round occupants from actual results
- keeps a blue `▲` when the team that actually advanced replaces the user's
  eliminated pick
- keeps the actual-path line treatment
- never rewrites the user's original picks

### My picks

- preserves the original uploaded or builder-created bracket chain
- keeps `✓` for a pick that won or advanced
- keeps `✕` for a pick that is out
- keeps pending treatment for a pick still to play
- keeps the advancing chevron and champion-pick treatment
- never imports an actual replacement as if the user selected it

### Shared geometry and switching

- both views contain exactly the same 31 match codes
- both views use the same node slots, card anatomy, mirrored shape, Final, and 30
  feeder relationships
- occupant and status data remain separate
- only one tree is visible at a time
- the existing Actual path and My picks controls remain real buttons with selected
  and focus states
- toggling redraws lines against the visible cards
- no stale line, wrong occupant, or status class crosses between views
- the switch does not cause a geometry jump

### Shared legend

Keep the existing `How to read this bracket` legend visible for either view. It
must retain all eight meanings:

1. Your pick won or advanced
2. Your pick is out
3. Your path so far is correct
4. Your pick is still to play
5. The team that actually advanced replaced your pick
6. Actual path
7. You have this team advancing
8. Your champion pick

Labels can become clearer for match-level feeder lines. Removing or merging a
meaning requires a separate review decision.

## Legend

Retain the existing `How to read this bracket` block.

It must continue to explain:

- your pick won or advanced
- your pick is out
- correct path line
- pending path line
- actual replacement
- actual path line
- your advancing team
- champion pick

Update labels only where the new match-level connectors require clearer wording.

## 3D center sculpture

Build a compact World Cup-inspired low-poly monument from original geometry. It
should look like the dashboard's rounded cards, flat status colors, glass surfaces,
and subtle gradients translated into depth. It should not look ornate, realistic,
organic, or like a separate fantasy object.

Dashboard visual language:

- one faceted globe with a few abstract geometric seams
- two clean straight V supports with open negative space
- one short center bridge
- a compact hexagonal plinth
- flat-shaded matte surfaces with high roughness and low metalness
- body color read from the active `--gold` dashboard token
- recessed faces derived from `--panel`
- one soft key light and a restrained blue-teal rim light
- an orthographic camera with no dramatic perspective
- no flowing ribbons, chrome, texture maps, reflection maps, bloom, lens flare,
  smoke, particles, star field, or separate 3D stage
- deliberately different front, side, and three-quarter silhouettes
- intentionally different proportions from the official object

Do not:

- use human figures, anatomy, or organic figure-like supports
- reproduce the official twisting two-figure stem
- reproduce the circular base with green malachite-like rings
- copy geographic surface relief, inscriptions, proportions, or surface details
- use FIFA logos, wordmarks, names, or other official branding on the model
- download, trace, scan, reconstruct, use photogrammetry from, or copy an
  official trophy model or mesh
- depend on a CDN
- make the sculpture necessary to understand the Final

Implementation:

- pinned self-hosted Three.js ES module
- original geometry created in `docs/js/trophy.js`
- neutral internal and visible naming that does not present it as official
- dashboard-token matte materials, restrained lighting, transparent canvas
- one full vertical-axis rotation every 36 seconds
- a maximum three-degree eased cursor-follow tilt for mouse and pen hover
- click-drag rotation with `grab` and `grabbing` cursors
- horizontal drag controls yaw; mouse and pen vertical drag controls pitch within
  a ten-degree clamp
- touch drag controls yaw with `touch-action:pan-y` so vertical page scrolling
  remains available
- auto-rotation pauses during drag and resumes 1.5 seconds after release
- no inertia, bobbing, rocking, repeating tilt loop, auto-zoom, wheel zoom, or
  pinch zoom
- lazy initialization when the bracket enters the viewport
- pause when offscreen
- pause when the browser tab is hidden
- keyboard focus, visible focus ring, Arrow key rotation, Home reset, and Space
  pause or resume
- a compact dashboard-style Pause or Resume control
- no automatic or cursor-follow movement for reduced motion; direct drag and
  keyboard movement remain available
- original local static SVG fallback for WebGL failure
- pointer capture only during an active drag, released on pointer up, cancel, and
  teardown
- no wheel-event capture
- material-color updates after dashboard theme changes without scene rebuild

Review the silhouette from front, side, and three-quarter angles. If it reads as a
replica, increase the divergence. If it becomes the loudest or largest object in
the bracket, simplify or scale it down. It should support the Final, not compete
with it.

This design boundary reduces copying risk but does not provide legal clearance.
Rights-holder permission or qualified legal review remains the path to certainty
when public use requires it.

Confirmed choice: keep this distinct inspired design rather than reproduce the
official trophy. The project's noncommercial status does not change this build
boundary. A rights-cleared asset could be considered through a separate review.

## Responsive behavior

No bracket mode may require horizontal scrolling or side panning. Do not hide a
scrollbar while leaving the map horizontally scrollable.

### Wide desktop

- full mirrored map visible
- center Final and trophy remain the focal point
- no card overlap
- no clipped connectors
- full flags, country names, scores, match code, and date

### Medium desktop and tablet

- retain the mirrored geometry
- fit all nine columns inside the available bracket width
- use a size container and fluid `minmax(0, ...)` grid tracks
- reduce gaps, padding, and secondary metadata before reducing core text
- switch to bundled flags plus three-letter team codes at the tablet density
- keep full names in accessible labels and the readable detail representation
- use no global CSS scale transform
- use no horizontal overflow, hidden scrollbar, drag-to-pan, or edge fade

### Phone

- show a complete miniature overview with all 31 nodes and 30 feeder edges
- place readable round-by-round match cards below it in one vertical flow
- generate both representations from the same match data
- treat the overview as orientation, not the accessible source of match details
- keep the readable list as the keyboard and screen-reader representation
- synchronize Actual path and My picks across the overview and list
- preserve the legend below the readable cards
- use a static cup instead of running WebGL
- use no sideways scrolling

## Accessibility

- Actual path and My picks remain proper buttons.
- Every match card has a useful accessible label.
- Country names and scores stay readable without flags.
- Status never depends only on color.
- The decorative connector SVG stays hidden from assistive technology.
- The interactive trophy canvas has a concise label and keyboard instructions.
- Reduced motion stops auto-rotation and hover-follow movement.
- Keyboard focus remains visible.
- Mouse, pen, touch, and keyboard controls are optional and do not change
  tournament meaning.
- The phone bracket does not require precision dragging or horizontal panning.
- Three-letter visual codes never replace full names in accessible labels.

## No-horizontal-overflow contract

- `.brk-wrap` uses `container-type:inline-size`.
- The mirrored desktop and tablet tree uses nine fluid columns with no fixed
  minimum card width.
- Card internals have `min-width:0` and deliberate density variants.
- Connector measurements use the final fitted card boxes.
- The implementation does not use `transform:scale()` on the interactive tree.
- The page does not intercept the mouse wheel or horizontal trackpad gesture for
  bracket navigation.
- At 320, 375, 600, 768, 1024, 1280, 1440, and wide desktop widths, bracket
  `scrollWidth` must be no more than `clientWidth + 1`.
- At phone widths, the overview fits the viewport and the full card list flows
  vertically.

## No-build technical strategy

### Pure tree model

Add a pure helper that accepts topology and returns:

```text
nodes: code, round, side, slot, parent, feeders
edges: from, to, feeder side
```

This model is shared by Actual path and My picks.

### Renderer

Refactor `buildBracket()` around:

- `deriveBracketTree(topology)`
- `renderMatchCard(state, node, mode)`
- `renderCenterStage(state, mode)`

Keep all data escaping and current score logic.

### Interaction

Update connector drawing to use `data-match-code` and feeder edges.

Do not add the new match-fact hover in this milestone.

### New files

| File | Purpose |
| --- | --- |
| `docs/js/bracket-tree.js` | Pure topology and layout model |
| `docs/js/trophy.js` | Lazy 3D cup lifecycle |
| `docs/js/vendor/three.module.min.js` | Pinned self-hosted Three.js runtime |
| `docs/assets/trophy-fallback.svg` | Static fallback |
| `tests/bracket-tree.mjs` | Node, branch, order, and edge tests |
| `tests/matchcards.mjs` | Card coverage and status tests |

### Existing files

| File | Change |
| --- | --- |
| `docs/js/render.js` | Mirrored markup and reusable game cards |
| `docs/js/interact.js` | Match-edge connectors and redraw lifecycle |
| `docs/css/dashboard.css` | Mirrored grid, cards, center, responsive modes |
| `docs/index.html` | Load any new local module required by the map |

No result-sync, FIFA-detail, FotMob, or Bogachev files change during this milestone.

## Fable planning handoff

Use this Markdown file as the source contract. Use the HTML file beside it as the
visual companion.

After the map review gate, continue with
`MATCH-DATA-CARD-AND-PORTRAIT-BRIEF.md`. The two briefs form one dependency graph,
not one uninterrupted implementation pass.

Fable should review the architecture and write exactly six ranked, executor-ready
plans in the repository root. It must not implement feature code:

Editable sandbox: `/Users/ericlam/Projects/my-wc26-bracket`

Read-only production reference:
`/Users/ericlam/Projects/sled-mywcbracket`

1. `PLAN-bracket-tree-model.md`
2. `PLAN-mirrored-match-cards.md`
3. `PLAN-responsive-no-scroll.md`
4. `PLAN-feeder-connectors.md`
5. `PLAN-center-sculpture.md`
6. `PLAN-map-validation-review.md`

Each file must state its leverage, goal, non-goals, exact files and symbols to
touch, dependencies, step-by-step implementation order, validation after each
checkpoint, codebase traps a weaker model could miss, and concrete automated and
manual acceptance criteria. Each plan also records read-only production-delta
notes for a future port without adding production implementation steps.
Shared-file ownership must be explicit so lower-cost executors do not make
competing edits to `render.js`, `interact.js`, `dashboard.css`, or `index.html`.

`PLAN-bracket-tree-model.md` executes first. The tree and card contracts stabilize
before Fable marks any connector, responsive, or sculpture work as safely
parallel. `PLAN-map-validation-review.md` depends on the other five plans.

The first implementation phase must stop at the map review gate. Do not start FIFA
details, match hover, or Bogachev portraits before approval. Do not copy the
lightweight HTML schematic into the production renderer.

Match odds, bookmaker links, and odds-sync work remain outside both briefs.

The Fable session must follow
`/Users/ericlam/Projects/sled-mywcbracket/dev-docs/CLAUDE.md` before inspecting the
production reference and must keep that entire repository unchanged.

After explicit map approval, start the second brief. Keep production porting,
commits, pushes, and deployment outside the combined sandbox task graph.

## Build sequence

### Pass 1: Structure

- derive and test the 31-node tree
- render all game cards in mirrored positions
- render the center Final

### Pass 2: Visual language

- finish card anatomy
- apply status treatments
- adapt the legend
- tune spacing in dark and light themes

### Pass 3: Connectors

- draw all 30 feeder edges
- verify both views
- verify redraw behavior

### Pass 4: Trophy

- add local Three.js
- build the original cup
- add lifecycle controls and fallback

### Pass 5: Responsive and review

- finish medium and phone behavior
- run focused tests
- serve locally
- capture review screenshots

Stop after Pass 5. Do not begin the match-data hover phase until the map is approved.

## Acceptance criteria

1. Both bracket views contain exactly 31 unique game cards.
2. The map contains exactly 30 feeder connections.
3. M101 and M102 feed M104 at the center.
4. The expected eight-game left and right Round-of-32 branches are correct.
5. No match card is clipped or overlaps another at the review widths.
6. Flags, names, scores, dates, and placeholders remain legible.
7. Existing pick and actual status meanings remain intact.
8. The legend explains every visible state.
9. The World Cup-inspired sculpture is original, self-hosted, gently animated,
   visually distinct from the official trophy, and non-essential.
10. Reduced motion and WebGL failure show a clear static cup.
11. Actual path and My picks switch without layout jumps or stale connectors.
12. No target width produces bracket horizontal overflow or side panning.
13. The phone overview contains all 31 nodes and 30 edges, and the vertical list
    contains all 31 readable game cards.
14. Existing scoring, builder, share, and parse behavior remains unchanged.
15. No data-hover, FotMob, FIFA-detail, or Bogachev integration is included yet.
16. Local screenshots are approved before the next phase begins.

## Later phase

After this brief is approved and the map is built:

1. generate official FIFA match facts
2. add hover, focus, and tap details
3. map all available Bogachev portraits
4. add the click-to-load iframe dialog

That later work reuses `data-match-code` from the rebuilt cards.
