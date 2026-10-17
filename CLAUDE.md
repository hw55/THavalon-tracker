# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A phone-first tracker for **Thavalon** (a variant of *The Resistance: Avalon*). Each player runs their own copy in a mobile browser to record teams, votes and quest results by tapping, and flips to a second screen to see the game so far.

This file holds the requirements and design. [docs/worklog.md](docs/worklog.md) holds the history: decisions with dates and reasons, deferred items, open questions, and a log of work done. Update the worklog when a decision is made or changed; update this file when the requirements or design change.

## Requirements (confirmed 2026-10-16)

- **Outcome:** Teams, votes and quest results entered by taps, plus a second screen showing the game so far at a glance. The two screens flip easily.
- **User:** Any individual player, on their own phone (Android or iPhone, portrait), tracking for themselves. Use is optional; no collaboration or sync between phones.
- **Success:** A full game tracked with only taps (no typing after player setup); the app computes the mechanical outcomes itself (next king from seating order, vote pass/fail, hammer, quest pass/fail from fail-card count); the history screen is readable without scrolling tables.
- **Rules depth, for now:** Avalon-level only: team sizes for 5–10 players, majority votes, 5-proposal hammer, fail-card counts with the quest-4 two-fail rule at 7+ players. Our group plays a modified Thavalon with **no Nimue, Guinevere or Maeve**; Thavalon role rules (Reverse cards, Agravaine, assassination, …) come later.
- **Later, not now** (the TODO list in the worklog): Reverse cards, assassination, saving/exporting entered games, voice / "AI core on Android" integration, multi-device sync.

## Design (approved 2026-10-16)

Scope check: the request bundles three capabilities that can be built, tested and replaced independently (the rules can be tested without a screen; either screen could be redesigned without touching the rules or the other screen), so it is split into three modules with their own specs rather than one spec for everything. Dependencies point one way, from the screens to the model, never between the screens.

Three modules, built in this order:

| Module id | Responsibility | Depends on |
|---|---|---|
| `game-model` | Game state and rules: players, seating, king rotation, proposals, votes, hammer, quest results, game end. Pure logic, no UI. Save/load. | — |
| `capture` | The input screen: tap-driven entry that drives `game-model`. | `game-model` |
| `review` | The history screen: visualises the game so far from `game-model` state. | `game-model` |

Working assumptions:
- Plain HTML/CSS/JS, no framework, no build step.
- Setup captures names in clockwise seating order and the first king; kingship rotates clockwise.
- Votes are per-player approve/reject taps with presets (All reject default → Team → All approve); majority approves. The 5th proposal is the hammer: no vote, the team goes.
- Horizontal swipe flips between the two screens. The vote-preset gesture is undecided until it can be felt in the prototype; start with buttons.
- Quest result is entered as the number of fail cards; the app decides pass/fail.
- Game end (3 passed / 3 failed quests) is detected and shown; assassination isn't modelled.
- One game at a time, saved in localStorage so a refresh doesn't lose it.
- Hosted on GitHub Pages from this repo, so players open a URL rather than a file.

Files: `index.html` (both screens), `game.js` (the model), `tests.js` + `tests.html` (checks against `game.js`, no framework; run with `node tests.js` or by opening `tests.html`).

## UI principle: show, don't tell

If something can be shown, don't explain it in words. Use position, colour, shape, emoji and repetition instead of labels, sentences and legends. For example: team = shaded cell or 🛡️ (no "on the team" text); team size = repeated 🛡️; vote result = a coloured dot, not "PASSED". Before adding any text to a screen, ask whether a visual already says it, and if so leave the text out. Text is for names and numbers.

## Process

Split by module, because rules can be verified by reading but screens only by using:

- **`game-model`:** spec-driven, test-first. `docs/spec/SPEC-game-model.md` is the contract; change the spec before changing a rule.
- **`capture` and `review`:** prototype-driven. Build rough, run it on the phone, iterate on feel. Their specs in `docs/spec/` are living notes updated *after* each round, not approvals sought in advance.

Local iteration loop: `python3 -m http.server 8000` in the repo, open `http://<mac-ip>:8000` on the phone over Wi-Fi.

**Commit every UI iteration** as soon as it's done (one commit per round of feedback, no need to ask), so any version can be checked out and compared on the phone. The message says what changed on screen. Pushing to GitHub still waits for the user to ask.

## Repository layout

- `docs/worklog.md` — decisions, deferred items, open questions, log.
- `docs/prompts.md` — every user prompt, word for word, in order. Append each new prompt there.
- Both of those are **local only**: git-ignored and never pushed (they were scrubbed from the unpushed history on 2026-10-16). Keep updating them, but don't commit them.
- `docs/spec/` — module specs (`SPEC-<module-id>.md`).
- `archive/` — the previous tracker, kept **for reference only**. Nothing new depends on it, it isn't maintained, and its structure (desktop layout, DOM-as-state, hand-entered outcomes) is not the pattern to copy. It has its own CLAUDE.md.

## Constraints

- Must run in a mobile browser on Android and iPhone, portrait, with no install and no backend.
- Keep the file count and tooling minimal. Adding a framework, a build step or a dependency is a decision to propose with trade-offs, not to make silently.

## GitHub

This repo is `hw55/THavalon-tracker` (capital H is intentional), pushed through the `github-hw55` SSH alias. The `gh` CLI defaults to a different account; run it here as `GH_TOKEN=$(gh auth token -u hw55) gh …`.
