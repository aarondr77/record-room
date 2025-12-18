import { useState, useEffect, useRef } from 'react'
import './ControllableCat.css'

export default function ControllableCat({ onInteract, partner = 'partner1' }) {
  const catRef = useRef(null)
  const positionRef = useRef({ x: 100, y: 100 })
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const facingRef = useRef('right')
  const [facing, setFacing] = useState('right') // 'left' or 'right'
  const movementDirectionRef = useRef('right')
  const [movementDirection, setMovementDirection] = useState('right') // 'left', 'right', 'up', 'down'
  const [isMoving, setIsMoving] = useState(false)
  const keysPressed = useRef(new Set())
  const animationFrameId = useRef(null)
  const speed = 3

  // Partner-specific colors
  const catColor = partner === 'partner1' ? '#9b59b6' : '#3498db'
  const eyeColor = partner === 'partner1' ? '#7d3c98' : '#2874a6'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        keysPressed.current.add(e.key)
        setIsMoving(true)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Get current position from ref
        if (onInteract) {
          onInteract(positionRef.current)
        }
      }
    }

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current.delete(e.key)
        if (keysPressed.current.size === 0) {
          setIsMoving(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [onInteract])

  // Movement animation loop - triggered by isMoving state
  useEffect(() => {
    if (!isMoving) {
      // Stop animation if not moving
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
      return
    }

    const move = () => {
      if (keysPressed.current.size === 0) {
        animationFrameId.current = null
        return
      }

      let newX = positionRef.current.x
      let newY = positionRef.current.y
      let newFacing = facingRef.current
      let newDirection = movementDirectionRef.current

      // Determine primary movement direction (prioritize horizontal over vertical)
      if (keysPressed.current.has('ArrowLeft')) {
        newX = Math.max(40, newX - speed)
        newFacing = 'left'
        newDirection = 'left'
      } else if (keysPressed.current.has('ArrowRight')) {
        newX = Math.min(window.innerWidth - 40, newX + speed)
        newFacing = 'right'
        newDirection = 'right'
      } else if (keysPressed.current.has('ArrowUp')) {
        newY = Math.max(40, newY - speed)
        newDirection = 'up'
      } else if (keysPressed.current.has('ArrowDown')) {
        newY = Math.min(window.innerHeight - 40, newY + speed)
        newDirection = 'down'
      }

      // Update refs
      positionRef.current = { x: newX, y: newY }
      
      // Update state only if facing changed
      if (newFacing !== facingRef.current) {
        facingRef.current = newFacing
        setFacing(newFacing)
      }

      // Update movement direction if it changed
      if (newDirection !== movementDirectionRef.current) {
        movementDirectionRef.current = newDirection
        setMovementDirection(newDirection)
      }

      // Update position state for rendering
      setPosition({ x: newX, y: newY })

      animationFrameId.current = requestAnimationFrame(move)
    }

    // Start animation loop
    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(move)
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
  }, [isMoving, speed, movementDirection])

  // Calculate tail rotation based on movement direction
  // Tail points away from movement direction
  const getTailTransform = (direction) => {
    switch (direction) {
      case 'left':
        return 'rotate(180deg)' // Tail points left (away from right movement)
      case 'right':
        return 'rotate(0deg)' // Tail points right (away from left movement)
      case 'up':
        return 'rotate(90deg)' // Tail points down (away from up movement)
      case 'down':
        return 'rotate(-90deg)' // Tail points up (away from down movement)
      default:
        return 'rotate(0deg)'
    }
  }

  return (
    <div 
      ref={catRef}
      className={`controllable-cat ${isMoving ? 'moving' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        '--cat-color': catColor,
        '--eye-color': eyeColor
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="cat-svg"
      >
        {/* Cat head */}
        <circle
          cx="50"
          cy="40"
          r="25"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cat ears */}
        <path
          d="M 35 25 L 30 10 L 40 20 Z"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 65 25 L 70 10 L 60 20 Z"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cat eyes */}
        <circle
          cx="42"
          cy="38"
          r="3"
          fill="var(--eye-color)"
        />
        <circle
          cx="58"
          cy="38"
          r="3"
          fill="var(--eye-color)"
        />
        
        {/* Cat nose */}
        <path
          d="M 50 45 L 47 50 L 53 50 Z"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cat mouth */}
        <path
          d="M 50 50 Q 45 55 42 52"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 50 50 Q 55 55 58 52"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Cat body */}
        <ellipse
          cx="50"
          cy="70"
          rx="20"
          ry="15"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cat tail - points away from movement direction, stays in last position when stopped */}
        {/* For horizontal movement: always draw tail on left side - scaleX flip handles showing it correctly */}
        <g>
          {(movementDirection === 'left' || movementDirection === 'right') && (
            // Horizontal movement - tail drawn on left, scaleX flip makes it appear on correct side
            <path
              d="M 30 70 Q 15 60 10 75 Q 15 80 20 75"
              fill="none"
              stroke="var(--cat-color)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {movementDirection === 'up' && (
            // Moving up, tail points down (away from movement)
            <path
              d="M 50 85 Q 55 95 60 90 Q 55 85 50 90"
              fill="none"
              stroke="var(--cat-color)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {movementDirection === 'down' && (
            // Moving down, tail points up (away from movement)
            <path
              d="M 50 55 Q 55 45 60 50 Q 55 55 50 50"
              fill="none"
              stroke="var(--cat-color)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
        
        {/* Cat paws */}
        <circle
          cx="35"
          cy="80"
          r="4"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="1.5"
        />
        <circle
          cx="65"
          cy="80"
          r="4"
          fill="none"
          stroke="var(--cat-color)"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Interaction indicator */}
      <div className="cat-interaction-hint">Press Enter</div>
    </div>
  )
}

