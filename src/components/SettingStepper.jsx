export default function SettingStepper({ label, value, unit, onChange, min, max, step = 1 }) {
  return (
    <div className="stepper">
      <div className="stepper-label">{label}</div>
      <div className="stepper-controls">
        <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))}>
          −
        </button>
        <span className="stepper-value">
          {value}
          <span className="stepper-unit">{unit}</span>
        </span>
        <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))}>
          +
        </button>
      </div>
    </div>
  );
}
