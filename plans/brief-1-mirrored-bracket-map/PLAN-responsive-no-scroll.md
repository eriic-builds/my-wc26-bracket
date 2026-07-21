# PLAN-responsive-no-scroll — nine fluid columns everywhere, phone overview + vertical flow

## Rank and leverage

**Rank 3 of 6 (Brief 1).** The no-horizontal-overflow contract is an acceptance
criterion at eight named widths and the main way this rebuild can fail review. Doing
it immediately after the card DOM lands (and before connectors) means Plan 4 measures
*final fitted* card boxes, not boxes that later shrink — the brief explicitly requires
"connector measurements use the final fitted card boxes".

## Goal and user-visible outcome

- Desktop and tablet (≥ ~600px container): the complete nine-column mirrored map fits
  the bracket width with **no horizontal scrolling, panning, hidden scrollbar, or
  transform scaling** — density degrades gracefully (gaps → padding → metadata →
  flags+three-letter codes).
- Phone: a complete miniature 31-node/30-edge overview SVG for orientation, then all
  31 readable cards in one round-by-round vertical flow; legend below; both views
  stay in sync with the Actual/My picks toggle.

## In scope

- `.brk-wrap` becomes a size container; `.bracket`/`.bkgrid` layout rules; density
  variants via container queries; removal of the bracket's `overflow-x:auto` +
  hidden-scrollbar rules.
- Three-letter visual team codes at tablet density (`flags.js` addition + a `tcode`
  span in the card row).
- `renderMiniOverview(tree, D, mode)` in `render.js` + phone flow CSS.
- A width-audit helper snippet documented for manual validation.

## Out of scope

- Connector drawing (Plan 4) — but this plan must not break `.bksvg` positioning.
- Card anatomy/status semantics (Plan 2, already landed).
- Trophy sizing hooks beyond reserving the center column (Plan 5 handles its canvas
  sizes; phone static-cup gating is Plan 5's).

## Verified current architecture

- `docs/css/dashboard.css` line 168–171 today:
  `.brk-wrap{padding:8px;overflow:hidden}` and
  `.bracket{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;…;scrollbar-width:none;…}`
  plus `.bracket::-webkit-scrollbar{display:none}` — **this is the banned
  hidden-scrollbar workaround; these are the exact rules this plan replaces.**
  `.round{min-width:150px}` (line 185) is the fixed minimum the brief forbids; it
  becomes dead CSS after Plan 2 (new columns are `.bkcol`) — leave the legacy rule
  in place (untracked pilot pages may use it) but ensure **no new rule** sets a
  fixed min-width on `.bkcol`/`.mcard`.
- Plan 2's DOM: `.bracket > .bksvg + .bkgrid > 9 × .bkcol[data-col]`, center col has
  `.bkcenter` and `.center-stage`; cards `.mcard` with `.mhead/.team/.tname/.tscore`.
- `.bksvg` is `position:absolute;top:0;left:0` — the `.bracket` must keep
  `position:relative` (it has it today) so Plan 4's coordinates hold.
- The inactive bracket is `display:none` via `.brk-wrap[data-view=…]` — container
  queries still apply when it becomes visible; no measurement happens in CSS, so
  this plan has no stale-geometry risk (that risk lives in Plan 4).
- `flags.js` has `FLAG_CODE` (name → ISO2 file code) and is already imported by
  `render.js` after Plan 2.
- Themes multiply everything: font stacks differ per theme (Comic Sans, monospace,
  Tahoma…), so **never** tune widths to one font's metrics; use `minmax(0,1fr)`,
  `min-width:0`, and ellipsis rather than character counts.

## Exact files

| File | Action | Symbols / sections |
| --- | --- | --- |
| `docs/css/dashboard.css` | modify | (a) Replace the `.brk-wrap` rule: add `container-type:inline-size;container-name:brk;` keep padding, keep `overflow:hidden`. (b) Replace the `.bracket` flex/overflow rule with `position:relative;overflow:visible;padding:14px 4px` — **delete** `overflow-x:auto`, `scrollbar-width:none`, `-ms-overflow-style:none`, and the `.bracket::-webkit-scrollbar` rule (they apply to the new map; removing them is required, not optional). (c) Extend the Plan 2 marked block with the fluid grid + density tiers + phone flow below. Own the `.bkgrid/.bkcol/.mcard` *layout* rules from here on (Plan 2 owned their creation; sizes/gaps/visibility now live here). |
| `docs/js/flags.js` | modify | Append `export const TEAM_CODE3 = {…}` (exact 32-entry table below) and `export function teamCode3(name){ return TEAM_CODE3[name] || ""; }`. |
| `docs/js/render.js` | modify | Two surgical insertions only: (1) in the team-row template of `renderMatchCard` add `<span class="tcode" aria-hidden="true">${esc(teamCode3(team))}</span>` immediately after the `tname` span (and import `teamCode3`); (2) add `renderMiniOverview(tree, D, mode)` and call it in `buildBracket` immediately after the `.bksvg` element, before `.bkgrid`. No other render.js edits. |
| `tests/matchcards.mjs` | modify | Extend: every named team row contains a non-empty `tcode`; mini overview per view has 31 `<rect|node>` elements and 30 `<path>` edges and `aria-hidden="true"` on the `<svg>`. |

## Three-letter codes (FIFA trigrams — full names stay in `aria-label`s and `tname`)

```
Algeria ALG · Argentina ARG · Australia AUS · Austria AUT · Belgium BEL ·
Bosnia & Herz. BIH · Brazil BRA · Canada CAN · Cape Verde CPV · Colombia COL ·
Croatia CRO · DR Congo COD · Ecuador ECU · Egypt EGY · England ENG · France FRA ·
Germany GER · Ghana GHA · Ivory Coast CIV · Japan JPN · Mexico MEX · Morocco MAR ·
Netherlands NED · Norway NOR · Paraguay PAR · Portugal POR · Senegal SEN ·
South Africa RSA · Spain ESP · Sweden SWE · Switzerland SUI · United States USA
```

Key the object by the exact bracket names above (they match `topology.seed` keys —
note `Bosnia & Herz.`, `DR Congo`, `Ivory Coast`, `Cape Verde`, `United States`).

## Layout specification

Density tiers, all inside `@container brk (…)` queries (the container is `.brk-wrap`,
so tiers respond to the *bracket's* width, not the viewport — the 1280px `.wrap`
max-width and the ≤1200px rail collapse both change available width independently of
the viewport):

1. **Wide (default, container ≥ ~1100px):** `.bkgrid{display:grid;
   grid-template-columns:repeat(9,minmax(0,1fr));gap:8px}` with the center track
   `minmax(0,1.15fr)` via `grid-template-columns:repeat(4,minmax(0,1fr)) minmax(0,1.15fr) repeat(4,minmax(0,1fr))`.
   Full names (`tname` shown, `tcode` hidden), flags, seeds, dates, scores.
2. **Medium (container ~800–1100px):** shrink `gap` to 4px, card padding down,
   hide `.seed` in card rows and the `.mwhen` secondary text on *undecided* R32
   cards (keep match code always); font-size step down ~0.72rem.
3. **Tablet (container ~600–800px):** hide `.tname`, show `.tcode`; flags stay;
   `mhead` keeps only `.mcode`. This is the brief's "bundled flags plus three-letter
   codes" tier. Full names remain in `aria-label` (unchanged markup).
4. **Phone (container < ~600px):** `.bkgrid` switches to a single-column flow:
   `display:flex;flex-direction:column` with explicit `order` on `.bkcol[data-col]`
   to get round-by-round reading order: cols 1,9 (R32 L/R), 2,8 (R16), 3,7 (QF),
   4,6 (SF), 5 (Final last). Cards full width, full names back on (`tname` shown,
   `tcode` hidden — phone list is the readable representation). `.mini-map` becomes
   visible (hidden at all wider tiers). `.bkhead` labels each column; append the
   side visually via `data-side` (e.g. `.bkcol[data-side="L"] .bkhead::after{content:" · left"}`)
   so the two halves of each round are distinguishable in the flow.

Hard bans (verify by grep in the checkpoint): no `transform:scale` anywhere in the
new rules; no `overflow-x` other than `visible/hidden/clip` on `.brk-wrap/.bracket/
.bkgrid`; no fixed `min-width` on `.bkcol/.mcard`; no wheel/touch handlers (CSS-only
plan). `.mcard` and `.team` get `min-width:0`; `.tname{overflow:hidden;
text-overflow:ellipsis;white-space:nowrap}` already holds via `.team .tname` — keep.

Equal card heights per tier (`.mcard{min-height:…}` per tier) keep
`justify-content:space-around` midpointing later cards between their feeders — same
mechanism the old bracket used with `.match{height:132px}`.

## Mini overview (phone orientation strip)

`renderMiniOverview(tree, D, mode)` returns one inline `<svg class="mini-map"
aria-hidden="true" viewBox="0 0 360 200" role="presentation">`:

- 31 nodes: `x` from `node.col` (9 evenly spaced lanes), `y` from
  `(slot + 0.5) / columnCount * 200`; each a `3×~10px` `<rect class="mm-node mm-<status>">`
  where status is the card-level `won|lost|pending` (reuse the same computation the
  card uses; pass mode).
- 30 edges: elbow `<path class="mm-edge">` from feeder rect edge to parent rect edge
  (pure arithmetic from the same x/y — no DOM measurement).
- Colors via existing tokens (`--win`, `--red`, `--muted`, `--blue`) so themes work.
- `aria-hidden="true"` is mandatory — the readable card list below is the single
  assistive-technology representation (the brief's duplicate-announcement rule).
- It renders **inside each `.bracket`**, so the Actual/My picks toggle synchronizes
  overview and list for free (only the visible bracket's overview shows).

## Dependencies and parallelism

- Depends on: Plans 1 and 2 (tree + card DOM). Independent of Plans 4 and 5, **but
  must land before Plan 4** so connectors measure final boxes (Plan 4 explicitly
  depends on this plan). Plan 5 can run in parallel with this plan (disjoint files
  except `dashboard.css`, where Plan 5 appends its own marked block — append-only on
  both sides, no conflict).
- Leaves for Plan 4: stable `.bracket{position:relative}` + `.bksvg` absolute origin;
  `.mini-map` never intercepts pointers (`pointer-events:none` on it).

## Implementation order

1. `flags.js`: add `TEAM_CODE3`/`teamCode3`. **Checkpoint:**
   `node -e "import('./docs/js/flags.js').then(m=>console.log(Object.keys(m.TEAM_CODE3).length, m.teamCode3('South Africa')))"`
   prints `32 RSA`.
2. `render.js`: insert the `tcode` span. **Checkpoint:** `node tests/matchcards.mjs`
   (with its new `tcode` assertion added) passes; serve — wide view unchanged
   visually (tcode hidden by default rule added in step 3; order steps so the
   default `.tcode{display:none}` ships in the same commit-unit as the span).
3. CSS: container setup, tier 1 grid, kill the overflow/scrollbar rules.
   **Checkpoint:** serve at 1440 and 1280 viewport; in devtools console run the
   audit snippet below; both pass; no horizontal scrollbar on the page.
4. CSS tiers 2–3. **Checkpoint:** audit snippet at 1024, 768 (rail is stacked below
   1200, so the container is nearly viewport-width), and 600 — passes; tablet tier
   shows flags+codes; `aria-label` still carries full names (inspect one card).
5. `renderMiniOverview` + phone tier CSS + column `order`. **Checkpoint:** audit at
   375 and 320; overview visible with 31 nodes/30 edges; list order is R32(L,R) →
   R16(L,R) → QF → SF → Final; legend still below the bracket section; toggling My
   picks updates both overview and list.
6. Extend and run `tests/matchcards.mjs`; full sweep of all test files.

Audit snippet (manual validation, run in the browser console at each width — this is
the brief's `scrollWidth <= clientWidth + 1` check):

```js
[...document.querySelectorAll('.bracket')].map(b =>
  `${b.className}: scroll=${b.scrollWidth} client=${b.clientWidth} ok=${b.scrollWidth <= b.clientWidth + 1}`)
```

Both brackets must report `ok=true` (switch the view toggle so each is measured while
visible; a `display:none` bracket reports 0/0 which is vacuously fine — measure the
visible one at each width). Also check `document.documentElement.scrollWidth <=
window.innerWidth + 1` for whole-page overflow.

## Data contracts and invariants

- No markup change to statuses, `data-*` contract, or aria-labels beyond adding the
  aria-hidden `tcode` span and the aria-hidden overview.
- Three-letter codes are visual-only; assistive labels always use full names.
- Both views keep identical geometry across all tiers.

## Edge cases and codebase traps

- **Container width ≠ viewport width.** The rail (186px) sits beside `.content`
  above 1200px viewport and stacks below it; `.wrap` caps at 1280px with 22px
  paddings. Tune tiers to the *container* via `@container brk`, never `@media`, or
  the 1024 viewport case (container ≈ 770px) lands in the wrong tier.
- **`container-type:inline-size` on `.brk-wrap`** changes how its percentage heights
  resolve for children — nothing in the map uses percentage heights, but if the
  bracket collapses to zero height after the change, this is why (add explicit
  min-heights to `.mcard` per tier).
- **Easy theme** raises `--fs` to 18px and `--gap` to 22px — re-run the audit in
  Easy at 768/1024; if a tier overflows only in Easy, cut gaps in that tier rather
  than shrinking below legibility.
- **GeoCities/Minecraft/WinXP/Doodle** override radii/borders (3px ridge borders add
  width) — border-box sizing is global (`*{box-sizing:border-box}`) so widths hold,
  but check one fun theme at 768.
- **Do not "fix" `body{overflow-x:hidden}`** (line 42) — it masks page-level
  overflow, which is exactly why the audit checks the bracket element itself, not
  the page.
- The old `.bracket` rules being replaced also affected the legacy pilot pages only
  if those pages reuse `.bracket` — grep `docs/pilot.html docs/design-lab.html
  docs/glass-preview.html docs/js/pilot-skin.js docs/css/pilot-skin.css` for
  `class="bracket"` / `.bracket` first; if any hit exists, scope every changed rule
  under `.brk-wrap .bracket` instead of bare `.bracket` and leave the originals.
- Phone `order` reordering is visual only — DOM order (and therefore screen-reader
  order) stays L-outer→center→R-outer. That is acceptable for the overview+list
  contract, but keep the `.bkhead` side suffix so the visual flow is labeled; do
  not try to reorder the DOM per breakpoint (that would need JS and re-rendering).
- `justify-content:space-around` midpointing only holds when sibling cards share a
  height — if a card wraps to a third line at some tier, fix with `min-height` per
  tier, not per-card heights.

## Read-only production-delta note

Production `dashboard.css` (414 lines) has the same `.bracket{overflow-x:auto}` +
hidden-scrollbar pattern and no container queries; a port must re-apply this tier
system there and re-check it against production-only surfaces (compare/leaderboard
views render brackets too). Note only; no production edits now.

## Automated checks (exact commands)

```
node --check docs/js/render.js && node --check docs/js/flags.js
node tests/matchcards.mjs
node tests/bracket-tree.mjs && node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
grep -n "transform:scale" docs/css/dashboard.css   # expect: no hits in the new blocks
grep -n "overflow-x:auto" docs/css/dashboard.css   # expect: only .chips (filter bar), never .bracket/.bkgrid
```

## Manual acceptance criteria

At viewport widths 320, 375, 600, 768, 1024, 1280, 1440, and ≥1800 (each in dark and
one other theme; each in both bracket views):

- The audit snippet reports `ok=true` for the visible bracket; no sideways panning
  is possible (attempt trackpad horizontal swipe over the bracket — page does not
  pan and no scrollbar appears).
- ≥600px: all nine columns visible; no card overlap; no clipped card; match codes
  always legible; tablet tier shows flag + three-letter code.
- <600px: overview strip visible with the full shape; all 31 cards readable below,
  round-by-round with side labels; legend present below the cards.
- No layout jump when toggling Actual/My picks at any width.

## Handoff checklist and stop condition

- [ ] Hidden-scrollbar rules removed for the map; grep checks pass.
- [ ] Eight widths audited in both views; results noted in the handoff message.
- [ ] `tcode`/overview assertions added to `tests/matchcards.mjs`, all tests green.
- [ ] No JS behavior added (CSS + render-string only); `interact.js` untouched.

**Stop** after the checklist. Connector work is PLAN-feeder-connectors.md.
