# Worklog — mobile Thavalon tracker

History of the project: what was decided, when, and why; what's deferred; what's still open; what work was done. The requirements and design themselves live in [CLAUDE.md](../CLAUDE.md).

## Status

- 2026-10-16: All three specs approved. Process changed for the screens (see decisions): prototype-driven from here.
- Next: build `game-model` test-first → rough `index.html` → iterate on the phone over local Wi-Fi.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-10-16 | Start from a clean slate. `archive/Thavalon-tracker.html` is reference only; nothing new depends on it. | Old code is desktop-shaped, DOM-as-state, and hand-entered outcomes. |
| 2026-10-16 | Portrait mobile is the primary target (Android and iPhone browsers). | That's where it's used, at the table. |
| 2026-10-16 | Data entry is tap-only after player setup. | Speed at the table. |
| 2026-10-16 | The app computes mechanical outcomes (next king, vote result, hammer, quest result). | Less to think about mid-game; fewer entry mistakes. |
| 2026-10-16 | Rules stay Avalon-simple for now; no role logic. | Get the UI right first; rules depth comes later. |
| 2026-10-16 | Our group plays a modified Thavalon with no Nimue, Guinevere or Maeve. | Governs which role rules matter when we add them. |
| 2026-10-16 | Two-screen model: input screen and visual history screen, easy to flip. | Entering and reading are different jobs. |
| 2026-10-16 | Personal tool: each player runs their own copy, optionally. No collaboration. | Keeps it simple; a player's notes are their own. |
| 2026-10-16 | Process: spec-driven development, with mocks before building. | User's choice. |
| 2026-10-16 | CLAUDE.md = requirements and design; this worklog = history. The old tracker's CLAUDE.md moved to `archive/`. | The two files were overlapping. |
| 2026-10-16 | Single HTML file with no build step is a preference, not a hard rule. | Easy to share; revisit if it gets in the way. |
| 2026-10-16 | Capability map (`game-model` → `capture` → `review`) and all working assumptions in CLAUDE.md approved, incl. GitHub Pages hosting and the `index.html` / `game.js` / `tests.*` layout. | Pure model is testable without clicking and gives the future AI-core integration a clean target. |
| 2026-10-16 | Game state is an append-only event log; everything else is derived by replaying it. | Undo is "drop the last event"; save/export is "the log"; an AI core can feed the same events taps do. |
| 2026-10-16 | Undo is unlimited in the model. Correcting history is undo-only (no editing a past event in place). | Simple and sufficient; in-place edit is a TODO we probably won't need. |
| 2026-10-16 | Vote entry uses presets, then individual taps to adjust. Order and default: **All reject** (default) → Team approves → All approve; a horizontal swipe on the chips cycles through them. | Fast at the table; most votes are close to one of the presets. |
| 2026-10-16 | ~~Screens flip by bottom tabs only; swipe is reserved for vote presets.~~ Reversed the same day: **swipe flips screens**; vote presets start as buttons and the gesture is decided in the prototype. | Preset cycling is a rotation (approve → reject again), and flipping is the more natural use of a swipe. Needs to be felt, not read. |
| 2026-10-16 | Review grid votes: 🟢 approve / 🔴 reject; votes against expectation get their own icon: 🐸 off-approve (approved a team they're not on), 🍎 on-reject (rejected their own team). | Colour reads fastest; the odd votes are what players look for. Chosen from a mock of candidates; 🐍 was tried first, then swapped for 🐸. |
| 2026-10-16 | Save/load games as files: 💾 writes the event log as JSON (share sheet where supported, else download); 📂 loads one after the model validates it. | Done (was a TODO). The log is already the save format, so no new code in `game.js`. |
| 2026-10-16 | Rogue cards (🎭): part of the team's cards; one flips the result (after the quest-4 two-fail rule), two cancel out; at most 2. Captured with a `🎭 0/1/2` counter set apart below the result rows (design A2 from a mock), above Record; team names centred below Record. | Rules confirmed by the user. Rogues are rare, so the common quest stays one tap and the counter stays out of the way. |
| 2026-10-16 | Agravaine (👹): a `quest` event may name the team member who came out as Agravaine; the quest then fails whatever the cards and rogues said. Card counts are unchanged. | User's rule. Recording *who* (not just yes/no) costs nothing and lets the review grid mark that player later. |
| 2026-10-16 | GitHub Pages turned on: https://hw55.github.io/THavalon-tracker/ serves `main` from the repo root. | So every player can open it from a link; HTTPS also lets 💾 Save use the phone's share sheet. Pushing to `main` now publishes. |
| 2026-10-16 | SDD stays for `game-model`; `capture` and `review` switch to prototype-driven iteration on the phone over local Wi-Fi. Their specs become living notes. | Layout and gestures can't be approved from ASCII mocks. |
| 2026-10-16 | Setup shows ten name fields (we usually play with 10); blank fields are empty seats. | Fewest taps for the common case. |
| 2026-10-16 | Review grid: players as columns, proposals as rows, team shown as a shaded band per row, quest result rows inside the same grid. | Votes, team and result read together in one place. |

## Before completion (in order, one at a time)

1. ~~**Header icons:** reorder to 🔄 refresh · 📂 load · 💾 save · new game · undo, with new, clearer icons for new game and undo.~~ Done 2026-10-16: 🎲 📂 💾 ⏪, and the phone's back button is undo. 🔄 was removed (the browser's own refresh does the same) and new game moved to the front.
2. **Players from the Thavalon server:** load the player list for a game from the Thavalon server, then edit names and move players up/down in the list (which moves them around the circle).
   Depends on [feyweb/THavalon#19](https://github.com/feyweb/THavalon/issues/19) ("Have a way to export the player list to other servers": query the server with the game label, get the participants as JSON). That issue is **still open** as of 2026-10-16, so the server side doesn't exist yet. The edit/reorder half can be built now.
3. ~~**Rogue fails:** up to two per quest (one each for Lancelot and Maelagant), recorded separately from ordinary fail cards.~~ Done 2026-10-16: 🎭 cards in the model (spec + tests) and on the quest and review screens.
4. ~~**Agravaine fails (👹):** Agravaine declares and fails the mission regardless of the fail-card count.~~ Done 2026-10-16: model (spec + tests, `quest.agravaine` = the team member who came out); quest screen: tap a team name below Record to mark 👹 (all rows turn red, and each row draws one ❌ as 👹 so the other cards can be recorded); the revealed Agravaine keeps a 👹 on their seat in the circle and on their review column header; review result rows draw Agravaine's card as 👹.

## TODO (future)

- Reverse cards (and the rest of the Thavalon role rules: Agravaine declarations, other roles).
- Assassination at game end.
- Editing a past event in place without undoing everything after it. (Probably not needed.)
- Review: tap a player's initial to highlight their column across all quests.
- Propose: replace the "2 / 3" counter with visual shield tokens to hand out.
- Review: let the user choose the off-approve icon (🐸 by default; e.g. 🐍 snake or 🍀 clover).
- Review score strip: bring back a marker on quest 4 when it needs two fails (removed 2026-10-16: two red ❌ read as two failed quests).
- Voice / "AI core on Android" integration that listens to the table and understands game state.
- Learning the full Thavalon rulebook.

## Where things live

- `docs/prompts.md` is local only (git-ignored, never pushed). On 2026-10-16 the 30 unpushed commits were rewritten to drop it (and, briefly, this worklog) before pushing; minutes later the worklog was put back under git. Its edits between 13:49 and 17:35 are therefore not in git history, only in the local branch `backup-before-scrub`.
- Since 2026-10-16 17:26 the repo is the folder `2026-10 Thavalon/THavalon-tracker/` (same name as the GitHub repo). The outer `2026-10 Thavalon/` folder only holds `.remember/` (memory-plugin state, not part of the repo).

## Open questions

- Whether the old tracker's saved-game format needs to load in the new app. (Assumed: no.)

## Log

- 2026-10-16: Project set up on GitHub under the hw55 account (`hw55/THavalon-tracker`), public, empty. Local repo linked; nothing pushed yet.
- 2026-10-16: Interview run. User's requirements: (1) portrait mobile UI, (2) tap-to-capture, (3) app makes the mechanical decisions, (4) later: hook up to a mobile AI core, (5) two screens, input and visual history. Intent confirmed.
- 2026-10-16: Old tracker and its CLAUDE.md moved to `archive/`. New CLAUDE.md written. Spec process started: assumptions and capability map proposed and approved. `docs/spec/SPEC-game-model.md` drafted.
- 2026-10-16: All three specs written with ASCII mocks, questions answered, specs approved.
