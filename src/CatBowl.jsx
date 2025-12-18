import './CatBowl.css'

export default function CatBowl({ isPlaying, onClick, disabled }) {
  return (
    <button 
      className={`cat-bowl ${isPlaying ? 'playing' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      <svg 
        width="70" 
        height="55" 
        viewBox="0 0 70 55" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="bowl-svg"
      >
        {/* Food in bowl - animated when playing */}
        <g className="bowl-food">
          {/* Food kibbles */}
          <ellipse cx="25" cy="18" rx="4" ry="3" fill="#8B4513" stroke="#5D2E0C" strokeWidth="1"/>
          <ellipse cx="35" cy="15" rx="4" ry="3" fill="#A0522D" stroke="#5D2E0C" strokeWidth="1"/>
          <ellipse cx="45" cy="18" rx="4" ry="3" fill="#8B4513" stroke="#5D2E0C" strokeWidth="1"/>
          <ellipse cx="30" cy="22" rx="4" ry="3" fill="#A0522D" stroke="#5D2E0C" strokeWidth="1"/>
          <ellipse cx="40" cy="22" rx="4" ry="3" fill="#8B4513" stroke="#5D2E0C" strokeWidth="1"/>
          <ellipse cx="35" cy="20" rx="3" ry="2" fill="#CD853F" stroke="#5D2E0C" strokeWidth="1"/>
        </g>

        {/* Bowl outline - hand drawn style */}
        <path
          d="M 10 25 Q 5 40 15 48 Q 25 54 35 54 Q 45 54 55 48 Q 65 40 60 25"
          fill="#f0f0f0"
          stroke="#2c2c2c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Bowl rim */}
        <ellipse
          cx="35"
          cy="25"
          rx="27"
          ry="8"
          fill="#e8e8e8"
          stroke="#2c2c2c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Inner bowl shadow */}
        <ellipse
          cx="35"
          cy="26"
          rx="22"
          ry="5"
          fill="#d0d0d0"
          stroke="none"
        />

        {/* Play/Pause icon in center of bowl */}
        <g className="bowl-icon" transform="translate(35, 38)">
          {isPlaying ? (
            // Pause bars
            <>
              <rect x="-8" y="-6" width="5" height="12" rx="1" fill="#1db954" stroke="#2c2c2c" strokeWidth="1.5"/>
              <rect x="3" y="-6" width="5" height="12" rx="1" fill="#1db954" stroke="#2c2c2c" strokeWidth="1.5"/>
            </>
          ) : (
            // Play triangle
            <path
              d="M -6 -8 L -6 8 L 8 0 Z"
              fill="#1db954"
              stroke="#2c2c2c"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {/* Decorative paw print on bowl */}
        <g transform="translate(52, 38) scale(0.4)" opacity="0.3">
          <ellipse cx="0" cy="5" rx="5" ry="6" fill="#2c2c2c"/>
          <circle cx="-5" cy="-3" r="2.5" fill="#2c2c2c"/>
          <circle cx="0" cy="-5" r="2.5" fill="#2c2c2c"/>
          <circle cx="5" cy="-3" r="2.5" fill="#2c2c2c"/>
        </g>
      </svg>

      {/* Steam/aroma lines when playing */}
      {isPlaying && (
        <div className="bowl-steam">
          <span className="steam-line">~</span>
          <span className="steam-line">~</span>
          <span className="steam-line">~</span>
        </div>
      )}
    </button>
  )
}

