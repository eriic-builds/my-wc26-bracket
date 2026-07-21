# PLAN-match-details-contract-and-fixtures — schemas, frozen FIFA fixtures, parser + validator

> **GATE: Do not start any Brief 2 plan until the rebuilt map (Brief 1, all six
> plans) has explicit user approval.** This file may be read/planned against, but
> no Brief 2 implementation runs before that approval.

## Rank and leverage

**Rank 1 of 6 (Brief 2). Execute first after the map gate.** Every other Brief 2
plan consumes the data contracts defined here: the sync pipeline writes them, the
browser reads them, the validator gates the workflow. Freezing FIFA payload fixtures
first makes all Python work hermetic and reviewable.

## Goal and user-visible outcome

No user-visible change. Deliver: the `docs/data/match-details.json` and
`docs/data/match-portraits.json` schemas as code-enforced contracts; pure parse/merge
helpers in `scripts/match_details.py`; the focused validator
`scripts/validate_match_details.py`; Python test fixtures and tests
(`tests/match_details.py`) proving parsing, merging, failure behavior, and the
25-of-25 portrait join.

## In scope

- Frozen fixtures under `tests/fixtures/fifa/`: one calendar payload snapshot and at
  least one per-match live payload (M97 France–Morocco, match ID `400021536`),
  captured once from the real endpoints, then never re-fetched by tests.
- `scripts/match_details.py`: pure functions only in this plan —
  `parse_calendar(payload, tmap)` (carries FIFA competition/season/stage/match IDs
  through bracket matching), `parse_live_match(payload)` (goals, cards, venue, city,
  attendance, referee, penalty note; omit nulls), `merge_details(old, new)`
  (keep complete records whose source match+score didn't change; retry partials),
  `record_state(rec)` → `complete|partial`.
- `scripts/validate_match_details.py` (stdlib only, like the pipeline): known codes
  M73–M102 + M104 (M103 rejected), topology participation, score/winner agreement
  with `results.json`, source-ID shape, event-team membership, attendance
  non-negative int, required-fields-by-state, no unknown top-level match fields,
  portrait slug `^[a-z]{3}-[a-z]{3}$` + single allowed host, analytics block
  rejected without recorded authorization metadata.
- `tests/match_details.py` (plain `python3 tests/match_details.py`, asserts +
  exit code, no pytest — no new framework).
- The portrait mapping *schema* and its validation rules (the reviewed 25-entry
  data file itself ships in PLAN-portrait-shell.md).

## Out of scope

- Network fetching, cache writing, workflow edits (PLAN-fifa-details-sync-pipeline).
- Any browser code (Plans 3–5 of Brief 2).
- Anything FotMob: no schema finalization, no adapter, no fixtures presented as
  FotMob output — the branch is blocked on written authorization.
- Match odds/bookmaker anything (excluded from the whole program).

## Verified current architecture

- `scripts/fetch_results.py` already: loads `scripts/team_map.json` (`load_team_map`,
  `norm`), fetches the calendar (`FIFA_URL`, competition 17 / season 285023),
  fetches per-match live feeds (`FIFA_LIVE`, `fetch_match_goals`) for scorer
  enrichment, and maps finished games to bracket codes in `match_all(r32, ko_feed,
  base_res, feed)` — **reuse its name-normalization and matching approach; do not
  duplicate `team_map.json`**.
- `docs/data/results.json` shape: `{refreshed, res: {MXX: [gA, gB, winner, note]},
  ko_fix, auto_hl}` — details must agree with `res` scores/winners.
- The sandbox has **no** result validator today (the brief says add focused
  validation here; do **not** copy `sled-mywcbracket/scripts/validate_results.py`).
- The contract JSON shapes are specified verbatim in
  `docs/briefs/mirrored-bracket-map/MATCH-DATA-CARD-AND-PORTRAIT-BRIEF.md`
  (sections "Local data contract" and "Portrait mapping") — treat that file as the
  schema source; copy the M97 example into a fixture.

## Exact files

| File | Action |
| --- | --- |
| `scripts/match_details.py` | create (pure helpers only) |
| `scripts/validate_match_details.py` | create (CLI: exits non-zero with named problems) |
| `tests/match_details.py` | create |
| `tests/fixtures/fifa/calendar.frozen.json` | create (one-time snapshot) |
| `tests/fixtures/fifa/live-M97.frozen.json` | create (one-time snapshot) |
| `tests/fixtures/fifa/live-malformed.json` | create (hand-made failure fixture) |

No JS, CSS, HTML, or workflow edits in this plan.

## Dependencies and parallelism

- Depends on: map approval (gate) only.
- Blocks: all other Brief 2 plans. Nothing in Brief 2 runs in parallel before this
  lands; after it lands, Plan 2 (pipeline) and Plans 3–4 (browser) may proceed in
  parallel because the contract is frozen here.

## Implementation order

1. Snapshot fixtures (one supervised network fetch each; if offline, stop and
   report): calendar URL from `fetch_results.py`'s `FIFA_URL`; live URL pattern
   `FIFA_LIVE` with M97's IDs (17/285023/289289/400021536). Strip nothing; freeze
   raw. **Checkpoint:** `python3 -m json.tool` passes on both; the live fixture
   contains Mbappe 60', Dembele 66', Diop yellow 63', Boston Stadium, 63811,
   Facundo Tello, and a null possession (kept null in the fixture — the parser must
   omit it).
2. Write `parse_live_match` + `parse_calendar` against the fixtures. Rules: minutes
   are display strings passed through; unknown/null/empty fields omitted; no
   estimates; penalty note carried into `score.note`. **Checkpoint:**
   `python3 tests/match_details.py` (first assertions green): M97 parses to exactly
   the brief's example record.
3. Write `merge_details` + state rules; failure fixtures: malformed live payload →
   raises a typed error the pipeline will catch per-match; calendar-only data →
   valid `partial` record. **Checkpoint:** merge keeps an existing `complete`
   record when source ID + score unchanged; replaces it when the score changed;
   retries `partial`.
4. Write the validator; run it on a hand-built valid bundle and on seeded-invalid
   bundles (bad code M103, wrong winner, event by a non-participant, negative
   attendance, unknown field, bad slug, wrong host, analytics-without-authorization).
   Every failure message names the match code and the field. **Checkpoint:** each
   seeded bundle fails with the expected named problem; the valid bundle passes.
5. Full sweep: `python3 tests/match_details.py` green; JS suites untouched and
   green.

## Data contracts and invariants

- Exactly the brief's JSON shapes; keys are bracket codes; M103 never appears.
- FIFA is authoritative for identity/score/winner/round/kickoff.
- Fixtures are frozen: tests never hit the network and never read live
  `results.json` (pass a frozen copy where result agreement is tested).
- External strings are data, not markup — the validator checks types/shape only;
  escaping is the browser's job (`textContent`, Plans 3–4).

## Edge cases and codebase traps

- **Score orientation:** `results.json` `res` arrays are oriented to the stored
  team order per `match_all`'s `orient()` — reuse that logic for agreement checks
  rather than re-deriving home/away, or penalty games (M74 1–1) will false-fail.
- **Name normalization:** FIFA names ("Côte d'Ivoire", "IR Iran"-style variants)
  must round-trip through `team_map.json` — never compare raw feed names to
  bracket names.
- **Two-meetings trap:** a team pair can meet in groups and knockouts — matching by
  pair alone is banned; require stage + date + IDs (the portrait join tests this
  hard).
- **Don't catch programming errors as outages:** the parser distinguishes
  `KeyError` on a contract-required field (bug → propagate) from a missing
  optional section (omit).
- Deterministic output: sorted keys / fixed ordering in any serialization helper so
  the future workflow commit diff is stable.

## Read-only production-delta note

Production has `scripts/validate_results.py` (results-only) wired into both its
sync workflow and CI; the sandbox validator here is match-details-focused and
intentionally not a copy. A port must reconcile the two validators and production's
hermetic `npm test` layout. Record only.

## Automated checks (exact commands)

```
python3 tests/match_details.py
python3 scripts/validate_match_details.py --help   # usable CLI, non-zero on failure
node tests/map-frozen.mjs && node tests/matchcards.mjs   # map untouched
```

## Manual acceptance criteria

- Reading `scripts/match_details.py` top-to-bottom: pure functions, no I/O, no
  network, stdlib only.
- The M97 fixture → parsed record matches the brief's example byte-for-byte
  (ordering aside).
- `git status`: only the six planned new files; both repos otherwise untouched.

## Handoff checklist and stop condition

- [ ] Fixtures frozen and committed to the working tree.
- [ ] Parser/merge/validator green against fixtures, including all failure cases.
- [ ] No workflow, browser, or FotMob work started.

**Stop** after the checklist. The pipeline wiring is
PLAN-fifa-details-sync-pipeline.md.
