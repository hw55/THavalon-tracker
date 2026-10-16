# Spec: review

Module id: `review` (see the capability map in [CLAUDE.md](../../CLAUDE.md)). Depends on `game-model`. Status: **approved** (2026-10-16), open questions resolved below.

## Objective

The history screen. Shows the whole game so far in one portrait view so a player can answer "what happened?" and "who voted how?" at a glance, without scrolling through tables. Read-only: nothing here changes the game.

User stories:
- As a player, I see the quest score and which quest we're on in the first glance.
- As a player, I can see for every proposal who was king, who was on the team, and who approved, as one grid, so voting patterns stand out.
- As a player, I can flip back to capture with one tap.

## Screen structure

```
┌──────────────────────────────────┐
│ Thavalon                         │  ← same top bar as capture (no Undo here)
├──────────────────────────────────┤
│  Q1   Q2   Q3   Q4   Q5          │  ← score strip
│  ✓    ✗    ●    ○    ○    2–1    │     ✓ pass  ✗ fail  ● current  ○ not yet
├──────────────────────────────────┤
│        A  B  C  D  E  F  G       │  ← vote grid: one column per player (initials),
│ Q1 P1  ✓  ✓👑 ✗  ✓  ✗  ✓  ✓   ⇧  │     one row per proposal, in order
│ Q1 P2  ✗  ✓  ✓👑 ✓  ✗  ✗  ✓   ⇩  │
│ Q2 P1  ✓  ✓  ✓  ✓👑 ✓  ✓  ✓   ⇧  │
│ Q3 P1  ·  ·  ·  ·  👑 ·  ·   …  │  ← proposal in progress: dots
├──────────────────────────────────┤
│   [ Capture ]      [ Review ]    │
└──────────────────────────────────┘
```

### Score strip

One cell per quest, 1–5: ✓ passed (green), ✗ failed (red), ● in progress, ○ not started. The running score `passes–fails` sits at the end. Quest 4 at 7+ players gets a small "2 fails" note under its cell.

### Vote grid

- Columns: players in seating order, shown by initial (first letter, or first two if two players share one). A legend row of full names sits above the grid when it fits; otherwise the names are listed once under the score strip.
- Rows: every proposal so far, labelled `Q<n> P<m>`. The current, unfinished proposal is the last row, drawn with dots.
- Cells: ✓ approved (green) / ✗ rejected (red). **Team members' cells are shaded with a clearly visible fill** (not a faint tint), so the team for every proposal reads as a band across the row, and "approved but not on team" / "rejected but on team" stand out without any extra mark. The king's cell carries 👑. On a hammer row the team cells are shaded with no ✓/✗.
- Row result at the right edge: ⇧ vote passed, ⇩ vote rejected, 🔨 hammer (no vote). When a quest was played, its proposal row is followed by a full-width result row inside the grid: `Quest 2 · team Bob Cal Eve · 1 fail · FAILED`, coloured like the score strip. Votes, team and result are read together in one place; there is no separate per-quest list.
- A new quest starts with a thin separator line.

Grid sizing: with 10 players, 10 columns of 28–30 px plus a 44 px row label fits 360 px. Rows are 32 px; a long game (~25 proposals) scrolls vertically inside the grid area while the score strip and tabs stay fixed.

### Empty states

- Before setup: `Start a game on the Capture tab.`
- After setup, no proposals yet: score strip (all ○) plus `Waiting for Bob's first proposal.`

## Tech stack and structure

Same `index.html` as capture; rendered by one function from `Game.replay(events)`; re-rendered whenever capture commits a change (same `render()` call) and when the tab is shown.

## Code style

```js
function renderReview(view) {
  scoreStrip.replaceChildren(...view.quests.map(questCell), scoreLabel(view.score));
  grid.replaceChildren(headerRow(view.players), ...view.quests.flatMap(questRows));
}

function voteCell(player, proposal) {
  const cell = el("td", proposal.approvals.includes(player) ? "✓" : "✗");
  cell.classList.toggle("team", proposal.team.includes(player));
  cell.classList.toggle("king", proposal.king === player);
  return cell;
}
```

Same conventions as capture: DOM built with `createElement`/`textContent`; colours as CSS custom properties; no state outside the event log.

## Testing strategy

- Hand-checked with the same `walkthrough-capture.md` games: after each step, flip to Review and compare with the expected grid written in the walkthrough.
- Specific checks: 10-player grid fits 360 px; a 25-row game scrolls without the tabs moving; initials are unique; the in-progress row shows dots; a hammer row shows 🔨 and no votes.

## Boundaries

- **Always:** render from `Game.replay` only; keep the grid readable at 360 px; keep this screen read-only.
- **Ask first:** adding charts, per-player analysis, or anything beyond the grid; adding a dependency.
- **Never:** mutate the event log from this screen; duplicate rule logic.

## Success criteria

- From a full 7-player game, a player can state the score, the current quest, and every player's vote on any proposal without leaving the screen.
- Team membership and dissenting votes are visible from shading alone.
- Fits portrait at 360 px wide with no horizontal scroll, for 5 to 10 players.

## Resolved questions (2026-10-16)

1. **Grid orientation:** players as columns, proposals as rows. Team membership must be visible per proposal in the grid (the shaded band).
2. **Highlighting a player's column:** skipped for now; on the TODO list.
3. **Quest results:** rows inside the same grid, so votes, team and result are seen together.
