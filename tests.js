// Tests for game.js. Runs under `node tests.js` (exit 1 on failure) and inside tests.html.
// No framework: test(name, fn) collects cases; assert helpers throw on failure.

const G = typeof require === "function" ? require("./game.js") : Game;

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error });
  }
}

function assertEqual(actual, expected, label = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label ? label + ": " : ""}expected ${e}, got ${a}`);
}

function assertThrows(fn, pattern) {
  try {
    fn();
  } catch (error) {
    if (pattern && !pattern.test(error.message)) {
      throw new Error(`threw "${error.message}", expected to match ${pattern}`);
    }
    return;
  }
  throw new Error("expected an error, none thrown");
}

// Helpers to build logs quickly.
const names = (count) => Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)); // A, B, C …
const setup = (count, firstKing = 0) => G.append(G.create(), { type: "setup", players: names(count), firstKing });

// ---------- setup ----------

test("create returns an empty log", () => {
  assertEqual(G.create(), []);
});

test("replay of an empty log is in the setup phase", () => {
  assertEqual(G.replay([]).phase, "setup");
});

test("setup with 5 players moves to the propose phase", () => {
  const view = G.replay(setup(5));
  assertEqual(view.phase, "propose");
  assertEqual(view.players, ["A", "B", "C", "D", "E"]);
});

test("setup with 10 players is accepted", () => {
  assertEqual(G.replay(setup(10)).players.length, 10);
});

test("setup rejects 4 players", () => {
  assertThrows(() => setup(4), /5/);
});

test("setup rejects 11 players", () => {
  assertThrows(() => setup(11), /10/);
});

test("setup rejects duplicate names", () => {
  assertThrows(() => G.append(G.create(), { type: "setup", players: ["A", "B", "C", "D", "A"], firstKing: 0 }), /unique|duplicate/i);
});

test("setup rejects a blank name", () => {
  assertThrows(() => G.append(G.create(), { type: "setup", players: ["A", "B", "C", "D", " "], firstKing: 0 }), /blank|empty/i);
});

test("setup rejects a firstKing out of range", () => {
  assertThrows(() => setup(5, 5), /king/i);
});

test("setup twice is rejected", () => {
  assertThrows(() => G.append(setup(5), { type: "setup", players: names(5), firstKing: 0 }), /setup/i);
});

test("anything before setup is rejected", () => {
  assertThrows(() => G.append(G.create(), { type: "propose", team: [0, 1] }), /setup/i);
});

test("initial view after setup: quest 1, proposal 1, first king, team size, not hammer", () => {
  const view = G.replay(setup(5, 2));
  assertEqual(view.questNumber, 1);
  assertEqual(view.proposalNumber, 1);
  assertEqual(view.king, 2);
  assertEqual(view.teamSize, 2);
  assertEqual(view.isHammer, false);
  assertEqual(view.failsToFail, 1);
  assertEqual(view.score, { pass: 0, fail: 0 });
  assertEqual(view.winner, null);
});

// ---------- team sizes ----------

test("team sizes per player count match the Avalon table", () => {
  const expected = { 5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4],
                     8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5] };
  assertEqual(G.TEAM_SIZES, expected);
  assertEqual(G.replay(setup(7)).teamSize, 2, "7 players, quest 1");
});

// ---------- propose ----------

const propose = (events, team) => G.append(events, { type: "propose", team });
const vote = (events, approvals) => G.append(events, { type: "vote", approvals });

test("propose with the right team size moves to the vote phase", () => {
  const view = G.replay(propose(setup(5), [0, 1]));
  assertEqual(view.phase, "vote");
  assertEqual(view.quests[0].proposals[0], { king: 0, team: [0, 1], approvals: null, approved: null });
});

test("propose rejects the wrong team size", () => {
  assertThrows(() => propose(setup(5), [0, 1, 2]), /2/);
});

test("propose rejects duplicate or out-of-range players", () => {
  assertThrows(() => propose(setup(5), [1, 1]), /unique|twice|duplicate/i);
  assertThrows(() => propose(setup(5), [0, 5]), /range|player/i);
});

test("propose while a proposal is open is rejected", () => {
  assertThrows(() => propose(propose(setup(5), [0, 1]), [1, 2]), /vote|open/i);
});

// ---------- vote ----------

test("3 of 5 approvals passes the vote and moves to the quest phase", () => {
  const view = G.replay(vote(propose(setup(5), [0, 1]), [0, 1, 2]));
  assertEqual(view.phase, "quest");
  assertEqual(view.quests[0].proposals[0].approved, true);
  assertEqual(view.quests[0].proposals[0].approvals, [0, 1, 2]);
});

test("2 of 5 approvals rejects the vote and moves to proposal 2 with the next king", () => {
  const view = G.replay(vote(propose(setup(5), [0, 1]), [0, 1]));
  assertEqual(view.phase, "propose");
  assertEqual(view.quests[0].proposals[0].approved, false);
  assertEqual(view.proposalNumber, 2);
  assertEqual(view.king, 1);
});

test("exactly half is a rejection (4 of 8 fails, 5 of 8 passes)", () => {
  const base = propose(setup(8), [0, 1, 2]);
  assertEqual(G.replay(vote(base, [0, 1, 2, 3])).phase, "propose", "4 of 8");
  assertEqual(G.replay(vote(base, [0, 1, 2, 3, 4])).phase, "quest", "5 of 8");
});

test("vote rejects duplicate or out-of-range players", () => {
  const base = propose(setup(5), [0, 1]);
  assertThrows(() => vote(base, [0, 0]), /unique|twice|duplicate/i);
  assertThrows(() => vote(base, [7]), /range|player/i);
});

test("vote without an open proposal is rejected", () => {
  assertThrows(() => vote(setup(5), [0, 1, 2]), /propos/i);
});

// ---------- king rotation ----------

function rejectTimes(events, times) {
  for (let i = 0; i < times; i += 1) events = vote(propose(events, [0, 1]), []);
  return events;
}

test("king rotates clockwise and wraps around the table", () => {
  const events = rejectTimes(setup(5, 3), 3); // kings 3, 4, 0 have proposed
  assertEqual(G.replay(events).king, 1);
  assertEqual(G.replay(events).proposalNumber, 4);
});

test("king rotation continues across quests", () => {
  const events = G.append(vote(propose(setup(5, 4), [0, 1]), [0, 1, 2]), { type: "quest", fails: 0 });
  const view = G.replay(events);
  assertEqual(view.questNumber, 2);
  assertEqual(view.king, 0);
});

// ---------- hammer ----------

test("the 5th proposal is the hammer: auto-approved, no vote allowed", () => {
  const events = rejectTimes(setup(5), 4);
  assertEqual(G.replay(events).isHammer, true);
  const sent = propose(events, [0, 1]);
  const view = G.replay(sent);
  assertEqual(view.phase, "quest");
  assertEqual(view.quests[0].proposals[4].approved, true);
  assertEqual(view.quests[0].proposals[4].approvals, null);
  assertThrows(() => vote(sent, [0, 1, 2]), /hammer|vote/i);
});

// ---------- quest ----------

const quest = (events, fails) => G.append(events, { type: "quest", fails });
// Propose `team` and approve it with a strict majority of the table.
function approvedTeam(events, team) {
  const majority = Math.floor(G.replay(events).players.length / 2) + 1;
  return vote(propose(events, team), Array.from({ length: majority }, (_, i) => i));
}

test("one fail card fails quest 1", () => {
  const view = G.replay(quest(approvedTeam(setup(5), [0, 1]), 1));
  assertEqual(view.quests[0].result, "fail");
  assertEqual(view.quests[0].fails, 1);
  assertEqual(view.score, { pass: 0, fail: 1 });
});

test("zero fail cards passes the quest", () => {
  assertEqual(G.replay(quest(approvedTeam(setup(5), [0, 1]), 0)).quests[0].result, "pass");
});

test("quest rejects a fail count above the team size or below zero", () => {
  const base = approvedTeam(setup(5), [0, 1]);
  assertThrows(() => quest(base, 3), /0|2/);
  assertThrows(() => quest(base, -1), /0|2/);
});

test("quest without an approved team is rejected", () => {
  assertThrows(() => quest(setup(5), 0), /approved|quest/i);
});

// Play quests 1–3 to reach quest 4 with the given results.
function reachQuest4(playerCount, results) {
  let events = setup(playerCount);
  results.forEach((result) => {
    const size = G.replay(events).teamSize;
    events = quest(approvedTeam(events, Array.from({ length: size }, (_, i) => i)), result === "fail" ? 1 : 0);
  });
  return events;
}

test("quest 4 with 7 players needs two fails: one fail passes, two fail", () => {
  const base = reachQuest4(7, ["pass", "fail", "pass"]);
  assertEqual(G.replay(base).failsToFail, 2);
  const team = [0, 1, 2, 3];
  assertEqual(G.replay(quest(approvedTeam(base, team), 1)).quests[3].result, "pass", "1 fail");
  assertEqual(G.replay(quest(approvedTeam(base, team), 2)).quests[3].result, "fail", "2 fails");
});

test("quest 4 with 6 players fails on one fail card", () => {
  const base = reachQuest4(6, ["pass", "fail", "pass"]);
  assertEqual(G.replay(base).failsToFail, 1);
  assertEqual(G.replay(quest(approvedTeam(base, [0, 1, 2]), 1)).quests[3].result, "fail");
});

// ---------- game over ----------

function playQuests(playerCount, results) {
  let events = setup(playerCount);
  results.forEach((result) => {
    const size = G.replay(events).teamSize;
    events = quest(approvedTeam(events, Array.from({ length: size }, (_, i) => i)), result === "fail" ? 1 : 0);
  });
  return events;
}

test("three passed quests end the game with good winning", () => {
  const view = G.replay(playQuests(5, ["pass", "fail", "pass", "pass"]));
  assertEqual(view.phase, "over");
  assertEqual(view.winner, "good");
  assertEqual(view.score, { pass: 3, fail: 1 });
});

test("three failed quests end the game with evil winning", () => {
  const view = G.replay(playQuests(5, ["fail", "fail", "fail"]));
  assertEqual(view.phase, "over");
  assertEqual(view.winner, "evil");
});

test("no events are accepted after the game is over", () => {
  assertThrows(() => propose(playQuests(5, ["pass", "pass", "pass"]), [0, 1]), /over/i);
});

// ---------- undo ----------

test("undo removes the last event and restores the previous phase", () => {
  const events = propose(setup(5), [0, 1]);
  assertEqual(G.replay(events).phase, "vote");
  assertEqual(G.replay(G.undo(events)).phase, "propose");
  assertEqual(G.undo(events).length, 1);
});

test("undo on an empty log is a no-op", () => {
  assertEqual(G.undo([]), []);
});

// ---------- serialize ----------

test("serialize and deserialize round-trip the log", () => {
  const events = vote(propose(setup(5), [0, 1]), [0, 1, 2]);
  assertEqual(G.deserialize(G.serialize(events)), events);
});

test("deserialize rejects a log with an illegal event", () => {
  const bad = JSON.stringify([{ type: "setup", players: names(5), firstKing: 0 }, { type: "vote", approvals: [0] }]);
  assertThrows(() => G.deserialize(bad), /propos/i);
});

test("deserialize rejects something that isn't a log", () => {
  assertThrows(() => G.deserialize("{}"), /log|array|list/i);
  assertThrows(() => G.deserialize("not json"), /./);
});

// ---------- purity ----------

test("append does not mutate its input", () => {
  const events = setup(5);
  const copy = JSON.parse(JSON.stringify(events));
  propose(events, [0, 1]);
  assertEqual(events, copy);
});

test("a rejected event leaves the log unchanged", () => {
  const events = setup(5);
  try { propose(events, [0, 1, 2]); } catch (_) { /* expected */ }
  assertEqual(events.length, 1);
});

// ---------- full games ----------

test("a full 5-player game runs from setup to a winner", () => {
  let e = setup(5, 1);
  e = vote(propose(e, [1, 2]), [1, 2]);          // rejected (2 of 5), king 1
  e = vote(propose(e, [2, 3]), [0, 2, 3]);       // approved, king 2
  e = quest(e, 0);                               // Q1 pass
  e = vote(propose(e, [3, 4, 0]), [3, 4, 0]);    // king 3, Q2 team of 3
  e = quest(e, 1);                               // Q2 fail
  e = vote(propose(e, [4, 0]), [4, 0, 1]);       // king 4, Q3 team of 2
  e = quest(e, 0);                               // Q3 pass
  e = vote(propose(e, [0, 1, 2]), [0, 1, 2]);    // king 0, Q4 team of 3
  e = quest(e, 0);                               // Q4 pass → good wins
  const view = G.replay(e);
  assertEqual(view.winner, "good");
  assertEqual(view.quests.map((q) => q.result), ["pass", "fail", "pass", "pass"]);
  assertEqual(view.quests[0].proposals.map((p) => p.king), [1, 2]);
});

test("a full 7-player game with a hammer and the quest-4 rule runs to a winner", () => {
  let e = setup(7, 6);
  e = quest(approvedTeam(e, [6, 0]), 1);                       // Q1 fail (king 6)
  e = quest(approvedTeam(e, [0, 1, 2]), 1);                    // Q2 fail (king 0)
  for (let i = 0; i < 4; i += 1) e = vote(propose(e, [1, 2, 3]), []);  // Q3: 4 rejections
  assertEqual(G.replay(e).isHammer, true);
  e = quest(propose(e, [1, 2, 3]), 0);                         // hammer, Q3 pass
  e = quest(approvedTeam(e, [0, 1, 2, 3]), 1);                 // Q4: 1 fail passes at 7 players
  assertEqual(G.replay(e).score, { pass: 2, fail: 2 });
  e = quest(approvedTeam(e, [0, 1, 2, 3]), 2);                 // Q5: evil wins
  const view = G.replay(e);
  assertEqual(view.winner, "evil");
  assertEqual(view.quests[2].proposals.length, 5);
});

// ---------- report ----------

const failed = results.filter((r) => !r.ok);
const summary = `${results.length - failed.length} passed, ${failed.length} failed`;

if (typeof document !== "undefined") {
  const list = document.createElement("ul");
  for (const r of results) {
    const li = document.createElement("li");
    li.textContent = `${r.ok ? "✓" : "✗"} ${r.name}${r.ok ? "" : " — " + r.error.message}`;
    li.className = r.ok ? "ok" : "fail";
    list.append(li);
  }
  const h = document.createElement("h1");
  h.textContent = summary;
  document.body.append(h, list);
} else {
  for (const r of failed) console.log(`✗ ${r.name}\n    ${r.error.message}`);
  console.log(summary);
  if (failed.length) process.exit(1);
}
