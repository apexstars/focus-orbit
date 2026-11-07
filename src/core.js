export function parseBackup(text) {
  const { version, data } = JSON.parse(text) ?? {};
  const whole = (value, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(value) && value >= min && value <= max;
  const date = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
  const name = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 40;
  if (version !== 1 || !data || !whole(data.credits) || !whole(data.totalEarned, data.credits) ||
      !whole(data.dailyGoal, 1, 12) || !whole(data.focusMinutesPerCredit, 1, 30) ||
      ![5, 10, 15].includes(data.breakLength) ||
      (data.focusDuration !== undefined && ![15, 25, 45, 60].includes(data.focusDuration)) ||
      !Array.isArray(data.distractions) || !data.distractions.every(name) ||
      !Array.isArray(data.sessions) || !data.sessions.every((session) =>
        session && whole(session.minutes, 1, 60) && whole(session.reward, 1, 60) && date(session.completedAt)) ||
      !Array.isArray(data.interventions) || !data.interventions.every((entry) =>
        entry && name(entry.distraction) && ["returned", "continued"].includes(entry.choice) && date(entry.completedAt))) {
    throw new Error("Invalid Focus Orbit backup");
  }

  const { credits, totalEarned, dailyGoal, focusMinutesPerCredit, breakLength, focusDuration, distractions, sessions, interventions } = data;
  return { credits, totalEarned, dailyGoal, focusMinutesPerCredit, breakLength, focusDuration, distractions, sessions, interventions };
}

export const rewardForMinutes = (minutes, focusMinutesPerCredit = 5) => {
  const rate = Math.max(1, Number(focusMinutesPerCredit) || 5);
  return Math.max(1, Math.round(minutes / rate));
};

export const canSpendCredits = (credits, cost) => credits >= cost && cost > 0;

export const spendCredits = (credits, cost) => {
  if (!canSpendCredits(credits, cost)) return credits;
  return credits - cost;
};

export const normalizeDistractionName = (value) => value.trim().replace(/\s+/g, " ").slice(0, 40);

export const addUniqueDistraction = (items, value) => {
  const name = normalizeDistractionName(value);
  if (!name || items.some((item) => item.toLowerCase() === name.toLowerCase())) return items;
  return [...items, name];
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

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export const weeklyFocus = (sessions, today = new Date(), days = 7) => {
  const safeDays = Math.max(1, Math.floor(days));
  const end = new Date(today);
  end.setUTCHours(0, 0, 0, 0);
  const totals = new Map();

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - offset);
    totals.set(dayKey(date), { date: dayKey(date), minutes: 0, sessions: 0 });
  }

  sessions.forEach((session) => {
    const key = dayKey(session.completedAt);
    const entry = totals.get(key);
    if (!entry) return;
    entry.minutes += Math.max(0, Number(session.minutes) || 0);
    entry.sessions += 1;
  });

  return [...totals.values()];
};

export const weeklyInsight = (sessions, today = new Date()) => {
  const days = weeklyFocus(sessions, today);
  const totalMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const totalSessions = days.reduce((total, day) => total + day.sessions, 0);
  const bestDay = days.reduce((best, day) => day.minutes > best.minutes ? day : best, days[0]);
  return { days, totalMinutes, totalSessions, bestDay };
};
