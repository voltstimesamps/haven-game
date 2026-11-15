// Background music. Only one track plays at a time, always looping.
//
// Uses loadAudio (streamed <audio> elements) rather than loadSound, since
// music files are big and don't need to be fully decoded up front.

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

// Switches to the named track. Calling it with the track that's already
// playing does nothing, so the music carries on between states seamlessly.
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

function startCurrent() {
  if (!current) {
    return;
  }

  // Browsers block audio until the player has pressed a key or clicked.
  // If that happens, try again on the first input.
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
