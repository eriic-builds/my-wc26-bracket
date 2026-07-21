# PLAN: Hardening & accessibility — five small fixes that close real holes

**Rank: 5 of 5** (small individually, meaningful together; safe to do anytime, each fix
is independent — land them in any order, one commit each).

## Goal

Fix five concrete issues found by reading the code, each with a one-line thesis:

1. **Unescaped `note` in four render sites** — the only unescaped interpolation of
   sync-controlled data in the render path.
2. **Viewing the demo silently destroys your what-if overrides** — data loss from a
   preview button.
3. **Team stat cards are mouse-only** — keyboard and touch users get nothing despite
   `tabindex="0"` already being on every team box.
4. **`fetch(...).json()` never checks `r.ok`** — a 404/500 surfaces as a cryptic JSON
   parse error; offline = blank page even though everything could work from cache.
5. **Search-result count is invisible to screen readers** — one attribute fixes it.

## Files to touch

| File | Fix # |
| --- | --- |
| `docs/js/render.js` | 1 |
| `docs/js/main.js` | 2, 4 |
| `docs/js/storage.js` | 2 |
| `docs/js/interact.js` | 3, 5 |
| `tests/` (golden fixture note) | 1 |

## Step-by-step

### Fix 1 — escape `note` everywhere in render.js

`note` comes from `results.json` (bot-written). Today it is always benign ("4–3 pens",
"AET"), so escaping changes **zero bytes** of current output — the golden snapshot still
passes. That's exactly why now is the safe time to close it.

Sites (line numbers as of commit a35fa5b):
- `buildBracket` ~line 334: `${note ? " · " + note : ""}` → `esc(note)`
- `buildScorecard` ~386: `${note ? " (" + note + ")" : ""}` → `esc(note)`
- `buildScorecard` ~387: same pattern → `esc(note)`
- `buildScorecard` ~399: same pattern → `esc(note)`
- `buildScorecard` ~404: same pattern → `esc(note)`
- `buildResultsPanel` ~535: `${note ? " <i>" + note + "</i>" : ""}` → `esc(note)`

(`buildRoundResultsPanel` ~566 already escapes — use it as the reference pattern.)

### Fix 2 — stop the demo from wiping what-if overrides

Repro today: set any scorecard toggle on your bracket → click "view the demo bracket"
from an error box (or load the demo any way) → `showDashboard(demoPicks)` calls
`resetWhatIfsIfChanged`, sees a different hash, and **deletes `wcb.scores.v3`**. Your
edits are gone when you come back.

1. `storage.js` — add:

```js
const KEY_STASH = "wcb.scores.stash";
export function stashWhatIfs() {          // before a preview render (demo/shared)
  const h = safeGet(KEY_HASH), s = safeGet(KEY_SCORES);
  if (h != null || s != null) safeSet(KEY_STASH, JSON.stringify({ h, s }));
}
export function restoreWhatIfs() {        // when the user's own bracket returns
  const raw = safeGet(KEY_STASH);
  if (!raw) return;
  try {
    const { h, s } = JSON.parse(raw);
    if (h != null) safeSet(KEY_HASH, h); else safeDel(KEY_HASH);
    if (s != null) safeSet(KEY_SCORES, s); else safeDel(KEY_SCORES);
  } catch (e) {}
  safeDel(KEY_STASH);
}
```

2. `main.js`:
   - `onDemo()`: call `stashWhatIfs()` **before** `showDashboard(picks, true)`.
   - Startup path that shows the saved bracket, and any "back to my bracket" path:
     call `restoreWhatIfs()` **before** `showDashboard(saved)` (restore first, then
     `resetWhatIfsIfChanged` inside showDashboard sees the right hash and does nothing).
   - `toLanding()` (user explicitly clears): `safeDel` is fine — also drop the stash by
     calling `restoreWhatIfs()` first then proceeding (clearPicks already wipes scores).
   - Keep `resetWhatIfsIfChanged` exactly where it is for real uploads — replacing your
     bracket with a genuinely different one SHOULD reset overrides. The stash only
     brackets *previews*.
   (If PLAN-share-links landed, its `isShared` path should also stash/restore the same
   way — one shared mechanism, two callers.)

### Fix 3 — stat cards on keyboard focus and touch

In `interact.js`, the block near the bottom that wires
`document.querySelectorAll('.team[data-team]')` currently adds `mouseenter/mousemove/
mouseleave`. Team boxes already have `tabindex="0"` (rendered by render.js — no render
change needed). Extend the same `forEach`:

```js
el.addEventListener('focus',function(){var r=el.getBoundingClientRect();showCard(el,{clientX:r.right,clientY:r.top});});
el.addEventListener('blur',function(){card.classList.remove('show')});
```

And once, outside the loop:

```js
document.addEventListener('keydown',function(e){if(e.key==='Escape')card.classList.remove('show');});
```

Touch: `mouseenter` already fires on first tap on iOS/Android for elements with
listeners; a second tap anywhere else hides via `mouseleave`. Verify on a phone; if
first-tap doesn't show, add a `click` handler that toggles the card — but only after
testing, since a click handler also fires for mouse users and would double-toggle.

The card itself should also get (in `initInteractions`, one line):
`card.setAttribute('role','tooltip');`

### Fix 4 — fetch hardening + offline fallback in main.js

Replace `loadData()`:

```js
async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
  return r.json();
}
async function loadData() {
  const [t, l] = await Promise.all([
    fetchJSON("data/topology.json"),
    fetchJSON("data/results.json", { cache: "no-cache" }),
  ]);
  TOPO = t; LIVE = l;
  try { localStorage.setItem("wcb.cache.data", JSON.stringify({ t, l })); } catch (e) {}
}
```

In the startup IIFE, on `loadData()` failure:

```js
try { await loadData(); } catch (e) {
  console.warn("data load failed", e);
  try {
    const c = JSON.parse(localStorage.getItem("wcb.cache.data") || "null");
    if (c) { TOPO = c.t; LIVE = c.l; /* set a module flag OFFLINE = true */ }
  } catch (e2) {}
}
```

- If cache hydrates: proceed normally but show a small banner in `#viewerbar` (same
  pattern as the freshness chip from PLAN-match-day-freshness, class `bad`):
  `"offline — results as of " + (LIVE.refreshed || "an earlier sync")`.
- If neither network nor cache: keep the landing usable but disable `#pick`, `#build`,
  `#import` buttons and show one line under the drop zone: "Couldn't load tournament
  data — check your connection and reload." (Today those paths would throw
  `validateAgainstTopology(picks, null)` → TypeError → misleading "not a valid bracket"
  error.)

### Fix 5 — aria-live on the results count

The `#count` element ("Showing 12 of 32 teams") is rendered by render.js — **do not
edit render.js for this** (golden bytes). In `interact.js`, right after
`countEl` is looked up:

```js
if(countEl){countEl.setAttribute('aria-live','polite');}
```

DOM attributes set after injection don't affect the golden snapshot (which tests the
HTML string, not the live DOM).

## Edge cases a weaker model would miss

- **Escaping `note` is byte-neutral today** — that's the proof it can't break golden
  parity, and the test: run `node tests/golden.mjs` after Fix 1; it must pass
  *unchanged*, no `--update`.
- **The stash must round-trip "absent" correctly** (user had no overrides): store
  `null`s and delete on restore, or you resurrect stale keys.
- **`resetWhatIfsIfChanged` must keep running for real uploads** — the bug is only that
  *previews* trigger it. Don't just delete the call.
- **Focus-driven stat card has no mouse coordinates** — synthesize a position from
  `getBoundingClientRect()` (the `posCard` clamp logic already keeps it on-screen).
- **Don't attach `click` for touch blindly** — `mouseenter` fires on first tap on
  mobile; a click toggle would make mouse hover+click flicker. Test first.
- **`cache: "no-cache"` on results.json must survive the refactor** — it's what makes
  a Pages redeploy visible without a hard refresh.
- **Offline cache stores topology + results together** — caching only results would let
  them skew (topology from one deploy, results from another).
- **`#count` lives inside re-injected HTML** — the attribute must be set inside
  `initInteractions()` (runs after every injection), not once at startup.

## Acceptance criteria

1. `node tests/golden.mjs` passes with **no fixture update** after Fix 1; grep confirms
   no remaining `+ note +` (unescaped) in render.js:
   `grep -n '" (" + note' docs/js/render.js` → empty.
2. Repro from Fix 2 no longer loses data: toggle a what-if → view demo → back to your
   bracket → toggle still set. Also: upload a *different* real bracket → overrides reset
   (old behavior intact).
3. Tab through the bracket map: each focused team box shows its stat card near the box;
   Escape hides it; blur hides it. `#statcard` has `role="tooltip"`.
4. DevTools → Network → Offline → reload with a bracket saved: dashboard renders from
   cache with the offline banner; landing buttons disabled with message when cache is
   also cleared.
5. Rename `docs/data/results.json` locally and serve → the error shown mentions HTTP
   404 in the console, and the app falls back to cache instead of "That didn't look
   like a valid bracket".
6. VoiceOver/NVDA announces "Showing N of 32 teams" when typing in the search box.
7. All existing tests still pass (`npm test`).
