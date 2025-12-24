import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getPlatform, findClosestBottomShelf, FLOOR_BOUNDS } from '../config/platforms';
import type { CatState, ToyState, HatState, LampState } from '../types';
import { FLOOR_Y, FLOOR_Z, FLOOR_PLATFORM_ID } from '../types';

interface UseCatMovementOptions {
  trackCount?: number;
  toyState?: ToyState;
  hatState?: HatState;
  lampState?: LampState;
  onPickupToy?: () => void;
  onDropToy?: (x: number, z: number) => void;
  onPickupHat?: () => void;
  onDropHat?: (x: number, z: number) => void;
  onPickupLamp?: () => void;
  onDropLamp?: (x: number, z: number) => void;
}

// Proximity threshold for toy pickup
const PICKUP_DISTANCE = 1;
// Floor movement speed (units per frame at 60fps)
const FLOOR_MOVE_SPEED = 0.15;

export function useCatMovement(options: UseCatMovementOptions = {}) {
  const { trackCount = 5, toyState, hatState, lampState, onPickupToy, onDropToy, onPickupHat, onDropHat, onPickupLamp, onDropLamp } = options;
  
  // Generate platforms and find starting platform
  const { startPlatformId, startFloorX } = useMemo(() => {
    // Start on the floor platform
    return {
      startPlatformId: FLOOR_PLATFORM_ID,
      startFloorX: 0, // Center of floor bounds
    };
  }, []);
  
  const [platform, setPlatform] = useState(startPlatformId);
  const [recordIndex, setRecordIndex] = useState<number | null>(null);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);
  const [floorX, setFloorX] = useState(startFloorX); // X position when on floor
  const [carryingToy, setCarryingToy] = useState(false);
  const [wearingHat, setWearingHat] = useState(false);
  const [wearingLamp, setWearingLamp] = useState(false);
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

  // Helper function to check if cat and object are near each other
  const areObjectsNear = useCallback((
    catPos: { x: number; y: number; z: number },
    objectPos: { x: number; y: number; z: number }
  ): boolean => {
    const dx = catPos.x - objectPos.x;
    const dy = catPos.y - objectPos.y;
    const dz = catPos.z - objectPos.z;
    return Math.abs(dx) < PICKUP_DISTANCE && Math.abs(dy) < PICKUP_DISTANCE && Math.abs(dz) < PICKUP_DISTANCE;
  }, []);

  // Check if cat is near the toy (for pickup)
  const isNearToy = useCallback(() => {
    if (!toyState || toyState.isCarried || carryingToy) return false;
    
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform || currentPlatform.type !== 'floor') return false;
    
    const catPos = { x: floorX, y: FLOOR_Y + 0.15, z: FLOOR_Z + 0.3 };
    return areObjectsNear(catPos, toyState.position);
  }, [toyState, carryingToy, platform, floorX, areObjectsNear]);

  // Check if cat is near the hat (for putting on)
  const isNearHat = useCallback(() => {
    if (!hatState || hatState.isWorn || wearingHat) return false;
    
    const catPos = { x: floorX, y: FLOOR_Y + 0.15, z: FLOOR_Z + 0.3 };
    return areObjectsNear(catPos, hatState.position);
  }, [hatState, wearingHat, platform, floorX, areObjectsNear]);

  // Check if cat is near the lamp (for putting on head)
  const isNearLamp = useCallback(() => {
    if (!lampState || lampState.isWorn || wearingLamp) return false;
    
    const currentPlatform = getPlatform(platform);
    if (!currentPlatform) return false;
    
    // Calculate cat position (lamp can be on floor or shelf)
    let catX: number, catY: number, catZ: number;
    
    if (currentPlatform.type === 'floor') {
      catX = floorX;
      catY = FLOOR_Y + 0.15;
      catZ = FLOOR_Z + 0.3;
    } else {
      // Shelf or other platform types
      catX = currentPlatform.position.x;
      if (currentPlatform.type === 'shelf' && recordIndex !== null && recordIndex < currentPlatform.records.length) {
        const recordCount = currentPlatform.records.length;
        const RECORD_SPACING = 2.2;
        const totalWidth = (recordCount - 1) * RECORD_SPACING;
        const startOffset = -totalWidth / 2;
        catX = currentPlatform.position.x + startOffset + recordIndex * RECORD_SPACING;
      }
      catY = currentPlatform.position.y - 1.1 + 0.15;
      catZ = currentPlatform.position.z + 0.6;
    }
    
    const catPos = { x: catX, y: catY, z: catZ };
    return areObjectsNear(catPos, lampState.position);
  }, [lampState, wearingLamp, platform, recordIndex, floorX, areObjectsNear]);


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

  // Put on lamp handler
  const pickupLamp = useCallback(() => {
    if (isNearLamp() && onPickupLamp) {
      setWearingLamp(true);
      onPickupLamp();
    }
  }, [isNearLamp, onPickupLamp]);

  // Take off lamp handler
  const dropLamp = useCallback(() => {
    if (wearingLamp && onDropLamp) {
      const currentPlatform = getPlatform(platform);
      if (currentPlatform && currentPlatform.type === 'shelf') {
        setWearingLamp(false);
        onDropLamp(currentPlatform.position.x, currentPlatform.position.z);
      } else if (currentPlatform && currentPlatform.type === 'floor') {
        setWearingLamp(false);
        onDropLamp(floorX, FLOOR_Z);
      }
    }
  }, [wearingLamp, platform, floorX, onDropLamp]);

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
          // Drop toy, take off hat, or take off lamp
          dropToy();
          dropHat();
          dropLamp();
          break;

        case 'Enter':
        case ' ':
          break;
          
        case 'g':
        case 'G':
          // Pick up toy or put on lamp
          e.preventDefault();
          pickupHat();
          pickupToy();
          pickupLamp();
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
        // Drop toy, take off hat, or take off lamp (works on any platform)
        dropToy();
        dropHat();
        dropLamp();
        break;

      case 'g':
      case 'G':
        // Pick up toy or put on lamp (works on shelves)
        e.preventDefault();
        pickupHat();
        pickupToy();
        pickupLamp();
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
  }, [platform, recordIndex, isMoving, jumpToPlatform, startMove, floorX, dropToy, pickupToy, dropHat, pickupHat, pickupLamp, dropLamp]);

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
    wearingLamp,
    currentTrackIndex,
    isNearToy: isNearToy(),
    isNearHat: isNearHat(),
    isNearLamp: isNearLamp(),
    startPullup, // Add pullup trigger to state
    pickupToy,
    dropToy,
    pickupHat,
    dropHat,
    pickupLamp,
    dropLamp,
  } as CatState & { 
    currentTrackIndex: number | null;
    isNearToy: boolean;
    isNearHat: boolean;
    isNearLamp: boolean;
    startPullup: boolean;
    pickupToy: () => void;
    dropToy: () => void;
    pickupHat: () => void;
    dropHat: () => void;
    pickupLamp: () => void;
    dropLamp: () => void;
  };
}
