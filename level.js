const levels = {
  'menu/mainmenu': {
    id: 'menu/mainmenu',

    background: '#182033',

    player: {
      x: 0,
      y: 80,
      inputEnabled: false,
      idleFrames: [
        'assets/player-idle-0.png',
        'assets/player-idle-1.png',
        'assets/player-idle-2.png'
      ]
    },

    tiles: {
      size: 32,
      originX: -320,
      originY: -160,

      definitions: {
        '#': {
          image: 'assets/menu-ground.png',
          solid: true
        },
        '=': {
          image: 'assets/menu-platform.png',
          solid: true
        }
      },

      map: `
####################
#                  #
#                  #
#        ===       #
#                  #
####################
`
    }
  },

  'campaign1/one': {
    id: 'campaign1/one',

    background: '#6aa6d8',

    player: {
      x: -240,
      y: -80,
      inputEnabled: true,
      idleFrames: [
        'assets/player-idle-0.png',
        'assets/player-idle-1.png',
        'assets/player-idle-2.png'
      ]
    },

    tiles: {
      size: 32,
      originX: -320,
      originY: -160,

      definitions: {
        '#': {
          image: 'assets/grass-ground.png',
          solid: true
        },
        '=': {
          image: 'assets/grass-platform.png',
          solid: true
        }
      },

      map: `
####################
#                  #
#       ===        #
#                  #
#    ===           #
####################
`
    }
  }
};

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