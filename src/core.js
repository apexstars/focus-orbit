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
