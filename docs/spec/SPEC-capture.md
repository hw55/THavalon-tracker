# Spec: capture

Module id: `capture` (see the capability map in [CLAUDE.md](../../CLAUDE.md)). Depends on `game-model`. Status: **approved** (2026-10-16), open questions resolved below.

## Objective

The input screen. One player, one phone, portrait. Every game action after setup is a tap; the screen always shows exactly one thing to do next, decided by the model's `phase`. The player should never have to think about whose turn it is, how big the team is, or whether a vote passed.

User stories:
- As a player, after typing names once, I track the whole game by tapping names and buttons.
- As a player, I see who the king is and how big the team must be before I tap anything.
- As a player, entering a vote takes one tap for the common cases (everyone approved, everyone rejected, only the team approved) and one more tap per exception.
- As a player, when I mis-tap I press Undo and I'm back where I was.
- As a player, if the browser reloads mid-game, the game is still there.

## Screen structure

```
┌──────────────────────────────────┐
│ Thavalon                   Undo  │  ← top bar: title, Undo (disabled when nothing to undo)
├──────────────────────────────────┤
│ Q2 · Proposal 3/5        Team 3  │  ← context strip (hidden during setup)
│ King: Bob 👑                     │
├──────────────────────────────────┤
│                                  │
│          phase panel             │  ← changes with model.phase (below)
│                                  │
├──────────────────────────────────┤
│   [ Capture ]      [ Review ]    │  ← bottom tabs; also swipe left/right
└──────────────────────────────────┘
```

The bottom tabs flip between this screen and `review`; the current tab is highlighted. Flipping is tabs only: horizontal swipe is reserved for cycling vote presets (see `vote`).

## Phase panels

Player names appear as **chips** in seating order, wrapping into rows. The king's chip shows 👑. Chips are at least 44 px tall (thumb-sized).

### `setup`

```
│ Players (clockwise, 5–10)        │
│ ┌──────────────┐ ┌──────────────┐│
│ │ Ann          │ │ Bob          ││
│ └──────────────┘ └──────────────┘│
│ ┌──────────────┐ ┌──────────────┐│
│ │ Cal          │ │              ││
│ └──────────────┘ └──────────────┘│
│ …                                │
│ First king: tap a name above     │
│         [ Start game ]           │
```

- Ten text fields, two per row (we usually play with 10). Names are trimmed; a blank field is an empty seat and is skipped; order is the order of the fields. No add/remove buttons: leaving a field blank is the way to play with fewer.
- Tapping a filled name marks it as first king (👑). Start is enabled when 5–10 names are present, all unique, and a first king is chosen.
- Validation messages come from `game-model` errors, shown in one line under the button.

### `propose`

```
│ Pick the team: 2 / 3 chosen      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│ │ Ann │ │ Bob👑│ │ Cal │ │ Dee │  │
│ └─────┘ └─────┘ └─────┘ └─────┘  │
│ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │ Eve │ │ Fay │ │ Gus │          │
│ └─────┘ └─────┘ └─────┘          │
│         [ Propose team ]         │
```

- Tapping a chip toggles it in/out of the team. Chosen chips are filled; others outlined. When the team is full, unchosen chips are dimmed but still tappable (tapping one when full does nothing).
- Propose is enabled only when exactly `teamSize` chips are chosen.
- On proposal 5 the context strip says `Proposal 5/5 · HAMMER`, and Propose reads `Send team (no vote)`: it appends `propose` and the model auto-approves, so the next phase is `quest`.

### `vote`

```
│ Votes on Bob's team: Bob Cal Eve │
│ [All approve] [All reject] [Team]│  ← presets
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│ │✓Ann │ │✓Bob👑│ │✓Cal│ │✗Dee │  │
│ └─────┘ └─────┘ └─────┘ └─────┘  │
│ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │✓Eve │ │✗Fay │ │✗Gus │          │
│ └─────┘ └─────┘ └─────┘          │
│ 4 approve · 3 reject → PASSES    │
│         [ Record vote ]          │
```

- Each chip is a two-state toggle: approve (green, ✓) / reject (red, ✗). Team members' chips carry a small team marker so on/off-team is visible at a glance.
- Presets set every chip at once, in this order: **All reject** → **Team** (team members approve, everyone else rejects) → **All approve**. Default on entering the phase: **All reject**. Tapping a preset button applies it; **swiping horizontally on the chip area cycles to the next preset** in that order (and back the other way), so the common patterns are a swipe away and the exceptions one tap each.
- A swipe never records anything; only Record vote does.
- The tally line updates live and names the outcome using the model's majority rule.
- Record vote appends `vote` with the approving indexes.

### `quest`

```
│ Bob's team went: Bob Cal Eve     │
│ Fail cards?                      │
│   ┌───┐  ┌───┐  ┌───┐  ┌───┐     │
│   │ 0 │  │ 1 │  │ 2 │  │ 3 │     │
│   └───┘  └───┘  └───┘  └───┘     │
│ 1 fail → quest FAILS             │
│         [ Record quest ]         │
```

- One button per possible count, 0…`teamSize`. Tapping selects; the result line shows what the model will decide (`failsToFail` applied, so quest 4 at 7+ says "1 fail → quest passes").
- Record quest appends `quest`.

### `over`

```
│        GOOD wins  3 – 1          │
│   (assassination not tracked)    │
│         [ New game ]             │
```

- New game asks for confirmation, clears the saved log, returns to `setup`.
- Review stays available so the finished game can be read.

## Persistence

After every successful `append` or `undo`, the event log is written to `localStorage` under one key (`thavalon.game`). On load, if a log exists and `Game.deserialize` accepts it, the app resumes in whatever phase the model reports; otherwise it starts at `setup`. A corrupt log is discarded, not fatal.

## Tech stack and structure

Plain HTML/CSS/JS in `index.html`; `game.js` is loaded with `<script src>`. No framework, no build. `index.html` also hosts the `review` screen; the two share the top bar and bottom tabs.

```
index.html     → markup, styles, and the app script (capture + review + tab switching)
game.js        → the model (not touched by this module)
```

## Code style

One render function reads the model's view and rebuilds the phase panel; event handlers append an event, save, and re-render. State lives in the event log only.

```js
let events = load() ?? Game.create();

function commit(next) {            // every handler funnels through here
  events = next;
  save(events);
  render();
}

function render() {
  const view = Game.replay(events);
  renderContext(view);
  panel.replaceChildren(PANELS[view.phase](view));   // one builder per phase
  undoButton.disabled = events.length === 0;
}

proposeButton.onclick = () => commit(Game.append(events, { type: "propose", team: [...chosen] }));
```

Conventions: build DOM with `document.createElement` and `textContent` (never `innerHTML` with player names); CSS custom properties for colours; chips are `<button>` elements with `aria-pressed`; all tap targets ≥ 44 px; the layout uses `100dvh` so the bottom tabs sit above the browser chrome on iOS.

## Testing strategy

- `game-model` rules are already covered by `node tests.js`; capture does not re-test them.
- Capture is checked by hand on a phone (or a desktop browser in portrait device mode) with a scripted walkthrough kept in `docs/spec/walkthrough-capture.md`: a 5-player game and a 7-player game, each covering setup, a rejected vote, a hammer, a quest-4 two-fail case, undo, reload mid-game, and game over.
- Any pure helper that grows in `index.html` (e.g. building the preset approvals) moves to `game.js` or a small `ui.js` and gets a test.

## Boundaries

- **Always:** derive every label and decision from `Game.replay`; keep tap targets ≥ 44 px; save after every change; test the walkthrough on a real phone before calling a change done.
- **Ask first:** adding any dependency (the preset swipe is hand-written from touch events); changing the event shapes; adding a third screen.
- **Never:** store game state in the DOM; compute a rule in the UI; use typing after setup.

## Success criteria

- A full game can be entered on a phone with taps only, following the walkthrough, without reading instructions.
- The three vote presets cover the common cases; adjusting an exception is one tap on that player.
- Undo returns the screen to the previous state, including the previous phase.
- Reloading the page mid-game shows the same phase and data.
- Everything fits in portrait on a 360 × 640 px screen with no horizontal scroll; 10 players fit on the propose and vote panels without scrolling past the Record button.

## Resolved questions (2026-10-16)

1. **Setup:** ten fixed fields; a blank field is an empty seat. No add/remove controls.
2. **Vote default preset:** All reject.
3. **Swipe:** used to cycle vote presets (All reject → Team → All approve), not to flip screens. Screens flip by tabs only.
