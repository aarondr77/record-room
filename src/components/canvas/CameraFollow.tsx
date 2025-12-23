import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getPlatform } from '../../config/platforms';
import type { CatState } from '../../types';

interface CameraFollowProps {
  catState: CatState;
}

export function CameraFollow({ catState }: CameraFollowProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3(0, 0, 8));
  const currentPosition = useRef(new Vector3(0, 0, 8));

  // Initialize current position to camera's current position
  useEffect(() => {
    currentPosition.current.set(camera.position.x, camera.position.y, camera.position.z);
  }, [camera]);

  // Calculate target camera position based on cat's position
  useEffect(() => {
    const platformData = getPlatform(catState.platform);
    if (!platformData) return;

    // Calculate cat position (same logic as PlaceholderCat)
    let catX = platformData.position.x;
    
    if (platformData.type === 'shelf' && catState.recordIndex !== null && catState.recordIndex < platformData.records.length) {
      const recordCount = platformData.records.length;
      const RECORD_SPACING = 2.2;
      const totalWidth = (recordCount - 1) * RECORD_SPACING;
      const startOffset = -totalWidth / 2;
      catX += startOffset + catState.recordIndex * RECORD_SPACING;
    }

    // Camera follows cat's X position, but maintains fixed Y and Z
    // Smoothly interpolate to keep cat centered in view
    targetPosition.current.set(catX, 0, 8);
  }, [catState.platform, catState.recordIndex]);

  // Smoothly interpolate camera position
  useFrame((_state, delta) => {
    const lerpFactor = Math.min(1, delta * 3); // Smooth following speed
    currentPosition.current.lerp(targetPosition.current, lerpFactor);
    camera.position.copy(currentPosition.current);
  });

  return null;
}

