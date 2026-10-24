const SPEEDS = [1, 2, 4, 50];

export function GameControls({ speed, running, disabled, onSpeed, onRun, onReset }: {
  speed: number;
  running: boolean;
  disabled: boolean;
  onSpeed: (speed: number) => void;
  onRun: () => void;
  onReset: () => void;
}) {
  return <div className="algo-controls">
    <span className="algo-pointer" aria-hidden="true">&gt;</span>
    <div className="algo-speeds" role="group" aria-label="Playback speed">
      {SPEEDS.map(value => <button key={value} type="button" aria-pressed={speed === value} disabled={disabled} onClick={() => onSpeed(value)}>x{value}</button>)}
    </div>
    <button type="button" className="algo-run" onClick={onRun} disabled={disabled || running} aria-label="Run program">▶</button>
    <button type="button" className="algo-reset" onClick={onReset} disabled={disabled}>Reset robot</button>
  </div>;
}
