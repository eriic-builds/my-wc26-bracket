# PLAN-map-validation-review — frozen regression net, full sweep, served preview, hard stop

## Rank and leverage

**Rank 6 of 6 (Brief 1). Runs last; depends on all five other plans.** This is the
review gate the whole program hinges on: Brief 2 must not start until the map is
approved from this plan's served preview and screenshots. Its leverage is catching
cross-plan integration gaps (each earlier plan validated itself; this one validates
the *composition*) and leaving a frozen regression net so later work (Brief 2, a
future production port) can prove it didn't break the map.

## Goal and user-visible outcome

Every Brief 1 acceptance criterion verified against the running site; a
frozen-fixture regression test that locks the new bracket sections; a screenshot
packet at all review widths/themes/views; then a **hard stop for user approval**.
No new features.

## In scope

- `tests/map-frozen.mjs` — frozen snapshot test of the changed map sections.
- `tests/fixtures/map-sections.frozen.json` — the snapshot (generated once,
  reviewed, then locked).
- Full automated sweep + the manual acceptance matrix.
- Served preview + screenshot capture + review summary for the user.
- Verifying no repo hygiene rule was violated (untracked files preserved, no
  commits, production repo untouched).

## Out of scope

- Any feature or fix beyond what a failed check strictly requires (fixes go back
  through the owning plan's contract; if a contract itself must change, stop and
  report instead of improvising).
- Brief 2 anything (no `data`-hover, FIFA details, portraits).
- Commits, pushes, deploys, production porting, repository synchronization.
- Deleting legacy CSS (`.round/.match/.champcol…`) — explicitly deferred beyond
  Brief 1 because untracked pilot/design pages may use those classes; leave them.

## Verified current architecture (as of this plan's start)

- Plans 1–5 landed: `bracket-tree.js`, card DOM + center stage, fluid tiers +
  overview, 30 DOM-derived connectors + lifecycle, sculpture + fallback.
- Test files present: `bracket-tree.mjs`, `matchcards.mjs` (+ frozen results
  fixture), and the four legacy suites. `tests/golden.mjs` still exists, still
  needs `/tmp/py_sections.json` + live results — **documented limitation, not a
  gate**; this plan adds the replacement net rather than repairing it (the brief
  bans depending on it).
- `docs/data/results.json` is rewritten by the sync workflow up to 3×/day — any
  new fixture must be a `tests/fixtures/` copy, never the live file.

## Exact files

| File | Action | Why |
| --- | --- | --- |
| `tests/map-frozen.mjs` | create | Locks `buildBracket(D,"actual")`, `buildBracket(D,"picked")`, and `buildLegend()` output byte-for-byte against the frozen inputs (demo picks + frozen results + topology). Supports `--update` to intentionally re-freeze, printing a loud warning to review the diff — same philosophy as production's golden test but a fresh, focused implementation (do **not** copy production's test files or fixtures). |
| `tests/fixtures/map-sections.frozen.json` | create | The reviewed snapshot |

No `docs/` file changes are expected. If a check fails, the fix happens in the
owning plan's files under that plan's contract, then this plan re-runs from step 1.

## Dependencies and parallelism

- Depends on: Plans 1–5 complete. Nothing runs in parallel with this plan.

## Implementation order

1. **Automated sweep** (all must exit 0):
   ```
   node --check docs/js/bracket-tree.js && node --check docs/js/render.js && \
   node --check docs/js/interact.js && node --check docs/js/main.js && \
   node --check docs/js/flags.js && node --check docs/js/trophy.js
   node tests/bracket-tree.mjs
   node tests/matchcards.mjs
   node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
   ```
2. Create `tests/map-frozen.mjs`: load `demo-picks.json`, `topology.json`,
   `tests/fixtures/results.frozen.json`; render the three sections; compare to
   `map-sections.frozen.json` with first-divergence reporting (reuse the diff-print
   style from `tests/golden.mjs`). Run once with `--update` to create the fixture,
   **manually eyeball the fixture** (spot-check: 31 `data-match-code` per view, the
   three relabeled legend strings, no `team blank`), then run without flags.
   **Checkpoint:** `node tests/map-frozen.mjs` exits 0; a deliberate one-character
   sabotage of `buildLegend` makes it fail with a useful diff; revert the sabotage.
3. **Structural console audit** on the served site (`cd docs && python3 -m
   http.server 8080`), demo bracket loaded, per view:
   - `document.querySelectorAll('.bracket.mode-actual .mcard[data-match-code]').length === 31`
   - unique codes: `new Set([...document.querySelectorAll('.bracket.mode-actual [data-match-code]')].map(e=>e.dataset.matchCode)).size === 31`
   - `document.querySelectorAll('.bracket.mode-actual .conn').length === 30` (≥600px width)
   - M101/M102 rows feed M104: the center card's two `[data-feeder]` values are
     `M101` and `M102`
   - overflow audit at 320, 375, 600, 768, 1024, 1280, 1440, ≥1800:
     `b.scrollWidth <= b.clientWidth + 1` for the visible bracket, and
     `document.documentElement.scrollWidth <= window.innerWidth + 1`
   - `data-played` count in actual equals the frozen fixture's decided count at
     freeze time (25: M73–M97) **only if live results still match**; otherwise
     assert `document.querySelectorAll('.bracket.mode-picked [data-played]').length === 0`
     (the picks-view invariant is time-stable; the actual-view count grows with
     real results — check ≥25, not ==25).
4. **Manual acceptance matrix** — walk every Brief 1 criterion:
   1. 31 unique cards per view ✅ (step 3)
   2. 30 feeder connections ✅ (step 3)
   3. M101/M102 → center M104 ✅ (step 3)
   4. Branch R32 orders (left `M74 M77 M73 M75 M83 M84 M81 M82`, right
      `M76 M78 M79 M80 M86 M88 M85 M87`) — read the rendered column order
   5. No clipped/overlapping card at all eight widths
   6. Flags, names, scores, dates, placeholders legible at each tier
   7. Status meanings vs pre-rebuild screenshots (✓/✕/▲/›/🏆/gone/pending)
   8. Legend explains every visible state (eight items)
   9. Sculpture: original, self-hosted, gentle, distinct, non-essential
   10. Reduced motion + WebGL-failure → static cup
   11. View switch: no geometry jump, no stale lines, no crossed occupants
       (toggle 10×, inspect)
   12. No horizontal overflow/panning anywhere (step 3 audit)
   13. Phone: overview 31 nodes/30 edges + 31 readable cards in vertical flow
   14. Scoring/builder/share/parse behavior unchanged (suites green + one manual
       share-link roundtrip + one builder open/close)
   15. No Brief 2 surface leaked in (no fact hover, no portrait, no fetches to
       anything but same-origin — check the Network tab: only same-origin
       requests on load and on hover)
   16. Screenshots captured (next step)
5. **Screenshot packet** (both views × dark + light at 1440, 1024, 768, 375; plus
   Easy at 768, one fun theme at 1280, sculpture front/side/¾ from Plan 5,
   reduced-motion fallback, WebGL-failure fallback). Store outside `docs/`
   (screenshots must not enter the Pages tree): `plans/review-screenshots/brief-1/`.
6. **Repo hygiene check:**
   ```
   git status --short   # every pre-existing untracked file still present, no deletions,
                        # no commits made; new files are only the planned ones
   git -C /Users/ericlam/Projects/sled-mywcbracket status --short  # empty — production untouched
   ```
7. Write a short review summary (what changed, what to look at first, known
   accepted limitations: golden.mjs external fixture; phone hides connector SVG in
   favor of the overview; legacy CSS retained for pilot pages) and **stop**.

## Data contracts and invariants

- The frozen map fixture uses only repo-local frozen inputs; regenerating it is an
  explicit, reviewed `--update` action.
- Live `results.json` is never a test dependency.
- All earlier plans' contracts hold verbatim; this plan changes none of them.

## Edge cases and codebase traps

- **Results move under you.** Between Plan 2's freeze and this plan's run, the sync
  bot may decide more games (M98+ are scheduled Jul 9–11). Structural assertions on
  the *served* site must therefore be shape-based (31/30/unique/≥25 played), while
  byte assertions run only against frozen fixtures.
- **The demo bracket is the review vehicle** (`docs/data/demo-picks.json` via the
  landing "See a demo"). Also load one built-from-scratch bracket via the builder
  to confirm a non-demo picks object renders the same geometry.
- **Shared-link view** re-renders the dashboard with someone else's picks —
  open one share URL (create via the Share dialog) and confirm map + trophy +
  connectors initialize cleanly on that second render path (this exercises the
  teardown paths from Plans 4/5).
- Don't run the audit while the bracket section is collapsed (connector count
  would read 0 — expand first; that behavior is by design per Plan 4).
- If a criterion fails, route the fix to the owning plan and re-run **this whole
  plan** — partial re-verification is how integration bugs slip gates.

## Read-only production-delta note

A future port will want this exact frozen-fixture pattern, but production already
has its own (`tests/fixtures/golden-sections.json`, `results.frozen.json`,
`bracketmap.mjs`, `validate_results.py`, hermetic `npm test`). The port should
update *those*, not import this sandbox's fixtures. The sandbox's `sync-results.yml`
also lacks production's validator step — a port re-evaluates that gap. Record only.

## Automated checks (exact commands)

```
node tests/map-frozen.mjs
node tests/bracket-tree.mjs && node tests/matchcards.mjs
node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
```

## Manual acceptance criteria

The 16-point matrix in step 4, each with an observable pass/fail noted in the
review summary. The plan passes only when all 16 pass.

## Handoff checklist and stop condition

- [ ] All suites green, including the new frozen map test.
- [ ] 16/16 acceptance matrix recorded.
- [ ] Screenshot packet saved under `plans/review-screenshots/brief-1/`.
- [ ] Hygiene checks clean in both repositories; zero commits made.
- [ ] Review summary written.

**HARD STOP.** Present the served preview (`cd docs && python3 -m http.server 8080`)
and the screenshot packet for user approval. Do not begin
`MATCH-DATA-CARD-AND-PORTRAIT-BRIEF.md` (Brief 2), production porting, commits,
pushes, or deployment until the user explicitly approves the map.
