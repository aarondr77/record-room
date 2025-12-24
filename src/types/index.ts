// Spotify types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  uri: string;
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: {
    items: Array<{ track: SpotifyTrack }>;
    total: number;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
}

// Notes types
export interface Note {
  id: string;
  track_id: string;
  author: string;
  content: string;
  created_at: string;
}

// Platform types
export interface Platform {
  id: number;
  grid: { row: number; col: number };
  position: { x: number; y: number; z: number };
  connections: {
    left: number | null;
    right: number | null;
    up: number | null;
    down: number | null;
  };
  type: 'shelf' | 'window' | 'floor' | 'medal';
  records: number[]; // Indices into playlist
}

// Floor-specific constants
export const FLOOR_PLATFORM_ID = -1;
export const FLOOR_Y = -3; // Matches Floor.tsx position
export const FLOOR_Z = 2; // Matches Floor.tsx position

export interface CatState {
  platform: number;
  recordIndex: number | null;
  facing: 'left' | 'right';
  isMoving: boolean;
  floorX: number; // X position when on floor (continuous, not discrete)
  carryingToy: boolean;
  wearingHat: boolean;
  wearingLamp: boolean;
}

// Toy state for lobster toy
export interface ToyState {
  position: { x: number; y: number; z: number };
  isCarried: boolean;
}

// Hat state for baseball hat
export interface HatState {
  position: { x: number; y: number; z: number };
  isWorn: boolean;
}

// Lamp state for shelf lamp
export interface LampState {
  position: { x: number; y: number; z: number };
  isWorn: boolean;
}

// 3D Scene types
export interface SceneProps {
  children?: React.ReactNode;
}

