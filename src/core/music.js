// load and loop soundtrack

const TRACKS = {
  chill: 'assets/music/chill.ogg',
  chase: 'assets/music/chase.ogg'
};

const VOLUME = 0.5;

const loaded = {};
let current = null;
let waitingForInput = false;
let fadeFrameId = null;

function cancelFade() {
  if (fadeFrameId !== null) {
    cancelAnimationFrame(fadeFrameId);
    fadeFrameId = null;
  }
}

function getTrack(name) {
  if (!loaded[name]) {
    const audio = loadAudio(TRACKS[name]);
    audio.loop = true;
    audio.volume = VOLUME;
    loaded[name] = audio;
  }

  return loaded[name];
}

export function preloadMusic() {
  Object.keys(TRACKS).forEach((name) => getTrack(name));
}

// switches track if track is changing.
export function playMusic(name) {
  if (!TRACKS[name]) {
    throw new Error(`Unknown music track: ${name}`);
  }

  cancelFade();

  const next = getTrack(name);
  next.volume = VOLUME;

  if (current === next) {
    if (current.paused) {
      startCurrent();
    }
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
  cancelFade();

  if (!current) {
    return;
  }

  current.pause();
  current.currentTime = 0;
  current.volume = VOLUME;
  current = null;
}

export function fadeOutMusic(duration = 1.0) {
  cancelFade();

  if (!current) {
    return;
  }

  const target = current;
  const startVolume = target.volume;
  const startTime = performance.now();
  const durationMs = duration * 1000;

  function step(now) {
    const progress = Math.min(1, (now - startTime) / durationMs);
    target.volume = Math.max(0, startVolume * (1 - progress));

    if (progress < 1 && current === target) {
      fadeFrameId = requestAnimationFrame(step);
    } else {
      fadeFrameId = null;
      if (current === target) {
        stopMusic();
      }
    }
  }

  fadeFrameId = requestAnimationFrame(step);
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
