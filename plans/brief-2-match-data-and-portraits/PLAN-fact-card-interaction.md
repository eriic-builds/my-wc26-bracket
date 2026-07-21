# PLAN-fact-card-interaction — optional data loading, compact fact card, hover/focus behavior

> **GATE: Brief 2 starts only after explicit map approval (Brief 1 complete).**

## Rank and leverage

**Rank 3 of 6 (Brief 2).** This is the first user-visible Brief 2 change and the
foundation for the dialog (Plan 4) and portrait shell (Plan 5): it owns optional
resource loading, the `initMatchDetails()` lifecycle, the compact card surface, and
the team-history precedence rule. Getting its scoping right (Actual path only,
completed cards only) is what keeps My picks clean.

## Goal and user-visible outcome

Hovering or keyboard-focusing a **completed** match card in the **Actual path** view
shows a compact, locally-served fact card (teams, score, round; scorers+minutes;
pens/ET note; cards; stadium+city; attendance; referee; source label — missing
sections omitted, never blank rows). My picks shows nothing new. If
`match-details.json` fails to load, one explicit degraded notice appears and the
bracket stays fully usable.

## In scope

- `docs/js/main.js`: load `data/match-details.json` and `data/match-portraits.json`
  as **optional** same-origin resources (`{ ok, data, error }` state objects — a
  failure must not become a success-shaped `{}`); pass both to a new
  `initMatchDetails(root, detailsState, portraitState)` after `initInteractions()`;
  keep a `window.__matchDetailsCleanup` teardown called before each re-render
  (same pattern the trophy uses).
- `docs/js/match-details.js` (new): the initializer; event delegation scoped to
  `.bracket.mode-actual`; intent-delayed hover; focus behavior; viewport-clamped
  positioning; DOM-node + `textContent` rendering (no innerHTML for external
  strings); AbortController-based cleanup.
- `docs/index.html`: one fact-card host element `<div id="factcard" class="factcard"
  aria-hidden="true"></div>` beside the existing `#statcard`.
- `docs/css/dashboard.css`: marked block for `.factcard` (+ degraded-notice style),
  viewport-safe sizing, no horizontal overflow.
- Team-history precedence: inside a completed Actual-path match card the team-hover
  stat card must not open.
- Degraded-state notice near the bracket when details fail to load.

## Out of scope

- The full `<dialog>` (Plan 4) — but this plan emits the pointer/keyboard events
  Plan 4 hooks (`Enter/Space/click/tap` are captured here and no-op with a TODO
  seam until Plan 4 lands, or Plans 3+4 execute together — decided: **this plan
  ships hover/focus preview only; activation keys do nothing yet**).
- Portraits, iframes, 500ms external timer, disclosure (Plan 5).
- Any render.js change: Brief 1 already emits `data-match-code`, `data-played`,
  `data-home/away`, tabindex, aria-labels. If a needed hook is missing, stop and
  report — do not patch render.js here (its output is frozen by
  `tests/map-frozen.mjs`; changing it means an explicit reviewed re-freeze).

## Verified current architecture

- Brief 1 card contract (see `plans/brief-1-mirrored-bracket-map/PLAN-mirrored-match-cards.md`):
  completed Actual cards carry `data-played="true"`, `data-home`, `data-away`,
  `tabindex="0"`; picked-mode cards carry none of that. The inactive bracket is
  `display:none`, so scoping delegation to `.bracket.mode-actual` plus checking
  `closest('.brk-wrap')[data-view] === "actual"` makes view switches inherently
  safe.
- Team-history hover binds `mouseenter` directly on `.team[data-team]`
  (interact.js:101–104) and shows `#statcard`. Precedence rule: in
  `match-details.js`, on showing a fact card call `#statcard.classList.remove('show')`,
  and suppress statcard inside completed cards — implement by adding one guard to
  the *fact-card* layer, not by editing interact.js: a capture-phase
  `mouseenter`-equivalent (`mouseover` with `closest` check) that hides `#statcard`
  whenever the hover target is inside `.mcard[data-played="true"]` in the actual
  view. interact.js stays untouched.
- `main.js` `loadData()` uses `Promise.all` and **fails the whole dashboard** if
  required data fails — optional resources must use separate `.catch`-wrapped
  fetches, not join that gate.
- `showDashboard()` re-runs per session (demo/own/shared) — everything this plan
  attaches must tear down via the returned cleanup/AbortController.

## Exact files

| File | Action | Symbols |
| --- | --- | --- |
| `docs/js/match-details.js` | create | `initMatchDetails(root, detailsState, portraitState)` → cleanup fn |
| `docs/js/main.js` | modify | optional loads + init/teardown wiring in `showDashboard()` |
| `docs/index.html` | modify | `#factcard` host div |
| `docs/css/dashboard.css` | modify | `.factcard`, `.details-degraded` block |
| `tests/match-details.mjs` | create | formatting/safety unit tests for the pure formatters exported by `match-details.js` (section builder takes a record → DOM-free string/array description or a JSDOM-free structural object — keep formatters pure so Node can test them without a DOM) |

## Compact card behavior spec (decisions locked)

- Show on `mouseover` of `.mcard[data-played="true"]` (actual view only) after a
  **150ms intent delay** (cancel on leave — the dense grid needs this to avoid
  flicker); show immediately on `focusin` of the card.
- Hide on leave of card+factcard region / `focusout` / `Escape` / view switch /
  section collapse.
- Position: fixed, clamped to viewport (reuse the `posCard` math pattern from
  interact.js:91–94), never overlapping the hovered card's row under the pointer,
  `max-width:min(92vw, 340px)`, internal vertical scroll beyond `~60vh`, **no
  horizontal overflow**.
- Content priority per the brief (teams+score+round; scorers; note; cards;
  venue; attendance; referee; source "FIFA"); missing → section absent. Long event
  lists truncate with "+N more — open details" (full list is Plan 4's dialog).
- All values from `match-details.json` set via `textContent`/`createElement`.
- Upcoming cards and all My picks cards: no listener effects, no empty panel.
- Degraded state: if `detailsState.ok === false`, render one notice near the
  bracket toggle ("Match facts are unavailable right now — scores and picks still
  live.") and skip all hover wiring; if a specific completed card has no record,
  simply show nothing extra for it (fail quiet per-card, loud per-file).

## Dependencies and parallelism

- Depends on: Brief 2 Plan 1 (contract; a locally generated or hand-written
  contract-valid `match-details.json` suffices for development if Plan 2 hasn't
  run). Best after Plan 2 for real data.
- Blocks: Plans 4 and 5 (they extend this initializer). Plan 2 can run in parallel.

## Implementation order

1. `main.js` optional loading + state objects + teardown seam. **Checkpoint:**
   break the filename deliberately → dashboard still renders + degraded notice
   shows; fix → notice gone. `node --check docs/js/main.js`.
2. `#factcard` host + CSS block. **Checkpoint:** static mock content positioned and
   clamped at 375/768/1440 via devtools.
3. `match-details.js` delegation, intent timer, focus path, hide paths, statcard
   suppression. **Checkpoint (served):** hover M97 in Actual → facts after ~150ms;
   crossing quickly over cards shows nothing; focus via Tab shows the same card;
   Escape hides; hovering a team row inside M97 shows facts, not team history;
   hovering a team row in an *upcoming* card still shows the old team-history
   card; My picks view: nothing anywhere.
4. View-switch teardown: toggle to My picks with a card open → factcard hides;
   toggle back → no stale card; re-render (New bracket → demo) → no duplicate
   listeners (AbortController). **Checkpoint:** rapid toggling shows no leaks in
   the Performance panel listener count.
5. `tests/match-details.mjs` for the pure formatters: omission of missing
   sections; minute strings passed through; hostile strings (e.g. `<img onerror>`)
   remain inert data in the structural output; attendance formatting.
   **Checkpoint:** `node tests/match-details.mjs` green.
6. Full sweep: all JS + Python suites; `node tests/map-frozen.mjs` unchanged
   (render.js untouched).

## Data contracts and invariants

- Initial page load and all hover/focus in this plan contact **same origin only**.
- `initMatchDetails` is idempotent-per-render and fully torn down between renders.
- My picks exposes zero match-data surface (test + manual).
- No horizontal overflow from the factcard at any width.

## Edge cases and codebase traps

- **Don't bind to card elements directly** — delegation on the `#app` root
  (filtered by `closest('.mcard[data-played="true"]')` + actual-view check)
  survives re-renders and the two-brackets-in-DOM structure.
- `mouseover`/`mouseout` bubble (needed for delegation); `mouseenter` doesn't —
  use over/out with `relatedTarget` containment checks to avoid flicker between
  child rows.
- Touch devices fire synthetic mouseover — guard with `pointerType` via
  pointer events or `matchMedia('(hover: hover)')`; touch behavior belongs to
  Plan 4 (tap → dialog), so this plan must not open hover cards on tap.
- The factcard host lives outside `#app` (like `#statcard`) so `innerHTML`
  re-renders don't destroy it — but its *content* must be cleared on teardown.
- Collapsed bracket section: `focusin` can still fire via programmatic focus —
  the zero-size guard: skip showing if `card.clientWidth === 0`.
- Shared-link view renders someone else's bracket — facts are result-derived, so
  they show there too; that's correct (actual results are not private).

## Read-only production-delta note

Production `main.js` has the compare/leaderboard layer with extra dialogs and its
own hint system near the viewerbar — a port must re-check factcard z-index/overlay
interactions against compare views and its `wcb.hint.*` UI. Record only.

## Automated checks (exact commands)

```
node --check docs/js/match-details.js && node --check docs/js/main.js
node tests/match-details.mjs
node tests/map-frozen.mjs && node tests/matchcards.mjs && node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
python3 tests/match_details.py
```

## Manual acceptance criteria

- Hover, focus give equivalent facts on completed Actual cards; upcoming and
  My picks cards give nothing; team history preserved outside completed cards.
- Details file blocked → one degraded notice, everything else works.
- No third-party request appears in the Network tab at any point in this plan.
- Dark/light/easy themes; 320–1440 widths: card fits, no sideways scroll.

## Handoff checklist and stop condition

- [ ] Optional-resource states + teardown wired; degraded path demonstrated.
- [ ] Compact card complete with omission rules; precedence rule holds.
- [ ] Activation keys intentionally inert (documented seam for Plan 4).
- [ ] All suites green; render.js untouched.

**Stop** after the checklist. The dialog is PLAN-full-match-dialog.md.
