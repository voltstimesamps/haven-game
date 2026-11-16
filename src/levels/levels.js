// all editable level information and configurables

const SHARED_TILE_DEFINITIONS = {
  '#': {
    image: 'assets/TileSafe.png',
    solid: true,
    tint: ['#b07850', '#9a8a74', '#a8643c']
  },
  '=': {
    image: 'assets/TileSafe.png',
    solid: true,
    tint: ['#b8683a', '#9c5a36']
  }
};

const SHARED_BACKDROP = {
  image: 'assets/TileSafe.png',
  margin: 8,
  colors: ['#3a2a20', '#4a2a1a', '#3d1f1a', '#2c2a22', '#33302a'],
  brightness: [0.35, 0.7]
};

const SHARED_PLAYER_ANIMATIONS = {
  idleImage: 'assets/animations/DanBlink.png',
  idleFrames: 10,
  runImage: 'assets/animations/DanRun.png',
  runFrames: 12,
  hurtImage: 'assets/animations/DanHurt.png',
  hurtFrames: 14
};

const BACKGROUND = '#0a0605';

// when designing levels we use tile-based coordinates to make things simpler (fractional values permitted)
export function toWorldPlacement(level, placement) {
  const size = level.tiles.size;
  const tile = placement.tile ?? { col: 0, row: 0 };

  return {
    ...placement,
    x: level.tiles.originX + tile.col * size,
    y: level.tiles.originY + tile.row * size,
    ...(placement.widthTiles !== undefined
      ? { width: placement.widthTiles * size }
      : {}),
    ...(placement.heightTiles !== undefined
      ? { height: placement.heightTiles * size }
      : {})
  };
}

const CAMPAIGN_MAP = `
       ##############################################################
       #                                     #                      #
       #                                     #                      #
       #                                     #                      #
       #                                     #                      #
       #                                     #                      #
       #                                     ##############         #
       #                                                            #
       #                                                            #
       #                                                       ===  #
       #                                                            #
       #                                                            #
       #                     ###                        ===         #
       #                     ###                                    #
########                     ###                             ===    #
                    ######   ###                                    #
                    ######   ###                                    #
##################################            #######################
##################################            #######################
                                 #            #
                                 #            #
                                 #            #
                                 #            #
                                 ##############
`;

export const levels = {
  'menu/mainmenu': {
    id: 'menu/mainmenu',
    background: BACKGROUND,
    backdrop: SHARED_BACKDROP,

    player: {
      ...SHARED_PLAYER_ANIMATIONS,
      tile: { col: 5, row: 3.5 },
      inputEnabled: false
    },

    objects: {},

    tiles: {
      size: 32,
      originX: -320,
      originY: -160,
      definitions: SHARED_TILE_DEFINITIONS,
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
    background: BACKGROUND,
    backdrop: SHARED_BACKDROP,

    player: {
      ...SHARED_PLAYER_ANIMATIONS,
      tile: { col: 5, row: 15.5 },
      inputEnabled: true
    },

    objects: {
      chaseTrigger: {
        tile: { col: 50, row: 4.75 },
        widthTiles: 0.875,
        heightTiles: 1.5
      },
      chaser: {
        tile: { col: 60.9375, row: 3.4375 },
        widthTiles: 1.25,
        heightTiles: 1.75
      },
      escapeDoor: {
        tile: { col: 3, row: 15.5 },
        widthTiles: 1,
        heightTiles: 2,
        openImage: null, // door art goes here when finished
        closeImage: null
      }
    },

    signs: [
      { tile: { col: 3, row: 14.875 }, text: 'EXIT' },
      { tile: { col: 9.375, row: 13.75 }, text: 'WASD for movement' },
      { tile: { col: 18.75, row: 13.75 }, text: 'hop up' },
      { tile: { col: 23.75, row: 9.375 }, text: 'Too tall? Click to throw dynamite' },
      { tile: { col: 23.75, row: 9.875 }, text: 'at your feet and ride the blast' },
      { tile: { col: 35.625, row: 13.75 }, text: 'Throw it behind you to launch across' },
      { tile: { col: 35.625, row: 14.25 }, text: 'Fell in? Blast your way back out' },
      { tile: { col: 56.25, row: 16.25 }, text: 'Blast your way up' },
      { tile: { col: 50, row: 3 }, text: 'Touch the marker, then race back to the EXIT!' }
    ],

    tiles: {
      size: 32,
      originX: 0,
      originY: 0,
      definitions: SHARED_TILE_DEFINITIONS,
      map: CAMPAIGN_MAP
    }
  }
};
