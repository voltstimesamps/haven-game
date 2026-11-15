import {
  loadLevel,
  unloadLevel,
  updateLevel,
  drawLevel,
  drawLevelOverlay
} from './level.js';

import { hudText, drawHealth, drawItems } from './hud.js';

import {
  formatClock,
  tickClock,
  getClock,
  resetClock
} from './clock.js';

import { playMusic } from './music.js';

const game = {
  activeLevel: null,
  activeLevelId: null,
  tileGroups: [],
  backdrop: null,
  player: null,
  dynamite: null,
  pogo: null,
  chaser: null,
  selectedItem: 'dynamite',
  killY: Infinity,

  chaseTrigger: null,
  escapeDoor: null,
  chaseStarted: false
};

const menu = {
  enter() {
    loadLevel('menu/mainmenu', game);
    playMusic('chill');
  },

  update() {
    if (kb.presses('enter')) {
      setState('play');
    }
  },

  draw() {
    drawLevel(game);
  },

  hud() {
    drawLevelOverlay(game);
    hudText('Press ENTER to start', 0, height / 2 - 60);
  },

  exit() {
    unloadLevel(game);
  }
};

const play = {
  enter() {
    loadLevel('campaign1/one', game);
    resetClock();

    // Keeps chill going from the menu; swaps back if returning from a chase.
    playMusic('chill');
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
      // Restart the level from the beginning.
      setState('play');
      return;
    }

    if (kb.presses('escape')) {
      setState('menu');
    }
  },

  draw() {
    drawLevel(game);
  },

  hud() {
    drawLevelOverlay(game);
    drawHealth(game.player);
    drawItems(game.selectedItem, game.pogo);

    if (game.chaseStarted) {
      hudText('CHASE ACTIVE', 0, -height / 2 + 40);
      hudText(formatClock(getClock()), 0, -height / 2 + 70);
    }
  },

  exit() {
    unloadLevel(game);
  }
};

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

// Screen-space text, drawn after sprites so the level never covers it.
// (0, 0) is the centre of the screen.
export function drawStateHud() {
  currentState?.hud?.();
}
