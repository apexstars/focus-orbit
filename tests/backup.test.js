import test from "node:test";
import assert from "node:assert/strict";
import { parseBackup } from "../src/core.js";

const data = {
  credits: 5,
  totalEarned: 5,
  dailyGoal: 3,
  focusMinutesPerCredit: 5,
  breakLength: 5,
  focusDuration: 45,
  distractions: ["News"],
  sessions: [{ minutes: 25, reward: 5, completedAt: "2026-11-07T13:00:00.000Z" }],
  interventions: [{ distraction: "News", choice: "returned", completedAt: "2026-11-07T12:55:00.000Z" }]
};

test("restores a backup and accepts data from before presets were saved", () => {
  assert.deepEqual(parseBackup(JSON.stringify({ version: 1, data })), data);
  const olderData = { ...data, focusDuration: undefined };
  assert.deepEqual(parseBackup(JSON.stringify({ version: 1, data: olderData })), olderData);
});

test("rejects unsafe session values and unsupported backup versions", () => {
  assert.throws(() => parseBackup(JSON.stringify({ version: 2, data })));
  for (const changes of [{ minutes: "<img>" }, { completedAt: "invalid" }]) {
    const invalid = { ...data, sessions: [{ ...data.sessions[0], ...changes }] };
    assert.throws(() => parseBackup(JSON.stringify({ version: 1, data: invalid })));
  }
});
