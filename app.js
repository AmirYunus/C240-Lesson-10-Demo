const WORK_DURATION_SECONDS = 25 * 60;

let remainingSeconds = WORK_DURATION_SECONDS;
let timerIntervalId = null;
let timerDisplayElement = null;

function initPomodoroApp() {
	timerDisplayElement = document.getElementById("timer-display");

	updateTimerDisplay(
		Math.floor(remainingSeconds / 60),
		remainingSeconds % 60,
	);

	startTimer();
}

function startTimer() {
	if (timerIntervalId !== null) {
		return;
	}

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

function pauseTimer() {}

function resumeTimer() {}

function resetTimer() {}

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

document.addEventListener("DOMContentLoaded", initPomodoroApp);
