// scenes where the player is moved automatically (entrance and exit)

import { updatePlayer } from '../entities/player.js';
import { deleteChaser } from '../entities/chaser.js';
import { playMusic, fadeOutMusic } from '../core/music.js';
import { playSound } from '../core/sound.js';
import { shakeCamera } from '../core/camera.js';
import { FRAME_SECONDS } from '../core/time.js';
import { openDoor, closeDoor } from './door.js';

const ENTRANCE_DOOR_CLOSE_SECONDS = 0.45;
const EXIT_WALK_TIMEOUT_SECONDS = 1.5;
const EXIT_WALK_TILES = 3; // how dan walks before vanishing
const EXIT_IRIS_SECONDS = 0.75;

const DOOR_PARTICLE_COUNT = 20;
const DOOR_PARTICLE_LIFE_SECONDS = 1.1;

// entrance

export function beginEntrance(game) {
  const player = game.player;
  const door = game.escapeDoor;

  player.x = door.x - door.w - 8;
  player.inputEnabled = false;
  player.autoDirection = 1; // walk right automatically

  game.entrance = {
    phase: 'walking',
    elapsed: 0,
    particles: []
  };
}

// true while the entrance is still taking over the frame
export function updateEntrance(game) {
  const entrance = game.entrance;

  if (!entrance) {
    return false;
  }

  updateParticles(entrance);

  if (entrance.phase === 'done') {
    return false;
  }

  const player = game.player;
  const door = game.escapeDoor;

  if (entrance.phase === 'walking') {
    player.autoDirection = 1;
    updatePlayer(player);

    if (player.x >= door.x + door.w * 2) {
      player.autoDirection = 0; // stand still while door closes
      entrance.phase = 'closing';
      entrance.elapsed = 0;
    }

    return true;
  }

  player.autoDirection = 0;
  updatePlayer(player);

  entrance.elapsed += FRAME_SECONDS;
  const progress = constrain(entrance.elapsed / ENTRANCE_DOOR_CLOSE_SECONDS, 0, 1);
  door.openProgress = 1 - progress;
  door.animation = 'close';

  if (progress >= 1) {
    entrance.phase = 'done';
    player.autoDirection = null; // hand control back to keyboard
    player.inputEnabled = true;

    closeDoor(door, player);
    emitDoorParticles(entrance, door);
    playSound('doorClose');
    playMusic('chill');
    shakeCamera(0.7, 8);
  }

  return true;
}

export function isIntroFinished(game) {
  return !game.entrance || game.entrance.phase === 'done';
}

// exit

export function beginExit(game) {
  if (game.exit) {
    return;
  }

  const player = game.player;
  const door = game.escapeDoor;
  const tileSize = game.activeLevel.tiles.size;
  const targetX = door.x - tileSize * EXIT_WALK_TILES;
  const dir = targetX >= player.x ? 1 : -1;

  openDoor(door);

  player.inputEnabled = false;
  player.autoDirection = dir;

  deleteChaser(game.chaser);
  game.chaser = null;

  fadeOutMusic(1.2);

  game.exit = {
    phase: 'walking',
    dir,
    targetX,
    elapsed: 0,
    irisProgress: 0
  };
}

// complete if exit finished, continue while running, null if there is no exit
export function updateExit(game) {
  const exit = game.exit;

  if (!exit) {
    return null;
  }

  const player = game.player;

  if (exit.phase === 'walking') {
    exit.elapsed += FRAME_SECONDS;
    player.autoDirection = exit.dir;
    updatePlayer(player);

    const reachedTarget = exit.dir === 1
      ? player.x >= exit.targetX
      : player.x <= exit.targetX;

    if (reachedTarget || exit.elapsed >= EXIT_WALK_TIMEOUT_SECONDS) {
      player.autoDirection = 0;
      player.vel.x = 0;
      player.visible = false;
      exit.phase = 'iris';
      exit.elapsed = 0;
    }

    return 'continue';
  }

  if (exit.phase === 'iris') {
    exit.elapsed += FRAME_SECONDS;
    exit.irisProgress = constrain(exit.elapsed / EXIT_IRIS_SECONDS, 0, 1);

    if (exit.irisProgress >= 1) {
      exit.phase = 'done';
      player.autoDirection = null;
      return 'complete';
    }
  }

  return 'continue';
}

export function deleteCutscenes(game) {
  for (const particle of game.entrance?.particles ?? []) {
    particle.delete();
  }

  game.entrance = null;
  game.exit = null;
}

// door dust

function emitDoorParticles(entrance, door) {
  for (let i = 0; i < DOOR_PARTICLE_COUNT; i++) {
    const particle = new Sprite(
      door.x + random(-door.w / 2, door.w / 2),
      door.y - door.h / 2,
      random(2, 5),
      'dynamic'
    );

    particle.color = random() > 0.5 ? '#8b5a3c' : '#b8734d';
    particle.opacity = random(0.5, 0.95);
    particle.gravityScale = 0.8;
    particle.friction = 0;
    particle.bounciness = 0.25;
    particle.rotationLock = true;
    particle.lifeRemaining = DOOR_PARTICLE_LIFE_SECONDS;
    particle.vel.x = random(-3, 3);
    particle.vel.y = random(-5, -1);
    entrance.particles.push(particle);
    door.passes(particle);
    door.solid?.passes(particle);
  }
}

function updateParticles(entrance) {
  for (const particle of entrance.particles) {
    particle.lifeRemaining -= FRAME_SECONDS;
  }

  for (const particle of entrance.particles) {
    if (particle.lifeRemaining <= 0) {
      particle.delete();
    }
  }

  entrance.particles = entrance.particles.filter(
    (particle) => particle.lifeRemaining > 0
  );
}