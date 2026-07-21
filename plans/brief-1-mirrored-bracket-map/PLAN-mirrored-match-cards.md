# PLAN-mirrored-match-cards — one outlined card per game, mirrored nine-column markup

## Rank and leverage

**Rank 2 of 6 (Brief 1).** This plan replaces the bracket's visual grammar (team rows
in six sequential columns → 31 game cards in nine mirrored columns) and defines the
DOM contract every later plan touches: connectors hook `data-match-code`, responsive
work styles these cards, the sculpture mounts in the center stage this plan creates,
and Brief 2 later attaches to `data-match-code` / `data-played`. It is the largest
single change and the one whose contract must stabilize before parallel work starts.

## Goal and user-visible outcome

Both bracket views ("Actual path" and "My picks") render the full mirrored tree:
nine columns of outlined match cards converging on a center Final, each card showing
match code, date or score, two team rows with flags, statuses, placeholders, and an
accessible label. All eight legend meanings still apply. Old-style connectors will be
temporarily wrong/absent between this plan and Plan 4 — that is expected and stated
in the review notes.

## In scope

- Rewrite `buildBracket(D, mode)` in `docs/js/render.js` around
  `deriveBracketTree(topology)` + new helpers `renderMatchCard(D, tree, node, mode)`
  and `renderCenterStage(D, tree, mode)`.
- Card anatomy, status treatments, flags (bundled SVGs via `flags.js`), placeholders,
  accessible labels, Brief 2 data attributes.
- Legend label updates (exact strings below) in `buildLegend()`.
- Card/center-stage CSS appended to `docs/css/dashboard.css` (marked block).
- New `tests/matchcards.mjs` + new frozen fixture `tests/fixtures/results.frozen.json`.

## Out of scope

- Connector drawing and redraw lifecycle (Plan 4 — `interact.js` is **not edited here**).
- Grid fluidity, density variants, container queries, phone overview/flow (Plan 3).
- Trophy/Three.js/fallback SVG (Plan 5). This plan only emits the empty mount node.
- Any change to scorecard, KPIs, story, results panels, share, builder, parse, themes.

## Verified current architecture

- `render.js` is a **pure HTML-string engine**: `renderDashboard(picks, live, topo)`
  → `computeState()` → section builders. All dynamic text goes through `esc()`.
  Keep that: no DOM APIs in render.js, everything escaped.
- `buildBracket(D, mode)` (render.js:326) currently emits
  `<div class="bracket mode-<mode>"><svg class="bksvg" aria-hidden="true"></svg>` +
  6 `.round` columns (R32 team-pair "matches", 4 KO rounds of bare team pairs, a
  `champcol`). `renderDashboard` calls it twice into `.brk-wrap` (render.js:696);
  CSS hides the inactive one via `.brk-wrap[data-view=…] .bracket.mode-…{display:none}`.
  Keep the two-instances-plus-`data-view` mechanism and the `.bksvg` first child —
  `interact.js` `activeBracket()`/`drawConnectors()` depend on both.
- Status cell renderers to adapt (keep their class vocabulary — dozens of CSS rules
  and the legend depend on it):
  - `r32_cell(D, team, picked, decided, real_winner, freebie)` → classes
    `adv | busted | realadv | out`, badges `✓ ✕ ▲`, freebie 🎁, seed chip, `fav-bar`.
  - `pickBox(D, team, picked, short, champ, st)` → `st-won | st-lost | st-pending`,
    `champ`, `advancer`, `gone`, chevron `›`, 🏆.
  - `laterCell(D, team, picked, short, champ, actual, mode)` → the actual-replacement
    logic: pick alive → `pickBox`; pick out and actual known → `st-actual` row with
    `▲` and tooltip; pick out and no actual → **currently a blank cell** (`team blank`).
- Occupant resolution helpers on `D` (reuse, do not reimplement): `D.RES[code]` =
  `[gA, gB, winner, note]`; `D.PICK_BY_CODE[code]`; `D.actual_advancer(short, team)`;
  `D.reach_status`, `D.pick_status`, `D.out_at_round`, `D.ELIM`; `D.R32` rows are
  `[code, date, a, b, pick]`; `D.FREEBIE_MATCH`; `D.CHAMP`, `D.CHAMP_NOTE`.
- KO scheduling text sources (mirror `buildRoundResultsPanel`): `D.KO_FIX[code]`
  (live fixtures, `[day, et, ct, ptz]`), `D.R16_FIX` rows (`[code, day, a, b, …]`),
  fallback `D.KO_DATES[short]` ("Jul 9–11" etc.).
- `interact.js` binds team-history hover, search dim, and favorites to
  `.team[data-team]` — the new card team rows must keep class `team` +
  `data-team` + `tabindex="0"` so those features survive untouched.
- `flags.js` exports `flagImg(name, cls)` → `<img … src="flags/<code>.svg">`, already
  escaped, lazy-loading. All 32 team names in `topology.seed` have codes.
- The existing sandbox golden test (`tests/golden.mjs`) needs `/tmp/py_sections.json`
  and live results — treat as unavailable; the bracket sections diverge intentionally
  from the Python original from this plan onward.

## Exact files

| File | Action | Symbols / sections |
| --- | --- | --- |
| `docs/js/render.js` | modify | Add `import { deriveBracketTree } from "./bracket-tree.js";` and `import { flagImg } from "./flags.js";` at top. Replace the body of `buildBracket()`. Add `renderMatchCard()`, `renderCenterStage()`, and a small `matchWhen(D, node)` date helper. Adapt `r32_cell`/`pickBox`/`laterCell` into row renderers (keep names or rename to `r32Row`/`koRow` — keep the class vocabulary). Update the three legend strings in `buildLegend()`. Touch nothing else in the file. |
| `docs/css/dashboard.css` | modify | Append one clearly-marked block `/* ── mirrored map: cards & center stage (PLAN-mirrored-match-cards) ── */` with `.bkgrid`, `.bkcol`, `.mcard`, `.mhead`, `.mflag`, `.tscore`, `.team.placeholder`, `.center-stage`, `.trophy-slot`, `.champ-state` rules. Do **not** edit or delete the legacy `.round/.match/.matches/.rhead/.champcol` rules (untracked `docs/pilot.html`, `docs/design-lab.html`, `docs/glass-preview.html`, `docs/js/pilot-skin.js` may reference them — preserving untracked files is a hard rule). Do not touch `.bracket{overflow-x:auto…}` yet — Plan 3 owns the `.bracket` layout rules. |
| `tests/matchcards.mjs` | create | Card coverage & status tests (below) |
| `tests/fixtures/results.frozen.json` | create | Byte copy of the **current** `docs/data/results.json` (M73–M97 decided) taken at execution time; tests read this, never the live file |

## Card DOM contract (Plans 3, 4, 6 and Brief 2 consume this — do not deviate)

```html
<div class="mcard st-…" data-match-code="M97" data-round="qf" data-side="L"
     data-played="true" data-home="France" data-away="Morocco"
     tabindex="0" aria-label="M97, Quarterfinal: France 2, Morocco 0. France advance.">
  <div class="mhead"><span class="mcode">M97</span><span class="mwhen">Thu Jul 9</span></div>
  <div class="team st-won" data-team="France" data-feeder="M89" data-round="qf" tabindex="0">
    <span class="fav-bar"></span><img class="mflag" …><span class="seed">1I</span>
    <span class="tname">France</span><span class="tscore">2</span><span class="rb ok">✓</span>
  </div>
  <div class="team st-lost" data-team="Morocco" data-feeder="M90" …>…<span class="tscore">0</span>…</div>
</div>
```

Rules:

- Every card carries `data-match-code` and `data-round`; `data-side` is `L|R|C`.
- **Actual mode only**, decided matches only: add `data-played="true"`, `data-home`,
  `data-away` (the two *actual* participants from `D.RES`/feeder winners),
  `tabindex="0"`, and the full `aria-label`. Upcoming actual cards get an
  `aria-label` (e.g. `"M101, Semifinal: France vs winner of M98, Jul 14–15"`) but
  **no** `data-played/home/away`. **Picked-mode cards get `data-match-code`,
  `data-round`, `data-side`, and `aria-label` only** — no `data-played`, no
  tabindex on the card (Brief 2 contract: My picks exposes no match-data state).
- Team rows: keep `class="team …"` + `data-team` + `data-round` + `tabindex="0"` +
  `fav-bar` + seed span exactly as today (search/favorites/hover compatibility).
  New in rows: `flagImg(team, "mflag")` before the seed, `data-feeder="MXX"` on KO
  rows (row *i* ↔ `node.feeders[i]` — Plan 4 keys connector status off this), and
  `<span class="tscore">` with that team's goals when the match is decided
  (`D.RES[code][0]` is the goals of the feeder-A/`a` side; orient carefully — for
  R32 rows the stored order is `[gA, gB]` matching `[a, b]`; for KO matches the
  result note in `D.RES[code]` is oriented to the *actual* feeder-A winner, mirror
  `buildRoundResultsPanel`'s `an/bn` orientation logic).
- Statuses per row are computed exactly as today: R32 rows via the `r32_cell` logic
  (decided/picked/real_winner/freebie), KO rows via the `laterCell` logic per mode.
  **The one behavior change:** where `laterCell` returned the invisible
  `team blank`, emit a **placeholder row** instead:
  `<div class="team placeholder"><span class="tname">Winner M89</span></div>` —
  no `data-team` (so hover/search/favorites skip it), aria text “Winner of match 89”.
  The brief's match-card anatomy requires visible placeholders.
- Card-level status class `st-…` mirrors the R32 `data-status` convention
  (`won|lost|pending` from `D.pick_status`) so CSS can outline the card; keep the
  existing per-row classes as the primary status carrier.
- `mwhen`: decided → nothing extra needed beyond `tscore`s (keep header date);
  upcoming → date from `matchWhen`: R32 → `D.R32` row date; KO → `D.KO_FIX[code]`
  day, else `R16_FIX` day for r16, else `D.KO_DATES[short]`.
- All text through `esc()` — including `aria-label`, team names inside labels, notes.

Column markup (consumed by Plan 3's CSS and Plan 4's measurement):

```html
<div class="bracket mode-actual"><svg class="bksvg" aria-hidden="true"></svg>
  <div class="bkgrid">
    <div class="bkcol" data-col="1" data-side="L" data-round="r32">
      <div class="bkhead">Round of 32</div>
      …8 .mcard…
    </div>
    … cols 2–4 … <div class="bkcol bkcenter" data-col="5">…center stage…</div> … cols 6–9 …
  </div>
</div>
```

Center stage (col 5) — Plan 5 fills the mount, this plan ships it inert:

```html
<div class="center-stage">
  <div class="trophy-slot" data-trophy></div>   <!-- empty; Plan 5 mounts here -->
  <div class="bkhead">Final · Sun Jul 19 · MetLife</div>
  …the M104 .mcard (full anatomy, both modes)…
  <div class="champ-state">…</div>
</div>
```

`champ-state` replaces the old `champcol`: render the existing champion element
(`laterCell(D, D.CHAMP, true, "champion", true, null, mode)` equivalent — gold
`team champ` row with 🏆) plus `<div class="champ-note">` with `esc(D.CHAMP_NOTE)`.
Same meanings as today: gold champion treatment is legend meaning 8.

## Legend (exact strings — keep all eight meanings, relabel three lines)

In `buildLegend()` replace only these labels; keep order, markup, and swatches:

1. unchanged — `Your pick — won / through`
2. unchanged — `Your pick — out`
3. `Your path so far (correct)` → `Correct path — feeder line into the next game`
4. `Your pick — still to play` → `Still to play — pending feeder line`
5. unchanged — `Who actually advanced (you had the other team)`
6. `Actual path` → `Actual path — feeder line of the real result`
7. unchanged — `You have this team advancing`
8. unchanged — `Your champion pick`

## Dependencies and parallelism

- Depends on: **Plan 1** (imports `deriveBracketTree`).
- Blocks: Plans 3 and 4 (they style/measure this DOM). Plan 5 may run in parallel
  *after* this plan lands (needs `[data-trophy]`); its file set is otherwise disjoint.
- Shared-file ownership: this plan is the **first** editor of `render.js` and
  `dashboard.css` in Brief 1. It leaves: `buildBracket` consuming the tree,
  card/center CSS block appended. Plan 3 edits `render.js` only to add
  `renderMiniOverview` + the `tcode` span (stated insertion points in Plan 3);
  Plan 4 edits `interact.js` only; Plan 5 edits `render.js` not at all.

## Implementation order

1. Record baseline: run the four legacy tests; save served-site screenshots of the
   current bracket (both views) for comparison.
2. Create `tests/fixtures/results.frozen.json` as an exact copy of the current
   `docs/data/results.json`. **Checkpoint:** `python3 -m json.tool tests/fixtures/results.frozen.json > /dev/null`.
3. In `render.js`, add imports and `matchWhen`. Build `renderMatchCard` for **R32
   nodes** only (both modes use identical R32 occupants). Rewrite `buildBracket` to
   emit the 9-column skeleton with R32 cards in cols 1 and 9 and placeholder-only
   cards elsewhere. **Checkpoint:** `node --check docs/js/render.js`, then serve and
   confirm both views show 16 R32 cards in the outer columns, legend intact,
   scorecard/KPIs untouched.
4. Implement KO card occupants for both modes by adapting `laterCell`/`pickBox`
   semantics per row (pick chain for `picked`, pick-with-▲-replacement for `actual`,
   placeholders where blank). Wire scores/`mwhen`/freebie/champ. Add the center
   stage. **Checkpoint:** serve; walk M97 (France 2–0 Morocco, decided) in Actual:
   France row `st-won` + ✓ + score 2, Morocco `st-lost` + score 0; walk a busted
   pick in My picks (demo has England as champ) and confirm ✕/`gone`/chevron
   meanings match the old bracket's statuses for the same teams.
5. Add data attributes + aria-labels per the contract, then the CSS block: outlined
   card (`border:1px solid var(--border2); border-radius:var(--radius-sm);
   background:var(--panel)`), `mhead` styling, `tscore` weight, `placeholder`
   dashed/dimmed, center-stage vertical stack. Static 9-track grid for now:
   `.bkgrid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px}` and
   `.bkcol{display:flex;flex-direction:column;justify-content:space-around;min-width:0}`
   — Plan 3 refines all of this; keep it minimal and inside the marked block.
   **Checkpoint:** serve at a wide window; no console errors; cards legible in dark
   + light themes.
6. Write `tests/matchcards.mjs` (uses `demo-picks.json`, `topology.json`, and the
   **frozen** fixture — never live results):
   - each of `buildBracket(D,"actual")` / `"picked"` contains exactly 31
     `data-match-code` occurrences and all 31 expected codes exactly once;
   - actual view: every code in the frozen fixture's `res` (M73–M97) has
     `data-played="true"` and `data-home`/`data-away` matching the fixture winners
     chain; no `data-played` anywhere in the picked view;
   - no `team blank` string in either view; every unresolved KO slot renders
     `Winner M`;
   - per-status spot checks pinned to the frozen fixture (e.g. M97 France `st-won`,
     M104 rows are placeholders in actual, England `champ` class in picked);
   - every `<` in team-derived strings is escaped (feed a hostile entrant/team name
     through `esc` path by asserting no raw `<script` when a crafted picks object is
     rendered);
   - both views byte-share geometry: strip status classes/attrs and occupant text →
     the sequence of `data-match-code` and `data-feeder` attributes is identical.
   **Checkpoint:** `node tests/matchcards.mjs` exits 0.
7. Full sweep: `node tests/bracket-tree.mjs && node tests/matchcards.mjs &&
   node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs &&
   node tests/parse.mjs`.

## Data contracts and invariants

- Both views: same 31 codes, same slots, same feeder attribution; only occupants,
  statuses, and data attributes differ (brief's shared-geometry contract).
- Never show an actual replacement in the picked view; never show pick-only teams as
  advanced in the actual view beyond today's `laterCell` semantics.
- Scoring numbers (`D.CONF/OUT/LIVE/ATTAIN`) are not recomputed or altered anywhere.
- `esc()` on every interpolated value; no `innerHTML`-unsafe seams introduced.

## Edge cases and codebase traps

- **KO score orientation**: `D.RES[code] = [gA, gB, winner, note]` is oriented to
  the *actual* feeder order, not to whichever team sits in the row. Resolve each
  row's goals by matching the row team to the actual feeder-A/feeder-B winners
  (`buildRoundResultsPanel` lines 556–566 show the correct pattern). Getting this
  wrong swaps scores silently on penalty games like M74 (1–1, Paraguay on pens).
- **Penalty notes**: append `note` (e.g. `4–3 pens`) in the header or after scores —
  it exists on M74/M75/M83/M92 in the frozen fixture; don't drop it.
- **The freebie** (`D.FREEBIE_MATCH` = M73 demo): keep the 🎁 tag on the picked R32
  row exactly as `r32_cell` does today.
- **`gone` teams**: a pick that won into a round but died later renders `st-won gone`
  with no ✓ (see `pickBox`). Preserve — the legend's meanings depend on it.
- **Champion note in actual vs picked**: `D.CHAMP_NOTE` is pick-centric in both
  views today; keep it (do not invent an "actual champion" display — M104 undecided).
- **Duplicate team rows across views**: `interact.js` queries `.team[data-team]`
  document-wide; both brackets' rows already get hover/search behavior today (the
  hidden view is `display:none`, so hover is unreachable but dim classes still
  toggle). Nothing to fix; just don't rename the classes.
- **Do not touch `initInteractions`** even though connectors now mis-draw (they
  join repeated `data-team` across `.round` columns which no longer exist —
  `rounds` queries return `[]`, so it degrades to *no lines*, which is safe).
  Verify it degrades silently, then leave it for Plan 4.
- `window.WCSTATS` hover cards must keep working on card team rows (same
  `data-team` attribute — verify one hover manually).
- Emoji/nickname helpers (`teamEmoji`, `STORY_*`) are for story cards, not the map —
  don't reuse them in cards; flags come from `flags.js` only.

## Read-only production-delta note

Production's `render.js` output is byte-locked by `tests/fixtures/golden-sections.json`
(rendered against its own frozen results). This card rewrite is exactly the kind of
"intentional render change" that repo requires a reviewed `--update` for, and its
`tests/bracketmap.mjs` asserts old-DOM selectors (`st-actual[^>]*data-team=`) that a
port must rewrite against the new card DOM. Its `compare.js` leaderboard also renders
brackets — a port must check the mirrored map inside compare views. Record only; no
production steps now.

## Automated checks (exact commands)

```
node --check docs/js/render.js
node tests/bracket-tree.mjs
node tests/matchcards.mjs
node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
```

## Manual acceptance criteria (serve: `cd docs && python3 -m http.server 8080`)

- Wide desktop: nine columns, mirrored halves converging on the center Final;
  31 outlined cards; M101/M102 sit beside the center column.
- Every decided card: two flags, names, per-team scores, note when present, ✓/✕/▲
  meanings identical to the pre-change bracket for the same teams.
- Every undecided KO card shows `Winner MXX` placeholders — zero invisible blanks.
- Legend shows eight items with the three updated labels.
- Toggling Actual/My picks swaps occupants/statuses with no geometry change (cards
  don't move) and no `data-played` in My picks (inspect via devtools).
- Search for "France": non-matching team rows dim; favorites star still paints
  `fav-bar`; team hover card still appears.
- Dark, light, easy, and one fun theme all render legible cards.
- Scorecard totals, KPIs, story, results panels unchanged from the baseline
  screenshots.

## Handoff checklist and stop condition

- [ ] Card DOM contract above matches shipped markup exactly.
- [ ] `[data-trophy]` mount exists and is empty.
- [ ] Frozen fixture created; `tests/matchcards.mjs` green against it.
- [ ] Legacy tests green; no edits to `interact.js`, `main.js`, `index.html`.
- [ ] Known-and-accepted: no connector lines until Plan 4.

**Stop** after the checklist. Do not start layout fluidity (Plan 3) or connectors
(Plan 4) inside this task.
