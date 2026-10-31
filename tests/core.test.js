import test from "node:test";
import assert from "node:assert/strict";
import { addUniqueDistraction, calculateStreak, canSpendCredits, formatTime, normalizeDistractionName, progressRatio, rewardForMinutes, spendCredits } from "../src/core.js";

test("formats countdown values", () => {
  assert.equal(formatTime(1500), "25:00");
  assert.equal(formatTime(9), "00:09");
  assert.equal(formatTime(-1), "00:00");
});

test("calculates earned break credits", () => {
  assert.equal(rewardForMinutes(25), 5);
  assert.equal(rewardForMinutes(45), 9);
  assert.equal(rewardForMinutes(25, 10), 3);
  assert.equal(rewardForMinutes(25, 0), 5);
});

test("spends credits only when the full break is affordable", () => {
  assert.equal(canSpendCredits(10, 5), true);
  assert.equal(canSpendCredits(4, 5), false);
  assert.equal(spendCredits(10, 5), 5);
  assert.equal(spendCredits(4, 5), 4);
});

test("normalizes and deduplicates distraction names", () => {
  assert.equal(normalizeDistractionName("  Social   media  "), "Social media");
  assert.deepEqual(addUniqueDistraction([], "Reddit"), ["Reddit"]);
  const existing = ["Reddit"];
  assert.equal(addUniqueDistraction(existing, " reddit "), existing);
  assert.equal(addUniqueDistraction(existing, "   "), existing);
});

test("clamps timer progress", () => {
  assert.equal(progressRatio(50, 100), 0.5);
  assert.equal(progressRatio(-2, 100), 1);
  assert.equal(progressRatio(100, 0), 0);
});

test("counts a consecutive daily streak", () => {
  const today = new Date("2026-10-29T12:00:00Z");
  const dates = ["2026-10-27T09:00:00Z", "2026-10-28T09:00:00Z", "2026-10-29T09:00:00Z"];
  assert.equal(calculateStreak(dates, today), 3);
});
