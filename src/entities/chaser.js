import { debugEnabled } from '../core/debug.js';

// big enemy guy
// flies towards dan through walls while spilling physics particles everywhere to make clear it's evilness

const FRAME_SECONDS = 1 / 60;

const CINEMATIC_SECONDS = 12; // wait for the song intro to complete before chaser starts chasing
const INTRO_START_PARTICLES = 4;
const INTRO_END_PARTICLES = 72;
const ACTIVE_PARTICLE_COUNT = 28;
const PARTICLE_LIFE_SECONDS = 2.2;
const PARTICLE_EMIT_INTERVAL = 0.08;

const KNOCKBACK_RADIUS = 200;
const KNOCKBACK_FORCE = 12;
const STUN_SECONDS = 1.5;

const START_SPEED = 1;
const MAX_SPEED = 4;
const SPEED_GAIN_PER_SECOND = 0.2;

export function createChaser(settings) {
  const sprite = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'kinematic'
  );

  sprite.debug = debugEnabled('chaser');
  sprite.ignoreRays = true;
  sprite.isChaser = true;

  return {
    sprite,
    speed: START_SPEED,
    introRemaining: CINEMATIC_SECONDS,
    particles: [],
    particleEmitTimer: 0,
    stunRemaining: 0,
    age: 0
  };
}

export function deleteChaser(chaser) {
  for (const particle of chaser?.particles ?? []) {
    particle.delete();
  }

  chaser?.sprite.delete();
}

export function updateChaser(chaser, player) {
  if (!chaser || !player) {
    return false;
  }

  const sprite = chaser.sprite;
  chaser.age += FRAME_SECONDS;
  updateParticles(chaser);

  if (chaser.introRemaining > 0) {
    chaser.introRemaining = Math.max(
      0,
      chaser.introRemaining - FRAME_SECONDS
    );
    sprite.vel.x = 0;
    sprite.vel.y = 0;
    emitIntroParticles(chaser);
    return false;
  }

  if (chaser.stunRemaining > 0) {
    chaser.stunRemaining = Math.max(
      0,
      chaser.stunRemaining - FRAME_SECONDS
    );
    sprite.vel.x *= 0.9;
    sprite.vel.y *= 0.9;
    emitActiveParticles(chaser);
    return false;
  }

  emitActiveParticles(chaser);

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

function emitIntroParticles(chaser) {
  const progress = 1 - chaser.introRemaining / CINEMATIC_SECONDS;
  const desired = Math.floor(
    INTRO_START_PARTICLES +
      progress * (INTRO_END_PARTICLES - INTRO_START_PARTICLES)
  );
  const radius = 10 + progress * 80;
  const amount = Math.min(3, desired - chaser.particles.length);

  emitParticles(chaser, amount, radius);
}

function emitActiveParticles(chaser) {
  chaser.particleEmitTimer += FRAME_SECONDS;

  if (
    chaser.particleEmitTimer < PARTICLE_EMIT_INTERVAL ||
    chaser.particles.length >= ACTIVE_PARTICLE_COUNT
  ) {
    return;
  }

  chaser.particleEmitTimer = 0;
  emitParticles(chaser, 1, 8);
}

function emitParticles(chaser, count, radius) {
  if (count <= 0) {
    return;
  }

  const { sprite } = chaser;

  for (let i = 0; i < count; i++) {
    const angle = random(0, 360);
    const distance = random(radius * 0.7, radius);
    const particle = new Sprite(
      sprite.x + cos(angle) * distance,
      sprite.y + sin(angle) * distance,
      random(2, 5),
      'dynamic'
    );

    particle.color = random() > 0.5 ? '#3e171a' : '#4e1116';
    particle.opacity = random(0.45, 0.9);
    particle.gravityScale = 0.35;
    particle.friction = 0;
    particle.bounciness = 0.2;
    particle.rotationLock = true;
    particle.ignoreRays = true;
    particle.lifeRemaining = PARTICLE_LIFE_SECONDS;
    particle.vel.x = cos(angle) * random(1, 3);
    particle.vel.y = sin(angle) * random(1, 3);
    chaser.particles.push(particle);
  }
}

function updateParticles(chaser) {
  for (const particle of chaser.particles) {
    particle.lifeRemaining -= FRAME_SECONDS;
  }

  const expired = chaser.particles.filter(
    (particle) => particle.lifeRemaining <= 0
  );

  for (const particle of expired) {
    particle.delete();
  }

  chaser.particles = chaser.particles.filter(
    (particle) => particle.lifeRemaining > 0
  );
}

function overlaps(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

// dynamite pushes the chaser away and temporarily disables pursuit.
export function knockbackChaser(chaser, blastX, blastY) {
  if (!chaser?.sprite || chaser.introRemaining > 0) {
    return;
  }

  const sprite = chaser.sprite;
  const dx = sprite.x - blastX;
  const dy = sprite.y - blastY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > KNOCKBACK_RADIUS) {
    return;
  }

  const strength = 1 - distance / KNOCKBACK_RADIUS;
  const length = distance || 1;
  const impulse = KNOCKBACK_FORCE * strength * strength;

  sprite.vel.x += (dx / length) * impulse;
  sprite.vel.y += (dy / length) * impulse - impulse * 0.35;
  chaser.stunRemaining = Math.max(
    chaser.stunRemaining,
    STUN_SECONDS * strength
  );
}

// draw the chaser with debug renderers as we dont have assets right now.
export function drawChaser(chaser, player) {
  if (!chaser) {
    return;
  }

  const sprite = chaser.sprite;
  const cinematic = chaser.introRemaining > 0;

  if (cinematic) {
    drawArrivalCinematic(chaser);
  }

  if (!debugEnabled('chaser')) {
    return;
  }

  push();

  if (player) {
    stroke(130, 20, 30);
    strokeWeight(1);
    line(sprite.x, sprite.y, player.x, player.y);

    const distance = dist(sprite.x, sprite.y, player.x, player.y);
    noStroke();
    fill(130, 20, 30);
    textSize(7);
    textAlign(CENTER, CENTER);
    text(
      Math.round(distance) + 'px',
      (sprite.x + player.x) / 2,
      (sprite.y + player.y) / 2 - 6
    );
  }

  rectMode(CENTER);
  const flash = cinematic && Math.floor(chaser.age * 10) % 2 === 0;
  fill(flash ? 150 : 75, flash ? 20 : 8, flash ? 30 : 12, 150);
  stroke(160, 25, 35);
  strokeWeight(2);
  rect(sprite.x, sprite.y, sprite.w, sprite.h);

  strokeWeight(1);
  line(
    sprite.x - sprite.w / 2,
    sprite.y - sprite.h / 2,
    sprite.x + sprite.w / 2,
    sprite.y + sprite.h / 2
  );
  line(
    sprite.x + sprite.w / 2,
    sprite.y - sprite.h / 2,
    sprite.x - sprite.w / 2,
    sprite.y + sprite.h / 2
  );

  noStroke();
  fill(220, 40, 50);
  textSize(8);
  textAlign(CENTER, BOTTOM);
  text('CHASER', sprite.x, sprite.y - sprite.h / 2 - 9);
  fill(180, 35, 45);
  textSize(6);
  text(
    cinematic
      ? 'arriving...'
      : chaser.stunRemaining > 0
        ? 'STUNNED!!'
        : chaser.speed.toFixed(2) + ' m/s',
    sprite.x,
    sprite.y - sprite.h / 2 - 2
  );

  pop();
}

function drawArrivalCinematic(chaser) {
  const sprite = chaser.sprite;
  const progress = 1 - chaser.introRemaining / CINEMATIC_SECONDS;
  const pulse = 0.5 + 0.5 * sin(chaser.age * 18);

  push();
  noStroke();
  fill(70, 5, 10, 100 + pulse * 80);
  ellipse(sprite.x, sprite.y, 56 + progress * 24);
  fill(220, 25, 35, 160 + pulse * 80);
  ellipse(sprite.x, sprite.y, 18 + pulse * 10);
  pop();
}
