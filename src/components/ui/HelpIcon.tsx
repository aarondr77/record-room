import './HelpIcon.css';

interface HelpIconProps {
  onClick: () => void;
}

export function HelpIcon({ onClick }: HelpIconProps) {
  return (
    <button className="help-icon" onClick={onClick} aria-label="Help">
      <span className="help-icon-text">?</span>
    </button>
  );
}

