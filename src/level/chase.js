// chase trigger

import { createChaser } from '../entities/chaser.js';
import { playMusic } from '../core/music.js';
import { playSound } from '../core/sound.js';
import { shakeCamera } from '../core/camera.js';
import { debugEnabled } from '../core/debug.js';
import { openDoor } from './door.js';
import { toWorldPlacement } from './grid.js';

export function createChaseTrigger(settings) {
  const trigger = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  trigger.color = 'yellow';
  trigger.opacity = 0.5;
  trigger.debug = debugEnabled('colliders');
  trigger.ignoreRays = true;

  return trigger;
}

export function deleteChaseTrigger(game) {
  game.chaseTrigger?.delete();
  game.chaseTrigger = null;
}

export function drawChaseTrigger(trigger) {
  if (!trigger) {
    return;
  }

  push();
  rectMode(CENTER);
  noStroke();
  opacity(trigger.opacity ?? 1);
  fill(trigger.color);
  rect(trigger.x, trigger.y, trigger.w, trigger.h);
  pop();
}

export function checkChaseTrigger(game) {
  if (
    game.chaseTrigger &&
    !game.chaseStarted &&
    game.player.overlaps(game.chaseTrigger)
  ) {
    startChase(game);
  }
}

function startChase(game) {
  game.chaseStarted = true;

  playMusic('chase');
  deleteChaseTrigger(game);
  openDoor(game.escapeDoor);

  const spawn = game.activeLevel.objects.chaser;

  if (spawn) {
    game.chaser = createChaser(toWorldPlacement(game.activeLevel, spawn));
    playSound('chaserArrival');
    shakeCamera(1.5, 10);
  }
}