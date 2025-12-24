import { useRef, Suspense } from 'react';
import { Mesh } from 'three';
import { useTexture } from '@react-three/drei';
import { Platform } from './Platform';
import type { SpotifyTrack } from '../../types';

interface RecordProps {
  track: SpotifyTrack;
  position: [number, number, number];
  isHighlighted?: boolean;
  onClick?: () => void;
}

function AlbumArt({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[1.8, 1.8]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export function Record({ track, position, isHighlighted = false, onClick }: RecordProps) {
  const recordRef = useRef<Mesh>(null);
  const albumArtUrl = track.album.images[0]?.url;
  const RECORD_SIZE = 2; // Same size as window

  return (
    <group position={position}>
      {/* Single platform underneath - same size as record */}
      <Platform position={[0, -1.1, 0]} size={[RECORD_SIZE, 0.1, 1.5]} />
      
      {/* Album art - large, fills most of the 2x2 space */}
      {albumArtUrl && (
        <Suspense fallback={null}>
          <AlbumArt url={albumArtUrl} />
        </Suspense>
      )}
      
      {/* Record disc border/frame - thin border around album art */}
      <mesh 
        ref={recordRef} 
        position={[0, 0, 0.01]}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <ringGeometry args={[0.9, 1.0, 48]} />
        <meshStandardMaterial 
          color={isHighlighted ? "#FFD700" : "#2C2C2C"}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Highlight ring */}
      {isHighlighted && (
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[1.0, 1.05, 48]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

