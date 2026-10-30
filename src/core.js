export const rewardForMinutes = (minutes, focusMinutesPerCredit = 5) => {
  const rate = Math.max(1, Number(focusMinutesPerCredit) || 5);
  return Math.max(1, Math.round(minutes / rate));
};

export const canSpendCredits = (credits, cost) => credits >= cost && cost > 0;

export const spendCredits = (credits, cost) => {
  if (!canSpendCredits(credits, cost)) return credits;
  return credits - cost;
};

export const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const progressRatio = (remaining, total) => {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (total - remaining) / total));
};

export const calculateStreak = (sessionDates, today = new Date()) => {
  const days = new Set(sessionDates.map((date) => new Date(date).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date(today);
  cursor.setUTCHours(0, 0, 0, 0);

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};
