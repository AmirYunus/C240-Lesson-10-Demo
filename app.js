const WORK_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;

let remainingSeconds = WORK_DURATION_SECONDS;
let timerIntervalId = null;
let timerDisplayElement = null;
let phaseLabelElement = null;
let progressRingFillElement = null;

const state = { isRunning: false, phase: "work" };

function initPomodoroApp() {
	timerDisplayElement = document.getElementById("timer-value");
	phaseLabelElement = document.getElementById("phase-label");
	progressRingFillElement = document.getElementById("progress-ring-fill");
	initializeProgressRing();

	updateTimerDisplay(
		Math.floor(remainingSeconds / 60),
		remainingSeconds % 60,
	);
	updatePhaseLabel();
	updateProgressCircle(100);

	bindEventListeners();
}

function startTimer() {
	if (timerIntervalId !== null) {
		return;
	}

	state.isRunning = true;
	timerIntervalId = window.setInterval(() => {
		if (remainingSeconds <= 0) {
			switchMode(state.phase === "work" ? "break" : "work");
			return;
		}

		remainingSeconds -= 1;
		handleTimerTick();
	}, 1000);
}

function pauseTimer() {
	clearInterval(timerIntervalId);
	timerIntervalId = null;
	state.isRunning = false;
}

function resumeTimer() {
	startTimer();
}

function resetTimer() {
	clearInterval(timerIntervalId);
	timerIntervalId = null;
	state.phase = "work";
	state.isRunning = false;
	remainingSeconds = WORK_DURATION_SECONDS;
	updatePhaseLabel();
	handleTimerTick();
}

function handleTimerTick() {
	updateTimerDisplay(
		Math.floor(remainingSeconds / 60),
		remainingSeconds % 60,
	);

	const phaseDuration = getDurationForPhase(state.phase);
	const percentRemaining = phaseDuration === 0
		? 0
		: (remainingSeconds / phaseDuration) * 100;
	updateProgressCircle(percentRemaining);
}

function initializeProgressRing() {
	if (!progressRingFillElement) {
		return;
	}

	const radius = Number(progressRingFillElement.getAttribute("r"));
	const circumference = 2 * Math.PI * radius;
	progressRingFillElement.dataset.circumference = String(circumference);
	progressRingFillElement.style.strokeDasharray = `${circumference} ${circumference}`;
	progressRingFillElement.style.strokeDashoffset = "0";
}

function updateProgressCircle(percent) {
	if (!progressRingFillElement) {
		return;
	}

	const circumference = Number(progressRingFillElement.dataset.circumference);
	if (!Number.isFinite(circumference)) {
		return;
	}

	const clampedPercent = Math.max(0, Math.min(100, percent));
	const offset = circumference * (1 - clampedPercent / 100);
	progressRingFillElement.style.strokeDashoffset = String(offset);
}

function playTransitionSound() {}

function updateSessionCounter(increment) {}

function loadSessionCounter() {}

function saveSessionCounter(count) {}

function updateTimerDisplay(minutes, seconds) {
	if (!timerDisplayElement) {
		return;
	}

	const minuteText = String(minutes).padStart(2, "0");
	const secondText = String(seconds).padStart(2, "0");
	timerDisplayElement.textContent = `${minuteText}:${secondText}`;
}

function getDurationForPhase(phase) {
	return phase === "break" ? BREAK_DURATION_SECONDS : WORK_DURATION_SECONDS;
}

function updatePhaseLabel() {
	if (!phaseLabelElement) {
		return;
	}

	phaseLabelElement.textContent = state.phase === "break" ? "Break" : "Work";
}

function switchMode(newMode) {
	if (newMode !== "work" && newMode !== "break") {
		return;
	}

	state.phase = newMode;
	remainingSeconds = getDurationForPhase(newMode);
	updatePhaseLabel();
	handleTimerTick();
}

function setControlStates(state) {}

function bindEventListeners() {
	const pauseResumeBtn = document.getElementById("pause-btn");
	const resetBtn = document.getElementById("reset-btn");

	pauseResumeBtn.addEventListener("click", () => {
		if (state.isRunning) {
			pauseTimer();
			pauseResumeBtn.textContent = "Resume";
		} else {
			resumeTimer();
			pauseResumeBtn.textContent = "Pause";
		}
	});

	resetBtn.addEventListener("click", () => {
		if (resetBtn.textContent === "Start") {
			startTimer();
			pauseResumeBtn.textContent = "Pause";
			pauseResumeBtn.hidden = false;
			resetBtn.textContent = "Reset";
		} else {
			resetTimer();
			pauseResumeBtn.hidden = true;
			resetBtn.textContent = "Start";
		}
	});
}

document.addEventListener("DOMContentLoaded", initPomodoroApp);
