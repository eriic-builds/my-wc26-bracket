# PLAN-bracket-tree-model — pure knockout tree derived from `ko_feed`

## Rank and leverage

**Rank 1 of 6 (Brief 1). Execute first.**
Every other Brief 1 plan consumes the tree this plan produces: the mirrored card grid
(Plan 2), the phone overview (Plan 3), and the 30 feeder connectors (Plan 4) all read
the same node/edge model. Getting one verified, tested tree eliminates the whole class
of "renderer and connectors disagree about the bracket shape" bugs. This is the
Karpathy call from the brief: one simple model before any visual complexity.

## Goal and user-visible outcome

Create `docs/js/bracket-tree.js`, a pure ES module that turns `topology.ko_feed` into
an explicit 31-node / 30-edge mirrored tournament tree, plus `tests/bracket-tree.mjs`
proving every node, edge, branch, and ordering. There is **no user-visible change**
from this plan alone — it is the foundation contract.

## In scope

- New file `docs/js/bracket-tree.js` exporting `deriveBracketTree(topology)`.
- New file `tests/bracket-tree.mjs` (plain Node script, exit code 0/1, same style as
  the existing `tests/*.mjs` — no test framework).
- Defining the node/edge/column data contract all later plans consume.

## Out of scope

- Any edit to `render.js`, `interact.js`, `dashboard.css`, `index.html`, or `main.js`.
- Any DOM, layout, CSS, or connector work.
- Occupant/status resolution (stays in `render.js` — the tree is teams-agnostic).

## Verified current architecture (read before coding)

- `docs/data/topology.json` → `ko_feed` has exactly **15 entries**: M89–M102 and
  M104, each mapping to its two feeder codes. M103 (third place) is absent — do not
  add it. The 16 R32 codes (M73–M88) appear only as feeder *values*, never as keys.
- A DFS from M104 through `ko_feed` reaches exactly 31 codes (15 KO + 16 R32) and 30
  parent→feeder edges. `M104: ["M101","M102"]` defines the halves: the **first**
  feeder (M101) is the left branch, the **second** (M102) is the right branch.
- `docs/js/builder.js` already has `deriveStructure(topology)` which derives round
  code lists by pairing `topology.r32` order. **Do not reuse or modify it** — it
  orders by the R32 list (upload order), while the mirrored map must order by
  `ko_feed` DFS (bracket-adjacency order). They agree today, but the tree must not
  depend on `topology.r32` ordering at all. Reusing it would also couple the map to
  the builder; keep the new module dependency-free.
- `render.js` `computeState()` builds `D.KO_FEED` (a copy of `topology.ko_feed`) and
  derives `D._r16codes` etc. from **picks order**. The tree intentionally ignores
  picks — geometry never depends on user data.
- `package.json` is `{"type":"module"}`; tests run as `node tests/<name>.mjs`.

## Exact files

| File | Action | Why |
| --- | --- | --- |
| `docs/js/bracket-tree.js` | create | Pure topology → tree model, shared by Plans 2–4 |
| `tests/bracket-tree.mjs` | create | Node/branch/order/edge verification |

No existing file changes. This is what makes Plans 2–5 unable to conflict with this one.

## The data contract (all later plans import this shape — do not change it)

```js
// deriveBracketTree(topology) returns:
{
  nodes: [ // exactly 31, in column order then slot order
    { code: "M74",          // match code string
      round: "r32",         // "r32" | "r16" | "qf" | "sf" | "final"
      side: "L",            // "L" | "R" | "C" (only M104 is "C")
      col: 1,               // 1..9, see column table below
      slot: 0,              // 0-based top-to-bottom index within its column
      parent: "M89",        // parent match code; null for M104
      feeders: null }       // [feederA, feederB] in ko_feed order; null for r32 nodes
  ],
  edges: [ // exactly 30
    { from: "M74", to: "M89", feederIndex: 0, side: "L" }
  ],
  byCode: { /* code -> node */ },
  columns: [ // exactly 9, col 1..9 in order
    { col: 1, side: "L", round: "r32", codes: ["M74","M77","M73","M75","M83","M84","M81","M82"] }
  ]
}
```

Column layout (fixed):

| col | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| side/round | L r32 | L r16 | L qf | L sf | C final | R sf | R qf | R r16 | R r32 |

Slot ordering rule: within each branch, order is a pre-order DFS from the branch root
(M101 left, M102 right), always visiting `feeders[0]` before `feeders[1]`, collecting
codes per round. This reproduces the brief's expected branch tables exactly:

- Left r32 (col 1): `M74 M77 M73 M75 M83 M84 M81 M82`
- Left r16 (col 2): `M89 M90 M93 M94` · Left qf (col 3): `M97 M98` · Left sf (col 4): `M101`
- Right sf (col 6): `M102` · Right qf (col 7): `M99 M100` · Right r16 (col 8): `M91 M92 M95 M96`
- Right r32 (col 9): `M76 M78 M79 M80 M86 M88 M85 M87`

Invariants the function must enforce (throw `Error` with a message naming the bad
code — Hanselman: every failure says what broke):

1. Exactly one root exists (a key never appearing as a feeder value). It must have
   two feeders. Do not hardcode "M104" as the root lookup — *derive* it, then the
   test asserts it equals M104.
2. 31 unique nodes, 30 edges, no duplicate code, no orphan (every non-root node's
   parent exists), every `ko_feed` key has exactly 2 feeders.
3. Round of a node = depth from root: depth 0 → `final`, 1 → `sf`, 2 → `qf`,
   3 → `r16`, 4 → `r32`. Depth ≠ 0–4 is an error.
4. The function never reads `topology.r32`, `picks`, or `results` — signature takes
   only `topology` and touches only `topology.ko_feed`.

## Dependencies and parallelism

- Depends on: nothing.
- Blocks: Plans 2, 3, 4 (all import `deriveBracketTree`). Plan 5 (sculpture) touches
  disjoint files and may run in parallel with this plan. Plan 6 runs last.

## Implementation order

1. Write `deriveBracketTree(topology)` in `docs/js/bracket-tree.js`:
   find root → recurse feeders (pre-order) → assign round by depth, side by branch
   (root feeder 0 subtree = L, feeder 1 subtree = R, root = C) → group per
   (side, round) into columns in the table order above → assign `slot` by DFS
   encounter order within each column → build `edges` (one per feeder, `feederIndex`
   preserved) → freeze nothing, return plain objects.
   **Checkpoint:** `node --check docs/js/bracket-tree.js` passes.
2. Quick smoke: `node -e "import('./docs/js/bracket-tree.js').then(async m => { const t = m.deriveBracketTree(JSON.parse((await import('fs')).readFileSync('docs/data/topology.json'))); console.log(t.nodes.length, t.edges.length); })"`
   prints `31 30`.
3. Write `tests/bracket-tree.mjs` asserting, against the real `docs/data/topology.json`:
   - 31 nodes, 30 edges, 9 columns, all codes unique;
   - root is `M104`, side `C`, col 5, round `final`;
   - `M101` and `M102` are the two edges into `M104` (this is acceptance criterion 3);
   - all four branch code lists above, exactly, in order (this is acceptance
     criterion 4);
   - every edge's `from` node has `parent === edge.to`;
   - column sizes are 8/4/2/1/1/1/2/4/8;
   - M103 appears nowhere;
   - a corrupted-topology case: delete one `ko_feed` entry from a deep copy and
     assert `deriveBracketTree` throws (don't mutate the loaded original).
   Use the existing test style: `console.log("  ok   ...")` / `"  DIFF ..."`,
   `process.exit(fails ? 1 : 0)`.
   **Checkpoint:** `node tests/bracket-tree.mjs` exits 0.
4. Regression sweep — nothing else may change:
   `node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs`
   all pass exactly as before this plan (run them once before starting to record the
   baseline).

## Edge cases and codebase traps

- **Do not order anything by `topology.r32` or `picks.r32`.** `D.R32` in `render.js`
  comes from the *user's picks file*; a shared/imported bracket controls that order.
  Geometry from picks order is the bug this plan exists to prevent.
- **`codeNum`-style sorting is a trap.** Sorting codes numerically (M73, M74, …)
  destroys bracket adjacency (left r32 order starts M74, M77, M73…). Only DFS order
  is correct.
- `ko_feed` key iteration order in JS is insertion order and happens to be usable,
  but do not rely on it — the DFS from the derived root is the only ordering source.
- Feeder order matters: `M89: ["M74","M77"]` means M74 is the *upper* feeder. Never
  sort feeders.
- `tests/golden.mjs` requires `/tmp/py_sections.json` (external, usually absent) and
  live `results.json`; it is **not** a gate for this or any Brief 1 plan. Do not try
  to fix or run it.

## Read-only production-delta note (no implementation steps)

`sled-mywcbracket` has no bracket-tree module; its `tests/bracketmap.mjs` and
byte-locked `tests/fixtures/golden-sections.json` assert the *old* column-of-teams
DOM. A future port must re-derive this model there, intentionally update that golden
fixture (`node tests/golden.mjs --update` in that repo), and rewrite
`tests/bracketmap.mjs` expectations. Do none of that now; do not copy that repo's
test files here.

## Automated checks (exact commands)

```
node --check docs/js/bracket-tree.js
node tests/bracket-tree.mjs
node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
```

## Manual acceptance criteria

- `git status` shows exactly two new files (`docs/js/bracket-tree.js`,
  `tests/bracket-tree.mjs`) and no modified files. All previously dirty/untracked
  files are untouched.
- Opening the served site (`cd docs && python3 -m http.server 8080`) renders the
  dashboard pixel-identical to before (no module is imported by the page yet).

## Handoff checklist and stop condition

- [ ] Contract shape in this file matches the shipped code exactly (Plans 2–4 quote it).
- [ ] `node tests/bracket-tree.mjs` green; four legacy test files green.
- [ ] No edits outside the two new files.

**Stop** after the checklist passes. Do not begin rendering work — that is
PLAN-mirrored-match-cards.md.
