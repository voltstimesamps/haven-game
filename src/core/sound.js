// sfx
// these are currently placeholder as i haven't gotten around to making them yet

const CUES = {
  play: { frequency: 520, duration: 0.08, type: 'square' },
  doorClose: { frequency: 90, duration: 0.35, type: 'sawtooth' },
  dynamiteThrow: { frequency: 260, duration: 0.06, type: 'square' },
  explosion: { frequency: 65, duration: 0.3, type: 'sawtooth' },
  jump: { frequency: 390, duration: 0.1, type: 'triangle' },
  pogo: { frequency: 620, duration: 0.08, type: 'triangle' },
  chaserArrival: { frequency: 110, duration: 0.18, type: 'sawtooth' },
  chaserStun: { frequency: 180, duration: 0.12, type: 'square' },
  playerHurt: { frequency: 150, duration: 0.1, type: 'square' },
  death: { frequency: 70, duration: 0.4, type: 'sawtooth' },
  levelComplete: { frequency: 740, duration: 0.18, type: 'triangle' }
};

let audioContext = null;

export function playSound(name) {
  const cue = CUES[name];

  if (!cue || typeof window === 'undefined') {
    return;
  }

  try {
    audioContext ??= new AudioContext();

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = cue.type;
    oscillator.frequency.setValueAtTime(cue.frequency, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cue.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + cue.duration);
  } catch (error) {
    console.warn(`Sound cue "${name}" could not play.`, error);
  }
}

export function listSoundCues() {
  return Object.keys(CUES);
}
