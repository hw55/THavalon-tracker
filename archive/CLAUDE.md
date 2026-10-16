# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A match tracker for **Thavalon** (a variant of the social-deduction game *The Resistance: Avalon*). It records each quest's proposed teams, team leaders, approve/reject votes, and quest results for a table of 5–10 players.

The whole app is one file, [Thavalon-tracker.html](Thavalon-tracker.html): markup, a `<style>` block, and a single IIFE `<script>`. There is no build step, package manager, linter, test suite, or git repo.

## Running

Open the file directly in a browser (`open Thavalon-tracker.html`). You need a network connection because styling comes from CDNs:
- Tailwind via the Play CDN (`cdn.tailwindcss.com`), so utility classes compile at runtime in the browser. Classes built dynamically in JS work as long as the full class string appears somewhere.
- DaisyUI 4.12.14 component classes (`btn`, `badge`, `select`, `card`, …), with the theme fixed through `data-theme="dark"` on `<html>`.

To test by hand: lock in 5+ names, then click through votes and teams and reload the page to check that the state is restored. The "Start New Match" button clears saved state.

## Boundaries

- **Default to keeping the app as one HTML file with no build step.** This is a preference, not a hard rule. If splitting files or compiling before sharing would clearly work better (for example, if the script grows past what one file can comfortably hold), propose it to the user with the trade-offs and wait for approval instead of doing it unasked. Whatever the setup, the version that gets shared must still work when opened from disk or sent as one attachment.

## Architecture

**The DOM is the source of truth; nothing holds the state in memory.** The only JS-level state is `players` (a sorted array of names). Everything else lives in DOM elements and `data-*` attributes (`data-approved="0|1"`, `data-player`, `data-player-index`, `data-quest`, `data-round`), plus closure variables such as the per-row `selected` Set.

**Persistence:** `saveState()` reads the current DOM and writes this JSON to `localStorage["thavalon-tracker-state"]`:
```
{ players, roundCounts: [n per quest], questStatuses: {quest: "pending"|"pass"|"fail"},
  rounds: {"<quest>-<round>": {leader, team: [...], approved: [...]}} }
```
Every user interaction calls `saveState()` at the end. `restoreState()` runs on load and rebuilds the whole UI through `renderTracker(roundCounts, rounds, questStatuses)`. Any new interactive state must be added to `getRoundState()`/`saveState()` and also re-applied in `createRoundRow()`/`createQuestSection()`, or it will be lost on reload.

**Component factories with methods attached to elements:**
- `createQuestSection(quest, sizes, roundCount, savedRounds, savedStatus)` returns a `<section data-quest>`. It attaches `section.updateAddRoundState()` so that child rows can call back into it.
- `createRoundRow(quest, round, teamSize, savedRound)` returns a `<tr class="round-row">`. It attaches `row.getRoundState()`, which `saveState()` uses.
- Rows find their parent quest through `row.closest("section[data-quest]")`.

**Game rules encoded in the code:**
- `TEAM_SIZES[playerCount]` gives the team size for each of the 5 quests.
- A vote passes when approvals ≥ `floor(players/2) + 1`. The row then gets `.vote-passed` and the quest's "+ Add Round" button is disabled.
- At most 5 rounds (proposals) per quest. **Round 5 is "hammer"**: it has no vote UI (it shows 🔨 instead, and `voteBadges` is `null`, so vote functions return early on `if (!voteBadges)`).
- The next quest section is added when the current quest's status is set to Pass/Fail **or** when it reaches 5 rounds. `renderTracker` repeats this cascade on restore.
- The note "Quest 4 requires 2 fails" (7+ players) is display-only. Quest pass/fail is always set by hand with the status `<select>`.
- Vote badges get a warning ring for "dissenting" votes: an off-team player who approved, or an on-team player who rejected. The team leader gets a 👑 marker.

**Ordering:** players are sorted case-insensitively when locked in. Team-player buttons and vote badges are re-sorted by `data-player-index` and moved between the "selected/available" and "approved/rejected" containers on every update.

**Mobile:** below 900px, the CSS turns the quest table into stacked cards and uses each `<td data-label>` as a pseudo-element heading. New table cells need a `data-label`.

## Conventions (as seen in the existing code)

- Plain browser JS with no framework or modules. Everything lives inside the single IIFE. Use `const`/`let`, double quotes, and 2-space indentation.
- Look up shared elements once at the top with `document.querySelector("#id")`. Inside a component, look up children with `row.querySelector(".class")`, never with global IDs, because every quest and round repeats the same markup.
- Show visual state by toggling Tailwind/DaisyUI classes (`classList.toggle(cls, bool)`), not with inline styles. Put custom CSS in the `<style>` block only when no utility class will do.
- Each component is built the same way: an HTML template string for the structure → look up children → `update*()` helpers stored in closures → event listeners that call `update*()` and then `saveState()` → re-apply the saved state → call the updates once at the end. For example, a new toggle inside a round row:
  ```js
  someButton.addEventListener("click", () => {
    someButton.dataset.on = someButton.dataset.on === "1" ? "0" : "1";
    updateSomething();   // re-derive classes from data-* attributes
    saveState();         // always last
  });
  ```
  The new state must also be added to `row.getRoundState()` and re-applied from `savedRound` before the final `updatePicker()`/`updateVoteResult()` calls.

## Gotchas

- Player names are inserted with `innerHTML`, so run them through `escapeHtml()`. Elements built with `createElement` use `textContent`.
- Duplicate names (compared case-insensitively) are rejected with an error, not silently removed, even though the setup text says "de-duplicated".
- `.vote-badge` styles are defined in two separate CSS blocks.
