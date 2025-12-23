import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Wall } from './Wall';
import { Floor } from './Floor';
import { Lighting } from './Lighting';
import { Shelf } from './Shelf';
import { Window } from './Window';
import { PlaceholderCat } from './PlaceholderCat';
import { CameraFollow } from './CameraFollow';
import { getAllPlatforms, generatePlatforms, calculateWallWidth } from '../../config/platforms';
import type { SpotifyTrack } from '../../types';
import type { CatState } from '../../types';

interface RoomProps {
  tracks: SpotifyTrack[];
  catState: CatState & { currentTrackIndex: number | null };
  onRecordClick?: (trackIndex: number) => void;
}

export function Room({ tracks, catState, onRecordClick }: RoomProps) {
  // Generate platforms dynamically based on track count
  const platforms = useMemo(() => getAllPlatforms(tracks.length), [tracks.length]);
  
  // Calculate wall width based on platform layout
  const wallSize = useMemo(() => {
    const platformMap = generatePlatforms(tracks.length);
    const width = calculateWallWidth(platformMap);
    return [width, 30] as [number, number];
  }, [tracks.length]);

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
      
      {/* Camera follows cat */}
      <CameraFollow catState={catState} />
      
      <Lighting />
      
      {/* Wall - dynamically sized based on platform layout */}
      <Wall position={[0, 0, 0]} size={wallSize} />
      
      {/* Floor - width matches wall width */}
      <Floor position={[0, -3, 2]} width={wallSize[0]} depth={10} />
      
      {/* Platforms, Shelves, and Window */}
      <Suspense fallback={null}>
        {platforms.map((platform) => {
          if (platform.type === 'window') {
            return (
              <Window
                key={platform.id}
                position={[platform.position.x, platform.position.y, platform.position.z]}
                hasPlatform={true}
              />
            );
          } else {
            return (
              <Shelf
                key={platform.id}
                platform={platform}
                tracks={tracks}
                highlightedTrackIndex={catState.currentTrackIndex}
                onRecordClick={onRecordClick}
              />
            );
          }
        })}
      </Suspense>
      
      {/* Cat */}
      <PlaceholderCat catState={catState} />
    </Canvas>
  );
}

