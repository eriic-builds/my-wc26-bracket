# Match Data Card and Portrait Brief

Status: Ready for review

Target: `my-wc26-bracket` feature sandbox

Dependency: The mirrored bracket map brief is built and approved first

Production: No changes to `sled-mywcbracket`

Planning consumer: Fable

Folder: `docs/briefs/mirrored-bracket-map/`

Prior contract: `MIRRORED-BRACKET-MAP-REBUILD-BRIEF.md`

Browser companion: `MATCH-DATA-CARD-AND-PORTRAIT-BRIEF.html`

Publication note: this folder is inside the GitHub Pages `docs` tree and becomes
public if committed and deployed.

## Goal

Turn every completed knockout match card into a compact match-story entry point.

The experience has three layers:

1. The rebuilt bracket card shows teams, score, status, and path meaning.
2. Hover or keyboard focus shows a compact card with locally cached FIFA facts.
3. A 500 ms fine-pointer hover over a verified match loads its external portrait
   preview. Click, Enter, Space, or touch opens the same actual portrait full size.

The core facts experience remains local, fast, and useful without any third-party
portrait.

## Program sequence

This is Brief 2 in one sequential Fable task graph.

1. Complete Brief 1, the mirrored bracket map.
2. Serve it locally and pass the map review gate.
3. Start this brief only after explicit map approval.
4. Complete the FIFA data pipeline and match interactions.
5. Complete the permission-gated portrait shell.
6. Serve the combined result locally.
7. Stop for approval before production planning, commits, pushes, or deployment.

The hard map gate remains. Planning both briefs together does not remove it.

## Confirmed decisions

| Decision | Choice |
| --- | --- |
| Core facts source | FIFA public calendar and per-match feeds |
| FotMob | Desired analytics enrichment, blocked on written authorization and official access documentation |
| Match odds | Out of scope. No pre-match, live, historical, or predictive odds |
| Fact storage | Generated local `docs/data/match-details.json` |
| Fact availability | Completed bracket matches only |
| Missing fields | Omit them instead of showing empty values or estimates |
| Desktop preview | Hover and keyboard focus |
| Full details | Click, Enter, Space, or touch opens a native dialog |
| Existing team hover | Match facts take precedence inside completed match cards |
| Bracket view | Match facts and portraits exist only in Actual path |
| Portrait source | The author's hosted page in one reusable iframe |
| Portrait data | Do not copy source, xG, momentum, timeline, video, or thumbnails |
| Portrait coverage | Every exact completed-match mapping, not one hardcoded game |
| Third-party load | No initial request. Fine-pointer hover loads after 500 ms. Keyboard and touch require explicit input |
| Production permission | Written author approval required before production enablement |
| Missing portrait | Facts still work and the portrait action stays hidden |
| Initial page load | No new third-party request |
| Side scrolling | Fact cards and dialogs must fit without horizontal overflow |
| Repository relationship | Build in the sandbox. Do not synchronize repositories |

## Current sandbox state

### Existing data pipeline

- `scripts/fetch_results.py` already loads the FIFA calendar feed.
- The calendar response carries FIFA competition, season, stage, and match IDs.
- The script already calls FIFA's per-match feed for a small scorer enrichment.
- `match_all()` maps finished source games to bracket codes.
- `docs/data/results.json` is the current local score source.
- `.github/workflows/sync-results.yml` runs three times per day and commits the
  generated result file.
- The sandbox has no current result validator. Add focused validation here rather
  than copying a production architecture.

### Existing browser behavior

- `docs/js/main.js` loads topology and results before rendering.
- `docs/js/render.js` produces Actual path and My picks.
- `docs/js/interact.js` attaches a small team-history hover card to each team row.
- `docs/index.html` already contains a native share dialog and one team stat-card
  host.
- The rebuilt map from Brief 1 adds stable `data-match-code` hooks and completed
  match state.

### Integration rule

The match-level interaction owns the card surface for a completed match. The
existing team-history hover does not open inside that completed match card. Team
history remains available in other dashboard surfaces and in non-completed team
rows where it still makes sense.

## Source strategy

### FIFA calendar feed

Use the existing official feed:

`https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=500&language=en`

It supplies:

- team identities
- final score
- penalty score
- winner
- stage
- date
- stadium and city summary
- FIFA source IDs

Carry the source IDs through bracket-code matching instead of discarding them.

### FIFA per-match feed

Use the existing endpoint pattern:

`https://api.fifa.com/api/v3/live/football/{competition}/{season}/{stage}/{match}?language=en`

Representative M97 endpoint:

`https://api.fifa.com/api/v3/live/football/17/285023/289289/400021536?language=en`

Verified France versus Morocco facts:

- France 2, Morocco 0
- Mbappe scored at 60 minutes
- Dembele scored at 66 minutes
- Diop received a yellow card at 63 minutes
- Boston Stadium
- attendance 63,811
- referee Facundo Tello

Possession was null in this response. Do not render it.

### Authorized FotMob enrichment

FotMob analytics are desired, but this track is blocked.

Match odds are not part of this track. Do not request, sync, store, derive, or
display pre-match, live, historical, or predictive odds. Do not add bookmaker
links or betting recommendations.

Current official constraints:

- FotMob terms state that automatic, systematic, or regular use is not permitted.
- `https://www.fotmob.com/robots.txt` disallows generic agents from `/api/*`.
- No documented public developer API was found during this review.
- Undocumented community wrappers do not provide authorization.

While blocked:

- no browser fetch
- no hidden or unofficial API call
- no endpoint reverse engineering
- no scraper
- no scheduled collection
- no copied match facts or analytics
- no fake FotMob fixture presented as real provider output

Request written authorization directly from FotMob. The request must cover:

- permitted analytics fields
- official endpoint and authentication method
- rate limit and scheduled request cadence
- caching and retention duration
- public display and redistribution of normalized values
- derived charts or visualizations
- attribution language and placement
- noncommercial GitHub Pages use
- credential expiry and revocation behavior

After written approval:

1. Update this brief with the exact approved contract.
2. Use only the documented official access path.
3. Store credentials in GitHub Actions secrets, never browser JavaScript or
   committed files.
4. Fetch during scheduled sync, never from the static client.
5. Persist only approved normalized fields.
6. Add visible FotMob provenance to each enriched section.
7. Keep FIFA authoritative for team identity, score, winner, round, and kickoff.
8. Log and omit FotMob enrichment when it conflicts with FIFA.
9. Disable enrichment cleanly when authorization or credentials expire.

The FIFA facts and permission-gated Bogachev shell continue while this branch is
blocked. Full FotMob scope remains incomplete until authorization, implementation,
and validation pass.

### Bogachev data portraits

Treat each portrait as external authored work.

- embed only `https://wc26.bogachev.fr/m/<validated-slug>/`
- do not download or copy the Three.js source
- do not ingest momentum, xG, timeline, rich-data endpoints, videos, or thumbnails
- do not screen-record and redistribute the visual
- show clear attribution to Alexander Bogachev
- disclose that external content and analytics will load
- require written approval before production enablement

The local sandbox may build and test the shell before permission. Do not publish
an enabled iframe experience from the sandbox without a separate approval.

### Current technical verification

The representative page
`https://wc26.bogachev.fr/m/fra-mor/` currently:

- returns HTTP 200 from GitHub Pages
- sends no `X-Frame-Options` header
- sends no CSP `frame-ancestors` restriction

The page is technically frameable today. This is not a permanent contract.

The public manifest currently has one unique matching entry:

- external ID `1998582`
- date `2026-07-09`
- round `knockout`
- stage `Quarter-final`
- France 2-0 Morocco
- slug `fra-mor`

The direct external link remains required if framing behavior changes.

## Local data contract

Add `docs/data/match-details.json`.

```json
{
  "version": 1,
  "refreshed": "2026-07-10T02:36:41Z",
  "matches": {
    "M97": {
      "source": {
        "provider": "FIFA",
        "matchId": "400021536"
      },
      "state": "complete",
      "home": "France",
      "away": "Morocco",
      "score": {
        "home": 2,
        "away": 0,
        "note": ""
      },
      "winner": "France",
      "round": "Quarterfinal",
      "kickoff": "2026-07-09T20:00:00Z",
      "venue": {
        "stadium": "Boston Stadium",
        "city": "Boston"
      },
      "attendance": 63811,
      "referee": "Facundo Tello",
      "goals": [
        {
          "team": "France",
          "player": "Mbappe",
          "minute": "60'",
          "kind": "goal"
        },
        {
          "team": "France",
          "player": "Dembele",
          "minute": "66'",
          "kind": "goal"
        }
      ],
      "cards": [
        {
          "team": "Morocco",
          "player": "Diop",
          "minute": "63'",
          "card": "yellow"
        }
      ]
    }
  }
}
```

### Contract rules

- Match keys are known bracket codes from M73 through M102 and M104.
- M103 stays excluded because it is the third-place game.
- Teams and score agree with `docs/data/results.json`.
- The participant pair agrees with the bracket participants resolved from topology.
- `winner` belongs to the match.
- Events reference one of the two match teams.
- Attendance is a non-negative integer.
- Minutes are display strings from FIFA and are rendered as text.
- Unknown optional fields are omitted.
- Null, empty, guessed, and placeholder metrics do not enter the file.
- External strings are untrusted browser input and use DOM construction plus
  `textContent`.
- A fully parsed record uses `state: "complete"`.
- A result with unavailable detail uses `state: "partial"` and retains only
  validated calendar and score facts.

### Authorized analytics extension

Do not finalize or implement a FotMob analytics schema before authorization
defines the approved fields.

After approval, add an optional provider-scoped analytics object. It must include:

- provider name
- source match ID from the authorized contract
- fetch timestamp
- approved normalized metrics only
- provenance or attribution metadata required by the license

It must not override FIFA participant, score, winner, round, or kickoff fields.
It must not contain match odds or bookmaker links.
The validator rejects an analytics block without recorded authorization metadata.

## Detail fetch and cache behavior

Add `scripts/match_details.py` with pure parsing and merge helpers.

The sync flow:

1. Load topology, current results, and current match details.
2. Load the FIFA calendar once.
3. Resolve bracket codes and preserve FIFA source IDs.
4. Identify completed matches with a missing, partial, or score-mismatched detail
   record.
5. Fetch the per-match payload only for those records.
6. Parse the conservative field set.
7. Keep existing complete records whose source match and score did not change.
8. Write deterministic JSON.
9. Validate the generated bundle before commit.

### Failure behavior

- A per-match detail failure does not block a newly completed score.
- Store a validated partial record from the calendar and results data.
- Print a visible warning with the bracket code and source match ID.
- Retry partial records on the next scheduled run.
- A malformed top-level data contract fails validation and prevents the workflow
  commit.
- Do not catch unrelated programming errors as feed outages.

### Focused validator

Add `scripts/validate_match_details.py`.

It validates:

- known match codes
- topology participation
- score and winner agreement
- source ID shape
- event team membership
- attendance type
- required fields by state
- no unknown top-level match fields
- portrait slug and host constraints

Do not import a validator from `sled-mywcbracket`.

### Workflow

Update `.github/workflows/sync-results.yml`:

1. Run the existing result sync.
2. Run the focused validator.
3. Commit `results.json` and `match-details.json` together when either changes.
4. Trigger Pages once for the combined generated-data commit.
5. Keep the existing visible issue path for a workflow failure.

The portrait mapping remains a reviewed source file until author approval allows a
separate manifest-sync decision.

## Browser loading

Required topology and results still control whether the dashboard renders.

Load match details and portrait mappings as optional same-origin resources:

- report one explicit degraded-state notice if match details fail to load
- keep the bracket and scoring usable
- hide portrait actions if the mapping file fails
- do not turn an optional failure into a success-shaped empty object
- pass the resource state into `initMatchDetails()`

Use a teardown-aware initializer:

`initMatchDetails(root, detailsState, portraitState)`

It should return a cleanup function or use an `AbortController` so repeated
dashboard renders do not retain stale listeners, dialogs, or references.

## Render contract from Brief 1

Each completed Actual path match card provides:

- `data-match-code`
- `data-played="true"`
- `data-home`
- `data-away`
- a complete accessible label
- keyboard focus

Upcoming Actual path cards retain their code but do not advertise unavailable
facts.

My picks cards keep match codes for tree and connector logic but expose no
match-data-enabled state, fact-card behavior, portrait indicator, or external
request.

The pure bracket renderer does not embed fact JSON or portrait URLs in HTML.

## Compact fact card

### Content priority

Show:

1. teams, final score, and round
2. scorers and minutes
3. penalty or extra-time note
4. cards
5. stadium and city
6. attendance
7. referee
8. source label

Hide missing sections. Do not reserve empty rows.

The compact card should stay concise. Long event lists move into the full dialog.

### Desktop pointer behavior

- Hover a completed match card to show facts.
- Use a short intent delay to avoid flicker while crossing the dense bracket.
- Keep the card inside the viewport.
- Keep it outside the connector and match hit areas.
- For a verified mapping and a fine pointer, start a 500 ms portrait intent timer.
- Set no iframe source if the pointer leaves before the timer completes.
- After 500 ms, create the one allowed portrait iframe in the preview.
- Keep the preview open while the pointer is over the match or preview region.
- Close on region leave unless the full dialog is pinned.
- Remove an unpinned iframe on close to release WebGL resources.
- Do not open from an upcoming match.

### Keyboard behavior

- Focus a completed match card to show the same compact facts.
- Focus alone does not load an external iframe.
- Enter or Space opens the full match dialog and loads the verified portrait
  directly when one exists.
- Escape closes the preview or dialog.
- Closing the dialog returns focus to the originating match card.
- The preview uses a tooltip relationship without trapping focus.

### Touch behavior

- Tap a completed match card to open the full dialog and load the verified portrait
  directly when one exists.
- Do not depend on emulated hover.
- Keep vertical page scrolling available.
- Do not introduce horizontal scrolling.

### Team-history conflict

Inside a completed match card:

- match facts win
- team-history hover stays closed
- nested team rows do not open competing overlays

Outside a completed match card, preserve the existing team-history behavior.

### Actual-path-only behavior

Facts and portraits describe the realized tournament route and appear only in
Actual path.

- Scope event delegation to `.bracket.mode-actual`.
- My picks keeps its predicted cards, statuses, connectors, and legend.
- My picks exposes no fact hover, portrait availability, iframe load, or
  match-data dialog.
- Switching to My picks cancels the 500 ms timer.
- Switching to My picks removes an unpinned iframe.
- Switching to My picks closes a pinned match-data dialog and returns focus to the
  active view control.
- Switching back to Actual path starts with no stale overlay or iframe.

## Full match dialog

Use a native `<dialog>` in `docs/index.html`.

It contains:

- match title, round, and final score
- complete validated FIFA fact sections
- close button
- source label
- portrait action when an exact mapping exists
- direct external link when a portrait exists
- explicit unavailable copy for a loaded mapping failure
- an iframe loaded directly by click, Enter, Space, or tap when a verified mapping
  exists

Requirements:

- no horizontal overflow
- bounded height with vertical dialog scrolling
- visible focus
- Escape close
- backdrop click follows the app's existing dialog convention
- focus returns to the match card
- dialog content uses DOM nodes and `textContent`

## Portrait mapping

Add `docs/data/match-portraits.json`.

```json
{
  "version": 1,
  "permission": "required-for-production",
  "host": "https://wc26.bogachev.fr",
  "matches": {
    "M97": {
      "slug": "fra-mor",
      "externalId": "1998582",
      "date": "2026-07-09",
      "stage": "Quarter-final",
      "teams": ["France", "Morocco"],
      "score": [2, 0]
    }
  }
}
```

Rules:

- Store a slug, never a full arbitrary URL.
- Accept only lowercase three-letter pairs matching
  `^[a-z]{3}-[a-z]{3}$`.
- Build the URL with one hardcoded allowed host.
- Resolve actual participants from topology and results.
- Normalize team aliases through `scripts/team_map.json`.
- Require `round: "knockout"`.
- Require the expected stage and exact date.
- Require the same unordered participant pair.
- Orient and compare the final score.
- Require exactly one candidate.
- Store external ID, date, stage, teams, and score beside the slug.
- Team pair alone is not enough because countries may meet in group and knockout
  stages.
- Zero, duplicate, ambiguous, or conflicting candidates fail closed.
- The browser compares local mapping identity with local actual match details
  before showing availability.
- The browser never fetches or joins the remote manifest.
- A missing mapping hides the portrait action.
- A missing portrait never weakens FIFA facts.

## Current portrait coverage fixture

The expected reviewed sandbox snapshot is 25 mappings for 25 currently completed
bracket games:

| Match | Slug | Match | Slug |
| --- | --- | --- | --- |
| M73 | `saf-can` | M86 | `arg-cve` |
| M74 | `ger-par` | M87 | `col-gha` |
| M75 | `net-mor` | M88 | `aus-egy` |
| M76 | `bra-jap` | M89 | `par-fra` |
| M77 | `fra-swe` | M90 | `can-mor` |
| M78 | `ico-nor` | M91 | `bra-nor` |
| M79 | `mex-ecu` | M92 | `mex-eng` |
| M80 | `eng-dco` | M93 | `por-spa` |
| M81 | `usa-ban` | M94 | `usa-bel` |
| M82 | `bel-sen` | M95 | `arg-egy` |
| M83 | `por-cro` | M96 | `swi-col` |
| M84 | `spa-aus` | M97 | `fra-mor` |
| M85 | `swi-alg` |  |  |

Future coverage targets M98, M99, M100, M101, M102, and M104 after those games
finish and the author publishes matching pages.

## Permission-gated portrait rendering

Author permission remains the production gate. There is no separate per-use
confirmation screen in the selected interaction.

Show a persistent disclosure near the bracket:

- author attribution
- notice that a 500 ms portrait-enabled mouse hover loads external content
- analytics notice
- direct-link fallback

Fine-pointer hover:

1. Show local FIFA facts immediately.
2. Display `External portrait available`.
3. Start a 500 ms timer.
4. Cancel without a request on early leave.
5. Load the exact verified iframe after the timer.

Click, Enter, Space, or tap loads the exact verified iframe directly in the full
dialog. Focus alone does not load it.

Iframe requirements:

- URL built from the allowed host and validated slug
- `referrerpolicy="no-referrer"`
- descriptive `title`
- constrained sandbox with only the capabilities required by the hosted visual
- responsive 16:9 frame
- no bracket name, picks, share fragment, or user state in the URL
- at most one portrait iframe in the document
- move the preview iframe into the full dialog where practical
- remove an unpinned iframe after hover leave
- remove the dialog iframe on close to release WebGL and GPU resources
- direct link always available because framing is not a stable contract

Do not claim reliable cross-origin failure detection. If the portrait stays blank
or framing changes, the direct link remains the supported path.

## Privacy and safety

- Initial page load contacts only the same origin.
- Hover contacts only the same origin until the fine-pointer intent timer reaches
  500 ms on a verified portrait match.
- Keyboard focus contacts only the same origin.
- Enter, Space, click, or tap may load the verified external portrait directly.
- The disclosure states that portrait hover loads external content and analytics.
- `no-referrer` prevents the bracket URL from being sent as the referrer.
- No entrant name, picks, share data, favorites, or local storage value enters the
  portrait URL.
- External facts render with `textContent`.
- Portrait URLs use an exact host and strict slug allowlist.
- Hover leave destroys an unpinned iframe.
- Closing the dialog destroys the pinned iframe.

## No-build file plan

### New files

| File | Purpose |
| --- | --- |
| `docs/data/match-details.json` | Generated local FIFA facts |
| `docs/data/match-portraits.json` | Reviewed code-to-slug mapping |
| `docs/js/match-details.js` | Fact-card, full-dialog, and portrait behavior |
| `scripts/match_details.py` | Pure FIFA detail parsing and cache merge |
| `scripts/validate_match_details.py` | Focused generated-data validator |
| `tests/match-details.mjs` | Browser-module formatting and safety tests |
| `tests/match_details.py` | Python parser, merge, and failure fixtures |

### Existing files

| File | Change |
| --- | --- |
| `scripts/fetch_results.py` | Preserve FIFA IDs and update local detail cache |
| `.github/workflows/sync-results.yml` | Validate and commit both generated data files |
| `docs/js/main.js` | Load optional local resources and manage initializer cleanup |
| `docs/js/render.js` | Emit semantic match metadata only |
| `docs/js/interact.js` | Prevent team-hover competition inside completed cards |
| `docs/css/dashboard.css` | Fact card, dialog, disclosure, iframe, and responsive styles |
| `docs/index.html` | Add one fact-card host and one native dialog |

No framework, package, CDN, scraper, analytics SDK, or build step is added.

### Gated FotMob files

Do not create these while permission is blocked. Names remain provisional until
official documentation defines the integration:

| File | Purpose after authorization |
| --- | --- |
| `scripts/fotmob_provider.py` | Official authenticated server-side adapter |
| `tests/fotmob_provider.py` | Licensed field, rate-limit, conflict, and expiry fixtures |

No FotMob credential or endpoint enters a static file.

## Build passes

### Pass 1: Contract and fixtures

- add frozen FIFA calendar and live-match fixtures
- define the detail and portrait schemas
- add parser, merge, cache, and validator tests
- preserve source IDs through bracket matching

### Pass 2: Generated FIFA facts

- generate complete records for available bracket matches
- create partial records for recoverable detail failures
- add deterministic writes
- update the scheduled workflow
- validate result and detail agreement

### Blocked branch: Authorized FotMob analytics

- request written data-use authorization
- record the approved fields and official access documentation
- keep the branch blocked while either is missing
- after approval, add the server-side secret-backed adapter
- normalize only licensed analytics
- exclude all match odds and bookmaker links
- preserve FIFA authority for core match identity and results
- add provenance, rate-limit, retention, conflict, and expiry tests

### Pass 3: Fact-card interaction

- add semantic hooks from Brief 1
- add optional resource loading and explicit degraded state
- build hover, focus, touch, and dialog behavior
- resolve team-history overlay precedence
- keep every overlay inside the viewport without side scrolling

### Pass 4: Portrait shell

- add the reviewed 25-match mapping fixture
- validate external ID, date, stage, teams, score, and slug
- add persistent hover-load disclosure and attribution
- add the 500 ms fine-pointer intent timer
- add direct keyboard and touch loading
- add the constrained iframe and direct link
- enforce one iframe and remove it after unpinned leave or close
- keep production enablement blocked on permission

### Pass 5: Combined validation and review

- run all existing sandbox tests
- run new JavaScript and Python fixtures
- run the focused data validator
- serve the complete two-brief experience locally
- review all interactions and failure states
- capture combined map and data-card screenshots

Stop after Pass 5. Do not port, commit, push, or deploy.

## Future Brief 2 task graph

Do not include these tasks in the six immediate Brief 1 plan files. Create this
second graph only after the rebuilt map receives explicit approval.

Every task below depends on the approved map review from Brief 1:

1. Define match-detail schemas and frozen fixtures.
2. Add FIFA parser and cache merge helpers.
3. Preserve source IDs and generate local details.
4. Add focused cross-file validation.
5. Update the scheduled sync workflow.
6. Add semantic match-card hooks.
7. Add optional resource loading and cleanup.
8. Build compact fact-card behavior.
9. Build the full match dialog.
10. Add team-hover precedence.
11. Add portrait mapping validation.
12. Build hover-intent and direct-input portrait rendering.
13. Add accessibility, privacy, and lifecycle tests.
14. Run the combined local review.

Parallel work is allowed only after the data contract and fixtures are stable.
The portrait UI may proceed beside fact-card styling, but both depend on semantic
card hooks and validated URL construction.

Add a separate blocked branch:

1. Obtain written FotMob data-use authorization and official API documentation.
2. Amend the data contract with approved fields and obligations.
3. Implement the server-side provider with Actions secrets.
4. Validate rate limits, caching, retention, conflicts, attribution, and expiry.

This branch does not block the core FIFA fact-card and portrait-shell build. It
does block claiming that the requested FotMob enrichment is complete.

## Automated coverage

### JavaScript

- completed card exposes facts
- upcoming card exposes no empty panel
- Actual path participants match the actual fixture
- My picks exposes no match-data or portrait behavior
- view switching destroys pending and active portrait state
- compact card omits missing sections
- no state leaks across dashboard rerenders
- keyboard focus, Enter, Space, Escape, and focus return
- touch opens the dialog without hover
- team hover stays closed inside completed match cards
- portrait action hides without a mapping
- strict host and slug validation
- strings render as text
- iframe source is absent before the 500 ms hover threshold or explicit keyboard
  or touch input
- hover leave before the threshold causes no external request
- no more than one portrait iframe exists
- unpinned leave and dialog close remove the iframe
- no horizontal overflow in preview and dialog

### Python

- calendar source-ID preservation
- goal parsing
- yellow and red card parsing
- venue, city, attendance, and referee parsing
- null field omission
- score and penalty agreement
- complete record retention
- partial record retry
- per-match detail failure keeps a valid partial record
- deterministic output ordering
- current 25-of-25 portrait coverage fixture
- duplicate and ambiguous portrait joins fail
- M97 uniquely matches external ID `1998582`, date `2026-07-09`, Quarter-final,
  France 2-0 Morocco, slug `fra-mor`

After FotMob authorization, add:

- official adapter fixture parsing
- approved-field allowlist
- FIFA conflict omission
- request budget and retry behavior
- cache retention
- credential expiry and provider disablement
- required attribution

### Existing sandbox coverage

- scoring
- builder
- share
- parse
- the known live golden-test limitation remains documented

Do not add a new test framework.

## Manual review

- Chrome and Edge on Windows
- Actual path facts and portraits
- My picks with no fact card, portrait indicator, or external request
- completed regular result
- penalty result
- extra-time result
- upcoming match
- missing optional fields
- long player and stadium names
- hover intent and viewport collision
- hover leave before 500 ms makes no portrait request
- one iframe across rapid match changes
- My picks actual-fixture labeling
- keyboard focus and dialog focus return
- touch behavior
- team-history precedence
- details JSON unavailable
- portrait mapping unavailable
- portrait not yet published
- external frame slow or blank
- direct-link fallback
- iframe GPU cleanup
- dark, light, easy, and novelty themes
- 320, 375, 600, 768, 1024, 1280, and 1440 widths
- no horizontal page or dialog scrolling
- FotMob permission status is visible in the task graph
- if authorized, provider provenance and conflict behavior

## Acceptance criteria

1. Brief 2 does not start before the rebuilt map is approved.
2. Every completed bracket match has a valid complete or partial local fact record.
3. Facts agree with results and resolved topology participants.
4. Upcoming matches show no empty or misleading fact interface.
5. Hover, focus, click, keyboard, and touch provide equivalent access paths.
6. Match facts take precedence over team history inside completed match cards.
7. Missing optional FIFA fields disappear cleanly.
8. Initial page load and keyboard focus make no third-party request.
9. Fine-pointer hover loads only after 500 ms, cancels before request on early
   leave, and keeps at most one iframe.
10. Enter, Space, click, or tap loads only the verified actual fixture.
11. Every exact mapped completed match exposes the same portrait flow.
12. M97 uniquely resolves to external ID `1998582`, date `2026-07-09`,
    Quarter-final, France 2-0 Morocco, and slug `fra-mor`.
13. Current mapping coverage is 25 of 25 completed games.
14. Portrait coverage expands without match-specific browser code.
15. My picks exposes no match-data surface, portrait indicator, iframe, or
    external portrait request.
16. The iframe uses no referrer and a strict allowed URL.
17. Hover leave, view switch, or dialog close removes the unneeded iframe.
18. A direct external link remains available.
19. Missing portrait coverage never weakens local FIFA facts.
20. No unlicensed FotMob or WhoScored automation is introduced.
21. No FotMob adapter work starts before written authorization and official access
    documentation.
22. Any authorized FotMob fetch runs server-side with secret credentials, approved
    fields, rate limits, retention, and attribution.
23. FIFA remains authoritative for match identity and results, and every FotMob
    enrichment shows provenance.
24. No fact card, dialog, or iframe creates horizontal overflow.
25. Existing scoring, picks, views, legend, search, favorites, themes, and
    connectors remain intact.
26. Production portrait enablement remains blocked without author approval.
27. The combined two-brief experience receives local approval before production
    planning.
28. No repository synchronization, commit, push, or deployment occurs in the
    sandbox build task graph.
29. No pre-match, live, historical, or predictive odds, bookmaker links, betting
    recommendations, or odds-sync tasks enter either brief.

## Production gate

After the combined sandbox experience is approved:

1. Re-read the then-current `sled-mywcbracket`.
2. Write a production-specific integration plan.
3. Obtain written portrait embedding approval.
4. Obtain written FotMob data-use authorization and official access documentation
   if FotMob remains in the requested production scope.
5. Decide whether author approval includes manifest-based mapping updates.
6. Port behavior with surgical production changes.
7. Run production's own tests and validators.
8. Preview production locally.
9. Request approval before commit, push, or deployment.
