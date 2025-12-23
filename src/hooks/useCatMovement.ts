import { useState, useCallback, useEffect, useMemo } from 'react';
import { generatePlatforms, getPlatform } from '../config/platforms';
import type { CatState } from '../types';

interface UseCatMovementOptions {
  trackCount?: number;
}

export function useCatMovement(options: UseCatMovementOptions = {}) {
  const { trackCount = 5 } = options;
  
  // Generate platforms and find starting platform
  const { startPlatformId } = useMemo(() => {
    const platformMap = generatePlatforms(trackCount);
    // Find the first shelf in the bottom row (row 1) as starting position
    const startPlatform = Object.values(platformMap).find(p => 
      p.type === 'shelf' && p.grid.row === 1
    );
    return {
      startPlatformId: startPlatform?.id ?? Object.values(platformMap).find(p => p.type === 'shelf')?.id ?? 0,
    };
  }, [trackCount]);
  
  const [platform, setPlatform] = useState(startPlatformId);
  const [recordIndex, setRecordIndex] = useState<number | null>(0);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);

  const MOVE_DURATION_MS = 600; // matches JUMP_DURATION_S in PlaceholderCat

  const startMove = useCallback(() => {
    setIsMoving(true);
    setTimeout(() => setIsMoving(false), MOVE_DURATION_MS);
  }, []);

  const jumpToPlatform = useCallback((targetPlatformId: number | null) => {
    if (targetPlatformId === null || isMoving) return;
    
    const targetPlatform = getPlatform(targetPlatformId);
    if (!targetPlatform) return;

    startMove();
    setPlatform(targetPlatformId);
    
    // Land on first record (or null for window)
    setRecordIndex(targetPlatform.type === 'window' ? null : 0);
  }, [isMoving, startMove]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isMoving) return;

    const currentPlatform = getPlatform(platform);
    if (!currentPlatform) return;

    const records = currentPlatform.records;

    switch (e.key) {
      case 'ArrowLeft':
        setFacing('left');
        if (currentPlatform.type === 'window') {
          // At window, any arrow exits - go right
          jumpToPlatform(currentPlatform.connections.right);
        } else if (recordIndex !== null && recordIndex > 0) {
          // Move to previous record on same shelf
          startMove();
          setRecordIndex(recordIndex - 1);
        } else if (currentPlatform.connections.left !== null) {
          // Jump to left platform
          jumpToPlatform(currentPlatform.connections.left);
        }
        break;

      case 'ArrowRight':
        setFacing('right');
        if (currentPlatform.type === 'window') {
          jumpToPlatform(currentPlatform.connections.right);
        } else if (recordIndex !== null && recordIndex < records.length - 1) {
          // Move to next record on same shelf
          startMove();
          setRecordIndex(recordIndex + 1);
        } else if (currentPlatform.connections.right !== null) {
          // Jump to right platform
          jumpToPlatform(currentPlatform.connections.right);
        }
        break;

      case 'ArrowUp':
        if (currentPlatform.type === 'window') {
          jumpToPlatform(currentPlatform.connections.right);
        } else if (currentPlatform.connections.up !== null) {
          jumpToPlatform(currentPlatform.connections.up);
        }
        break;

      case 'ArrowDown':
        if (currentPlatform.type === 'window') {
          jumpToPlatform(currentPlatform.connections.right);
        } else if (currentPlatform.connections.down !== null) {
          jumpToPlatform(currentPlatform.connections.down);
        }
        break;
    }
  }, [platform, recordIndex, isMoving, jumpToPlatform, startMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Current track index the cat is next to
  const currentTrackIndex = recordIndex !== null && getPlatform(platform)
    ? getPlatform(platform)!.records[recordIndex]
    : null;

  return {
    platform,
    recordIndex,
    facing,
    isMoving,
    currentTrackIndex,
  } as CatState & { currentTrackIndex: number | null };
}

