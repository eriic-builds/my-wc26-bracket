// pilot-skin.js — PILOT-only presentational decorator.
//
// Runs after render.js has populated #app. It adds RIVR-style accents to the
// hero (a floating "confirmed points" stat card + a faux-cutout "Bracket Table"
// corner) and fades sections in as you scroll. It is PURELY visual: it never
// reads or writes bracket data, scores, what-if overrides, or storage, and it
// never rebinds the real interaction layer. If anything here throws, the app
// keeps working — production code is untouched.
//
// Hook: main.js sets `#app.innerHTML = renderDashboard(...)` inside
// showDashboard(); a MutationObserver on #app re-runs decoration on every
// (re)render. We also decorate once at startup in case a saved bracket has
// already rendered before this module ran.

const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
}

// Read the confirmed-points number straight from the existing "N pts confirmed"
// live badge that render.js already produced — no data logic duplicated here.
function confirmedPoints(hero) {
  const live = hero.querySelector(".badges .pill.live");
  if (live) { const m = live.textContent.match(/\d[\d,]*/); if (m) return m[0]; }
  return "\u2014";
}

// The two concave corner masks (same paths as the design-lab), filled via CSS
// with var(--bg) so the notch matches whatever theme is active.
const MASK_TOP = "M56 56V0C56 30.9279 30.9279 56 0 56H56Z";
const MASK_LEFT = "M56 56H0C30.9279 56 56 30.9279 56 0V56Z";
const svgMask = (kind, d) =>
  `<div class="pc-mask ${kind}" aria-hidden="true"><svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg></div>`;

function decorateHero(hero) {
  if (hero.dataset.pilotDecorated) return;   // idempotent per hero element
  hero.dataset.pilotDecorated = "1";

  // Floating stat card — confirmed points + the Bracket-map CTA
  // (this is the design-lab "Track a team" button, now a Bracket-map jump).
  const card = document.createElement("div");
  card.className = "pilot-statcard";
  card.innerHTML =
    `<div><div class="ps-num">${confirmedPoints(hero)}</div>` +
    `<div class="ps-lbl">Points confirmed</div></div>` +
    `<button type="button" class="pill-chip ghost" data-jump="sec-bracket">` +
    `<span class="chip-ic" aria-hidden="true">\u{1F5FA}\uFE0F</span> Bracket Table</button>`;
  hero.appendChild(card);

  // Faux-cutout corner — jumps to Scoring & schedule
  const corner = document.createElement("div");
  corner.className = "pilot-corner";
  corner.setAttribute("role", "button");
  corner.setAttribute("tabindex", "0");
  corner.setAttribute("aria-label", "How scoring works \u2014 jump to Scoring & schedule");
  corner.dataset.jump = "sec-scoring";
  corner.innerHTML =
    svgMask("top", MASK_TOP) + svgMask("left", MASK_LEFT) +
    `<div class="pc-ic" aria-hidden="true">\u{1F9EE}</div>` +
    `<div class="pc-txt"><div class="pc-title">How scoring works</div>` +
    `<div class="pc-link">Scoring &amp; schedule <span aria-hidden="true">\u203A</span></div></div>`;
  hero.appendChild(corner);
}

// Wire any element carrying data-jump to smooth-scroll to that section id.
function wireJumps(root) {
  root.querySelectorAll("[data-jump]").forEach((el) => {
    if (el.dataset.pilotWired) return;
    el.dataset.pilotWired = "1";
    const go = () => smoothScrollTo(el.dataset.jump);
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

let revealObserver = null;
function setupReveals(app) {
  if (prefersReduced) return;                 // never hide content under reduced motion
  const targets = app.querySelectorAll(".shead, .sec-body");
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
  targets.forEach((t) => { t.classList.add("reveal"); revealObserver.observe(t); });
  // Safety net: guarantee nothing stays hidden even if the observer misbehaves.
  setTimeout(() => targets.forEach((t) => t.classList.add("in")), 1600);
}

// --- Landing hero chrome: home button + a self-contained theme switcher ---
function goHome() {
  const app = document.getElementById("app");
  const landing = document.getElementById("landing");
  const vb = document.getElementById("viewerbar");
  const dab = document.getElementById("dab");
  // Non-destructive: return to the landing hero WITHOUT clearing the saved bracket
  // (unlike "New bracket"/"Clear", which wipe it).
  if (app && !app.hidden) {
    app.hidden = true;
    if (landing) landing.hidden = false;
    if (vb) vb.hidden = true;
    if (dab) dab.hidden = true;
  }
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
}

function wireLandingChrome() {
  const landing = document.getElementById("landing");
  if (!landing || landing.dataset.pilotChrome) return;   // idempotent
  landing.dataset.pilotChrome = "1";

  const home = landing.querySelector("#pilotHome");
  if (home) home.addEventListener("click", goHome);

  // Self-contained theme switcher for the landing. interact.js only wires the
  // dashboard's switcher, and only after a bracket renders — so the landing
  // needs its own. Scoped to the landing's .pilot-modes so it can't collide.
  const modes = landing.querySelector(".pilot-modes");
  if (!modes) return;
  const FUN = { geocities: 1, minecraft: 1, winxp: 1, doodle: 1 };
  const funWrap = modes.querySelector(".fun-wrap");
  const funBtn = modes.querySelector(".fun-btn");
  const closeFun = () => {
    if (funWrap) { funWrap.classList.remove("open"); if (funBtn) funBtn.setAttribute("aria-expanded", "false"); }
  };
  const reflect = (t) => {
    modes.querySelectorAll("button[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === t));
    if (funBtn) funBtn.classList.toggle("on", !!FUN[t]);
  };
  const setTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    reflect(t);
    try { localStorage.setItem("wcb.theme", t); } catch (e) {}
    closeFun();
    if (window.__drawConn) setTimeout(window.__drawConn, 80);
  };
  modes.querySelectorAll("button[data-mode]").forEach((b) =>
    b.addEventListener("click", () => setTheme(b.dataset.mode)));
  if (funBtn) funBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = funWrap.classList.toggle("open");
    funBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e) => { if (funWrap && !funWrap.contains(e.target)) closeFun(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFun(); });

  // Reflect whatever theme main.js already applied from localStorage.
  let cur = "dark";
  try { cur = localStorage.getItem("wcb.theme") || "dark"; } catch (e) {}
  reflect(cur);
}

function decorate() {
  const app = document.getElementById("app");
  if (!app) return;
  const hero = app.querySelector("#intro.hero") || app.querySelector(".hero");
  if (!hero) return;                          // dashboard not rendered yet
  try {
    decorateHero(hero);
    wireJumps(app);
    setupReveals(app);
  } catch (e) {
    console.warn("[pilot-skin] decoration skipped:", e);
  }
}

function start() {
  wireLandingChrome();                        // landing hero: home button + theme switcher
  const app = document.getElementById("app");
  if (app) {
    decorate();                               // covers an already-rendered saved bracket
    // Re-decorate whenever main.js replaces the dashboard (new bracket, demo, etc.).
    new MutationObserver(() => decorate()).observe(app, { childList: true });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
