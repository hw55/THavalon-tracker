// game.js — the Thavalon game model. Pure functions over an append-only event log.
// No DOM, no globals except the Game namespace. See docs/spec/SPEC-game-model.md.
const Game = (() => {
  const TEAM_SIZES = {
    5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5]
  };

  function failsToFail(questNumber, playerCount) {
    return questNumber === 4 && playerCount >= 7 ? 2 : 1;
  }

  function create() {
    return [];
  }

  function append(events, event) {
    const next = [...events, event];
    replay(next); // throws if `event` is illegal in this position
    return next;
  }

  function applySetup(state, event) {
    if (state.players) throw new Error("Setup has already been done.");
    const players = event.players;
    if (!Array.isArray(players) || players.length < 5 || players.length > 10) {
      throw new Error("Enter between 5 and 10 players.");
    }
    if (players.some((name) => typeof name !== "string" || !name.trim())) {
      throw new Error("Player names can't be blank.");
    }
    if (new Set(players.map((name) => name.trim().toLowerCase())).size !== players.length) {
      throw new Error("Player names must be unique.");
    }
    if (!Number.isInteger(event.firstKing) || event.firstKing < 0 || event.firstKing >= players.length) {
      throw new Error("Pick a first king from the players.");
    }
    state.players = players.map((name) => name.trim());
    state.firstKing = event.firstKing;
  }

  // ---- derived helpers over the raw state ----

  const currentQuest = (state) => state.quests[state.quests.length - 1];
  const openProposal = (quest) => quest && quest.proposals[quest.proposals.length - 1];
  const proposalsSoFar = (state) => state.quests.reduce((n, quest) => n + quest.proposals.length, 0);
  const teamSizeFor = (state, questNumber) => TEAM_SIZES[state.players.length][questNumber - 1];

  function phaseOf(state) {
    if (!state.players) return "setup";
    if (winnerOf(state)) return "over";
    const quest = currentQuest(state);
    const proposal = openProposal(quest);
    if (!proposal || proposal.approved === false) return "propose";
    if (proposal.approved === null) return "vote";
    return "quest";
  }

  function checkPlayers(state, indexes, label) {
    if (!Array.isArray(indexes)) throw new Error(`${label} must be a list of players.`);
    if (indexes.some((i) => !Number.isInteger(i) || i < 0 || i >= state.players.length)) {
      throw new Error(`${label} includes a player out of range.`);
    }
    if (new Set(indexes).size !== indexes.length) throw new Error(`${label} lists a player twice.`);
  }

  // ---- event handlers: each mutates the replay-local state or throws ----

  function applyPropose(state, event) {
    if (phaseOf(state) !== "propose") throw new Error("A proposal is already open for a vote.");
    const quest = currentQuest(state);
    const size = teamSizeFor(state, state.quests.length);
    checkPlayers(state, event.team, "Team");
    if (event.team.length !== size) throw new Error(`The team must have exactly ${size} players.`);
    const king = (state.firstKing + proposalsSoFar(state)) % state.players.length;
    const isHammer = quest.proposals.length === 4;
    quest.proposals.push({ king, team: [...event.team], approvals: null, approved: isHammer ? true : null });
  }

  function applyVote(state, event) {
    if (phaseOf(state) !== "vote") throw new Error("There is no open proposal to vote on.");
    const proposal = openProposal(currentQuest(state));
    checkPlayers(state, event.approvals, "Approvals");
    proposal.approvals = [...event.approvals].sort((a, b) => a - b);
    proposal.approved = proposal.approvals.length > state.players.length / 2;
  }

  function applyQuest(state, event) {
    if (phaseOf(state) !== "quest") throw new Error("No approved team has gone on a quest yet.");
    const quest = currentQuest(state);
    const size = openProposal(quest).team.length;
    const rogues = event.rogues ?? 0;
    if (!Number.isInteger(event.fails) || event.fails < 0 || event.fails > size) {
      throw new Error(`Fail cards must be between 0 and ${size}.`);
    }
    if (!Number.isInteger(rogues) || rogues < 0 || rogues > 2) throw new Error("Rogue cards must be 0, 1 or 2.");
    if (event.fails + rogues > size) throw new Error(`The team only played ${size} cards.`);
    const agravaine = event.agravaine ?? null;
    if (agravaine !== null && !openProposal(quest).team.includes(agravaine)) {
      throw new Error("Agravaine must be one of the players on the team.");
    }
    quest.fails = event.fails;
    quest.rogues = rogues;
    quest.agravaine = agravaine;
    // Ordinary cards decide first (incl. the quest-4 two-fail rule); one rogue flips that, two cancel out;
    // Agravaine coming out fails the quest whatever the cards said.
    const failed = event.fails >= failsToFail(state.quests.length, state.players.length);
    quest.result = agravaine !== null || failed !== (rogues === 1) ? "fail" : "pass";
    if (!winnerOf(state)) state.quests.push({ proposals: [], fails: null, rogues: null, agravaine: null, result: null });
  }

  function scoreOf(state) {
    const score = { pass: 0, fail: 0 };
    for (const quest of state.quests) if (quest.result) score[quest.result] += 1;
    return score;
  }

  function winnerOf(state) {
    const score = scoreOf(state);
    if (score.pass >= 3) return "good";
    if (score.fail >= 3) return "evil";
    return null;
  }

  const HANDLERS = { setup: applySetup, propose: applyPropose, vote: applyVote, quest: applyQuest };

  function replay(events) {
    const state = { players: null, firstKing: 0, quests: [] };
    for (const event of events) {
      if (!state.players && event.type !== "setup") throw new Error("Setup must come first.");
      if (state.players && winnerOf(state)) throw new Error("The game is over.");
      const handler = HANDLERS[event.type];
      if (!handler) throw new Error(`Unknown event type "${event.type}".`);
      handler(state, event);
      if (event.type === "setup") state.quests.push({ proposals: [], fails: null, rogues: null, agravaine: null, result: null });
    }
    return view(state);
  }

  function view(state) {
    const score = scoreOf(state);
    if (!state.players) return { players: [], phase: "setup", quests: [], score, winner: null };
    const phase = phaseOf(state);
    const playerCount = state.players.length;
    const questNumber = state.quests.length;
    // In the propose phase the next proposal is being formed; otherwise the open one counts.
    const proposalNumber = currentQuest(state).proposals.length + (phase === "propose" ? 1 : 0);
    const kingOffset = proposalsSoFar(state) - (phase === "propose" ? 0 : 1);
    return {
      players: state.players,
      phase,
      king: (state.firstKing + kingOffset) % playerCount,
      questNumber,
      proposalNumber,
      isHammer: proposalNumber === 5,
      teamSize: teamSizeFor(state, questNumber),
      failsToFail: failsToFail(questNumber, playerCount),
      quests: state.quests
        .filter((quest) => quest.proposals.length > 0)
        .map((quest, i) => ({ number: i + 1, proposals: quest.proposals, fails: quest.fails, rogues: quest.rogues, agravaine: quest.agravaine, result: quest.result })),
      score,
      winner: winnerOf(state)
    };
  }

  function undo(events) {
    return events.slice(0, -1);
  }

  function serialize(events) {
    return JSON.stringify(events);
  }

  function deserialize(json) {
    const events = JSON.parse(json);
    if (!Array.isArray(events)) throw new Error("A saved game must be a list of events.");
    replay(events); // throws if any event is illegal
    return events;
  }

  return { create, append, undo, replay, serialize, deserialize, TEAM_SIZES };
})();

if (typeof module !== "undefined") module.exports = Game;
