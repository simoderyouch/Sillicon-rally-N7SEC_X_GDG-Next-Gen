// Runs only inside the isolated, locally assembled iframe, after the original engine classes.
(() => {
  let coordinator, deadline = 0, base = 0, sequence = 0, stopped = false, roundOver = false;
  const send = (type, extra = {}) => parent.postMessage({ channel: 'rally-pacman-v1', instance: INSTANCE,
    type, sequence: ++sequence, at: Date.now(), score: base + (coordinator?.points || 0), ...extra }, ORIGIN);
  const active = () => deadline > Date.now() && !stopped;
  function stop() {
    stopped = true;
    coordinator?.gameEngine?.stop();
    coordinator?.activeTimers?.forEach(timer => timer.pause(true));
    if (coordinator) {
      coordinator.allowKeyPresses = false;
      coordinator.allowPause = false;
      coordinator.soundManager?.setMasterVolume(0);
      coordinator.soundManager?.ambience.suspend();
      coordinator.soundManager?.dotContext.suspend();
    }
    send('stopped');
  }
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (!active()) event.stopImmediatePropagation();
  }, true);
  const preload = GameCoordinator.prototype.preloadAssets;
  GameCoordinator.prototype.preloadAssets = function () {
    return preload.call(this).then(() => send('ready'));
  };
  const error = GameCoordinator.prototype.displayErrorMessage;
  GameCoordinator.prototype.displayErrorMessage = function () { send('error'); error.call(this); };
  const start = GameCoordinator.prototype.startButtonClick;
  GameCoordinator.prototype.startButtonClick = function () {
    if (!active() || (!this.firstGame && !roundOver)) return;
    if (roundOver) base += this.points;
    roundOver = false;
    start.call(this);
    send('started');
  };
  const award = GameCoordinator.prototype.awardPoints;
  GameCoordinator.prototype.awardPoints = function (event) {
    if (!active() || roundOver) return;
    const points = event.detail?.points;
    if (!Number.isSafeInteger(points) || points <= 0 || points > 5000) return;
    award.call(this, event);
    send('score');
  };
  const over = GameCoordinator.prototype.gameOver;
  GameCoordinator.prototype.gameOver = function () {
    if (!active() || roundOver) return;
    roundOver = true;
    over.call(this);
    send('round-over');
  };
  const cycle = GameEngine.prototype.engineCycle;
  GameEngine.prototype.engineCycle = function (timestamp) {
    if (!active()) { stop(); return; }
    cycle.call(this, timestamp);
  };
  const pause = GameCoordinator.prototype.handlePauseKey;
  GameCoordinator.prototype.handlePauseKey = function () { if (active()) pause.call(this); };
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== parent || event.origin !== ORIGIN || !data || data.channel !== 'rally-pacman-v1' || data.instance !== INSTANCE) return;
    if (data.type === 'stop') { stop(); return; }
    if (data.type === 'start' && !deadline && !stopped && Number.isSafeInteger(data.deadline) && data.deadline > Date.now()
        && data.deadline <= Date.now() + 300000 && Number.isSafeInteger(data.score) && data.score >= 0) {
      deadline = data.deadline;
      base = data.score;
      coordinator.startButtonClick();
      window.focus();
    }
  });
  window.addEventListener('error', () => send('error'));
  window.addEventListener('unhandledrejection', () => send('error'));
  coordinator = new GameCoordinator();
  setInterval(() => { if (deadline && !active() && !stopped) stop(); }, 100);
})();
