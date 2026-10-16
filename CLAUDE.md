# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A phone-first tracker for **Thavalon** (a variant of *The Resistance: Avalon*). Each player runs their own copy in a mobile browser to record teams, votes and quest results by tapping, and flips to a second screen to see the game so far. Our group plays a modified Thavalon with no Nimue, Guinevere or Maeve; for now the app only knows Avalon-level rules.

The new app is being built from scratch. **Read [docs/intent/mobile-tracker.md](docs/intent/mobile-tracker.md) first**: it holds the confirmed intent, every decision so far with its reason, what's deferred, and open questions. Keep it updated when a decision is made or changed.

## Process

Spec-driven development: intent → spec → mocks → build. Don't write app code before the spec in `docs/` covers it.

## Repository layout

- `docs/intent/` — intent and decision log (above).
- `archive/` — the previous tracker, kept **for reference only**. Nothing new depends on it, and it isn't maintained. Don't copy its structure (desktop layout, DOM-as-state, hand-entered outcomes).

## Constraints

- Must run in a mobile browser on Android and iPhone, portrait, with no install and no backend.
- Default to a single HTML file with no build step. This is a preference, not a rule: if splitting files or a build step would clearly work better, propose it with the trade-offs and wait for approval. Whatever the setup, the shared version must open from disk.

## GitHub

This repo is `hw55/THavalon-tracker` (capital H is intentional), pushed through the `github-hw55` SSH alias. The `gh` CLI defaults to a different account; run it here as `GH_TOKEN=$(gh auth token -u hw55) gh …`.
