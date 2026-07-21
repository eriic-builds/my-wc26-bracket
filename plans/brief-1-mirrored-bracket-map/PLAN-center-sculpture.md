# PLAN-center-sculpture — original low-poly cup, lazy Three.js lifecycle, SVG fallback

## Rank and leverage

**Rank 5 of 6 (Brief 1).** The sculpture is visual identity, not information — the
brief is explicit that the Final must stay readable without it. It ranks below the
structural plans because nothing depends on it, and it can run **in parallel with
Plans 3 and 4** once Plan 2's `[data-trophy]` mount exists. Its leverage is the
review gate: the center composition is what the reference image sells.

## Goal and user-visible outcome

The center column shows a gently spinning, low-poly, World Cup-*inspired* (and
deliberately distinct) sculpture above the Final card: faceted globe, two straight
geometric V supports, short bridge, hexagonal plinth, dashboard-token materials.
It lazy-loads, pauses offscreen/hidden, supports drag/keyboard/pause control,
respects reduced motion, and degrades to a local static SVG on WebGL failure and at
phone widths. It is never required to understand the Final.

## In scope

- `docs/js/vendor/three.module.min.js` — pinned, self-hosted Three.js.
- `docs/js/trophy.js` — geometry, materials, lights, animation, full lifecycle.
- `docs/assets/trophy-fallback.svg` — original static cup.
- One lazy-init call in `docs/js/main.js` + teardown across re-renders.
- Trophy CSS block (canvas sizing, cursors, pause button, focus ring) appended to
  `docs/css/dashboard.css`.

## Out of scope

- Card/center-stage markup (Plan 2 shipped `[data-trophy]`; do not move it).
- Connectors, redraw lifecycle, `interact.js` (Plan 4's file — zero edits here).
- Any CDN, build step, texture/reflection maps, bloom, particles, or official-asset
  reproduction (all banned by the brief).

## Verified current architecture

- Plan 2's center stage: `.bkcol.bkcenter > .center-stage > .trophy-slot[data-trophy]`
  (empty div) above the M104 card and champion state. Two brackets exist in the DOM
  (actual + picked); **both contain a `[data-trophy]`** — the trophy mounts into
  *both* (cheap: one shared renderer is overkill; decided: mount one instance per
  slot but only ever animate the visible one — the IntersectionObserver naturally
  reports the hidden bracket's slot as not-intersecting because `display:none`
  elements never intersect).
- `main.js` `showDashboard()` replaces `#app.innerHTML` and calls
  `initInteractions()` — it can run **multiple times per page life** (demo → own →
  shared). Any canvas, RAF loop, observer, or listener from a previous render must
  be torn down or it leaks GPU contexts. `main.js` is otherwise untouched by Plans
  1–4, so this plan owns its only Brief 1 edit.
- Theme tokens: `--gold` and `--panel` per theme on `html[data-theme]`
  (dashboard.css:5–39). Theme switches happen in `interact.js setTheme()` by
  setting the `data-theme` attribute — observable via `MutationObserver` on
  `document.documentElement` (`attributeFilter:["data-theme"]`), which keeps this
  plan fully decoupled from interact.js.
- `index.html` loads `js/main.js` as the single module entry — a dynamic
  `import("./trophy.js")` from main.js needs **no index.html change** (decided:
  index.html stays untouched; the brief's "load any new local module" is satisfied
  via dynamic import, which also gives lazy loading for free).
- No network at test time; tests are Node-only and must not import trophy.js
  (Three.js needs a browser; keep trophy code out of the render/test path).

## Exact files

| File | Action | Symbols / sections |
| --- | --- | --- |
| `docs/js/vendor/three.module.min.js` | create (vendored) | Pinned copy — see procurement below |
| `docs/js/vendor/THREE-LICENSE.txt` | create | Three.js MIT license text + version note |
| `docs/js/trophy.js` | create | `initTrophy(slot)` → returns `teardown()`; all geometry/lifecycle |
| `docs/assets/trophy-fallback.svg` | create | Original static cup (hand-authored SVG, same silhouette rules) |
| `docs/js/main.js` | modify | In `showDashboard()` after `initInteractions()`: teardown previous trophies (`window.__trophyTeardowns`), then if `document.querySelector('[data-trophy]')` exists, `import("./trophy.js").then(m => { window.__trophyTeardowns = [...document.querySelectorAll('[data-trophy]')].map(el => m.initTrophy(el)); }).catch(() => {})` — a load failure must never break the dashboard |
| `docs/css/dashboard.css` | modify | Append marked block `/* ── center sculpture (PLAN-center-sculpture) ── */`: `.trophy-slot` fixed aspect box (e.g. `aspect-ratio:1/1;max-width:180px;margin:0 auto`), `canvas{touch-action:pan-y;cursor:grab}` / `.dragging{cursor:grabbing}`, `.trophy-pause` compact button styled like `.sec-toggle`, focus-visible ring, `@container brk (max-width:600px)` swap canvas→fallback img sizing |

### Vendoring procedure (one-time network step, called out for the executor)

```
curl -fL https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js \
  -o docs/js/vendor/three.module.min.js
curl -fL https://raw.githubusercontent.com/mrdoob/three/r170/LICENSE \
  -o docs/js/vendor/THREE-LICENSE.txt
```

Pin exactly `three@0.170.0`. Verify: file starts with a Three.js banner/comment and
`grep -c "REVISION" docs/js/vendor/three.module.min.js` ≥ 1. If the executor has no
network, **stop this plan and report** — do not substitute a CDN `<script>` tag or a
different version. The rest of Brief 1 does not depend on this plan.

## Design specification (decisions locked, per the brief's boundaries)

- **Geometry (all original, built in code):**
  - Globe: `IcosahedronGeometry(r, 1)` with `flatShading` — faceted; add 2–3 raised
    "seam" great-circle ribbons via thin `TorusGeometry` arcs, abstract, not
    continents.
  - Supports: two mirrored straight arms (`BoxGeometry`, slight outward lean)
    forming an open V — no twist, no taper suggesting figures.
  - Bridge: one short `BoxGeometry` joining the arms below the globe.
  - Plinth: `CylinderGeometry(rTop, rBottom, h, 6)` — hexagonal, compact; **no
    rings, no green**.
  - Proportions deliberately off-official: globe ≈ 1/3 of total height (official is
    smaller relative to stem), overall squatter. Check silhouettes front/side/¾ —
    if it reads as a replica, widen the V and flatten the plinth further.
- **Materials/lights:** `MeshStandardMaterial({flatShading:true, roughness:0.9,
  metalness:0.1})`; body color from `getComputedStyle(document.documentElement)
  .getPropertyValue('--gold')`, recessed faces (plinth sides, bridge) from
  `--panel`. One key `DirectionalLight`, one low-intensity blue-teal rim light
  (`#0097F4`-ish from `--blue`), soft `AmbientLight`. `OrthographicCamera`.
  Transparent canvas (`alpha:true`), no tone-mapped drama.
- **Motion:** yaw rotation 2π per **36s** via RAF delta-time (not per-frame
  constants — throttled tabs otherwise speed-jump). Cursor-follow tilt ≤ **3°**,
  eased (lerp), mouse/pen hover only. Drag: horizontal → yaw; vertical (mouse/pen
  only) → pitch clamped ±**10°**; touch drag → yaw only, `touch-action:pan-y` so
  the page still scrolls vertically. Auto-rotation pauses during drag, resumes
  **1.5s** after release. **No** inertia, bobbing, wheel/pinch zoom, or auto-zoom.
- **Input/lifecycle:** Pointer Events only; `setPointerCapture` **only on
  pointerdown of an active drag**, released on pointerup/pointercancel and in
  teardown. No wheel listeners at all. Canvas `tabindex="0"`,
  `aria-label="Decorative World Cup sculpture. Arrow keys rotate, Home resets, Space pauses."`,
  visible focus ring, ArrowLeft/Right yaw, ArrowUp/Down pitch (clamped), Home
  reset, Space pause/resume (also a visible compact Pause ⏸/Resume ▶ button below
  the canvas). `IntersectionObserver` on the slot: init renderer lazily on first
  intersection, stop RAF when not intersecting. `visibilitychange`: pause when
  hidden. `matchMedia('(prefers-reduced-motion: reduce)')`: no auto-rotation, no
  cursor tilt; drag/keyboard still work; listen for changes.
- **Theme changes:** `MutationObserver` on `<html data-theme>` → re-read `--gold`/
  `--panel`/`--blue`, call `material.color.set(...)` — **no scene rebuild**.
- **Failure/fallback:** wrap renderer creation in try/catch; on failure (or when
  `canvas.getContext('webgl2')||getContext('webgl')` is null), or at phone tier
  (gate on the same measure Plan 3's container queries use:
  `slot.closest('.brk-wrap').clientWidth < 600` at init), or
  when the dynamic import itself fails, render
  `<img src="assets/trophy-fallback.svg" alt="" width="…">` into the slot instead
  (decorative: empty alt; the Final card below is the information).
  The fallback SVG is hand-drawn to the same silhouette rules (faceted circle,
  V supports, hex base) in currentColor/`var(--gold)` so themes tint it.
- **Naming:** file/function/DOM names are `trophy`/`sculpture`-neutral; no FIFA
  marks, no "World Cup Trophy" claim in visible text; the aria-label says
  "sculpture".
- **teardown()** (returned by `initTrophy`): cancel RAF, disconnect both observers,
  remove listeners, release pointer capture, `renderer.dispose()` +
  `geometry/material.dispose()`, remove canvas/img, null refs. `main.js` calls all
  stored teardowns before each re-render.

## Dependencies and parallelism

- Depends on: Plan 2 only (`[data-trophy]` mount). Runs in parallel with Plans 3–4
  (disjoint files; dashboard.css is append-only marked blocks on all sides).
- Blocks: nothing. Plan 6 verifies it.
- Shared-file note: this is the **only** Brief 1 plan that edits `main.js`.

## Implementation order

1. Vendor Three.js + license (procedure above). **Checkpoint:** file sizes sane
   (~600–700KB min); served page still loads (nothing imports it yet).
2. Author `trophy-fallback.svg`; drop it temporarily into the slot via devtools to
   check composition against the Final card. **Checkpoint:** silhouette review —
   distinct from the official trophy at front/side/¾ (subjective; take the three
   screenshots for the Plan 6 review packet).
3. `trophy.js`: static scene first (geometry, materials, lights, ortho camera, one
   frame). **Checkpoint:** serve; sculpture renders in the center of the Actual
   view; Final card unobstructed; dark/light theme tokens applied.
4. Animation + drag + keyboard + pause button + resume-delay. **Checkpoint:** 36s
   rotation timed roughly; drag yaw/pitch clamps; touch drag on a touchscreen or
   devtools emulation scrolls the page vertically but yaws horizontally; Space and
   button toggle; Home resets.
5. Lifecycle: lazy init, offscreen/hidden pause, reduced-motion, teardown, theme
   observer, WebGL-failure path (test by forcing `forceContextLoss()` or stubbing
   `getContext` to return null in console), phone fallback. **Checkpoint:** load
   the demo → "New bracket" → demo again: `performance` shows no accumulating
   `WebGLRenderer` warnings; only one live canvas per visible slot.
6. CSS block; verify the sculpture never exceeds its slot (max-width) and never
   becomes the loudest object — compare against the Final card at 1280.
7. Full test sweep (Node tests unaffected — confirm; trophy.js must not be imported
   by anything tests reach).

## Data contracts and invariants

- The dashboard renders fully (cards, connectors, legend, scoring) when trophy.js
  is absent, throws, or WebGL is unavailable.
- At most one RAF loop per visible canvas; zero when hidden/offscreen/paused.
- No wheel capture; page scroll is never hijacked; SVG/canvas never intercepts
  clicks meant for cards (slot sits above the Final, not overlapping it).
- All Brief 1 bans hold: no CDN, no figures/twisting stem/green rings, no official
  marks or mesh reproduction.

## Edge cases and codebase traps

- **Two mounts, one visible.** The picked-view slot is inside `display:none` —
  IntersectionObserver won't fire for it until the user toggles views; init is
  per-slot and lazy, so the second canvas appears on first toggle. Verify the
  toggle path (Plan 4's redraw is independent; don't couple).
- **Re-render leaks are the real risk** (`showDashboard` can run 3+ times in a
  session). The teardown array on `window.__trophyTeardowns` must be consumed
  (called + cleared) at the top of the trophy init block in `showDashboard`.
- **RAF delta time:** background tabs throttle RAF; compute rotation from
  `performance.now()` deltas, clamp dt (≤100ms) so returning to the tab doesn't
  snap-spin.
- **`prefers-reduced-motion` can change live** (OS toggle) — subscribe, don't
  sample once.
- **Ortho camera + container resize:** update camera frustum + renderer size from
  a `ResizeObserver` on the slot (one observer per instance is fine here —
  disconnect in teardown).
- **Don't read CSS vars per frame** (getComputedStyle is layout-bound); read on
  init + theme mutation only.
- **jsdelivr min build keeps the MIT banner** — keep the file byte-exact; do not
  re-minify or strip it.
- The Easy/fun themes change `--gold` drastically (WinXP `--gold` is blue!) — the
  sculpture follows tokens by design; screenshot WinXP once so the review
  consciously accepts a blue cup (it's the theme's gold token; consistent with
  every other gold element).

## Read-only production-delta note

Production has no vendored Three.js, no assets dir, and byte-locked render output;
porting adds ~650KB to its Pages payload — a port must re-decide lazy-load budget
(Russinovich: measure Pages transfer) and re-run its golden `--update`. Its stricter
hermetic `npm test` must keep trophy.js untested/not-imported in Node. Record only.

## Automated checks (exact commands)

```
node --check docs/js/trophy.js
node --check docs/js/main.js
grep -c "REVISION" docs/js/vendor/three.module.min.js        # ≥ 1
node tests/bracket-tree.mjs && node tests/matchcards.mjs && node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
grep -n "fifa" docs/js/trophy.js docs/assets/trophy-fallback.svg   # expect: no hits (naming rule)
```

## Manual acceptance criteria (served)

- Sculpture spins slowly above the Final; one full turn ≈ 36s; pauses on drag,
  resumes ~1.5s after release; hover tilt subtle (≤3°).
- Keyboard: Tab reaches the canvas (visible ring), arrows rotate, Home resets,
  Space toggles; the Pause button mirrors Space.
- OS reduced-motion on: no auto-spin, no hover tilt; drag/keyboard still rotate.
- DevTools → emulate WebGL failure (or block trophy.js in the Network tab): static
  SVG cup appears; dashboard fully functional; no console error escapes the catch.
- Phone width (≤600px container): static cup, no canvas, no WebGL context created
  (check `document.querySelector('.trophy-slot canvas')` is null).
- Tab hidden 30s → visible: rotation resumes smoothly (no snap).
- Silhouette review at front/side/¾: reads as "inspired by", not a replica; smaller
  visual weight than the Final card cluster.
- Toggling views: second slot initializes; toggling back doesn't duplicate
  canvases; "New bracket" → demo re-render leaves exactly the fresh instances.

## Handoff checklist and stop condition

- [ ] Pinned vendor file + license committed to the working tree (not committed to
      git — no commits in this task graph).
- [ ] All lifecycle behaviors demonstrated (list above) and the three silhouette
      screenshots saved for the review packet.
- [ ] Zero edits to `interact.js`, `render.js`, `index.html`.
- [ ] All Node tests green; page works with trophy.js blocked.

**Stop** after the checklist. Final validation/screenshots are
PLAN-map-validation-review.md.
