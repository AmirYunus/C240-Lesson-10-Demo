const WORK_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;

let remainingSeconds = WORK_DURATION_SECONDS;
let timerIntervalId = null;
let timerDisplayElement = null;
let phaseLabelElement = null;
let progressRingFillElement = null;
let audioContext = null;

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
			const nextPhase = state.phase === "work" ? "break" : "work";
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
			pauseResumeBtn.textContent = "Resume";
		} else {
			resumeTimer();
			pauseResumeBtn.textContent = "Pause";
		}
	});

	resetBtn.addEventListener("click", () => {
		ensureAudioContext();

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
