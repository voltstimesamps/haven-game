export const game = {
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
  chaseStarted: false,

  entrance: null,
  exit: null,
  irisOpenProgress: 0,
  letterboxProgress: 0
};
