// enter/exit door
import { debugEnabled } from '../core/debug.js';
import { hash, tileCell, pickShade, shadedImage } from './shading.js';

const DEFAULT_DOOR_SHEET = 'assets/animations/TileDoorOpenAnim.png';
const TOTAL_FRAMES = 13;
const OPEN_FRAME = 12;
const CLOSED_FRAME = 1;
const FRAME_DELAY = 2;

export function createEscapeDoor(settings, level) {
  const door = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  door.w = settings.width;
  door.h = settings.height;
  door.color = 'green';
  door.sheetPath = settings.sheet || DEFAULT_DOOR_SHEET;
  door.totalFrames = settings.totalFrames || TOTAL_FRAMES;
  door.openFrame = settings.openFrame ?? OPEN_FRAME;
  door.closedFrame = settings.closedFrame ?? CLOSED_FRAME;
  door.frameIndex = door.openFrame;
  door.frameTimer = 0;
  door.slamTriggered = false;
  door.onSlam = settings.onSlam || null;
  door.solid = null;
  door.isClosed = false;
  door.visible = false;
  door.debug = debugEnabled('colliders');
  door.ignoreRays = true;

  door.shade = resolveDoorShade(settings, level);

  getDoorSheet(door.sheetPath, door.shade);

  return door;
}

function resolveDoorShade(settings, level) {
  let rawTint = settings.tint ?? level?.tiles?.doorTint;

  if (!rawTint && level?.tiles?.definitions) {
    const defs = Object.values(level.tiles.definitions);
    const tintedTile = defs.find((d) => d.solid && d.tint) || defs.find((d) => d.tint);
    rawTint = tintedTile?.tint;
  }

  if (!rawTint) {
    return null;
  }

  const size = settings.tileSize ?? level?.tiles?.size ?? settings.width;
  const originX = settings.originX ?? level?.tiles?.originX ?? 0;
  const originY = settings.originY ?? level?.tiles?.originY ?? 0;
  const brightness = settings.brightness ?? [0.7, 1];

  const col = tileCell(settings.x, originX, size);
  const row = tileCell(settings.y, originY, size);
  const palette = [rawTint].flat();
  const base = palette[Math.floor(hash(col, row, 7) * palette.length)];

  return pickShade(base, col, row, brightness);
}

export function deleteDoor(door) {
  if (!door) {
    return;
  }

  door.solid?.delete();
  door.delete();
}

export function openDoor(door) {
  if (!door) {
    return;
  }

  door.solid?.delete();
  door.solid = null;
  door.isClosed = false;
  door.slamTriggered = false;
  door.color = 'green';
  door.frameIndex = door.openFrame;
  door.frameTimer = 0;
}

export function closeDoor(door, player, onSlam) {
  if (!door || door.isClosed) {
    return;
  }

  door.solid = new Sprite(door.x, door.y, door.w, door.h, 'static');
  door.solid.visible = false;
  door.solid.ignoreRays = false;
  door.isClosed = true;
  door.slamTriggered = false;
  door.color = 'red';
  door.frameIndex = door.openFrame;
  door.frameTimer = 0;

  if (onSlam) {
    door.onSlam = onSlam;
  }

  if (player) {
    player.collides(door.solid);
  }
}

export function drawDoor(door) {
  if (!door) {
    return;
  }

  const sheet = getDoorSheet(door.sheetPath, door.shade);

  push();
  rectMode(CENTER);
  noStroke();

  if (sheet && sheet.width > 0 && sheet.height > 0) {
    if (door.isClosed) {
      if (door.frameIndex > door.closedFrame) {
        door.frameTimer++;
        if (door.frameTimer >= FRAME_DELAY) {
          door.frameTimer = 0;
          door.frameIndex--;
        }
      } else if (!door.slamTriggered) {
        door.slamTriggered = true;
        door.onSlam?.(door);
      }
    }

    if (door.shade) {
      tint(color(door.shade));
    }

    const srcFrameW = sheet.width / door.totalFrames;
    const sx = door.frameIndex * srcFrameW;

    imageMode(CENTER);
    image(
      sheet,
      door.x,
      door.y,
      door.w,
      door.h,
      sx,
      0,
      srcFrameW,
      sheet.height
    );
  }

  pop();
}

function getDoorSheet(path, shade) {
  return shadedImage(path, shade || 'default');
}