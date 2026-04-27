const STORAGE_KEY = "level-up-fitness-state";

const defaultState = {
    profile: {
        name: "Hunter",
        goal: "Build Strength",
        accent: "cyan"
    },
    xp: 0,
    quests: [
        { id: "pushups", title: "100 Pushups", detail: "Strength training", xp: 25, done: false },
        { id: "situps", title: "100 Situps", detail: "Core training", xp: 25, done: false },
        { id: "squats", title: "100 Squats", detail: "Leg training", xp: 25, done: false },
        { id: "run", title: "10 Minute Run", detail: "Endurance training", xp: 25, done: false }
    ],
    workouts: [],
    meals: []
};

let state = loadState();

document.addEventListener("DOMContentLoaded", () => {
    setupLogin();
    setupForms();
    applyAccent();
    renderShared();
    renderPage();
});

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!saved) return structuredClone(defaultState);

        return {
            ...structuredClone(defaultState),
            ...saved,
            profile: { ...defaultState.profile, ...(saved.profile || {}) },
            quests: Array.isArray(saved.quests) && saved.quests.length ? saved.quests : structuredClone(defaultState.quests),
            workouts: Array.isArray(saved.workouts) ? saved.workouts : [],
            meals: Array.isArray(saved.meals) ? saved.meals : []
        };
    } catch (error) {
        return structuredClone(defaultState);
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setupLogin() {
    const loginBtn = document.getElementById("loginBtn");
    const loginScreen = document.getElementById("loginScreen");
    const app = document.getElementById("app");
    const loginError = document.getElementById("loginError");

    if (!loginBtn || !loginScreen || !app || !loginError) return;

    loginBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if ((username === "admin" && password === "1234") || username.length > 0) {
            loginScreen.classList.add("hidden");
            app.classList.remove("hidden");
            if (username && username !== "admin") {
                state.profile.name = username;
                saveState();
                renderShared();
            }
        } else {
            loginError.textContent = "Enter a username to continue.";
        }
    });
}

function setupForms() {
    const workoutForm = document.getElementById("workoutForm");
    if (workoutForm) {
        workoutForm.addEventListener("submit", (event) => {
            event.preventDefault();
            addWorkout();
        });
    }

    const mealForm = document.getElementById("mealForm");
    if (mealForm) {
        mealForm.addEventListener("submit", (event) => {
            event.preventDefault();
            addMeal();
        });
    }

    const saveProfile = document.getElementById("saveProfile");
    if (saveProfile) {
        saveProfile.addEventListener("click", () => {
            state.profile.name = document.getElementById("profileNameInput").value.trim() || "Hunter";
            state.profile.goal = document.getElementById("goalInput").value;
            state.profile.accent = document.getElementById("accentInput").value;
            saveState();
            applyAccent();
            renderShared();
            showToast("Profile Updated", `${state.profile.goal} protocol loaded.`);
        });
    }

    const resetDaily = document.getElementById("resetDaily");
    if (resetDaily) {
        resetDaily.addEventListener("click", () => {
            state.quests = state.quests.map((quest) => ({ ...quest, done: false }));
            saveState();
            renderPage();
            showToast("Daily Reset", "Quest board is ready for another run.");
        });
    }

    const resetAll = document.getElementById("resetAll");
    if (resetAll) {
        resetAll.addEventListener("click", () => {
            state = structuredClone(defaultState);
            saveState();
            applyAccent();
            renderShared();
            renderPage();
            showToast("System Reset", "Local progress has been cleared.");
        });
    }
}

function addWorkout() {
    const exercise = document.getElementById("exerciseInput").value.trim();
    const minutes = Number(document.getElementById("minutesInput").value);
    const calories = Number(document.getElementById("caloriesInput").value);
    const intensity = document.getElementById("intensityInput").value;

    if (!exercise || minutes <= 0) return;

    const multiplier = { light: 1, normal: 1.3, hard: 1.7, boss: 2.2 }[intensity] || 1;
    const earnedXp = Math.max(10, Math.round(minutes * multiplier));

    state.workouts.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        exercise,
        minutes,
        calories,
        intensity,
        xp: earnedXp,
        date: new Date().toISOString()
    });
    state.xp += earnedXp;
    saveState();

    document.getElementById("workoutForm").reset();
    document.getElementById("minutesInput").value = 30;
    document.getElementById("caloriesInput").value = 180;

    renderShared();
    renderPage();
    showToast("Workout Complete", `You gained ${earnedXp} XP.`);
}

function addMeal() {
    const meal = document.getElementById("mealInput").value.trim();
    const protein = Number(document.getElementById("proteinInput").value);
    const calories = Number(document.getElementById("mealCaloriesInput").value);
    if (!meal) return;

    state.meals.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        meal,
        protein,
        calories,
        date: new Date().toISOString()
    });
    saveState();
    document.getElementById("mealForm").reset();
    renderPage();
    showToast("Nutrition Logged", "Meal added to today's support items.");
}

function toggleQuest(id) {
    const quest = state.quests.find((item) => item.id === id);
    if (!quest) return;

    quest.done = !quest.done;
    state.xp = Math.max(0, state.xp + (quest.done ? quest.xp : -quest.xp));
    saveState();
    renderShared();
    renderPage();
    showToast(quest.done ? "Quest Complete" : "Quest Reopened", `${quest.title}: ${quest.done ? "+" : "-"}${quest.xp} XP`);
}

function renderShared() {
    const level = getLevel(state.xp);
    const currentXp = state.xp % 100;
    setText("hunterName", state.profile.name);
    setText("rankBadge", getRank(level));
    setText("levelNum", level);
    setText("expText", `${currentXp} / 100 XP`);
    setText("totalXp", state.xp);
    setText("streakCount", `${getStreak()} days`);
    setText("workoutCount", state.workouts.length);
    setText("calorieCount", getWorkoutCalories());

    const expBar = document.getElementById("expBar");
    if (expBar) expBar.style.width = `${currentXp}%`;

    const profileNameInput = document.getElementById("profileNameInput");
    if (profileNameInput) profileNameInput.value = state.profile.name;
    const goalInput = document.getElementById("goalInput");
    if (goalInput) goalInput.value = state.profile.goal;
    const accentInput = document.getElementById("accentInput");
    if (accentInput) accentInput.value = state.profile.accent;
}

function renderPage() {
    renderQuestList("questPreview", 3);
    renderQuestList("questList");
    renderWorkouts();
    renderMeals();
    renderStats();
    renderCalendar();
}

function renderQuestList(id, limit) {
    const container = document.getElementById(id);
    if (!container) return;

    const quests = typeof limit === "number" ? state.quests.slice(0, limit) : state.quests;
    container.innerHTML = quests.map((quest) => `
        <button class="quest-item ${quest.done ? "done" : ""}" data-quest="${quest.id}" type="button">
            <span class="check-glyph">X</span>
            <span>
                <strong>${escapeHtml(quest.title)}</strong>
                <small>${escapeHtml(quest.detail)}</small>
            </span>
            <span class="xp-pill">+${quest.xp} XP</span>
        </button>
    `).join("");

    container.querySelectorAll("[data-quest]").forEach((item) => {
        item.addEventListener("click", () => toggleQuest(item.dataset.quest));
    });
}

function renderWorkouts() {
    const containers = ["recentWorkouts", "workoutHistory"];
    containers.forEach((id) => {
        const container = document.getElementById(id);
        if (!container) return;

        const items = id === "recentWorkouts" ? state.workouts.slice(0, 4) : state.workouts;
        container.innerHTML = items.length ? items.map(workoutTemplate).join("") : `<p class="muted">No completed workouts yet.</p>`;
    });
}

function workoutTemplate(workout) {
    const date = new Date(workout.date);
    return `
        <article class="timeline-entry">
            <span>
                <strong>${escapeHtml(workout.exercise)}</strong>
                <small>${date.toLocaleDateString()} - ${workout.minutes} min - ${workout.intensity}</small>
            </span>
            <span class="xp-pill">+${workout.xp} XP</span>
        </article>
    `;
}

function renderMeals() {
    const container = document.getElementById("mealHistory");
    if (!container) return;

    container.innerHTML = state.meals.length ? state.meals.map((meal) => `
        <article class="timeline-entry">
            <span>
                <strong>${escapeHtml(meal.meal)}</strong>
                <small>${meal.protein || 0}g protein - ${meal.calories || 0} calories</small>
            </span>
            <span class="xp-pill">Fuel</span>
        </article>
    `).join("") : `<p class="muted">No meals logged yet.</p>`;
}

function renderStats() {
    const statBars = document.getElementById("statBars");
    if (statBars) {
        const totals = [
            { label: "Minutes Trained", value: state.workouts.reduce((sum, workout) => sum + Number(workout.minutes || 0), 0) },
            { label: "Calories Burned", value: getWorkoutCalories() },
            { label: "Quest Clears", value: state.quests.filter((quest) => quest.done).length },
            { label: "Boss Sessions", value: state.workouts.filter((workout) => workout.intensity === "boss").length }
        ];
        const maxValue = Math.max(1, ...totals.map((item) => item.value));
        statBars.innerHTML = totals.map((item) => `
            <div class="bar-row">
                <div class="bar-heading"><strong>${item.label}</strong><span>${item.value}</span></div>
                <div class="bar-track"><span style="width: ${(item.value / maxValue) * 100}%"></span></div>
            </div>
        `).join("");
    }

    const leaderboard = document.getElementById("leaderboard");
    if (leaderboard) {
        const rows = [
            { name: "Cha", xp: 820 },
            { name: "Baek", xp: 610 },
            { name: state.profile.name, xp: state.xp },
            { name: "Min", xp: 390 },
            { name: "D-Rank Rookie", xp: 120 }
        ].sort((a, b) => b.xp - a.xp);
        leaderboard.innerHTML = rows.map((row) => `<li><strong>${escapeHtml(row.name)}</strong> - ${row.xp} XP</li>`).join("");
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById("calendarGrid");
    if (!calendarGrid) return;

    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const completedByDay = state.workouts.reduce((map, workout) => {
        const day = new Date(workout.date).getDate();
        map[day] = (map[day] || 0) + 1;
        return map;
    }, {});

    const blanks = Array.from({ length: first.getDay() }, () => `<div class="calendar-day"></div>`);
    const days = Array.from({ length: last.getDate() }, (_, index) => {
        const day = index + 1;
        const count = completedByDay[day] || 0;
        return `
            <div class="calendar-day ${day === today.getDate() ? "active-day" : ""}">
                <strong>${day}</strong>
                <small>${count ? `${count} workout${count > 1 ? "s" : ""}` : "Open"}</small>
            </div>
        `;
    });

    calendarGrid.innerHTML = [...blanks, ...days].join("");
}

function applyAccent() {
    document.body.classList.remove("violet", "emerald");
    if (state.profile.accent !== "cyan") document.body.classList.add(state.profile.accent);
}

function getLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

function getRank(level) {
    if (level >= 20) return "S-Rank";
    if (level >= 15) return "A-Rank";
    if (level >= 10) return "B-Rank";
    if (level >= 6) return "C-Rank";
    if (level >= 3) return "D-Rank";
    return "E-Rank";
}

function getWorkoutCalories() {
    return state.workouts.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);
}

function getStreak() {
    const uniqueDays = new Set(state.workouts.map((workout) => new Date(workout.date).toDateString()));
    let streak = 0;
    const cursor = new Date();

    while (uniqueDays.has(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function showToast(title, message) {
    let toast = document.getElementById("systemToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "systemToast";
        toast.className = "system-toast";
        toast.innerHTML = `<p class="eyebrow">System</p><strong id="toastTitle"></strong><span id="toastMessage"></span>`;
        document.body.appendChild(toast);
    }

    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastMessage").textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}
