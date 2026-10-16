# Spec: game-model

Module id: `game-model` (see the capability map in [CLAUDE.md](../../CLAUDE.md)). Status: **approved** (2026-10-16), open questions resolved below.

## Objective

The rules and state of one Thavalon game, with no UI. Given what the players did (who proposed whom, who voted how, how many fail cards came out), it answers every question the screens need: whose turn is it to be king, did the vote pass, is this the hammer, did the quest pass, is the game over. It is the single source of truth for both `capture` and `review`, and later for an AI core that feeds it events instead of taps.

User stories:
- As the person tapping, I never have to work out the next king, the vote result, the hammer or the quest result; the model does.
- As the person tapping, I can undo my last entry when I mis-tap.
- As the app, I can save and reload a game in progress with nothing lost.

## Tech stack

Plain JavaScript (ES2020), one file, no dependencies. Works both in the browser (`<script src="game.js">`) and in Node (`require`), so tests run either way.

## Commands

```
Run tests (terminal):  node tests.js
Run tests (browser):   open tests.html
```

No build, lint or dev server. `node` v26 is on the dev machine.

## Project structure

```
game.js        → this module: the event log, replay, rules tables, validation
tests.js       → assertions against game.js; plain functions, no framework
tests.html     → loads game.js + tests.js and prints the results in the page
index.html     → the screens (capture, review); not part of this module
docs/spec/     → this file and the other module specs
```

## Design

### Event log, replayed

A game is an **ordered list of events**. The model never stores a derived fact; `replay(events)` computes everything from scratch each time. Lists are tiny (a long game is ~30 events), so this costs nothing and makes undo and save trivial.

Event types:

| Event | Fields | Meaning |
|---|---|---|
| `setup` | `players: string[]`, `firstKing: number` | Names in clockwise seating order; index of the first king. Always the first event, exactly once. |
| `propose` | `team: number[]` | The current king proposes this team (player indexes). |
| `vote` | `approvals: number[]` | Player indexes who approved the current proposal. Everyone else rejected. |
| `quest` | `fails: number` | The approved team went on the quest and this many fail cards came out. |

Rules the model enforces when an event is appended (it throws a descriptive error otherwise):
- `setup` comes first and only once; 5–10 unique, non-empty names; `firstKing` in range.
- `propose` only when no proposal is open; team size matches the quest's team size; indexes unique and in range.
- `vote` only when a proposal is open and it is **not** the hammer (5th proposal of a quest); indexes unique and in range.
- `quest` only when a proposal has been approved (by vote or by hammer) and the quest hasn't been resolved; `0 ≤ fails ≤ team size`.
- Nothing after the game is over.

### Derived view

`replay(events)` returns a plain object:

```js
{
  players,                 // string[] in seating order
  phase,                   // "setup" | "propose" | "vote" | "quest" | "over"
  king,                    // index of the current king
  questNumber,             // 1–5, the quest in progress
  proposalNumber,          // 1–5 within the current quest
  isHammer,                // proposalNumber === 5
  teamSize,                // for the current quest
  failsToFail,             // 1, or 2 on quest 4 with 7+ players
  quests: [                // one per quest started, in order
    { number, proposals: [ { king, team, approvals, approved } ], fails, result } // result: "pass" | "fail" | null
  ],
  score: { pass, fail },   // quests passed / failed so far
  winner                   // "good" | "evil" | null
}
```

Rules encoded:
- **King rotation:** king for the *n*-th proposal of the game (counting across quests) is `players[(firstKing + n) % players.length]`.
- **Team sizes** (players → quests 1–5): 5: 2 3 2 3 3 · 6: 2 3 4 3 4 · 7: 2 3 3 4 4 · 8–10: 3 4 4 5 5.
- **Vote:** approved when `approvals.length > players.length / 2`.
- **Hammer:** the 5th proposal of a quest needs no vote; it is approved automatically.
- **Quest result:** `fail` when `fails ≥ failsToFail`, else `pass`.
- **Game over:** three passes → `winner: "good"`; three fails → `winner: "evil"`. (Assassination is a TODO and not modelled; "good" means "good, pending assassination".)

### Public API (`game.js`)

```js
Game.create()                       // → []  (empty log)
Game.append(events, event)          // → new events array; throws on an invalid event
Game.undo(events)                   // → new events array without the last event (no-op on empty)
Game.replay(events)                 // → the derived view above
Game.serialize(events)              // → JSON string
Game.deserialize(json)              // → events array; throws if the log is invalid
Game.TEAM_SIZES                     // the table above, exposed for the UI
```

All functions are pure: they never mutate their input. `append` validates by replaying first, so an invalid event can never enter a log.

## Code style

```js
// game.js — pure functions over an event log. No DOM, no globals except the Game namespace.
const Game = (() => {
  const TEAM_SIZES = { 5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4],
                       8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5] };

  function failsToFail(questNumber, playerCount) {
    return questNumber === 4 && playerCount >= 7 ? 2 : 1;
  }

  function append(events, event) {
    const next = [...events, event];
    replay(next);                         // throws if `event` is illegal in this position
    return next;
  }

  // ...

  return { create, append, undo, replay, serialize, deserialize, TEAM_SIZES };
})();

if (typeof module !== "undefined") module.exports = Game;   // Node; in the browser `Game` is global
```

Conventions: `const` everywhere; double quotes; 2-space indent; small named functions; player references are **indexes** into `players`, never names (names can repeat in spirit, indexes can't); errors are thrown as `Error` with a sentence a person could read on screen.

## Testing strategy

`tests.js` is a list of `test(name, fn)` calls with a tiny `assert`; no framework. It runs under `node tests.js` (exit code 1 on failure) and inside `tests.html`. Every rule above gets at least one test. Must-have cases:

- Setup validation: 4 names rejected, 11 rejected, duplicate rejected, 5 and 10 accepted.
- King rotation wraps around the table and continues across quests.
- Team size for each player count and quest.
- Vote: 3/5 passes, 2/5 fails; 4/8 fails, 5/8 passes (strict majority).
- Hammer: 5th proposal can't be voted on and is auto-approved.
- Quest: 1 fail fails quest 1; on quest 4 with 7 players, 1 fail passes and 2 fails fail; with 6 players 1 fail fails.
- Game over at 3 passes / 3 fails; further events rejected.
- Undo reverses the last event; undo on an empty log is a no-op.
- serialize → deserialize round-trips; deserialize rejects a log with an illegal event.
- Purity: `append` doesn't mutate its input array.

## Boundaries

- **Always:** keep `game.js` free of DOM and browser APIs; run `node tests.js` before committing; add a test when adding or changing a rule.
- **Ask first:** changing the event shapes once `capture` depends on them; adding Thavalon role rules; adding any dependency.
- **Never:** store derived state in the log; let the UI compute a rule the model could compute.

## Success criteria

- `node tests.js` passes with every must-have case present.
- A full 5-player game and a full 7-player game can be driven entirely through `Game.append` from setup to `winner`, in a test.
- `replay` of a 30-event log takes well under a millisecond (no need to measure unless it's visibly slow).
- `capture` and `review` can be written without reading `game.js` internals: the derived view and the API above are enough.

## Resolved questions (2026-10-16)

1. **Undo depth:** unlimited in the model. The UI decides how much to expose.
2. **Editing history:** undo-only. Editing a past event without undoing everything after it is on the TODO list, expected not to be needed.
3. **Vote entry:** the model just records approvals. The UI offers quick presets (all approve, all reject, team approves only) that are then adjusted by tapping individuals; see `SPEC-capture.md`.
