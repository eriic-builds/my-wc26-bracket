# PLAN-feeder-connectors — 30 explicit feeder edges and the redraw lifecycle

## Rank and leverage

**Rank 4 of 6 (Brief 1).** Connectors are what make the mirrored map read as a
tournament ("connector lines show exactly how winners feed into later games"). This
plan also owns the entire redraw lifecycle — fonts, resize, theme, section expansion,
view toggles — which is where the old `display:none` / zero-size measurement bugs
live. It runs after Plans 1–3 so it measures final fitted card boxes.

## Goal and user-visible outcome

Each of the 30 `topology.ko_feed` edges renders as one elbow line from feeder card to
parent card: left-side lines travel right, right-side lines travel left, M101 and
M102 meet the center Final. Line color/style carries the same legend meanings as
today (correct path / pending / actual path, `gone` dimming). Lines are always
correct after resize, font load, theme switch, bracket-section collapse/expand, and
Actual/My picks toggles, and the SVG never captures pointer input.

## In scope

- Rewrite `drawConnectors()` in `docs/js/interact.js` to consume
  `data-match-code`/`data-feeder` edges (not repeated team names).
- Redraw triggers: fonts ready, resize (exists), theme change (exists via
  `setTheme`), **bracket section expand (new)**, view toggle (exists).
- Connector CSS additions only if needed (existing `.conn c-*` classes are reused).

## Out of scope

- Any card markup change (Plan 2 done) or layout change (Plan 3 done).
- The mini overview's edges (pure render-time arithmetic, Plan 3, already done).
- Trophy events (Plan 5 observes theme itself; no coupling here).
- New hover/interaction on lines (explicitly excluded by the brief).

## Verified current architecture

- `docs/js/interact.js` is one IIFE inside `initInteractions()`, re-run on every
  `showDashboard()` (`main.js:46`) after `#app.innerHTML` is replaced. DOM-scoped
  listeners die with the old DOM; **window-scoped listeners accumulate** across
  re-renders (demo → own bracket → shared link all re-init). The existing code
  tolerates this because handlers call the *latest* `window.__drawConn`. Keep that
  exact pattern for anything window-scoped you add.
- `activeBracket()` (interact.js:57) returns
  `.brk-wrap → .bracket.mode-<data-view>` — the **visible** bracket. Keep it; the
  inactive bracket is `display:none` (zero-size rects), so measuring it produces
  garbage. Only ever draw into the visible bracket's own `.bksvg`.
- `drawConnectors()` (interact.js:58–82) currently: sizes the SVG to
  `scrollWidth/scrollHeight`, clears children, then for each `.round` column joins
  same-`data-team` boxes across adjacent columns. After Plan 2 there are no `.round`
  elements, so it silently draws nothing — this plan replaces the body.
- Existing redraw triggers to preserve as-is:
  - `setTheme()` → `setTimeout(window.__drawConn, 80)` (interact.js:8);
  - `.brk-toggle` click → `setTimeout(drawConnectors, 60)` after `data-view` flips
    (interact.js:84);
  - debounced `resize` (interact.js:87), `load` (interact.js:88);
  - initial call at the end of the IIFE (interact.js:105), plus
    `main.js:47` `setTimeout(window.__drawConn, 90)`.
- **Missing trigger (verified):** `.sec-toggle` collapse/expand (interact.js:86)
  toggles `.sec-body.collapsed{display:none}` and never redraws. Collapsing the
  bracket section and re-expanding leaves lines drawn from pre-collapse geometry —
  and if the *initial* draw ever happens while collapsed, all rects are zero. This
  plan adds the redraw there.
- `.bksvg` CSS: `position:absolute;top:0;left:0;pointer-events:none;z-index:0` and
  the markup carries `aria-hidden="true"` — both already satisfy "behind cards, no
  pointer input, hidden from AT". Card columns are `z-index` above via
  `.bkcol`/`.round{position:relative;z-index:1}` — confirm `.bkcol` has
  `position:relative;z-index:1` (Plan 3's block; if missing, add it there-scoped in
  this plan's CSS touch).
- Plan 2's DOM contract this plan consumes: every card `[data-match-code]`; every KO
  team row `[data-feeder="MXX"]`; rows carry status classes
  `st-won|st-lost|st-actual|gone` (KO) / `adv|busted|realadv|out` (R32);
  placeholders are `.team.placeholder`. Tree geometry (which codes connect) comes
  from the same source as render: import `deriveBracketTree` from
  `./bracket-tree.js` and build the 30-edge list from `topology` — **but
  interact.js has no topology reference today.** Resolution (decided here, not left
  to the executor): do not import topology into interact.js; read the edges from
  the DOM instead. Every `[data-feeder]` row *is* an edge declaration:
  `edge = { from: row.dataset.feeder, to: closest('.mcard').dataset.matchCode }`.
  30 such rows exist per bracket (15 KO cards × 2 rows). This keeps interact.js
  dependency-free and immune to render/interact version skew.

## Exact files

| File | Action | Symbols / sections |
| --- | --- | --- |
| `docs/js/interact.js` | modify | Replace the body of `drawConnectors()`; add `document.fonts.ready.then(...)` trigger; extend the `.sec-toggle` handler with a conditional redraw; keep `window.__drawConn = drawConnectors` and every existing trigger untouched. No other edits in the file. |
| `docs/css/dashboard.css` | modify (only if needed) | The `.conn` rules (lines 186–191) stay. Add at most: `.bkcol{position:relative;z-index:1}` if Plan 3 didn't, inside a one-line marked addition. |

## Connector algorithm (drop-in specification)

```
drawConnectors():
  bracket = activeBracket(); svg = bracket.querySelector('.bksvg')
  if (!bracket || !svg) return
  if (bracket.clientWidth === 0) return          // collapsed section / hidden view guard
  size svg to bracket scrollWidth/scrollHeight, set viewBox, clear children
  for each row of bracket.querySelectorAll('.team[data-feeder]'):
    parentCard = row.closest('.mcard'); fromCard = bracket.querySelector('.mcard[data-match-code="' + row.dataset.feeder + '"]')
    if (!fromCard) continue                       // defensive; tested never to happen
    side = parentCard.closest('.bkcol').dataset.side   // 'L' | 'R' | 'C'
    a = box(fromCard); b = box(row)               // getBoundingClientRect → bracket-local coords (reuse existing P() math)
    if parentCard is in the center column: feeder side decides direction
      (fromCard's own .bkcol data-side: L → line runs left→right into the Final's left edge;
       R → right→left into its right edge)
    else L: x1 = a.right, x2 = b.left; R: x1 = a.left, x2 = b.right
    xm = midpoint(x1, x2)
    path d = M x1 aY H xm V bY H x2                // same elbow form as today
    status = row.classList: st-won|adv → 'won'; st-lost|busted → 'lost';
             st-actual|realadv → 'actual'; placeholder/other → 'pending'
    class = 'conn c-' + status + (row.classList.contains('gone') ? ' gone' : '')
    append <path>
```

Notes locked in:

- Anchor the parent end at the **feeder's own row** (`row`), not the card center —
  two lines into one card must land on their respective rows (upper feeder → upper
  row), which `data-feeder` gives for free.
- Anchor the child end at the **card** (`fromCard`) vertical center, horizontal
  inner edge facing the parent.
- Status comes from the parent-slot row (who advanced *into* that slot), which
  reproduces today's semantics where the target box's classes colored the line
  (interact.js:76). Same mapping table extended with the R32 class synonyms because
  R32→R16 edges read rows fed by R32 cards whose *parent* rows are KO rows — i.e.
  all 30 read KO rows; the `adv/busted/realadv` synonyms are only a safety net.
- Exactly 30 paths per visible bracket when nothing is filtered; count is a test.

## Redraw lifecycle additions

1. **Fonts:** once per `initInteractions()` run:
   `if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (window.__drawConn) window.__drawConn(); });`
   (Poppins loads via `fonts.css`; metrics shift card heights after first paint.)
2. **Section expand:** in the existing `.sec-toggle` click handler (interact.js:86),
   after `body.classList.toggle('collapsed', open)`, add:
   `if (!body.classList.contains('collapsed') && body.querySelector('.bracket') && window.__drawConn) setTimeout(window.__drawConn, 60);`
   — redraw only when *expanding* the section that contains the bracket.
3. **Zero-size guard** (in the algorithm above) so a draw scheduled while the
   section is collapsed or the document hidden is a no-op instead of drawing
   garbage; the expand trigger re-draws when visible again.
4. Existing triggers (theme, toggle, resize, load, init) stay byte-identical.

## Dependencies and parallelism

- Depends on: Plans 1–3 all landed (DOM contract + final fitted layout).
- Independent of Plan 5 (disjoint files; trophy never touches `.bksvg`). May run in
  parallel with Plan 5.
- Leaves for Plan 6: `window.__drawConn` semantics unchanged; 30-path invariant
  testable from a served page.

## Implementation order

1. Replace `drawConnectors()` body per the spec. **Checkpoint:**
   `node --check docs/js/interact.js`; serve; wide desktop shows 30 elbows in the
   Actual view; visually confirm M101→M104 and M102→M104 meet the center card from
   opposite sides; left half's lines all point right, right half's all point left.
2. Verify colors: decided chains render `c-won`/`c-lost`/`c-actual` matching the
   pre-rebuild screenshots' meanings; undecided edges dashed `c-pending`; a
   `gone` chain dims. **Checkpoint:** in console,
   `document.querySelectorAll('.bracket.mode-actual .conn').length === 30`.
3. Toggle to My picks; count 30 again; statuses now reflect the pick chain (demo:
   England champion path solid/lost per results). Toggle back and forth five times
   fast — no duplicated or stale lines (SVG is cleared each draw; the visible
   bracket's own SVG is the only one written).
4. Add fonts + section-expand triggers + zero-size guard. **Checkpoint:** collapse
   the bracket section, resize the window, expand — lines land on cards (this
   exact sequence was broken before); hard-reload with devtools font throttling —
   lines correct after Poppins arrives.
5. Theme sweep: switch dark→light→geocities→easy; lines redraw each time (existing
   `setTheme` hook) with token colors.
6. Resize sweep at 1440→1024→768→600: after each debounce, lines meet cards. At
   phone width the vertical flow makes long edges; verify they still originate and
   terminate on the right elements and stay behind cards (acceptable aesthetics;
   the overview strip is the phone orientation tool — if lines are visually noisy
   below the phone breakpoint, hide them there via
   `@container brk (max-width:600px){ .bksvg{display:none} }` — decided: **hide
   them at phone tier**; the mini overview carries the 30 edges there, so the
   "complete miniature overview plus readable list" contract still holds).
7. Full test sweep (all `tests/*.mjs` except golden).

## Data contracts and invariants

- Edge set is exactly the DOM's 30 `[data-feeder]` rows — no team-name joins, no
  hardcoded positions, no `topology` import in interact.js.
- SVG per bracket; only the visible one is ever (re)drawn; drawing never mutates
  cards.
- `.bksvg` keeps `aria-hidden`, `pointer-events:none`, z-index below cards.
- No new wheel/touch/pointer listeners anywhere in this plan.

## Edge cases and codebase traps

- **The `display:none` inactive bracket**: `getBoundingClientRect()` on it returns
  zeros. Never draw into `activeBracket()`'s sibling; never cache geometry across
  toggles. The 60ms toggle delay exists because the class flip must paint first —
  keep it.
- **`initInteractions` re-entry**: `document.fonts.ready.then` fires immediately if
  fonts already loaded — safe. But it holds a closure over the *old* draw function
  after a re-render; route through `window.__drawConn` (latest) exactly as the spec
  writes it, not over a captured `drawConnectors` reference.
- **Scroll offsets**: the old `P()` added `bracket.scrollLeft/scrollTop`; after Plan
  3 the bracket no longer scrolls, but keep the terms (they're 0) so nothing breaks
  if an inner element ever scrolls.
- **Center column direction**: M104's two rows are fed from opposite sides; deriving
  direction from the *feeder card's* column side (not the parent's) is what makes
  both semifinal lines meet the center correctly — the spec above already says
  this; don't simplify it to parent-side.
- **Rounded coordinates**: keep `Math.round` on path coords as today — fractional
  coords blur 2.5px strokes on non-retina displays.
- **Filter dim**: search dims team rows (`dim` class) but must not recolor or hide
  lines (today it doesn't; keep status mapping off `dim`).
- **Do not attach ResizeObserver to 62 cards** — the debounced window resize plus
  the named triggers cover every resize source in this app (Russinovich: measure
  before adding observers; the app has no element-resizing interactions besides
  window/theme/section/toggle, all hooked).

## Read-only production-delta note

Production `interact.js` (124 lines) has the same team-name join and the same
missing section-expand redraw; its golden fixture byte-locks `buildBracket` output
that contains the `.bksvg` markup. A port must carry this algorithm over *after* the
card DOM ports, and re-run its `tests/bracketmap.mjs` (which greps old selectors).
Record only; no production steps.

## Automated checks (exact commands)

```
node --check docs/js/interact.js
node tests/bracket-tree.mjs && node tests/matchcards.mjs
node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
```

(Line geometry itself is browser-measured; the served checks below are the gate.)

## Manual acceptance criteria (served, console-assisted)

- `document.querySelectorAll('.bracket.mode-actual .conn').length` → 30 (Actual
  visible); same for `mode-picked` when visible. Zero paths in the hidden bracket.
- Every line starts at a card edge and ends at its parent's correct row at 1440,
  1024, 768 in both themes; no line crosses through a card.
- Collapse bracket section → resize → expand: lines correct (regression for the
  stale-geometry trap).
- Rapid view toggling (10×): no stale or duplicate lines; no console errors.
- Lines are unreachable by pointer (click-through to cards works over a line).
- Phone tier: `.bksvg` hidden; overview strip carries the shape.

## Handoff checklist and stop condition

- [ ] 30/30 edges in both views; direction and center convergence verified.
- [ ] All five redraw triggers exercised (fonts, resize, theme, section expand,
      view toggle) and correct.
- [ ] No topology import added to interact.js; no new global listeners beyond the
      fonts hook routed through `window.__drawConn`.
- [ ] All tests green.

**Stop** after the checklist. Sculpture work is PLAN-center-sculpture.md; the review
pass is PLAN-map-validation-review.md.
