// attempt to catch engine crashes. doesn't work for the most part but is probably helpful to keep around.

let crashError = null;
let restartHandler = null;

export function installCrashRecovery(onRestart) {
  restartHandler = onRestart;

  window.addEventListener('error', (event) => {
    handleCrash(event.error ?? new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleCrash(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
}

export function guardFrame(callback) {
  if (crashError) {
    return;
  }

  try {
    callback();
  } catch (error) {
    handleCrash(error);
  }
}

export function isCrashed() {
  return crashError !== null;
}

export function drawCrashScreen() {
  background('#120506');
  push();
  fill('#ffb0a8');
  textAlign(CENTER, CENTER);
  textSize(28);
  text('GAME STOPPED', width / 2, height / 2 - 90);
  textSize(16);
  text('An error was printed to the console.', width / 2, height / 2 - 45);
  text('Press a key or click to restart.', width / 2, height / 2 + 5);
  textSize(12);
  text(String(crashError), width / 2, height / 2 + 55, width - 80, 100);
  pop();
}

function handleCrash(error) {
  if (crashError) {
    return;
  }

  crashError = error instanceof Error ? error : new Error(String(error));
  console.error('Dynamite Dan stopped after an error:', crashError);
  window.addEventListener('keydown', restartOnce, { once: true });
  window.addEventListener('pointerdown', restartOnce, { once: true });
}

function restartOnce() {
  if (!crashError || !restartHandler) {
    return;
  }

  crashError = null;
  restartHandler();
}
