// How many world pixels tall the view should be, whatever the window size.
// Smaller = more zoomed in. 270 gives exactly 4x zoom on a 1080p screen.
const VIEW_HEIGHT = 270;

// 0..1, how quickly the camera catches up to its target each frame.
const FOLLOW_SPEED = 0.15;

let snapNextFrame = true;

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
}
