# PLAN-combined-validation-review — full two-brief validation, served review, hard stop

> **GATE: Runs only after Brief 2 Plans 1–5 are complete (which themselves required
> the approved Brief 1 map).**

## Rank and leverage

**Rank 6 of 6 (Brief 2). Runs last.** Same role as the Brief 1 review plan but for
the combined experience: catches integration gaps between map, facts, dialog, and
portrait shell; produces the evidence packet; enforces the final program stop
before any production planning, commit, push, or deployment.

## Goal and user-visible outcome

Every Brief 2 acceptance criterion verified on the served combined experience, all
suites green, a combined screenshot packet captured, a review summary written, and
a **hard stop for user approval**.

## In scope

- Full automated sweep (JS + Python + validators + frozen map test).
- The Brief 2 manual review matrix (below) on the served site.
- Combined screenshot packet under `plans/review-screenshots/brief-2/`.
- Repo hygiene verification; FotMob-status visibility in the summary.

## Out of scope

- New features/fixes beyond routing failures back to the owning plan and
  re-running this plan in full.
- Production integration planning, porting, commits, pushes, deployment,
  repository synchronization, portrait production enablement.

## Automated sweep (exact commands, all must pass)

```
node --check docs/js/render.js && node --check docs/js/interact.js && \
node --check docs/js/main.js && node --check docs/js/match-details.js && \
node --check docs/js/bracket-tree.js && node --check docs/js/trophy.js
node tests/bracket-tree.mjs
node tests/matchcards.mjs
node tests/map-frozen.mjs
node tests/match-details.mjs
node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
python3 tests/match_details.py
python3 scripts/validate_match_details.py
python3 scripts/fetch_results.py --dry-run
```

Known, documented non-gate: `tests/golden.mjs` (external `/tmp` fixture + live
results dependency — superseded by `map-frozen.mjs` for the map surface).

## Manual review matrix (served: `cd docs && python3 -m http.server 8080`; each
item recorded pass/fail in the summary)

Data and facts:
1. Every completed bracket match has a complete or partial local fact record
   agreeing with `results.json` and topology participants.
2. Upcoming matches show no empty/misleading fact UI.
3. Missing optional fields disappear cleanly (find one partial record).
4. Long player/stadium names wrap without overflow.

Interaction equivalence:
5. Hover, focus, click, Enter, Space, touch all reach the same facts.
6. Compact card stays in the viewport at 320–1440; dialog never scrolls sideways.
7. Team-history hover suppressed inside completed cards, intact elsewhere.
8. View switching destroys pending timers, iframes, dialogs; Actual restores
   clean; My picks exposes zero match-data/portrait surface.
9. Dashboard re-render (New bracket → demo → shared link) leaks no listeners,
   canvases, or iframes.

Portrait privacy (Network tab open throughout):
10. Initial load + keyboard focus: same-origin requests only.
11. Fine-pointer hover < 500ms then leave: zero external requests.
12. Hover ≥ 500ms on a verified match: exactly one external document request;
    at most one iframe ever; hover leave/dialog close/view switch removes it.
13. M97 resolves uniquely (ID `1998582`, 2026-07-09, Quarter-final, France 2-0
    Morocco, `fra-mor`); current coverage 25/25 completed games; unmapped
    completed games hide the portrait action but keep facts.
14. Iframe: `referrerpolicy="no-referrer"`, allowed host + validated slug only,
    no user state in URL; direct external link present and working.
15. Disclosure visible with attribution and notices.

Program boundaries:
16. No FotMob/WhoScored automation anywhere; FotMob branch status (blocked on
    written authorization) stated in the summary.
17. No odds, bookmaker links, or betting UI anywhere.
18. Map regression: Brief 1's structural audit still passes (31 cards / 30
    connectors / no overflow at the eight widths / legend / trophy lifecycle).
19. Scoring, picks, views, legend, search, favorites, themes, share, builder,
    parse all behave as at the Brief 1 gate (suites + one manual pass each).
20. Widths 320/375/600/768/1024/1280/1440 with dark/light/easy + one fun theme:
    no horizontal page, bracket, card, or dialog overflow.

## Screenshot packet

`plans/review-screenshots/brief-2/`: compact card (hover + focus), full dialog
(regular, penalty, partial record), portrait preview + pinned dialog iframe +
unavailable state + direct link, disclosure, My picks (clean), degraded
details-file state, 375px and 1440px composites, one fun theme. Keep out of
`docs/` (Pages tree).

## Repo hygiene

```
git status --short                 # only planned files; no commits; untracked files preserved
git -C /Users/ericlam/Projects/sled-mywcbracket status --short   # empty
```

## Dependencies

Brief 2 Plans 1–5 complete. Nothing parallel.

## Edge cases and traps

- Live results may have advanced past the fixtures — matrix items assert
  shape/behavior, not counts pinned to July 9 (except the frozen-fixture suites,
  which are immune by design). If M98+ finished and the author published new
  pages, coverage may exceed 25 — the "25/25" item then reads "all completed
  matches with published portraits map exactly; no stale mapping mismatches".
- Run the privacy items in a fresh profile/incognito with cache disabled — a
  cached portrait document can mask a request-count regression.
- If any matrix item fails, fix in the owning plan and re-run this **entire**
  plan.

## Read-only production-delta note

The production gate after this review (re-read production, write a
production-specific integration plan, obtain written portrait and — if still in
scope — FotMob authorizations, port surgically, run production's own tests,
preview, request approval) is recorded in the brief and is **not** part of this
task graph. Record only.

## Handoff checklist and stop condition

- [ ] Automated sweep green.
- [ ] 20/20 matrix items recorded pass.
- [ ] Screenshot packet saved; review summary written (including FotMob blocked
      status and the portrait production-permission gate).
- [ ] Hygiene checks clean in both repositories.

**HARD STOP.** Present the served combined experience and packet for user
approval. No production planning, porting, commits, pushes, deployment, or
portrait production enablement until explicitly approved.
