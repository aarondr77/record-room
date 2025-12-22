import { useRef, useMemo } from 'react';
import { Mesh } from 'three';
import { Record } from './Record';
import { Platform } from './Platform';
import type { SpotifyTrack } from '../../types';
import type { Platform as PlatformType } from '../../types';

interface ShelfProps {
  platform: PlatformType;
  tracks: SpotifyTrack[];
  highlightedTrackIndex: number | null;
  onRecordClick?: (trackIndex: number) => void;
}

export function Shelf({ platform, tracks, highlightedTrackIndex, onRecordClick }: ShelfProps) {
  const RECORD_SIZE = 2; // Same size as window
  const RECORD_SPACING = 2.2; // Space between records (slightly more than record size)

  // Calculate record positions on shelf - evenly spaced
  const recordPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];
    const recordCount = platform.records.length;
    const totalWidth = (recordCount - 1) * RECORD_SPACING;
    const startOffset = -totalWidth / 2;
    
    platform.records.forEach((trackIndex, index) => {
      positions.push([
        platform.position.x + startOffset + index * RECORD_SPACING,
        platform.position.y,
        platform.position.z,
      ]);
    });
    
    return positions;
  }, [platform]);

  return (
    <group>
      {/* Records - each has its own platform, no shelf board */}
      {platform.records.map((trackIndex, index) => {
        const track = tracks[trackIndex];
        if (!track) return null;
        
        return (
          <Record
            key={track.id}
            track={track}
            position={recordPositions[index]}
            isHighlighted={highlightedTrackIndex === trackIndex}
            onClick={() => onRecordClick?.(trackIndex)}
          />
        );
      })}
    </group>
  );
}

