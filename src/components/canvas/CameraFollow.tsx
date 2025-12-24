import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getPlatform } from '../../config/platforms';
import type { CatState } from '../../types';

interface CameraFollowProps {
  catState: CatState;
  isZoomed?: boolean;
  zoomTarget?: { x: number; y: number; z: number };
}

// Default camera Z distance
const DEFAULT_CAMERA_Z = 8;
// Zoomed-in camera Z distance (closer to target)
const ZOOMED_CAMERA_Z = 3;

export function CameraFollow({ catState, isZoomed = false, zoomTarget }: CameraFollowProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3(0, 0, DEFAULT_CAMERA_Z));
  const currentPosition = useRef(new Vector3(0, 0, DEFAULT_CAMERA_Z));

  // Initialize current position to camera's current position
  useEffect(() => {
    currentPosition.current.set(camera.position.x, camera.position.y, camera.position.z);
  }, [camera]);

  // Calculate target camera position based on cat's position or zoom target
  useEffect(() => {
    if (isZoomed && zoomTarget) {
      // When zoomed, position camera to look at the zoom target
      // Camera positioned at zoom target X/Y, but at ZOOMED_CAMERA_Z distance
      targetPosition.current.set(zoomTarget.x, zoomTarget.y, ZOOMED_CAMERA_Z);
      return;
    }

    // Normal cat-following behavior
    const platformData = getPlatform(catState.platform);
    if (!platformData) return;

    // Calculate cat position (same logic as PlaceholderCat)
    let catX = platformData.position.x;
    let catY = platformData.position.y;
    
    if (platformData.type === 'floor') {
      // On floor: use floorX for X position, lower camera Y
      catX = catState.floorX;
      catY = -2; // Lower Y to see floor better
    } else if (platformData.type === 'shelf' && catState.recordIndex !== null && catState.recordIndex < platformData.records.length) {
      const recordCount = platformData.records.length;
      const RECORD_SPACING = 2.2;
      const totalWidth = (recordCount - 1) * RECORD_SPACING;
      const startOffset = -totalWidth / 2;
      catX += startOffset + catState.recordIndex * RECORD_SPACING;
    }

    // Camera follows cat's X position, adjusts Y for floor/shelves
    // Smoothly interpolate to keep cat centered in view
    targetPosition.current.set(catX, catY * 0.3, DEFAULT_CAMERA_Z);
  }, [catState.platform, catState.recordIndex, catState.floorX, isZoomed, zoomTarget]);

  // Smoothly interpolate camera position
  useFrame((_state, delta) => {
    // Use slower lerp when zooming for smoother transition
    const lerpFactor = Math.min(1, delta * (isZoomed ? 2 : 3));
    currentPosition.current.lerp(targetPosition.current, lerpFactor);
    camera.position.copy(currentPosition.current);
  });

  return null;
}

