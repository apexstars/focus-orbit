import test from "node:test";
import assert from "node:assert/strict";
import { calculateStreak, formatTime, progressRatio, rewardForMinutes } from "../src/core.js";

test("formats countdown values", () => {
  assert.equal(formatTime(1500), "25:00");
  assert.equal(formatTime(9), "00:09");
  assert.equal(formatTime(-1), "00:00");
});

test("calculates earned break credits", () => {
  assert.equal(rewardForMinutes(25), 5);
  assert.equal(rewardForMinutes(45), 9);
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
