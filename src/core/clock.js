let count = 0;

export function formatClock(stepCount) {
  const minutes = Math.floor(stepCount / 3600);
  const seconds = Math.floor((stepCount / 60) % 60);
  const leftover = stepCount % 60;
  const milliseconds = Math.floor(leftover * 1000 / 60);

  return (
    minutes +
    ':' +
    pad(seconds, 2) +
    '.' +
    pad(milliseconds, 3)
  );
}

export function tickClock() {
  count++;
}

export function getClock() {
  return count;
}

export function resetClock() {
  count = 0;
}

function pad(value, goalLength) {
  let text = String(value);

  while (text.length < goalLength) {
    text = '0' + text;
  }

  return text;
}