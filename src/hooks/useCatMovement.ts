import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { generatePlatforms, getPlatform, findClosestBottomShelf, FLOOR_BOUNDS } from '../config/platforms';
import type { CatState, ToyState, HatState } from '../types';
import { FLOOR_Z } from '../types';

interface UseCatMovementOptions {
  trackCount?: number;
  toyState?: ToyState;
  hatState?: HatState;
  onPickupToy?: () => void;
  onDropToy?: (x: number, z: number) => void;
  onPickupHat?: () => void;
  onDropHat?: (x: number, z: number) => void;
}

// Proximity threshold for toy pickup
const PICKUP_DISTANCE = 0.5;
// Floor movement speed (units per frame at 60fps)
const FLOOR_MOVE_SPEED = 0.08;

export function useCatMovement(options: UseCatMovementOptions = {}) {
  const { trackCount = 5, toyState, hatState, onPickupToy, onDropToy, onPickupHat, onDropHat } = options;
  
  // Generate platforms and find starting platform
  const { startPlatformId, startFloorX } = useMemo(() => {
    const platformMap = generatePlatforms(trackCount);
    // Find the first shelf in the bottom row (row 1) as starting position
    const startPlatform = Object.values(platformMap).find(p => 
      p.type === 'shelf' && p.grid.row === 1
    );
    return {
      startPlatformId: startPlatform?.id ?? Object.values(platformMap).find(p => p.type === 'shelf')?.id ?? 0,
      startFloorX: startPlatform?.position.x ?? 0,
    };
  }, [trackCount]);
  
  const [platform, setPlatform] = useState(startPlatformId);
  const [recordIndex, setRecordIndex] = useState<number | null>(0);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);
  const [floorX, setFloorX] = useState(startFloorX); // X position when on floor
  const [carryingToy, setCarryingToy] = useState(false);
  const [wearingHat, setWearingHat] = useState(false);
  const [startPullup, setStartPullup] = useState(false); // Trigger for window pullup animation
  
  // Track which keys are currently pressed for continuous floor movement
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);

  const MOVE_DURATION_MS = 600; // matches JUMP_DURATION_S in PlaceholderCat

  const startMove = useCallback(() => {
    setIsMoving(true);
    setTimeout(() => setIsMoving(false), MOVE_DURATION_MS);
  }, []);

  const jumpToPlatform = useCallback((targetPlatformId: number | null, targetFloorX?: number) => {
    if (targetPlatformId === null || isMoving) return;
    
    const targetPlatform = getPlatform(targetPlatformId);
    if (!targetPlatform) return;

    startMove();
    setPlatform(targetPlatformId);
    
    // Set floor X position when jumping to floor
    if (targetPlatform.type === 'floor' && targetFloorX !== undefined) {
      setFloorX(targetFloorX);
    }
    
    // Land on first record (or null for window/floor)
    if (targetPlatform.type === 'shelf') {
      setRecordIndex(0);
    } else {
      setRecordIndex(null);
    }
  }, [isMoving, startMove]);

  // Check if cat is near the toy (for pickup)
  const isNearToy = useCallback(() => {
    if (!toyState || toyState.isCarried || carryingToy) return false;
    
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform || currentPlatform.type !== 'floor') return false;
    
    // Calculate distance on floor
    const dx = floorX - toyState.position.x;
    const dz = FLOOR_Z - toyState.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    return distance < PICKUP_DISTANCE;
  }, [toyState, carryingToy, platform, floorX]);

  // Check if cat is near the hat (for putting on)
  const isNearHat = useCallback(() => {
    if (!hatState || hatState.isWorn || wearingHat) return false;
    
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform || currentPlatform.type !== 'floor') return false;
    
    // Calculate distance on floor
    const dx = floorX - hatState.position.x;
    const dz = FLOOR_Z - hatState.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    return distance < PICKUP_DISTANCE;
  }, [hatState, wearingHat, platform, floorX]);

  // Pickup toy handler
  const pickupToy = useCallback(() => {
    if (isNearToy() && onPickupToy) {
      setCarryingToy(true);
      onPickupToy();
    }
  }, [isNearToy, onPickupToy]);

  // Drop toy handler
  const dropToy = useCallback(() => {
    if (carryingToy && onDropToy) {
      setCarryingToy(false);
      onDropToy(floorX, FLOOR_Z);
    }
  }, [carryingToy, floorX, onDropToy]);

  // Put on hat handler
  const pickupHat = useCallback(() => {
    if (isNearHat() && onPickupHat) {
      setWearingHat(true);
      onPickupHat();
    }
  }, [isNearHat, onPickupHat]);

  // Take off hat handler
  const dropHat = useCallback(() => {
    if (wearingHat && onDropHat) {
      setWearingHat(false);
      onDropHat(floorX, FLOOR_Z);
    }
  }, [wearingHat, floorX, onDropHat]);

  // Floor movement animation loop
  useEffect(() => {
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform || currentPlatform.type !== 'floor') {
      // Not on floor, cancel any animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const moveOnFloor = () => {
      let newX = floorX;
      let moved = false;

      if (keysPressed.current.has('ArrowLeft')) {
        newX = Math.max(FLOOR_BOUNDS.minX, floorX - FLOOR_MOVE_SPEED);
        moved = true;
      } else if (keysPressed.current.has('ArrowRight')) {
        newX = Math.min(FLOOR_BOUNDS.maxX, floorX + FLOOR_MOVE_SPEED);
        moved = true;
      }

      if (moved && newX !== floorX) {
        setFloorX(newX);
        setIsMoving(true);
      } else if (!keysPressed.current.has('ArrowLeft') && !keysPressed.current.has('ArrowRight')) {
        setIsMoving(false);
      }

      animationFrameRef.current = requestAnimationFrame(moveOnFloor);
    };

    animationFrameRef.current = requestAnimationFrame(moveOnFloor);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [platform, floorX]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform) return;

    // Handle floor-specific controls
    if (currentPlatform.type === 'floor') {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          keysPressed.current.add('ArrowLeft');
          setFacing('left');
          break;

        case 'ArrowRight':
          e.preventDefault();
          keysPressed.current.add('ArrowRight');
          setFacing('right');
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isMoving) return;
          // Jump up to closest bottom row shelf
          const closestShelf = findClosestBottomShelf(floorX);
          if (closestShelf) {
            jumpToPlatform(closestShelf.id);
          }
          break;

        case 'd':
        case 'D':
          // Drop toy or take off hat
          dropToy();
          dropHat();
          break;

        case 'Enter':
        case ' ':
          // Pick up toy or put on hat
          e.preventDefault();
          pickupToy();
          pickupHat();
          break;
      }
      return;
    }

    // Regular platform controls
    if (isMoving) return;

    switch (e.key) {
      case 'ArrowLeft':
        setFacing('left');
        if (currentPlatform.connections.left !== null) {
          jumpToPlatform(currentPlatform.connections.left);
        }
        break;

      case 'ArrowRight':
        setFacing('right');
        if (currentPlatform.connections.right !== null) {
          jumpToPlatform(currentPlatform.connections.right);
        }
        break;

      case 'ArrowUp':
        if (currentPlatform.connections.up !== null) {
          jumpToPlatform(currentPlatform.connections.up);
        }
        break;

      case 'ArrowDown':
        if (currentPlatform.connections.down !== null) {
          // For bottom row shelves, this goes to floor
          // Pass current X position so cat lands at same X
          const targetId = currentPlatform.connections.down;
          const targetPlatform = getPlatform(targetId);
          if (targetPlatform?.type === 'floor') {
            jumpToPlatform(targetId, currentPlatform.position.x);
          } else {
            jumpToPlatform(targetId);
          }
        }
        break;

      case 'd':
      case 'D':
        // Drop toy or take off hat (works on any platform)
        dropToy();
        dropHat();
        break;

      case 'Enter':
      case ' ':
        // Space/Enter: trigger pullup if on window
        if (currentPlatform.type === 'window') {
          e.preventDefault();
          setStartPullup(true);
          // Reset after a short delay to allow the animation to start
          setTimeout(() => setStartPullup(false), 100);
        }
        // Note: Floor interactions and record interactions are handled elsewhere
        break;
    }
  }, [platform, recordIndex, isMoving, jumpToPlatform, startMove, floorX, dropToy, pickupToy, dropHat, pickupHat]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      keysPressed.current.delete('ArrowLeft');
    } else if (e.key === 'ArrowRight') {
      keysPressed.current.delete('ArrowRight');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Current track index the cat is next to
  const currentTrackIndex = recordIndex !== null && getPlatform(platform)
    ? getPlatform(platform)!.records[recordIndex]
    : null;

  return {
    platform,
    recordIndex,
    facing,
    isMoving,
    floorX,
    carryingToy,
    wearingHat,
    currentTrackIndex,
    isNearToy: isNearToy(),
    isNearHat: isNearHat(),
    startPullup, // Add pullup trigger to state
    pickupToy,
    dropToy,
    pickupHat,
    dropHat,
  } as CatState & { 
    currentTrackIndex: number | null;
    isNearToy: boolean;
    isNearHat: boolean;
    startPullup: boolean;
    pickupToy: () => void;
    dropToy: () => void;
    pickupHat: () => void;
    dropHat: () => void;
  };
}
