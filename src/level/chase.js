// chase trigger

import { createChaser } from '../entities/chaser.js';
import { playMusic } from '../core/music.js';
import { playSound } from '../core/sound.js';
import { shakeCamera } from '../core/camera.js';
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

  trigger.debug = false;
  trigger.ignoreRays = true;
  trigger.visible = false;
  trigger.triggered = false;
  trigger.lastFrame = 0;

  loadImage('assets/animations/DavenTake.png')
    .then((img) => {
      if (trigger.removed) return;

      const frameCount = Math.max(1, Math.floor(img.width / 96));
      trigger.lastFrame = frameCount - 1;

      const ani = trigger.addAni('trigger', img, {
        frameSize: 96,
        frames: frameCount,
      });

      ani.looping = false;
      ani.frame = 0;
      ani.playing = false;

      trigger.visible = true;
    })
    .catch((err) => {
      console.error('Failed to load chase trigger graphic:', err);
    });

  return trigger;
}

export function deleteChaseTrigger(game) {
  game.chaseTrigger?.delete();
  game.chaseTrigger = null;
}

export function drawChaseTrigger(trigger) {
  if (!trigger || !trigger.visible) {
    return;
  }

  if (trigger.ani) {
    if (!trigger.triggered) {
      trigger.ani.frame = 0;
      trigger.ani.playing = false;
    } else if (trigger.ani.frame >= trigger.lastFrame) {
      trigger.ani.frame = trigger.lastFrame;
      trigger.ani.playing = false;
    }
  }

  trigger.draw();
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

  if (game.chaseTrigger) {
    game.chaseTrigger.triggered = true;

    if (game.chaseTrigger.ani) {
      game.chaseTrigger.ani.frame = 0;
      game.chaseTrigger.ani.playing = true;
    }
  }

  openDoor(game.escapeDoor);

  const spawn = game.activeLevel.objects.chaser;

  if (spawn) {
    game.chaser = createChaser(toWorldPlacement(game.activeLevel, spawn));
    playSound('chaserArrival');
    shakeCamera(1.5, 10);
  }
}