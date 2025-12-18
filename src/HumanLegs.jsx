import './HumanLegs.css'

export default function HumanLegs({ isPlaying, onClick, disabled }) {
  return (
    <button 
      className={`human-legs ${isPlaying ? 'playing' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      <svg 
        width="70" 
        height="75" 
        viewBox="0 0 70 75" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="legs-svg"
      >
        {/* Left leg */}
        {/* Outer line - thigh to ankle */}
        <path
          d="M 8 0 
             L 8 20
             Q 6 28 8 32
             L 6 55
             Q 4 62 6 68"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner line - thigh to ankle */}
        <path
          d="M 22 0
             L 22 20
             Q 24 28 22 32
             L 20 55
             Q 18 62 16 68"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Knee detail */}
        <path
          d="M 10 27 Q 15 25 20 27"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Left foot */}
        <path
          d="M 6 68 Q 2 70 2 72 Q 4 74 12 74 Q 16 73 16 68"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Toes hint */}
        <path
          d="M 4 72 L 4 73 M 6 72 L 6 74 M 8 72 L 8 74 M 10 72 L 10 73"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Right leg */}
        {/* Outer line - thigh to ankle */}
        <path
          d="M 32 0
             L 32 18
             Q 30 26 32 30
             L 30 52
             Q 28 60 30 66"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner line - thigh to ankle */}
        <path
          d="M 46 0
             L 46 18
             Q 48 26 46 30
             L 44 52
             Q 42 60 40 66"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Knee detail */}
        <path
          d="M 34 25 Q 39 23 44 25"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Calf muscle hint */}
        <path
          d="M 34 38 Q 37 42 34 46"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Right foot */}
        <path
          d="M 30 66 Q 26 68 26 70 Q 28 72 36 72 Q 40 71 40 66"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Toes hint */}
        <path
          d="M 28 70 L 28 71 M 31 70 L 31 72 M 34 70 L 34 72 M 37 70 L 37 71"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Play/Pause icon */}
        <g className="legs-icon" transform="translate(56, 38)">
          <circle r="12" fill="white" stroke="#2c2c2c" strokeWidth="2"/>
          {isPlaying ? (
            // Pause icon
            <>
              <rect x="-5" y="-5" width="3.5" height="10" rx="1" fill="none" stroke="#2c2c2c" strokeWidth="2"/>
              <rect x="1.5" y="-5" width="3.5" height="10" rx="1" fill="none" stroke="#2c2c2c" strokeWidth="2"/>
            </>
          ) : (
            // Play icon
            <path
              d="M -3 -6 L -3 6 L 6 0 Z"
              fill="none"
              stroke="#2c2c2c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>
    </button>
  )
}

