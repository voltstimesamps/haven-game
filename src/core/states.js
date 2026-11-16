import {
  loadLevel,
  unloadLevel,
  updateLevel,
  drawLevel,
  drawLevelOverlay
} from '../levels/level.js';

import { hudText, drawHealth, drawItems } from './hud.js';

import {
  formatClock,
  tickClock,
  getClock,
  resetClock
} from './clock.js';

import { playMusic, stopMusic } from './music.js';
import { playSound } from './sound.js';
import { game } from './game.js';

const menu = {
  enter() {
    loadLevel('menu/mainmenu', game);
    playMusic('chill');
  },

  update() {
    if (kb.presses('enter') || (mouse.presses() && isPlayButtonHovered())) {
      playSound('play');
      setState('play');
    }
  },

  draw() {
    drawLevel(game);
  },

  hud() {
    drawLevelOverlay(game);
    hudText('DYNAMITE DAN', 0, -height / 2 + 96, 48);
    drawPlayButton();
    hudText('ENTER or click PLAY', 0, height / 2 - 54, 18);
  },

  exit() {
    unloadLevel(game);
  }
};

const play = {
  enter() {
    loadLevel('campaign1/one', game);
    resetClock();
    stopMusic();
  },

  update() {
    const result = updateLevel(game);

    if (game.chaseStarted) {
      tickClock();
    }

    if (result === 'complete') {
      setState('menu');
      return;
    }

    if (result === 'dead') {
      // restart the level from the beginning.
      setState('play');
      return;
    }

    if (game.entrance?.phase === 'done' && kb.presses('escape')) {
      setState('menu');
    }
  },

  draw() {
    drawLevel(game);
  },

  hud() {
    drawLevelOverlay(game);
    drawHealth(game.player);
    drawItems(game.selectedItem);

    if (game.chaseStarted) {
      hudText('CHASER INCOMING', 0, -height / 2 + 40);
      hudText(formatClock(getClock()), 0, -height / 2 + 70);
    }
  },

  exit() {
    unloadLevel(game);
  }
};

const PLAY_BUTTON = {
  x: 0,
  y: 200,
  width: 220,
  height: 64
};

function isPlayButtonHovered() {
  const screenMouseX = mouse.x - camera.x;
  const screenMouseY = mouse.y - camera.y;

  return (
    screenMouseX >= PLAY_BUTTON.x - PLAY_BUTTON.width / 2 &&
    screenMouseX <= PLAY_BUTTON.x + PLAY_BUTTON.width / 2 &&
    screenMouseY >= PLAY_BUTTON.y - PLAY_BUTTON.height / 2 &&
    screenMouseY <= PLAY_BUTTON.y + PLAY_BUTTON.height / 2
  );
}

function drawPlayButton() {
  const hovered = isPlayButtonHovered();

  push();
  rectMode(CENTER);
  fill(hovered ? 255 : 220, hovered ? 210 : 170, 60);
  stroke(0);
  strokeWeight(5);
  rect(PLAY_BUTTON.x, PLAY_BUTTON.y, PLAY_BUTTON.width, PLAY_BUTTON.height, 10);
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(30);
  textAlign(CENTER, CENTER);
  text('PLAY', PLAY_BUTTON.x, PLAY_BUTTON.y);
  pop();
}

const states = {
  menu,
  play
};

let currentState = null;

export function setState(nextState) {
  const next = states[nextState];

  if (!next) {
    throw new Error(`Unknown state: ${nextState}`);
  }

  currentState?.exit?.();

  currentState = next;
  currentState.enter?.();
}

export function updateState() {
  currentState?.update?.();
}

export function drawState() {
  currentState?.draw?.();
}

export function drawStateHud() {
  currentState?.hud?.();
}
