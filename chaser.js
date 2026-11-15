// The chaser: spawns when the chase starts and flies straight at Dan,
// through walls, getting faster over time. Touching it ends the run.
//
// No art yet, so it's drawn with a debug renderer: q5play's collider
// outline (sprite.debug) plus a label, its speed, and a line to Dan.

const FRAME_SECONDS = 1 / 60;

const WIND_UP_SECONDS = 0.75; // pause after spawning so you can react
const START_SPEED = 2.6; // meters/second (Dan runs at 3.2)
const MAX_SPEED = 4.2;
const SPEED_GAIN_PER_SECOND = 0.2;

export function createChaser(settings) {
  // Kinematic sensor: moves where we tell it, passes through tiles,
  // and never shoves anything.
  const sprite = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'kinematic'
  );

  sprite.debug = true;
  sprite.ignoreRays = true; // don't block blasts or ground checks
  sprite.isChaser = true;

  return {
    sprite,
    speed: START_SPEED,
    windUp: WIND_UP_SECONDS,
    age: 0
  };
}

export function deleteChaser(chaser) {
  chaser?.sprite.delete();
}

// Returns true when the chaser has caught the player.
export function updateChaser(chaser, player) {
  if (!chaser || !player) {
    return false;
  }

  const sprite = chaser.sprite;
  chaser.age += FRAME_SECONDS;

  if (chaser.windUp > 0) {
    chaser.windUp -= FRAME_SECONDS;
    sprite.vel.x = 0;
    sprite.vel.y = 0;
    return false;
  }

  chaser.speed = Math.min(
    MAX_SPEED,
    chaser.speed + SPEED_GAIN_PER_SECOND * FRAME_SECONDS
  );

  const dx = player.x - sprite.x;
  const dy = player.y - sprite.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;

  sprite.vel.x = (dx / distance) * chaser.speed;
  sprite.vel.y = (dy / distance) * chaser.speed;

  return overlaps(sprite, player);
}

function overlaps(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

// Debug-style rendering. Call with the camera on.
export function drawChaser(chaser, player) {
  if (!chaser) {
    return;
  }

  const sprite = chaser.sprite;
  const winding = chaser.windUp > 0;

  push();

  // Line to Dan with the distance at its midpoint.
  if (player) {
    stroke('#ff3cc8');
    strokeWeight(1);
    line(sprite.x, sprite.y, player.x, player.y);

    const distance = dist(sprite.x, sprite.y, player.x, player.y);
    noStroke();
    fill('#ff3cc8');
    textSize(7);
    textAlign(CENTER, CENTER);
    text(
      Math.round(distance) + 'px',
      (sprite.x + player.x) / 2,
      (sprite.y + player.y) / 2 - 6
    );
  }

  // Body: translucent box (flashing during the wind-up).
  rectMode(CENTER);
  const flash = winding && Math.floor(chaser.age * 10) % 2 === 0;
  fill(flash ? '#ffffff66' : '#ff3cc855');
  stroke('#ff3cc8');
  strokeWeight(2);
  rect(sprite.x, sprite.y, sprite.w, sprite.h);

  // Cross through the middle, like a missing-texture placeholder.
  strokeWeight(1);
  line(sprite.x - sprite.w / 2, sprite.y - sprite.h / 2, sprite.x + sprite.w / 2, sprite.y + sprite.h / 2);
  line(sprite.x + sprite.w / 2, sprite.y - sprite.h / 2, sprite.x - sprite.w / 2, sprite.y + sprite.h / 2);

  // Labels
  noStroke();
  fill('#ffffff');
  textSize(8);
  textAlign(CENTER, BOTTOM);
  text('CHASER', sprite.x, sprite.y - sprite.h / 2 - 9);
  fill('#ffb3ea');
  textSize(6);
  text(
    winding ? 'waking up...' : chaser.speed.toFixed(2) + ' m/s',
    sprite.x,
    sprite.y - sprite.h / 2 - 2
  );

  pop();
}
