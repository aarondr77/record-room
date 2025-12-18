import { useState, useRef, useEffect } from 'react'

export default function VoiceNotePlayer({ src, duration, partner }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let animationFrameId = null
    
    const updateTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime)
      }
    }
    
    const updateDuration = () => setTotalDuration(audio.duration || duration || 0)
    
    // Use requestAnimationFrame for smooth visual updates when playing
    const animate = () => {
      if (audio && !audio.paused && !audio.ended) {
        updateTime()
        animationFrameId = requestAnimationFrame(animate)
      } else {
        animationFrameId = null
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (!animationFrameId) {
        animate()
      }
    }
    
    const handlePause = () => {
      setIsPlaying(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    audio.addEventListener('timeupdate', updateTime) // Keep for time display updates
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [duration])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0
  
  // Partner-specific colors
  const darkColor = partner === 'partner1' ? '#9b59b6' : partner === 'partner2' ? '#3498db' : '#2c2c2c'
  const lightColor = partner === 'partner1' ? '#e8c5f5' : partner === 'partner2' ? '#b3d9f2' : '#d0d0d0'
  const lightColorOpacity = partner === 'partner1' ? '#e8c5f5' : partner === 'partner2' ? '#b3d9f2' : '#d0d0d0'
  
  const gradientId = `wave-gradient-${src.replace(/[^a-zA-Z0-9]/g, '')}`
  const gradientId2 = `wave-gradient-2-${src.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="voice-note-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="voice-player-controls">
        <button 
          className="voice-play-btn" 
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-cat-interactive
          data-cat-action="voice-play"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isPlaying ? (
              // Pause icon (hand-drawn)
              <>
                <rect x="8" y="6" width="3" height="12" rx="1" stroke="#2c2c2c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="13" y="6" width="3" height="12" rx="1" stroke="#2c2c2c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            ) : (
              // Play icon (hand-drawn triangle)
              <path 
                d="M 9 7 L 9 17 L 17 12 Z" 
                stroke="#2c2c2c" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        <div className="voice-time-display">
          <span className="voice-time-current">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div className="voice-wave-progress">
        <svg 
          width="100%" 
          height="50" 
          viewBox="0 0 400 50" 
          preserveAspectRatio="none"
          className="voice-wave-svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={darkColor} />
              <stop offset={`${Math.max(0, progress - 5)}%`} stopColor={darkColor} />
              <stop offset={`${Math.max(0, progress - 2)}%`} stopColor={darkColor} stopOpacity="0.9" />
              <stop offset={`${progress}%`} stopColor={lightColor} stopOpacity="0.7" />
              <stop offset={`${Math.min(100, progress + 3)}%`} stopColor={lightColor} />
              <stop offset="100%" stopColor={lightColor} />
            </linearGradient>
            <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={darkColor} stopOpacity="0.8" />
              <stop offset={`${Math.max(0, progress - 5)}%`} stopColor={darkColor} stopOpacity="0.8" />
              <stop offset={`${Math.max(0, progress - 2)}%`} stopColor={darkColor} stopOpacity="0.7" />
              <stop offset={`${progress}%`} stopColor={lightColorOpacity} stopOpacity="0.5" />
              <stop offset={`${Math.min(100, progress + 3)}%`} stopColor={lightColorOpacity} stopOpacity="0.6" />
              <stop offset="100%" stopColor={lightColorOpacity} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Progressive color waves - get darker from left to right as audio plays */}
          <path
            d="M 0 25 Q 8 15, 16 25 T 32 25 T 48 25 T 64 25 T 80 25 T 96 25 T 112 25 T 128 25 T 144 25 T 160 25 T 176 25 T 192 25 T 208 25 T 224 25 T 240 25 T 256 25 T 272 25 T 288 25 T 304 25 T 320 25 T 336 25 T 352 25 T 368 25 T 384 25 T 400 25"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="voice-wave-progress-line"
          />
          <path
            d="M 0 20 Q 6 12, 12 20 T 24 20 T 36 20 T 48 20 T 60 20 T 72 20 T 84 20 T 96 20 T 108 20 T 120 20 T 132 20 T 144 20 T 156 20 T 168 20 T 180 20 T 192 20 T 204 20 T 216 20 T 228 20 T 240 20 T 252 20 T 264 20 T 276 20 T 288 20 T 300 20 T 312 20 T 324 20 T 336 20 T 348 20 T 360 20 T 372 20 T 384 20 T 396 20 T 400 20"
            stroke={`url(#${gradientId2})`}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="voice-wave-progress-line"
          />
          <path
            d="M 0 30 Q 10 22, 20 30 T 40 30 T 60 30 T 80 30 T 100 30 T 120 30 T 140 30 T 160 30 T 180 30 T 200 30 T 220 30 T 240 30 T 260 30 T 280 30 T 300 30 T 320 30 T 340 30 T 360 30 T 380 30 T 400 30"
            stroke={`url(#${gradientId2})`}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="voice-wave-progress-line"
          />
        </svg>
      </div>

      <div className="voice-duration-display">
        <span className="voice-duration-text">{formatTime(totalDuration)}</span>
      </div>
    </div>
  )
}

