// load and loop soundtrack

const TRACKS = {
  chill: 'assets/music/chill.ogg',
  chase: 'assets/music/chase.ogg'
};

const VOLUME = 0.5;

const loaded = {};
let current = null;
let waitingForInput = false;

function getTrack(name) {
  if (!loaded[name]) {
    const audio = loadAudio(TRACKS[name]);
    audio.loop = true;
    audio.volume = VOLUME;
    loaded[name] = audio;
  }

  return loaded[name];
}

// switches track if track is changing.
export function playMusic(name) {
  if (!TRACKS[name]) {
    throw new Error(`Unknown music track: ${name}`);
  }

  const next = getTrack(name);

  if (current === next) {
    return;
  }

  if (current) {
    current.pause();
    current.currentTime = 0;
  }

  current = next;
  startCurrent();
}

export function stopMusic() {
  if (!current) {
    return;
  }

  current.pause();
  current.currentTime = 0;
  current = null;
}

function startCurrent() {
  if (!current) {
    return;
  }

  // browsers block audio until the player has pressed a key or clicked.
  // if that happens, try again on the first input.
  current.play().catch(() => {
    if (waitingForInput) {
      return;
    }

    waitingForInput = true;

    const retry = () => {
      waitingForInput = false;
      window.removeEventListener('keydown', retry);
      window.removeEventListener('pointerdown', retry);
      startCurrent();
    };

    window.addEventListener('keydown', retry);
    window.addEventListener('pointerdown', retry);
  });
}
