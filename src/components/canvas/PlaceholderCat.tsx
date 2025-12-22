import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { getPlatform } from '../../config/platforms';
import type { CatState } from '../../types';

interface PlaceholderCatProps {
  catState: CatState & { currentTrackIndex: number | null };
}

export function PlaceholderCat({ catState }: PlaceholderCatProps) {
  const catRef = useRef<Mesh>(null);
  const { platform, recordIndex, facing } = catState;

  const platformData = getPlatform(platform);
  if (!platformData) return null;

  // Calculate cat position
  let catPosition = { ...platformData.position };
  
  if (platformData.type === 'shelf' && recordIndex !== null && recordIndex < platformData.records.length) {
    // Position cat next to the current record on the shelf
    // Records are now 2x2 and spaced 2.2 apart
    const recordCount = platformData.records.length;
    const RECORD_SPACING = 2.2;
    const totalWidth = (recordCount - 1) * RECORD_SPACING;
    const startOffset = -totalWidth / 2;
    catPosition.x += startOffset + recordIndex * RECORD_SPACING;
  }

  // Position cat on the platform (platform is at y - 1.1 from record center)
  catPosition.y = platformData.position.y - 1.1 + 0.3; // Platform y + slight offset to sit on it

  useFrame(() => {
    if (catRef.current) {
      // Smoothly move to target position
      catRef.current.position.lerp(
        { x: catPosition.x, y: catPosition.y, z: catPosition.z },
        0.1
      );
      
      // Face the correct direction
      catRef.current.rotation.y = facing === 'left' ? Math.PI : 0;
    }
  });

  return (
    <mesh ref={catRef} position={[catPosition.x, catPosition.y, catPosition.z]} castShadow>
      {/* Simple box cat placeholder */}
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#FFA500" />
      
      {/* Eyes */}
      <mesh position={[0.1, 0.1, 0.21]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[-0.1, 0.1, 0.21]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
    </mesh>
  );
}

