import { calculateStreak, formatTime, progressRatio, rewardForMinutes } from "./core.js";

const STORAGE_KEY = "focus-orbit-v1";
const ringCircumference = 2 * Math.PI * 96;

const elements = {
  duration: document.querySelector("#duration-select"),
  timer: document.querySelector("#timer-value"),
  status: document.querySelector("#timer-status"),
  ring: document.querySelector("#ring-progress"),
  start: document.querySelector("#start-button"),
  reset: document.querySelector("#reset-button"),
  reward: document.querySelector("#reward-preview"),
  credits: document.querySelector("#credit-count"),
  totalEarned: document.querySelector("#total-earned"),
  sessions: document.querySelector("#session-count"),
  goal: document.querySelector("#goal-count"),
  goalProgress: document.querySelector("#goal-progress"),
  streak: document.querySelector("#streak-count"),
  streakMessage: document.querySelector("#streak-message"),
  spend: document.querySelector("#spend-button"),
  clear: document.querySelector("#clear-button"),
  activity: document.querySelector("#activity-list"),
  emptyTemplate: document.querySelector("#empty-template")
};

const defaultData = { credits: 0, totalEarned: 0, dailyGoal: 3, sessions: [] };
let data = loadData();
let selectedMinutes = Number(elements.duration.value);
let totalSeconds = selectedMinutes * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let running = false;

function loadData() {
  try {
    return { ...defaultData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultData };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function todaySessions() {
  return data.sessions.filter((session) => session.completedAt.slice(0, 10) === todayKey());
}

function renderTimer() {
  const progress = progressRatio(remainingSeconds, totalSeconds);
  elements.timer.textContent = formatTime(remainingSeconds);
  elements.ring.style.strokeDasharray = `${ringCircumference}`;
  elements.ring.style.strokeDashoffset = `${ringCircumference * (1 - progress)}`;
  elements.status.textContent = running ? "STAY WITH THIS MOMENT" : remainingSeconds < totalSeconds ? "ORBIT PAUSED" : "READY WHEN YOU ARE";
  elements.start.querySelector("span").textContent = running ? "Pause focus" : remainingSeconds < totalSeconds ? "Resume focus" : "Start focus";
}

function renderDashboard() {
  const sessions = todaySessions();
  const streak = calculateStreak(data.sessions.map((session) => session.completedAt));
  elements.credits.textContent = data.credits;
  elements.totalEarned.textContent = `${data.totalEarned} minute${data.totalEarned === 1 ? "" : "s"}`;
  elements.sessions.textContent = sessions.length;
  elements.goal.textContent = data.dailyGoal;
  elements.goalProgress.style.width = `${Math.min(100, (sessions.length / data.dailyGoal) * 100)}%`;
  elements.streak.textContent = streak;
  elements.streakMessage.textContent = streak ? "Keep the rhythm alive" : "Begin your first orbit";
  elements.spend.disabled = data.credits < 5;
  elements.reward.textContent = `${rewardForMinutes(selectedMinutes)} break credits`;
  renderActivity();
}

function renderActivity() {
  elements.activity.replaceChildren();
  const recent = data.sessions.slice(-5).reverse();
  elements.clear.hidden = recent.length === 0;
  if (!recent.length) {
    elements.activity.append(elements.emptyTemplate.content.cloneNode(true));
    return;
  }

  recent.forEach((session) => {
    const row = document.createElement("article");
    const completed = new Date(session.completedAt);
    row.className = "activity-row";
    row.innerHTML = `
      <span class="activity-dot">✓</span>
      <div><strong>${session.minutes}-minute focus orbit</strong><small>${completed.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${completed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small></div>
      <span class="activity-reward">+${session.reward} min</span>
    `;
    elements.activity.append(row);
  });
}

function toggleTimer() {
  running = !running;
  if (running) {
    timerId = window.setInterval(tick, 1000);
  } else {
    window.clearInterval(timerId);
  }
  renderTimer();
}

function tick() {
  remainingSeconds -= 1;
  if (remainingSeconds <= 0) completeSession();
  renderTimer();
}

function completeSession() {
  window.clearInterval(timerId);
  running = false;
  const reward = rewardForMinutes(selectedMinutes);
  data.credits += reward;
  data.totalEarned += reward;
  data.sessions.push({ minutes: selectedMinutes, reward, completedAt: new Date().toISOString() });
  saveData();
  remainingSeconds = totalSeconds;
  elements.status.textContent = "ORBIT COMPLETE";
  renderDashboard();
}

function resetTimer() {
  window.clearInterval(timerId);
  running = false;
  remainingSeconds = totalSeconds;
  renderTimer();
}

elements.duration.addEventListener("change", () => {
  selectedMinutes = Number(elements.duration.value);
  totalSeconds = selectedMinutes * 60;
  resetTimer();
  renderDashboard();
});

elements.start.addEventListener("click", toggleTimer);
elements.reset.addEventListener("click", resetTimer);
elements.spend.addEventListener("click", () => {
  if (data.credits < 5) return;
  data.credits -= 5;
  saveData();
  renderDashboard();
  elements.spend.textContent = "5 minutes unlocked ✓";
  window.setTimeout(() => { elements.spend.textContent = "Take a break"; }, 1800);
});
elements.clear.addEventListener("click", () => {
  data.sessions = [];
  data.credits = 0;
  data.totalEarned = 0;
  saveData();
  renderDashboard();
});

renderTimer();
renderDashboard();
