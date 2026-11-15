
let activeLevel = null;
let activeLevelId = null;
let player = null;
let tileGroups = [];

function createTileGroups(level) {
  const groups = [];

  for (const [character, definition] of Object.entries(level.tiles.definitions)) {
    const group = new Group();

    group.tile = character;
    group.img = definition.image;
    group.w = level.tiles.size;
    group.h = level.tiles.size;

    // Custom properties can be used by collision and gameplay logic.
    group.solid = definition.solid === true;

    group.addTiles(
      level.tiles.map,
      level.tiles.originX,
      level.tiles.originY,
      level.tiles.size,
      level.tiles.size
    );

    groups.push(group);
  }

  return groups;
}

function createPlayer(playerSettings) {
  const sprite = new Sprite(
    playerSettings.x,
    playerSettings.y,
    32,
    48
  );

  sprite.addAni('idle', ...playerSettings.idleFrames);
  sprite.changeAni('idle');
  sprite.ani.frameDelay = 12;

  sprite.inputEnabled = playerSettings.inputEnabled;

  return sprite;
}

function destroyActiveLevel() {
  if (player) {
    player.delete();
    player = null;
  }

  for (const group of tileGroups) {
    group.deleteAll();
  }

  tileGroups = [];
  activeLevel = null;
  activeLevelId = null;
}

function showLevel(levelId) {
  const level = levels[levelId];

  if (!level) {
    throw new Error(`Unknown level ID: ${levelId}`);
  }

  destroyActiveLevel();

  activeLevel = level;
  activeLevelId = level.id;

  background(level.background);

  tileGroups = createTileGroups(level);
  player = createPlayer(level.player);
}

function updatePlayer() {
  if (!player || !player.inputEnabled) {
    return;
  }

  const speed = 3;

  if (kb.pressing('left')) {
    player.vel.x = -speed;
  } else if (kb.pressing('right')) {
    player.vel.x = speed;
  } else {
    player.vel.x = 0;
  }

  if (kb.presses('space') && player.vel.y === 0) {
    player.vel.y = -8;
  }
}

function setup() {
  new Canvas(640, 360);

  showLevel('menu/mainmenu');
}

function update() {
  clear();

  updatePlayer();

  // Example level switching:
  if (activeLevelId === 'menu/mainmenu' && kb.presses('enter')) {
    showLevel('campaign1/one');
  }

  if (activeLevelId === 'campaign1/one' && kb.presses('escape')) {
    showLevel('menu/mainmenu');
  }
}