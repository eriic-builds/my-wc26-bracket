# PLAN: Match-day freshness — denser sync, honest staleness, stall detection

**Rank: 2 of 5.** Time-sensitive: quarterfinals are Jul 9–11, semis Jul 14–15, final
Jul 19. Today results sync at 3 fixed times/day, so on match days the dashboard can be
hours behind and *says nothing about it*. The page proudly shows "Live · updated …" —
users' #1 question during the QFs is "is this current?"

## Goal

1. Sync every 30 minutes during the daily match window instead of 3×/day.
2. Show a truthful client-side freshness chip ("updated 23m ago", amber when stale).
3. Detect the *silent-stall* failure mode: a knockout match that finished in the feed
   but never resolved to a bracket code (almost always a `team_map.json` gap) — today
   this fails silently by absence, forever.

## Files to touch

| File | Change |
| --- | --- |
| `scripts/fetch_results.py` | Write `refreshed_iso`; throttle stamp-only writes; print `UNMATCHED-KO` warnings |
| `.github/workflows/sync-results.yml` | Denser cron; stall-warning → GitHub issue step |
| `docs/index.html` | Empty chip container in `#viewerbar` |
| `docs/js/main.js` | Compute + refresh the staleness chip |

Do **NOT** touch `docs/js/render.js`. The dashboard's own "Live · updated" pill is
rendered by the golden-tested engine; changing it breaks byte-parity with the snapshot
(see PLAN-ci-safety-net). The new chip lives in the viewer bar, which `main.js` owns.

## Step-by-step

### Step 1 — `refreshed_iso` in results.json

In `fetch_results.py`:

- Add helper: `def now_iso(): return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")`
- Everywhere `results["refreshed"] = now_pt_stamp()` is set (two places: the
  no-change branch and the main write path), also set
  `results["refreshed_iso"] = now_iso()`.

`render.js` copies only the keys it knows from `live`, so the extra key is invisible to
the golden snapshot. The validator from PLAN-ci-safety-net already tolerates extra keys.

### Step 2 — throttle stamp-only commits (the trap in this plan)

**Trap:** today, even when no games changed, the script rewrites the `refreshed` stamp
and the workflow commits it (git status shows a change) and dispatches a Pages deploy.
At 3 runs/day that's fine; at ~26 runs/day it's ~26 commits + deploys of pure noise.

In the no-change branch of `main()` (the block that currently says
`# Nothing to apply, but record that we checked`), only rewrite the stamp when the
existing one is older than 2 hours:

```python
prev_iso = results.get("refreshed_iso", "")
stale = True
if prev_iso:
    try:
        prev = datetime.strptime(prev_iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        stale = (datetime.now(timezone.utc) - prev).total_seconds() > 2 * 3600
    except ValueError:
        pass
if stale:
    results["refreshed"] = now_pt_stamp()
    results["refreshed_iso"] = now_iso()
    _write_results(results)
    print(f"...refreshed sync time...")
else:
    print(f"Source: {src}. No new finished games; stamp is recent — nothing written.")
```

Result: when games finish, every 30-min run publishes immediately; when nothing is
happening, at most ~1 stamp commit per 2 h. The workflow's existing
`git status --porcelain docs/data/results.json` check handles the rest unchanged.

### Step 3 — denser cron on the match window

All 2026 knockout kickoffs fall between 12:00 ET and ~9:00 PM ET → UTC window
16:00–02:00 (+ buffer for AET/pens ≈ finish by 05:00 UTC). Replace the `schedule:` block
in `sync-results.yml`:

```yaml
  schedule:
    - cron: "*/30 16-23 * * *"   # match window, first half (UTC)
    - cron: "*/30 0-5 * * *"     # match window past midnight UTC
    - cron: "0 10 * * *"         # one off-window heartbeat
```

Notes:
- GitHub cron is **UTC only** and fires with up to ~15 min jitter (and occasionally
  skips under load) — that is *why* we pick 30-min density rather than hourly.
- The script is idempotent; extra runs that find nothing new now exit without writing
  (step 2), so the deploy chain stays quiet.
- After the final (Jul 19), prune back to a single daily line — add a `# TODO(after
  Jul 19)` comment right in the YAML so future-you sees it.

### Step 4 — silent-stall detector in fetch_results.py

The dangerous failure is not an exception — it's a knockout result that arrives in the
feed with a team name `team_map.json` doesn't map (e.g. FIFA switches "Korea Republic"
style), so `match_all` never pairs it and the bracket silently never updates.

After `new_res, applied = match_all(...)` in `main()`, add:

```python
# --- silent-stall detection: knockout feed entries that matched nothing ---
known_pairs = set()
for code, a, b in r32:
    known_pairs.add(frozenset((a, b)))
for code, (fa, fb) in ko_feed.items():
    wa = new_res[fa][2] if fa in new_res else None
    wb = new_res[fb][2] if fb in new_res else None
    if wa and wb:
        known_pairs.add(frozenset((wa, wb)))
for f in feed:
    lbl = stage_label(f.get("stage", ""))
    if lbl in ("group stage", "third-place playoff", "match"):
        continue                       # not bracket matches — never warn on these
    if not f.get("winner"):
        continue                       # draws can't be bracket results
    if frozenset((f["home"], f["away"])) not in known_pairs:
        print(f"UNMATCHED-KO: {f['home']} vs {f['away']} ({lbl}, {f.get('date','')[:10]}) "
              f"finished in the feed but matches no bracket fixture — check team_map.json")
```

### Step 5 — surface stalls as a GitHub issue

In `sync-results.yml`, change the fetch step to tee its output, then add a step after it:

```yaml
      - name: Fetch results into docs/data/results.json
        run: python scripts/fetch_results.py | tee sync.log

      - name: Flag unmatched knockout results
        if: always()
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          if grep -q "UNMATCHED-KO" sync.log; then
            body=$(grep "UNMATCHED-KO" sync.log)
            existing=$(gh issue list --state open --search "Unmatched knockout result in:title" --json number --jq '.[0].number')
            if [ -n "$existing" ]; then
              gh issue comment "$existing" --body "$body"
            else
              gh issue create --title "Unmatched knockout result — team_map.json gap?" --body "$body"
            fi
          fi
```

(`pipefail` note: GitHub's default bash invocation includes `-o pipefail`, and
`tee` preserves the script's exit code path anyway — a script failure still fails the
step and triggers the existing failure-issue step.)

### Step 6 — freshness chip in the viewer bar

`docs/index.html` — inside `<div id="viewerbar" …>` after the `vb-you` span, add:

```html
<span id="vb-fresh" class="vb-fresh" hidden></span>
```

and in the inline `<style>` block:

```css
.vb-fresh{font-size:.76rem;border-radius:999px;padding:2px 9px;border:1px solid var(--border2);color:var(--muted)}
.vb-fresh.warn{color:#b58900;border-color:rgba(181,137,0,.5)}
.vb-fresh.bad{color:var(--lose-ink,#e5484d);border-color:rgba(229,72,77,.5)}
```

`docs/js/main.js` — add a module-level function and call it from `showDashboard()`:

```js
let freshTimer = null;
function paintFreshness() {
  const el = $("#vb-fresh");
  if (!el || !LIVE || !LIVE.refreshed_iso) return;   // old data file: stay hidden
  const t = Date.parse(LIVE.refreshed_iso);
  if (isNaN(t)) return;
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  const label = mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
  el.textContent = "results updated " + label;
  el.className = "vb-fresh" + (mins > 720 ? " bad" : mins > 180 ? " warn" : "");
  el.hidden = false;
}
```

In `showDashboard()` after `$("#viewerbar").hidden = false;`:
`paintFreshness(); clearInterval(freshTimer); freshTimer = setInterval(paintFreshness, 60000);`
In `toLanding()`: `clearInterval(freshTimer);`

## Edge cases a weaker model would miss

- **Do not put the chip in `render.js`** — that output is byte-locked by the golden
  snapshot. The viewer bar is main.js territory; that's why the chip goes there.
- **Stamp-only commit spam** (step 2): without the 2-hour throttle, 30-min crons produce
  ~26 no-op commits+deploys a day and bury real history.
- **The third-place playoff (M103) is a real knockout game that legitimately matches no
  bracket fixture.** The stall detector must whitelist its stage label or it cries wolf
  on Jul 18. Same for genuine draws (group games can end level; `winner` is empty).
- **`stage_label()` returns `"match"` for an empty/unknown stage** — treat unknown as
  non-bracket (skip) rather than warning; the football-data fallback sometimes carries
  sparse stage strings.
- **GitHub cron jitter**: schedules fire late or occasionally not at all. Never build
  logic that assumes a run happened; the freshness chip is the honest fallback.
- **`Date.parse` on iOS Safari** is strict — the `YYYY-MM-DDTHH:MM:SSZ` format emitted
  in step 1 is the safe subset; don't emit `+00:00` offsets or space separators.
- **Demo mode**: the chip reads `LIVE`, which is loaded regardless, so it works for the
  demo too — that's correct (freshness is a property of shared results, not the bracket).

## Acceptance criteria

1. `python3 scripts/fetch_results.py --dry-run` runs clean; with a doctored
   `--input` feed containing `{"home":"Foolandia","away":"Spain","gh":0,"ga":1,"stage":"QUARTER_FINALS", "date":"2026-07-09T20:00:00Z"}`
   the output contains a `UNMATCHED-KO: Foolandia vs Spain` line.
2. A feed entry with stage `THIRD_PLACE` or an empty winner produces **no** warning.
3. Run the script twice in a row with no new games: the second run prints
   "stamp is recent — nothing written" and `git status` shows no change.
4. `docs/data/results.json` gains `refreshed_iso` matching `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$`.
5. Open the site with a bracket loaded: the viewer bar shows "results updated Xm ago";
   manually edit `refreshed_iso` 13 h back → chip turns red ("bad" class).
6. With `refreshed_iso` removed from results.json the chip stays hidden (no JS errors).
7. `node tests/golden.mjs` still passes (render output untouched).
8. The workflow file has 3 cron lines and the new "Flag unmatched" step; a push of the
   YAML alone does not trigger a Pages deploy (deploy watches `docs/**` only).
