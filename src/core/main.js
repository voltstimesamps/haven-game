import {
  setState,
  updateState,
  drawState,
  drawStateHud
} from './states.js';

import { fitCameraToCanvas } from './camera.js';
import {
  drawCrashScreen,
  guardFrame,
  installCrashRecovery,
  isCrashed
} from './crash.js';

// No size = fill the browser window.
await Canvas();
fitCameraToCanvas();
installCrashRecovery(() => setState('menu'));

world.gravity.y = 30;

q5.windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
  fitCameraToCanvas();
};

q5.update = function () {
  guardFrame(updateState);
};

q5.draw = function () {
  if (isCrashed()) {
    drawCrashScreen();
    return;
  }

  guardFrame(drawState);

  if (isCrashed()) {
    drawCrashScreen();
  }
};

// make sure hud stays on top of all other draws
q5.postProcess = function () {
  if (!isCrashed()) {
    guardFrame(drawStateHud);
  }
};

guardFrame(() => setState('menu'));
