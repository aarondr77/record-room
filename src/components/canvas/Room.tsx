import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Wall } from './Wall';
import { Floor } from './Floor';
import { Lighting } from './Lighting';
import { Shelf } from './Shelf';
import { Window } from './Window';
import { MedalCase } from './MedalCase';
import { PlaceholderCat } from './PlaceholderCat';
import { CameraFollow } from './CameraFollow';
import { LobsterToy } from './LobsterToy';
import { BaseballHat } from './BaseballHat';
import { ChristmasLights } from './ChristmasLights';
import { FloorLamp } from './FloorLamp';
import { ArcLamp } from './ArcLamp';
import { ShelfLamp } from './ShelfLamp';
import { PothosPlant } from './PothosPlant';
import { getAllPlatforms, generatePlatforms, calculateWallWidth } from '../../config/platforms';
import type { SpotifyTrack, ToyState, HatState } from '../../types';
import type { CatState } from '../../types';
import { FLOOR_Y, FLOOR_Z } from '../../types';

interface RoomProps {
  tracks: SpotifyTrack[];
  catState: CatState & { currentTrackIndex: number | null };
  toyState: ToyState;
  hatState: HatState;
  onRecordClick?: (trackIndex: number) => void;
  isZoomed?: boolean;
  zoomTarget?: { x: number; y: number; z: number };
  isPlaying?: boolean;
}

export function Room({ tracks, catState, toyState, hatState, onRecordClick, isZoomed, zoomTarget, isPlaying = false }: RoomProps) {
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
      
      {/* Camera follows cat (or zooms to target) */}
      <CameraFollow catState={catState} isZoomed={isZoomed} zoomTarget={zoomTarget} />
      
      <Lighting />
      
      {/* Wall - dynamically sized based on platform layout */}
      <Wall position={[0, 0, 0]} size={wallSize} />
      
      {/* Floor - width matches wall width */}
      <Floor position={[0, -3, 2]} width={wallSize[0]} depth={10} />
      
      {/* Platforms, Shelves, Window, and Medal Case */}
      <Suspense fallback={null}>
        {/* Christmas string lights along top of platforms */}
        <ChristmasLights platforms={platforms.filter(p => p.type !== 'floor')} />
        
        {platforms.map((platform) => {
          // Skip floor platform from shelf/window rendering
          if (platform.type === 'floor') {
            return null;
          }
          if (platform.type === 'window') {
            return (
              <Window
                key={platform.id}
                position={[platform.position.x, platform.position.y, platform.position.z]}
                hasPlatform={true}
              />
            );
          } else if (platform.type === 'medal') {
            return (
              <MedalCase
                key={platform.id}
                position={[platform.position.x, platform.position.y, platform.position.z]}
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
      
      {/* Lobster toy on floor - only show when not being carried */}
      {!toyState.isCarried && (
        <LobsterToy 
          position={[toyState.position.x, FLOOR_Y + .05, FLOOR_Z]} 
          isCarried={toyState.isCarried}
        />
      )}
      
      {/* Baseball hat on floor - only show when not being worn */}
      {!hatState.isWorn && (
        <BaseballHat 
          position={[hatState.position.x, FLOOR_Y + .2, FLOOR_Z]} 
          isWorn={hatState.isWorn}
        />
      )}
      
      {/* Cat */}
      <PlaceholderCat 
        catState={catState} 
        carryingToy={toyState.isCarried} 
        wearingHat={hatState.isWorn}
        isPlaying={isPlaying} 
      />
      
      {/* Floor lamp with warm yellow glow - left side */}
      <FloorLamp position={[-4, FLOOR_Y, FLOOR_Z + 0.5]} />
      
      {/* Funky arc lamp - right side */}
      <ArcLamp position={[10, FLOOR_Y, FLOOR_Z + 0.5]} />
      
      {/* Small shelf lamp */}
      <ShelfLamp position={[4, -1.4, 0.8]} lampPostColor="#1e4005" lightColor="#ba5d9d" />
      
      {/* Pothos plant on top shelf (row 0, col 0) with vines trailing down to bottom shelf */}
      {/* Top shelf y ≈ 2.1 (record center), shelf surface ≈ 1.1, vine hangs ~2.5 units to reach row 1 */}
      <PothosPlant position={[-.75, 1.1, 0.5]} vineLength={2.5} />
    </Canvas>
  );
}
