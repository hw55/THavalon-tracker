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
| 2026-10-16 | SDD stays for `game-model`; `capture` and `review` switch to prototype-driven iteration on the phone over local Wi-Fi. Their specs become living notes. | Layout and gestures can't be approved from ASCII mocks. |
| 2026-10-16 | Setup shows ten name fields (we usually play with 10); blank fields are empty seats. | Fewest taps for the common case. |
| 2026-10-16 | Review grid: players as columns, proposals as rows, team shown as a shaded band per row, quest result rows inside the same grid. | Votes, team and result read together in one place. |

## TODO (future)

- Reverse cards (and the rest of the Thavalon role rules: Agravaine declarations, other roles).
- Assassination at game end.
- A way to save / export an entered game (votes etc.), beyond the in-browser autosave.
- Editing a past event in place without undoing everything after it. (Probably not needed.)
- Review: tap a player's initial to highlight their column across all quests.
- Voice / "AI core on Android" integration that listens to the table and understands game state.
- Learning the full Thavalon rulebook.

## Open questions

- Whether the old tracker's saved-game format needs to load in the new app. (Assumed: no.)

## Log

- 2026-10-16: Project set up on GitHub under the hw55 account (`hw55/THavalon-tracker`), public, empty. Local repo linked; nothing pushed yet.
- 2026-10-16: Interview run. User's requirements: (1) portrait mobile UI, (2) tap-to-capture, (3) app makes the mechanical decisions, (4) later: hook up to a mobile AI core, (5) two screens, input and visual history. Intent confirmed.
- 2026-10-16: Old tracker and its CLAUDE.md moved to `archive/`. New CLAUDE.md written. Spec process started: assumptions and capability map proposed and approved. `docs/spec/SPEC-game-model.md` drafted.
- 2026-10-16: All three specs written with ASCII mocks, questions answered, specs approved.
