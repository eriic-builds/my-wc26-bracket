// Golden test: prove the JS render engine matches the Python original section-by-section.
// Run: node tests/golden.mjs   (expects /tmp/py_sections.json dumped from build_dashboard.py)
import fs from "fs";
import * as R from "../docs/js/render.js";

const D0 = new URL("../docs/data/", import.meta.url);
const load = (n) => JSON.parse(fs.readFileSync(new URL(n, D0)));
const picks = load("demo-picks.json"), live = load("results.json"), topo = load("topology.json");
const py = JSON.parse(fs.readFileSync("/tmp/py_sections.json", "utf-8"));

const D = R.computeState(picks, live, topo);
const KO = [["Round of 16", "r16", [89,90,91,92,93,94,95,96].map(n => "M" + n)],
  ["Quarterfinals", "qf", [97,98,99,100].map(n => "M" + n)],
  ["Semifinals", "sf", ["M101", "M102"]], ["Final", "final", ["M104"]]];

const js = {
  bracket_actual: R.buildBracket(D, "actual"), bracket_picked: R.buildBracket(D, "picked"),
  scorecard: R.buildScorecard(D), scorebar: R.buildScorebar(D), kpis: R.buildKpis(D),
  finalfour: R.buildFinalfour(D), story: R.buildStory(D), stages: R.buildStages(D),
  results_panel: R.buildResultsPanel(D), highlights: R.buildHighlights(D), legend: R.buildLegend(),
};
for (const [label, short, codes] of KO) js["round_" + short] = R.buildRoundResultsPanel(D, label, short, codes);

let fails = 0;
for (const k of Object.keys(py)) {
  if (py[k] === js[k]) { console.log("  ok   " + k); continue; }
  fails++;
  // find first divergence
  const a = py[k], b = js[k] || "";
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log("  DIFF " + k + " at char " + i);
  console.log("    py: ..." + JSON.stringify(a.slice(Math.max(0, i - 30), i + 60)));
  console.log("    js: ..." + JSON.stringify(b.slice(Math.max(0, i - 30), i + 60)));
}
console.log(fails ? `\nFAILED: ${fails} section(s) differ` : `\nGOLDEN OK: all ${Object.keys(py).length} sections byte-identical`);
process.exit(fails ? 1 : 0);
