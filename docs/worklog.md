# Worklog — mobile Thavalon tracker

History of the project: what was decided, when, and why; what's deferred; what's still open; what work was done. The requirements and design themselves live in [CLAUDE.md](../CLAUDE.md).

## Status

- 2026-10-16: Requirements confirmed. Capability map and design assumptions approved. `SPEC-game-model.md` drafted, awaiting review.
- Next: approve game-model spec → `capture` and `review` specs with mocks → plan → build.

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

## TODO (future)

- Reverse cards (and the rest of the Thavalon role rules: Agravaine declarations, other roles).
- Assassination at game end.
- A way to save / export an entered game (votes etc.), beyond the in-browser autosave.
- Voice / "AI core on Android" integration that listens to the table and understands game state.
- Learning the full Thavalon rulebook.

## Open questions

- What the history screen must show at minimum (per-player vote grid? quest timeline? both?). To settle during the `review` spec with mocks.
- Whether the old tracker's saved-game format needs to load in the new app. (Assumed: no.)

## Log

- 2026-10-16: Project set up on GitHub under the hw55 account (`hw55/THavalon-tracker`), public, empty. Local repo linked; nothing pushed yet.
- 2026-10-16: Interview run. User's requirements: (1) portrait mobile UI, (2) tap-to-capture, (3) app makes the mechanical decisions, (4) later: hook up to a mobile AI core, (5) two screens, input and visual history. Intent confirmed.
- 2026-10-16: Old tracker and its CLAUDE.md moved to `archive/`. New CLAUDE.md written. Spec process started: assumptions and capability map proposed and approved. `docs/spec/SPEC-game-model.md` drafted.
