const WORK_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;
const SESSION_STORAGE_KEY = "pomodoroSessions";
const TIMER_STATE_STORAGE_KEY = "pomodoroTimerState";

let remainingSeconds = WORK_DURATION_SECONDS;
let timerIntervalId = null;
let timerDisplayElement = null;
let phaseLabelElement = null;
let progressRingFillElement = null;
let sessionCountElement = null;
let audioContext = null;

const state = { isRunning: false, phase: "work", sessionCount: 0 };

function initPomodoroApp() {
	timerDisplayElement = document.getElementById("timer-value");
	phaseLabelElement = document.getElementById("phase-label");
	progressRingFillElement = document.getElementById("progress-ring-fill");
	sessionCountElement = document.getElementById("session-count");
	initializeProgressRing();
	loadSessionCounter();
	loadTimerState();

	updatePhaseLabel();
	handleTimerTick();
	setControlStates();

	bindEventListeners();
}

function startTimer() {
	if (timerIntervalId !== null) {
		return;
	}

	state.isRunning = true;
	saveTimerState();
	timerIntervalId = window.setInterval(() => {
		if (remainingSeconds <= 0) {
			const nextPhase = state.phase === "work" ? "break" : "work";
			if (state.phase === "work" && nextPhase === "break") {
				updateSessionCounter(1);
			}
			switchMode(nextPhase);
			playTransitionSound(nextPhase);
			return;
		}

		remainingSeconds -= 1;
		handleTimerTick();
		playTickSound(); // Play tick sound every second
	}, 1000);
}

function pauseTimer() {
	clearInterval(timerIntervalId);
	timerIntervalId = null;
	state.isRunning = false;
	saveTimerState();
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
	setControlStates();
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
	saveTimerState();
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

function ensureAudioContext() {
	if (audioContext) {
		if (audioContext.state === "suspended") {
			audioContext.resume();
		}
		return audioContext;
	}

	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextClass) {
		return null;
	}

	audioContext = new AudioContextClass();
	if (audioContext.state === "suspended") {
		audioContext.resume();
	}

	return audioContext;
}

function playTransitionSound(nextPhase) {
	playTone(nextPhase === "break" ? 440 : 660, 0.2, 0.2, "sine");
}

function playTickSound() {
	playTone(1000, 0.06, 0.05, "square");
}

function playButtonClickSound() {
	playTone(1800, 0.05, 0.07, "triangle");
}

function playTone(frequency, durationSeconds, peakGain, type) {
	const context = ensureAudioContext();
	if (!context) {
		return;
	}

	const startAt = context.currentTime;
	const stopAt = startAt + durationSeconds;

	const oscillator = context.createOscillator();
	const gainNode = context.createGain();

	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, startAt);

	gainNode.gain.setValueAtTime(0.0001, startAt);
	gainNode.gain.exponentialRampToValueAtTime(
		Math.max(0.0002, peakGain),
		startAt + Math.min(0.02, durationSeconds / 2),
	);
	gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

	oscillator.connect(gainNode);
	gainNode.connect(context.destination);

	oscillator.start(startAt);
	oscillator.stop(stopAt);
}

function updateSessionCounter(increment) {
	if (!Number.isFinite(increment)) {
		return;
	}

	const nextCount = Math.max(0, state.sessionCount + Math.trunc(increment));
	state.sessionCount = nextCount;
	saveSessionCounter(nextCount);
	updateSessionCounterDisplay();
}

function loadSessionCounter() {
	const savedValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
	const parsedValue = Number.parseInt(savedValue ?? "0", 10);

	state.sessionCount = Number.isFinite(parsedValue) && parsedValue >= 0
		? parsedValue
		: 0;
	updateSessionCounterDisplay();
}

function saveSessionCounter(count) {
	window.localStorage.setItem(SESSION_STORAGE_KEY, String(count));
}

function updateSessionCounterDisplay() {
	if (!sessionCountElement) {
		return;
	}

	sessionCountElement.textContent = String(state.sessionCount);
}

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

function saveTimerState() {
	const timerState = {
		phase: state.phase,
		remainingSeconds,
		isRunning: state.isRunning,
	};

	window.localStorage.setItem(
		TIMER_STATE_STORAGE_KEY,
		JSON.stringify(timerState),
	);
}

function loadTimerState() {
	const rawTimerState = window.localStorage.getItem(TIMER_STATE_STORAGE_KEY);
	if (!rawTimerState) {
		return;
	}

	try {
		const parsedState = JSON.parse(rawTimerState);
		const isValidPhase = parsedState.phase === "work" || parsedState.phase === "break";
		const phaseForValidation = isValidPhase ? parsedState.phase : "work";
		const maxDuration = getDurationForPhase(phaseForValidation);
		const parsedRemaining = Number.parseInt(String(parsedState.remainingSeconds), 10);
		const isValidRemaining = Number.isFinite(parsedRemaining) && parsedRemaining >= 0 &&
			parsedRemaining <= maxDuration;

		if (!isValidPhase || !isValidRemaining) {
			return;
		}

		state.phase = parsedState.phase;
		remainingSeconds = parsedRemaining;
		state.isRunning = false;
	} catch {
		// Ignore malformed persisted state and keep defaults.
	}
}

function hasTimerProgress() {
	return state.phase !== "work" || remainingSeconds !== WORK_DURATION_SECONDS;
}

function setControlStates() {
	const pauseResumeBtn = document.getElementById("pause-btn");
	const resetBtn = document.getElementById("reset-btn");

	if (!pauseResumeBtn || !resetBtn) {
		return;
	}

	if (state.isRunning) {
		pauseResumeBtn.hidden = false;
		pauseResumeBtn.textContent = "Pause";
		resetBtn.textContent = "Reset";
		return;
	}

	if (hasTimerProgress()) {
		pauseResumeBtn.hidden = false;
		pauseResumeBtn.textContent = "Resume";
		resetBtn.textContent = "Reset";
		return;
	}

	pauseResumeBtn.hidden = true;
	pauseResumeBtn.textContent = "Pause";
	resetBtn.textContent = "Start";
}

function bindEventListeners() {
	const pauseResumeBtn = document.getElementById("pause-btn");
	const resetBtn = document.getElementById("reset-btn");
	const resetSessionsBtn = document.getElementById("reset-sessions-btn");
	const buttons = document.querySelectorAll("button");

	buttons.forEach((button) => {
		button.addEventListener("click", () => {
			playButtonClickSound();
		});
	});

	pauseResumeBtn.addEventListener("click", () => {
		ensureAudioContext();

		if (state.isRunning) {
			pauseTimer();
		} else {
			resumeTimer();
		}

		setControlStates();
	});

	resetBtn.addEventListener("click", () => {
		ensureAudioContext();

		if (resetBtn.textContent === "Start") {
			startTimer();
		} else {
			resetTimer();
		}

		setControlStates();
	});

	resetSessionsBtn.addEventListener("click", () => {
		state.sessionCount = 0;
		saveSessionCounter(0);
		updateSessionCounterDisplay();
	});
}

document.addEventListener("DOMContentLoaded", initPomodoroApp);
