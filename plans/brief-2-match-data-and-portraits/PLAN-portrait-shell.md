# PLAN-portrait-shell — permission-gated Bogachev portrait embedding with strict allowlisting

> **GATE 1: Brief 2 starts only after explicit map approval.**
> **GATE 2: Production enablement of this feature requires the author's written
> permission — the sandbox may build and test the shell, but nothing here may be
> published/deployed, and this task graph never commits or deploys anyway.**

## Rank and leverage

**Rank 5 of 6 (Brief 2).** The portrait shell is the highest-scrutiny surface
(third-party content, privacy, external requests) and sits last in the dependency
chain before combined review: it needs the mapping data, the fact card (Plan 3),
and the dialog (Plan 4). Its leverage is making all 25 completed matches (and
future ones) portrait-capable through data, with zero match-specific browser code.

## Goal and user-visible outcome

For a completed Actual-path match with an exactly-verified mapping: the compact
fact card shows "External portrait available"; a **fine-pointer** hover that stays
500ms loads the portrait preview iframe; click/Enter/Space/tap loads it directly in
the full dialog; a persistent disclosure near the bracket explains attribution and
that hover loads external content; a direct link is always available. No mapping →
no portrait UI at all; facts unaffected.

## In scope

- `docs/data/match-portraits.json` — the reviewed 25-entry fixture exactly as
  tabulated in the brief (M73→`saf-can` … M97→`fra-mor`), with
  `version:1`, `permission:"required-for-production"`,
  `host:"https://wc26.bogachev.fr"`, and per-match `slug/externalId/date/stage/
  teams/score`.
- Validator additions already contracted in Brief 2 Plan 1 run against this real
  file (slug regex, host, stage/date/teams/score agreement, exactly-one-candidate
  semantics documented as generation rules).
- `docs/js/match-details.js` extensions: portrait availability check (browser
  compares mapping identity — teams+score+date — against the local match record
  before showing anything); 500ms fine-pointer intent timer
  (`matchMedia('(pointer: fine)')`); iframe creation/teardown; single-iframe
  invariant; move-preview-into-dialog on pin; direct link; unavailable copy.
- Persistent disclosure element near the bracket (attribution to Alexander
  Bogachev, hover-loads-external-content notice, analytics notice, direct-link
  fallback) — visible in Actual view whenever any portrait mapping is loaded.
- Iframe requirements: URL = hardcoded host + `/m/<validated-slug>/` only;
  `referrerpolicy="no-referrer"`; descriptive `title`; minimal `sandbox`
  (start `sandbox="allow-scripts allow-same-origin"` — the hosted Three.js visual
  needs scripts; add nothing else unless the visual demonstrably requires it);
  responsive 16:9 box; no user state in the URL.
- CSS marked block for the preview region, disclosure, and dialog portrait area.

## Out of scope

- Downloading/copying any Bogachev source, data, video, or thumbnails; screen
  recording; manifest fetching from the browser (the mapping file is
  repo-reviewed data, never fetched remotely at runtime).
- FotMob anything; odds anything.
- Claiming reliable cross-origin failure detection — if the frame is blank, the
  direct link is the supported path (copy states this).

## Verified current architecture

- Plan 3 loads `match-portraits.json` as an optional resource with an
  `{ok,data,error}` state and passes it to `initMatchDetails` — this plan consumes
  that state; a load failure hides all portrait actions (fail closed).
- Plan 4's dialog has the inert `.mdlg-portrait` container + note slot.
- Verified externally (brief): `https://wc26.bogachev.fr/m/fra-mor/` returns 200,
  no `X-Frame-Options`, no `frame-ancestors` — frameable today, not guaranteed;
  hence the mandatory direct link.
- M97's mapping uniquely matches external ID `1998582`, date `2026-07-09`,
  Quarter-final, France 2-0 Morocco — the canonical test case.

## Exact files

| File | Action |
| --- | --- |
| `docs/data/match-portraits.json` | create (25 reviewed entries from the brief's table) |
| `docs/js/match-details.js` | modify — portrait availability, intent timer, iframe lifecycle |
| `docs/index.html` | modify — persistent disclosure element (one small block near `#app`? No — it must sit near the bracket, which is injected; **decided:** the disclosure renders from `match-details.js` into a fixed host `<div id="portrait-disclosure" hidden></div>` added to index.html, shown only when mappings are loaded and the Actual view is active) |
| `docs/css/dashboard.css` | modify — marked block |
| `tests/match-details.mjs` | modify — availability/URL/iframe-policy pure-logic tests |

`scripts/validate_match_details.py` already validates the portrait file (Plan 1
contract) — no edit needed; run it against the real file (step 1).

## Behavior spec (decisions locked)

- **Availability:** a portrait action appears only when (a) mapping exists for the
  code, (b) the local match record is complete/partial with matching unordered
  team pair and oriented score and date, (c) the match is completed, (d) Actual
  view. Any mismatch → treat as no mapping (fail closed, log via `console.warn`
  naming the code).
- **Fine-pointer hover:** facts show immediately (Plan 3); if available, the card
  shows "External portrait available"; a 500ms timer starts on hover of the
  card/preview region; leaving before 500ms cancels **before any request** (the
  iframe element is not created and no `src` is ever set early); after 500ms the
  single iframe is created in the preview region. Leaving the region removes the
  unpinned iframe (releases WebGL). Timer also cancels on view switch, Escape,
  dialog open, teardown.
- **Keyboard/touch:** focus alone never loads; Enter/Space/click/tap open the
  dialog (Plan 4) and load the verified iframe directly into `.mdlg-portrait`;
  closing removes it. Where practical, an existing preview iframe is *moved* into
  the dialog instead of recreated.
- **Single-iframe invariant:** at most one portrait iframe in the document at any
  time, across rapid match changes — enforced by a module-level reference.
- **URL construction:** `buildPortraitUrl(slug)` validates
  `^[a-z]{3}-[a-z]{3}$` and returns `https://wc26.bogachev.fr/m/<slug>/`; anything
  else throws. Never interpolate any other field into a URL. No bracket name,
  picks, share fragment, or storage value ever appears in the URL; the iframe has
  `referrerpolicy="no-referrer"`.
- **My picks:** switching cancels timers, removes unpinned iframes, closes a
  pinned dialog (focus → active view control), and shows no portrait UI.
- **Direct link:** always rendered beside the portrait action and in the dialog
  (`target="_blank" rel="noopener noreferrer"`), plus in the unavailable copy.

## Dependencies and parallelism

- Depends on: Brief 2 Plans 1, 3, 4 (and Plan 2 for real details data to verify
  against; a contract-valid local file suffices in development).
- Blocks: Plan 6 (combined review). Nothing else runs in parallel after this
  except Plan 2 if still in flight.

## Implementation order

1. Author `match-portraits.json` (25 rows from the brief's table — transcribe
   exactly; `M97` keeps `externalId "1998582"`). Run
   `python3 scripts/validate_match_details.py`. **Checkpoint:** validator passes;
   deliberately corrupt one slug → fails naming M-code; revert.
2. Availability + URL logic with pure functions; unit-test them.
   **Checkpoint:** `node tests/match-details.mjs` green (availability truth
   table, URL allowlist, mismatch → closed).
3. Disclosure host + rendering + CSS. **Checkpoint (served):** disclosure visible
   in Actual view with attribution and notices; hidden in My picks; hidden when
   the mapping file is blocked.
4. Hover intent timer + preview iframe lifecycle. **Checkpoint (served, Network
   tab open):** hover M97 < 500ms and leave → **zero** requests to bogachev.fr;
   hover ≥ 500ms → exactly one document request; leave → iframe removed; re-hover
   → new single iframe; rapid hover across M96/M97 → never two iframes
   (`document.querySelectorAll('iframe').length ≤ 1` polled during the dance).
5. Dialog integration (direct load on activation; move-preview-on-pin; removal on
   close; unavailable copy when a mapping fails identity checks at runtime).
   **Checkpoint:** keyboard-only walk: focus M97 → facts, no request → Enter →
   dialog + iframe → Escape → iframe gone, focus back on card.
6. Full sweep + privacy audit: fresh load with Network tab — only same-origin
   requests until an intentional ≥500ms fine-pointer hover or explicit
   activation on a verified match.

## Data contracts and invariants

- All privacy rules in the brief's "Privacy and safety" list hold verbatim.
- Mapping is data-driven: adding M98+ later means editing JSON only, no JS.
- A missing/blocked mapping never affects FIFA facts (Plan 3 behavior unchanged).
- The browser never fetches the remote manifest.

## Edge cases and codebase traps

- **Never pre-create the iframe with an empty `src`** and set it later — some
  browsers fire a request for `about:blank` contexts and it muddies the
  no-request-before-500ms audit; create the element only when the timer fires.
- `matchMedia('(pointer: fine)')` at event time, not load time (convertible
  laptops); coarse pointers get no hover-load path at all.
- Preview region leave-detection must treat the iframe as inside the region
  (pointer events over a cross-origin iframe don't bubble to the parent — use
  `mouseout`/`relatedTarget` on the wrapper and a small hover bridge gap, and
  accept that once the pointer is inside the iframe the region counts as hovered
  until it leaves the wrapper).
- GPU cleanup: removing the iframe from the DOM is the release mechanism — do it
  on every close/leave/switch path (the brief calls WebGL resources out
  explicitly).
- Theme/dialog z-index: the 16:9 box must not overflow `#matchdlg`'s
  `max-height:85vh` — cap the portrait box height and keep dialog scroll internal.
- The `sandbox` attr: `allow-same-origin` + `allow-scripts` together on a
  *cross-origin* iframe is standard for embedding hosted visuals (the origin
  isolation still applies); do not add `allow-top-navigation`, `allow-popups`,
  `allow-forms`.

## Read-only production-delta note

Production enablement is blocked on the author's written approval, and whether
approval covers manifest-based mapping sync is an explicit open decision recorded
in the brief's production gate. A port must also re-verify frameability headers at
that time. Record only.

## Automated checks (exact commands)

```
python3 scripts/validate_match_details.py
node --check docs/js/match-details.js
node tests/match-details.mjs
node tests/map-frozen.mjs && node tests/matchcards.mjs && node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
python3 tests/match_details.py
```

## Manual acceptance criteria

- 25/25 completed matches expose the identical portrait flow (spot-check 5
  including M97); M98+ (unmapped) show facts with no portrait action.
- The no-request-before-500ms, single-iframe, removal-on-leave/close/switch, and
  focus-return behaviors all demonstrated with the Network tab open.
- Disclosure present and accurate; direct link opens the portrait page in a new
  tab with no referrer.
- Nothing portrait-related exists anywhere in My picks.

## Handoff checklist and stop condition

- [ ] Mapping file validated; behavior spec demonstrated end-to-end.
- [ ] Privacy audit recorded (request log at each interaction stage).
- [ ] Production gate language present in the disclosure/docs (permission still
      required; nothing deployed).

**Stop** after the checklist. The combined review is
PLAN-combined-validation-review.md.
