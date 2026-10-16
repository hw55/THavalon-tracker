# Mobile Thavalon tracker — intent, decisions, open questions

Living record of what we're building and why. Update it when a decision changes.

## Status

- 2026-10-16: Intent confirmed by the user. Spec in progress.
- Next: spec (spec-driven development) → mocks → build.

## Intent (confirmed 2026-10-16)

- **Outcome:** A new, phone-first Thavalon tracker: vote/team/quest data entered by taps, with a second screen that shows what has happened so far at a glance.
- **User:** Any individual player, on their own phone (Android or iPhone, portrait), tracking the game for themselves. Use is optional: players can take their own notes or track nothing. No collaboration or sharing between phones.
- **Why now:** The old tracker (now in `archive/`) is desktop-shaped and does no thinking: every outcome is typed in by hand.
- **Success:** A full game can be tracked with only taps, the app works out the mechanical outcomes itself, and the history screen makes the game readable without scrolling through tables.
- **Constraint:** Runs in a mobile browser; no install, no backend.
- **Out of scope (for now):** Thavalon role rules, voice/AI-core integration, multi-device sync.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-10-16 | Start from a clean slate. The old `archive/Thavalon-tracker.html` is reference only; nothing in the new app depends on it. | Old code is desktop-shaped, DOM-as-state, and hand-entered outcomes. |
| 2026-10-16 | Portrait mobile is the primary target (Android and iPhone browsers). | That's where it's used, at the table. |
| 2026-10-16 | Data entry is tap-only. No typing after player setup. | Speed at the table. |
| 2026-10-16 | The app computes mechanical outcomes: next king from seating order, vote pass/fail, who is hammer, quest pass/fail from fail-card count (incl. the quest-4 two-fail rule at 7+ players). | Less to think about mid-game; fewer entry mistakes. |
| 2026-10-16 | Rules stay Avalon-simple for now: team sizes, majority vote, 5-proposal hammer, fail-card counts. No role logic yet. | Get the UI right first; rules depth comes later. |
| 2026-10-16 | Our group plays a modified Thavalon with **no Nimue, Guinevere or Maeve**. | Governs which role rules matter when we do add them. |
| 2026-10-16 | Two-screen model: an input screen and a visual "what happened" screen, easy to flip between. | Entering and reading are different jobs. |
| 2026-10-16 | Process: spec-driven development, with mocks before building. | User's choice. |
| 2026-10-16 | The tracker is a personal tool: each player runs their own copy, optionally. No collaboration. | Keeps it simple; a player's notes are their own. |
| 2026-10-16 | CLAUDE.md rewritten for the new project; the old tracker is reference only. | Fresh start. |
| 2026-10-16 | Single HTML file with no build step is the default, not a hard rule (see CLAUDE.md). | Easy to share; revisit if it gets in the way. |

## Deferred (explicitly later)

- Thavalon-specific rules: Reverse cards, Agravaine declarations, assassination, other roles.
- Voice / "AI core on Android" integration that listens to the table and understands game state.
- Learning the full Thavalon rulebook.

## Open questions

- Seating order: how is it captured at setup, and does the king rotate strictly clockwise from a chosen starter?
- What the history screen must show at minimum (per-player vote grid? quest timeline? both?).
- Whether the old tracker's saved-game format needs to load in the new app. (Assumed: no.)

## Log

- 2026-10-16: Project set up on GitHub under the hw55 account (`hw55/THavalon-tracker`). CLAUDE.md written for the old tracker; it will need rewriting once the new app exists.
- 2026-10-16: Interview started. User's requirements: (1) portrait mobile UI, (2) tap-to-capture, (3) app makes the mechanical decisions, (4) later: hook up to a mobile AI core, (5) two screens, input and visual history.
