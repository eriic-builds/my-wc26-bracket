# PLAN-full-match-dialog — native dialog with complete validated facts, keyboard/touch entry

> **GATE: Brief 2 starts only after explicit map approval (Brief 1 complete).**

## Rank and leverage

**Rank 4 of 6 (Brief 2).** The dialog is the accessibility backbone of the feature:
keyboard and touch users get their equivalent access path here (hover is
pointer-only), and Plan 5's portrait loads *into* this dialog. Small, contained, and
on the app's existing native-`<dialog>` pattern.

## Goal and user-visible outcome

Click, Enter, Space, or tap on a completed Actual-path match card opens a native
dialog: match title, round, final score, all validated FIFA fact sections (full
event lists — the compact card truncates, this doesn't), close button, source label.
Escape and backdrop close it; focus returns to the originating card. Bounded height
with vertical scrolling; never horizontal overflow.

## In scope

- One `<dialog id="matchdlg">` in `docs/index.html` (patterned on the existing
  `#sharedlg` markup/CSS conventions).
- Activation wiring in `docs/js/match-details.js` (the seam Plan 3 left):
  `click` on card (not on a team-row's future interactive children), `keydown`
  Enter/Space when the card itself has focus, `pointerup` with `pointerType:
  "touch"` (tap opens the dialog directly — no hover emulation).
- Dialog content built with `createElement`/`textContent` from the match record;
  full goals/cards lists; penalty/ET note; venue/attendance/referee; "Source: FIFA".
- Focus management: remember the invoking card; `dialog.close()` → `card.focus()`.
- Backdrop-click close following `#sharedlg`'s convention (verify how sharedlg
  handles it and mirror; if sharedlg has no backdrop-close, add the standard
  `click on dialog where target === dialog → close()` pattern to **both**? No —
  touch only `#matchdlg`; leave sharedlg as-is and match its observed behavior.
  If sharedlg lacks backdrop close, the app convention is "no backdrop close";
  follow the convention: Escape + ✕ button only. **Executor: check
  `#sharedlg`/`main.js` first and mirror what exists.**)
- Portrait placeholders: an inert, clearly-marked container
  `<div class="mdlg-portrait" hidden></div>` + a `<p class="mdlg-portrait-note">`
  slot — Plan 5 owns filling them; this plan ships them empty.
- CSS marked block: `#matchdlg` sizing (`max-width:min(94vw,560px)`,
  `max-height:85vh`, internal `overflow-y:auto`, `overflow-x:hidden`), section
  styles, visible focus rings.

## Out of scope

- Any iframe/external request/portrait logic, the disclosure, the 500ms timer
  (Plan 5).
- My picks (no activation there — cards lack `data-played`/tabindex by contract).
- render.js/interact.js edits (none needed; stop and report if that assumption
  breaks).

## Verified current architecture

- `docs/index.html` already has a native `<dialog id="sharedlg">` with
  `showModal()` usage and fallback in `main.js:100` (`typeof dlg.showModal !==
  "function"` guard) — reuse both patterns.
- Plan 3 delivers `initMatchDetails` with delegated events and an AbortController;
  activation handlers register through the same controller.
- Completed Actual cards are focusable (`tabindex="0"` from Brief 1) and My picks
  cards are not — the activation filter is the same
  `closest('.mcard[data-played="true"]')` + actual-view check as Plan 3.
- Team rows inside cards also have `tabindex="0"` (legacy) — Enter/Space must act
  only when `event.target` **is the card** (or a non-interactive descendant via
  click), not when a team row has focus (team rows keep their hover/stat
  semantics).

## Exact files

| File | Action |
| --- | --- |
| `docs/index.html` | modify — add `#matchdlg` markup after `#sharedlg` |
| `docs/js/match-details.js` | modify — activation handlers + `openMatchDialog(record, card)` + focus return |
| `docs/css/dashboard.css` | modify — `#matchdlg` marked block |
| `tests/match-details.mjs` | modify — extend pure-formatter tests for the full (untruncated) section builder |

## Dependencies and parallelism

- Depends on: Brief 2 Plans 1 and 3. May run in parallel with Plan 2 (pipeline).
- Blocks: Plan 5 (portrait fills this dialog).

## Implementation order

1. Markup + CSS shell; open it manually from console with a stub record.
   **Checkpoint:** 320–1440 widths: no horizontal overflow; long content scrolls
   vertically inside; Escape closes; focus ring visible on the ✕ button.
2. Wire activation (click / Enter / Space / touch tap) through the Plan 3
   controller; ignore upcoming cards, picked view, and team-row-focused Enter.
   **Checkpoint (served):** each input path opens M97 with full facts; focus
   returns to the M97 card on close (verify with `document.activeElement`).
3. Content builder: full sections, omission rules, source label.
   **Checkpoint:** a `partial` record renders only its available sections; a
   record with 6+ goals lists all of them here while the compact card truncates.
4. Interplay with the compact card: opening the dialog hides the factcard; while
   the dialog is open, hover does not spawn factcards; closing restores normal
   hover. View switch while open → dialog closes and focus goes to the view
   toggle button (the brief's rule).
5. Extend `tests/match-details.mjs`; full sweep.

## Data contracts and invariants

- Dialog content is DOM + `textContent` only; no HTML string interpolation of feed
  data.
- Exactly one `#matchdlg` in the document; reused across matches (content
  replaced, not re-created).
- Keyboard/touch/click give equivalent access to everything hover gives (and
  more — full lists).
- No external request from anything in this plan.

## Edge cases and codebase traps

- **Space scrolls the page by default** — `preventDefault()` only when handling
  Space on a card, never globally.
- `showModal()` needs the guard fallback (mirror `openShareDialog`); without
  `<dialog>` support, fall back to… nothing fancy: skip dialog behavior (compact
  card still works) — matching the app's graceful-degradation style.
- Focus return breaks if the bracket re-rendered while the dialog was open (score
  sync doesn't re-render, but "New bracket" flows can) — guard
  `if (document.contains(card)) card.focus()`.
- iOS tap also fires click — dedupe by handling `click` for mouse/keyboard-
  synthesized activation and ignoring `pointerup` unless `pointerType === "touch"`
  *and* debouncing the follow-up click (a `justOpened` flag or checking
  `dlg.open`).
- `aria-labelledby` the dialog title; `aria-label` on ✕; keep heading order sane
  (one `<h3>` like sharedlg).

## Read-only production-delta note

Production index.html has additional dialogs/hosts from the compare layer; ids may
collide (`#matchdlg` is free today — re-verify at port time). Record only.

## Automated checks (exact commands)

```
node --check docs/js/match-details.js
node tests/match-details.mjs
node tests/map-frozen.mjs && node tests/matchcards.mjs && node tests/scoring.mjs && node tests/builder.mjs && node tests/share.mjs && node tests/parse.mjs
```

## Manual acceptance criteria

- Open/close via every input path with correct focus return; Escape and ✕ always
  work; backdrop behavior matches the app convention found in `#sharedlg`.
- Penalty result (M74), regular result, partial record, long-name teams
  (Bosnia & Herz.) all render correctly with no sideways scroll at 320px.
- My picks and upcoming cards never open it.
- Dark/light/easy/one fun theme all legible.

## Handoff checklist and stop condition

- [ ] Dialog complete with inert portrait slots for Plan 5.
- [ ] All four input paths + focus return verified.
- [ ] Formatter tests green; suites green; no external requests anywhere.

**Stop** after the checklist. The portrait shell is PLAN-portrait-shell.md.
