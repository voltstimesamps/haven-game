import { createPlayer, updatePlayer, isDead } from '../entities/player.js';
import {
  createDynamite,
  updateDynamite,
  deleteDynamite,
  drawDynamite
} from '../entities/dynamite.js';
import { createPogo, updatePogo, deletePogo, drawPogo } from '../entities/pogo.js';
import {
  updateChaser,
  deleteChaser,
  drawChaser
} from '../entities/chaser.js';
import { followChaseCamera, snapCamera } from '../core/camera.js';

import { getLevel } from './registry.js';
import { toWorldPlacement, levelBottom } from './grid.js';
import {
  createTileGroups,
  deleteTileGroups,
  connectPlayerToSolidTiles,
  createBackdrop,
  drawBackdrop
} from './tiles.js';
import {
  createEscapeDoor,
  deleteDoor,
  drawDoor
} from './door.js';
import {
  createChaseTrigger,
  deleteChaseTrigger,
  drawChaseTrigger,
  checkChaseTrigger
} from './chase.js';
import {
  beginEntrance,
  updateEntrance,
  beginExit,
  updateExit,
  deleteCutscenes
} from './cutscenes.js';
import {
  updateOverlay,
  resetOverlay,
  drawCutsceneOverlay
} from './overlay.js';
import { drawReferenceCursor } from '../entities/heldItem.js';

// states.js uses this to know whether the player has control yet
export { isIntroFinished } from './cutscenes.js';

const FALL_DEATH_MARGIN = 300; // how far below the map dan can fall before dying

export function loadLevel(levelId, game) {
  const level = getLevel(levelId);

  unloadLevel(game);

  game.activeLevel = level;
  game.activeLevelId = level.id;
  game.chaseStarted = false;

  background(level.background);

  game.backdrop = createBackdrop(level);
  game.tileGroups = createTileGroups(level);

  game.player = createPlayer(toWorldPlacement(level, level.player));
  game.dynamite = createDynamite();
  game.pogo = createPogo();
  game.selectedItem = 'dynamite';
  game.killY = levelBottom(level) + FALL_DEATH_MARGIN;
  snapCamera();

  connectPlayerToSolidTiles(game.player, game.tileGroups);

  const { chaseTrigger, escapeDoor } = level.objects;

  if (chaseTrigger) {
    game.chaseTrigger = createChaseTrigger(toWorldPlacement(level, chaseTrigger));
  }

  if (escapeDoor) {
    game.escapeDoor = createEscapeDoor(toWorldPlacement(level, escapeDoor), level);
  }

  if (level.intro === 'door') {
    beginEntrance(game);
  }

  game.irisOpenProgress = level.irisIn ? 1 : 0;
}

export function unloadLevel(game) {
  if (game.player) {
    game.player.delete();
    game.player = null;
  }

  deleteChaseTrigger(game);
  deleteDoor(game.escapeDoor);
  game.escapeDoor = null;

  deleteDynamite(game.dynamite);
  game.dynamite = null;
  deletePogo(game.pogo);
  game.pogo = null;

  deleteChaser(game.chaser);
  game.chaser = null;

  deleteCutscenes(game);
  resetOverlay(game);

  deleteTileGroups(game.tileGroups);
  game.tileGroups = [];
  game.backdrop = null;
  game.activeLevel = null;
  game.activeLevelId = null;
  game.chaseStarted = false;
}

// returns continue, dead or complete
export function updateLevel(game) {
  if (!game.player) {
    return 'continue';
  }

  updateOverlay(game);

  if (updateEntrance(game)) {
    return 'continue';
  }

  const exitStatus = updateExit(game);

  if (exitStatus) {
    return exitStatus;
  }

  updateItemSelection(game);

  // update stuff that proposes velocity change before applying it
  updateDynamite(
    game.dynamite,
    game.player,
    game.selectedItem === 'dynamite',
    game.chaser
  );
  updatePlayer(game.player);
  updatePogo(game.pogo, game.player, game.selectedItem === 'pogo');

  const caught = updateChaser(game.chaser, game.player);

  if (
    game.player.inputEnabled &&
    (caught || isDead(game.player) || game.player.y > game.killY)
  ) {
    return 'dead';
  }

  checkChaseTrigger(game);

  if (
    game.chaseStarted &&
    game.escapeDoor &&
    !game.escapeDoor.isClosed &&
    game.player.overlapping(game.escapeDoor)
  ) {
    beginExit(game);
  }

  return 'continue';
}

// 1 = dynamite, 2 = pogo, Q = swap
function updateItemSelection(game) {
  if (!game.player?.inputEnabled) {
    return;
  }

  if (kb.presses('1')) {
    game.selectedItem = 'dynamite';
  } else if (kb.presses('2')) {
    game.selectedItem = 'pogo';
  } else if (kb.presses('q')) {
    game.selectedItem =
      game.selectedItem === 'dynamite' ? 'pogo' : 'dynamite';
  }
}

export function drawLevel(game) {
  if (!game.activeLevel) {
    return;
  }

  background(game.activeLevel.background);

  followChaseCamera(game.player, game.chaser);

  // draw in worldspace low here
  camera.on();

  drawBackdrop(game.backdrop, game.activeLevel.tiles.size);
  drawChaseTrigger(game.chaseTrigger);
  drawDoor(game.escapeDoor);
  drawSigns(game.activeLevel);

  camera.off();
}

// draw in worldspace high here
export function drawLevelOverlay(game) {
  if (!game.activeLevel) {
    return;
  }

  camera.on();
  drawReferenceCursor(game.selectedItem, game.player);
  drawDynamite(game.dynamite, game.player, game.selectedItem === 'dynamite');
  drawPogo(game.pogo, game.player, game.selectedItem === 'pogo');
  drawChaser(game.chaser, game.player);
  camera.off();

  drawCutsceneOverlay(game);
}

function drawSigns(level) {
  push();
  textAlign(CENTER, CENTER);
  textSize(9);
  fill(232, 214, 184);
  noStroke();

  for (const sign of level.signs) {
    const position = toWorldPlacement(level, sign);
    text(sign.text, position.x, position.y);
  }

  pop();
}