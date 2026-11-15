import {
  setState,
  updateState,
  drawState,
  drawStateHud
} from './states.js';

import { fitCameraToCanvas } from './camera.js';

// No size = fill the browser window.
await Canvas();
fitCameraToCanvas();

// Box2D units: meters/s², with 60px to a meter. 30 gives a snappy,
// non-floaty jump arc.
world.gravity.y = 30;

q5.windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
  fitCameraToCanvas();
};

q5.update = function () {
  updateState();
};

q5.draw = function () {
  drawState();
};

// Runs after q5play has drawn the sprites, so HUD text stays on top.
q5.postProcess = function () {
  drawStateHud();
};

setState('menu');
