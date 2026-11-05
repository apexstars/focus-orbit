import { addUniqueDistraction, calculateStreak, canSpendCredits, formatTime, progressRatio, rewardForMinutes, spendCredits, weeklyInsight } from "./core.js";

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
  emptyTemplate: document.querySelector("#empty-template"),
  settingsButton: document.querySelector("#settings-button"),
  settingsDialog: document.querySelector("#settings-dialog"),
  settingsForm: document.querySelector("#settings-form"),
  focusPerCredit: document.querySelector("#focus-per-credit"),
  breakLength: document.querySelector("#break-length"),
  dailyGoal: document.querySelector("#daily-goal"),
  breakDialog: document.querySelector("#break-dialog"),
  breakTimer: document.querySelector("#break-timer"),
  endBreak: document.querySelector("#end-break-button"),
  interventionButton: document.querySelector("#intervention-button"),
  interventionDialog: document.querySelector("#intervention-dialog"),
  interventionBreathe: document.querySelector("#intervention-breathe"),
  interventionChoice: document.querySelector("#intervention-choice"),
  interventionDistraction: document.querySelector("#intervention-distraction"),
  breathCount: document.querySelector("#breath-count"),
  closeIntervention: document.querySelector("#close-intervention-button"),
  returnFocus: document.querySelector("#return-focus-button"),
  continueIntentionally: document.querySelector("#continue-button"),
  distractionForm: document.querySelector("#distraction-form"),
  distractionInput: document.querySelector("#distraction-input"),
  distractionList: document.querySelector("#distraction-list"),
  urgeCount: document.querySelector("#urge-count"),
  weeklyMinutes: document.querySelector("#weekly-minutes"),
  weeklySessions: document.querySelector("#weekly-sessions"),
  bestDay: document.querySelector("#best-day"),
  weeklyChart: document.querySelector("#weekly-chart")
};

const defaultData = {
  credits: 0,
  totalEarned: 0,
  dailyGoal: 3,
  focusMinutesPerCredit: 5,
  breakLength: 5,
  distractions: [],
  interventions: [],
  sessions: []
};
let data = loadData();
let selectedMinutes = Number(elements.duration.value);
let totalSeconds = selectedMinutes * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let running = false;
let focusDeadline = null;
let breakTimerId = null;
let breakSeconds = data.breakLength * 60;
let breathTimerId = null;
let breathSeconds = 5;

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
  elements.spend.disabled = !canSpendCredits(data.credits, data.breakLength);
  elements.spend.textContent = `Take a ${data.breakLength} min break`;
  elements.reward.textContent = `${rewardForMinutes(selectedMinutes, data.focusMinutesPerCredit)} break credits`;
  renderActivity();
  renderDistractions();
  renderWeeklyInsight();
}

function renderWeeklyInsight() {
  const summary = weeklyInsight(data.sessions);
  const highestMinutes = Math.max(1, ...summary.days.map((day) => day.minutes));
  elements.weeklyMinutes.textContent = `${summary.totalMinutes} min`;
  elements.weeklySessions.textContent = summary.totalSessions;
  elements.bestDay.textContent = summary.bestDay.minutes
    ? new Date(`${summary.bestDay.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long" })
    : "—";
  elements.weeklyChart.replaceChildren();

  summary.days.forEach((day) => {
    const item = document.createElement("div");
    item.className = "chart-day";
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${day.minutes ? Math.max(8, (day.minutes / highestMinutes) * 100) : 3}%`;
    bar.title = `${day.minutes} focused minute${day.minutes === 1 ? "" : "s"}`;
    bar.setAttribute("aria-label", `${new Date(`${day.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long" })}: ${day.minutes} focused minutes`);
    const label = document.createElement("span");
    label.textContent = new Date(`${day.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow" });
    item.append(bar, label);
    elements.weeklyChart.append(item);
  });
}

function renderDistractions() {
  elements.distractionList.replaceChildren();
  elements.interventionDistraction.replaceChildren();
  elements.urgeCount.textContent = data.interventions.length;

  if (!data.distractions.length) {
    const empty = document.createElement("p");
    empty.className = "distraction-empty";
    empty.textContent = "Your list is empty. Add one recurring distraction to begin.";
    elements.distractionList.append(empty);
  }

  data.distractions.forEach((name, index) => {
    const item = document.createElement("div");
    item.className = "distraction-chip";
    const label = document.createElement("span");
    label.textContent = name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      data.distractions.splice(index, 1);
      saveData();
      renderDistractions();
    });
    item.append(label, remove);
    elements.distractionList.append(item);

    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.interventionDistraction.append(option);
  });

  if (!data.distractions.length) {
    const option = document.createElement("option");
    option.value = "Something else";
    option.textContent = "Something else";
    elements.interventionDistraction.append(option);
  }
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
    focusDeadline = Date.now() + remainingSeconds * 1000;
    timerId = window.setInterval(tick, 1000);
  } else {
    remainingSeconds = Math.max(0, Math.ceil((focusDeadline - Date.now()) / 1000));
    focusDeadline = null;
    window.clearInterval(timerId);
    if (remainingSeconds === 0) completeSession();
  }
  renderTimer();
}

function tick() {
  remainingSeconds = Math.max(0, Math.ceil((focusDeadline - Date.now()) / 1000));
  if (remainingSeconds <= 0) completeSession();
  renderTimer();
}

function completeSession() {
  focusDeadline = null;
  window.clearInterval(timerId);
  running = false;
  const reward = rewardForMinutes(selectedMinutes, data.focusMinutesPerCredit);
  data.credits += reward;
  data.totalEarned += reward;
  data.sessions.push({ minutes: selectedMinutes, reward, completedAt: new Date().toISOString() });
  saveData();
  remainingSeconds = totalSeconds;
  elements.status.textContent = "ORBIT COMPLETE";
  renderDashboard();
}

function resetTimer() {
  focusDeadline = null;
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
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (document.querySelector("dialog[open]")) return;
  if (event.target.closest("input, select, textarea, button, a, [contenteditable]")) return;
  if (event.code === "Space") {
    event.preventDefault();
    toggleTimer();
  } else if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetTimer();
  }
});
elements.spend.addEventListener("click", () => {
  if (!canSpendCredits(data.credits, data.breakLength)) return;
  data.credits = spendCredits(data.credits, data.breakLength);
  saveData();
  renderDashboard();
  startBreak();
});
elements.clear.addEventListener("click", () => {
  data.sessions = [];
  data.credits = 0;
  data.totalEarned = 0;
  saveData();
  renderDashboard();
});

elements.settingsButton.addEventListener("click", () => {
  elements.focusPerCredit.value = data.focusMinutesPerCredit;
  elements.breakLength.value = data.breakLength;
  elements.dailyGoal.value = data.dailyGoal;
  elements.settingsDialog.showModal();
});

elements.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    elements.settingsDialog.close();
    return;
  }
  if (!elements.settingsForm.reportValidity()) return;
  data.focusMinutesPerCredit = Number(elements.focusPerCredit.value);
  data.breakLength = Number(elements.breakLength.value);
  data.dailyGoal = Number(elements.dailyGoal.value);
  saveData();
  renderDashboard();
  elements.settingsDialog.close();
});

elements.endBreak.addEventListener("click", endBreak);
elements.distractionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const updated = addUniqueDistraction(data.distractions, elements.distractionInput.value);
  if (updated === data.distractions) return;
  data.distractions = updated;
  elements.distractionInput.value = "";
  saveData();
  renderDistractions();
});

elements.interventionButton.addEventListener("click", startIntervention);
elements.closeIntervention.addEventListener("click", closeIntervention);
elements.interventionDialog.addEventListener("close", () => window.clearInterval(breathTimerId));
elements.returnFocus.addEventListener("click", () => completeIntervention("returned"));
elements.continueIntentionally.addEventListener("click", () => completeIntervention("continued"));

function startBreak() {
  if (running) toggleTimer();
  window.clearInterval(breakTimerId);
  breakSeconds = data.breakLength * 60;
  renderBreakTimer();
  elements.breakDialog.showModal();
  const breakDeadline = Date.now() + breakSeconds * 1000;
  breakTimerId = window.setInterval(() => {
    breakSeconds = Math.max(0, Math.ceil((breakDeadline - Date.now()) / 1000));
    renderBreakTimer();
    if (breakSeconds <= 0) endBreak();
  }, 1000);
}

function renderBreakTimer() {
  elements.breakTimer.textContent = formatTime(breakSeconds);
}

function endBreak() {
  window.clearInterval(breakTimerId);
  if (elements.breakDialog.open) elements.breakDialog.close();
}

function startIntervention() {
  window.clearInterval(breathTimerId);
  breathSeconds = 5;
  elements.breathCount.textContent = breathSeconds;
  elements.interventionBreathe.hidden = false;
  elements.interventionChoice.hidden = true;
  elements.interventionDialog.showModal();
  breathTimerId = window.setInterval(() => {
    breathSeconds -= 1;
    elements.breathCount.textContent = Math.max(0, breathSeconds);
    if (breathSeconds <= 0) {
      window.clearInterval(breathTimerId);
      elements.interventionBreathe.hidden = true;
      elements.interventionChoice.hidden = false;
    }
  }, 1000);
}

function completeIntervention(choice) {
  data.interventions.push({
    distraction: elements.interventionDistraction.value,
    choice,
    completedAt: new Date().toISOString()
  });
  saveData();
  elements.urgeCount.textContent = data.interventions.length;
  closeIntervention();
}

function closeIntervention() {
  window.clearInterval(breathTimerId);
  if (elements.interventionDialog.open) elements.interventionDialog.close();
}

renderTimer();
renderDashboard();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Offline support could not be enabled", error);
  });
}
