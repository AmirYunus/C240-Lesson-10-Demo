const WORK_DURATION_SECONDS = 25 * 60;

let remainingSeconds = WORK_DURATION_SECONDS;
let timerIntervalId = null;
let timerDisplayElement = null;

const state = { isRunning: false, phase: "work" };

function initPomodoroApp() {
	timerDisplayElement = document.getElementById("timer-display");

	updateTimerDisplay(
		Math.floor(remainingSeconds / 60),
		remainingSeconds % 60,
	);

	bindEventListeners();
}

function startTimer() {
	if (timerIntervalId !== null) {
		return;
	}

	state.isRunning = true;
	timerIntervalId = window.setInterval(() => {
		if (remainingSeconds <= 0) {
			clearInterval(timerIntervalId);
			timerIntervalId = null;
			return;
		}

		remainingSeconds -= 1;
		updateTimerDisplay(
			Math.floor(remainingSeconds / 60),
			remainingSeconds % 60,
		);

		if (remainingSeconds === 0) {
			clearInterval(timerIntervalId);
			timerIntervalId = null;
			console.log("work complete");
		}
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
	remainingSeconds = WORK_DURATION_SECONDS;
	state.phase = "work";
	state.isRunning = false;
	updateTimerDisplay(
		Math.floor(remainingSeconds / 60),
		remainingSeconds % 60,
	);
}

function handleTimerTick() {}

function switchMode(newMode) {}

function updateProgressCircle(percent) {}

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
