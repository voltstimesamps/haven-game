let restartHandler = null;
let toastEl = null;
let lastError = null;
let errorCount = 0;
let streakStart = null;
let lastErrorTime = 0;
let streakCount = 0;
let lastTick = 0;
let halted = false;

const STREAK_DURATION_MS = 2000; // must persist for 3 seconds
const MAX_GAP_MS = 250;          // how long between errors
const MIN_STREAK_ERRORS = 20;    // minimum of how many errors

export function installCrashRecovery(onRestart) {
  restartHandler = onRestart;
  lastTick = performance.now();

  window.addEventListener('error', (e) => reportError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

  document.querySelector('canvas')?.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    haltGame(new Error('WebGL context lost.'));
  });
}

export function guardFrame(fn) {
  if (halted) return;
  lastTick = performance.now();

  try {
    fn();
  } catch (err) {
    reportError(err);
  }
}

export const isCrashed = () => halted;
export const drawCrashScreen = () => {};

function reportError(raw) {
  if (halted) return;
  const now = performance.now();
  const err = raw instanceof Error ? raw : new Error(String(raw));
  lastError = err;
  errorCount += 1;

  // Start or continue an error streak if the gap since the last error is <= MAX_GAP_MS
  if (streakStart === null || now - lastErrorTime > MAX_GAP_MS) {
    streakStart = now;
    streakCount = 1;
  } else {
    streakCount += 1;
  }
  lastErrorTime = now;

  // Escalate to a major error if errors persist for 3 seconds
  if (now - streakStart >= STREAK_DURATION_MS && streakCount >= MIN_STREAK_ERRORS) {
    haltGame(err);
    return;
  }

  if (errorCount <= 3 || errorCount % 60 === 0) {
    console.error(`⚠ Minor Error (#${errorCount}):`, err);
  }

  renderToast(err.message);
}

function haltGame(raw) {
  if (halted) return;
  halted = true;
  clearToast();

  const err = raw instanceof Error ? raw : new Error(String(raw));
  console.error('⚠ Major Error Detected:', err);
  injectStyles();

  const rect = document.querySelector('canvas')?.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.id = 'game-fatal-overlay';
  Object.assign(overlay.style, {
    left: `${rect?.left ?? 0}px`,
    top: `${rect?.top ?? 0}px`,
    width: rect ? `${rect.width}px` : '100vw',
    height: rect ? `${rect.height}px` : '100vh',
  });

  overlay.innerHTML = `
    <div class="gfo-box">
      <h1>⚠ Major Error Detected</h1>
      <p>Dynamite Dan encountered a critical error and was forced to stop. :(</p>
      <p>More information is available in the console.<p>
      <br>
      <p>Press a key or click to attempt a restart.</p>
      <br>
      <pre></pre>
    </div>
  `;
  overlay.querySelector('pre').textContent = err.message;
  document.body.appendChild(overlay);

  setTimeout(() => {
    const resume = () => {
      overlay.remove();
      halted = false;
      streakStart = null;
      streakCount = 0;
      lastErrorTime = 0;
      lastTick = performance.now();
      restartHandler?.();
    };
    window.addEventListener('keydown', resume, { once: true });
    window.addEventListener('pointerdown', resume, { once: true });
  }, 250);
}

function renderToast(message) {
  injectStyles();

  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'game-warning-toast';
    toastEl.innerHTML = `
      <div class="gwt-body">
        <strong class="gwt-title"></strong>
        <span class="gwt-msg"></span>
      </div>
      <button class="gwt-btn" data-action="restart" title="Restart">↻</button>
      <button class="gwt-btn" data-action="dismiss" title="Dismiss">✕</button>
    `;

    toastEl.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'dismiss') clearToast();
      if (action === 'restart') {
        clearToast();
        restartHandler?.();
      }
    });

    document.body.appendChild(toastEl);
  }

  const rect = document.querySelector('canvas')?.getBoundingClientRect();
  toastEl.style.left = `${(rect?.left ?? 0) + 12}px`;
  toastEl.style.bottom = `${(rect ? window.innerHeight - rect.bottom : 0) + 12}px`;

  toastEl.querySelector('.gwt-title').textContent =
    errorCount > 1 ? `⚠ Minor Error Detected (${errorCount}x)` : '⚠ Minor Error Detected';
  toastEl.querySelector('.gwt-msg').textContent = message;
}

function clearToast() {
  toastEl?.remove();
  toastEl = null;
  errorCount = 0;
  lastError = null;
}

function injectStyles() {
  if (document.getElementById('game-warning-styles')) return;

  const style = document.createElement('style');
  style.id = 'game-warning-styles';
  style.textContent = `
    #game-warning-toast {
      position: fixed;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 340px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 176, 168, 0.45);
      background: rgba(18, 5, 6, 0.92);
      color: #ffb0a8;
      font: 12px/1.4 monospace, sans-serif;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    }
    .gwt-body { flex: 1; overflow: hidden; }
    .gwt-title { display: block; margin-bottom: 2px; }
    .gwt-msg { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.9; }
    .gwt-btn { background: none; border: none; color: inherit; font: bold 14px/1 monospace; cursor: pointer; padding: 2px 4px; }
    .gwt-btn:hover { opacity: 0.75; }
    #game-fatal-overlay {
      position: fixed;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: left;
      padding: 24px;
      box-sizing: border-box;
      background: #120506;
      color: #ffb0a8;
      font: 14px/1.5 monospace, sans-serif;
    }
    .gfo-box {
      max-width: 560px;
      width: 100%;
      text-align: left;
    }
    .gfo-box h1 { margin: 0 0 8px; font-size: 26px; }
    .gfo-box p { margin: 0 0 8px; opacity: 0.85; }
    .gfo-box pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; opacity: 0.9; }
  `;
  document.head.appendChild(style);
}
