const VIEW_HEIGHT = 360; // how many world pixels tall view should be, irrespective of window size. basically zoom level.

const FOLLOW_SPEED = 0.15; // how quickly the camera catches up to its target each frame
const CHASE_LOOKAHEAD = 0.35;
const MAX_CHASE_OFFSET_X = 120;
const MAX_CHASE_OFFSET_Y = 80;
const FRAME_SECONDS = 1 / 60;

let snapNextFrame = true;
let shakeTime = 0;
let shakeMagnitude = 0;

export function fitCameraToCanvas() {
  camera.zoom = height / VIEW_HEIGHT;

  // resizeCanvas() resets the camera position, so jump straight back
  // to the target instead of sliding across the level.
  snapNextFrame = true;
}

export function snapCamera() {
  snapNextFrame = true;
}

export function followCamera(target) {
  if (!target) {
    return;
  }

  if (snapNextFrame) {
    camera.x = target.x;
    camera.y = target.y;
    snapNextFrame = false;
    return;
  }

  camera.x += (target.x - camera.x) * FOLLOW_SPEED;
  camera.y += (target.y - camera.y) * FOLLOW_SPEED;

  if (shakeTime > 0) {
    camera.x += random(-shakeMagnitude, shakeMagnitude);
    camera.y += random(-shakeMagnitude, shakeMagnitude);
    shakeTime = Math.max(0, shakeTime - FRAME_SECONDS);
    shakeMagnitude *= 0.94;
  }
}

export function shakeCamera(duration, magnitude) {
  shakeTime = Math.max(shakeTime, duration);
  shakeMagnitude = Math.max(shakeMagnitude, magnitude);
}

export function followChaseCamera(player, chaser) {
  if (!player) {
    return;
  }

  if (!chaser?.sprite) {
    followCamera(player);
    return;
  }

  const sprite = chaser.sprite;
  const offsetX = constrain(
    (sprite.x - player.x) * CHASE_LOOKAHEAD,
    -MAX_CHASE_OFFSET_X,
    MAX_CHASE_OFFSET_X
  );
  const offsetY = constrain(
    (sprite.y - player.y) * CHASE_LOOKAHEAD,
    -MAX_CHASE_OFFSET_Y,
    MAX_CHASE_OFFSET_Y
  );

  followCamera({
    x: player.x + offsetX,
    y: player.y + offsetY
  });
}
