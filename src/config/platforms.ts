import { Platform } from '../types';

// 2-level shelf layout:
// Row 0: WINDOW | RECORD | RECORD
// Row 1: RECORD | RECORD | RECORD
const COLUMNS = 3;
const ROWS = 2;
const ITEM_SIZE = 2; // Size of each record/window
const WALL_WIDTH = 10; // Total wall width in 3D units
const WALL_HEIGHT = 6; // Total wall height in 3D units

// Calculate evenly spaced position
function calculateEvenPosition(row: number, col: number): { x: number; y: number; z: number } {
  // Calculate center positions for evenly distributed items
  const totalItemWidth = COLUMNS * ITEM_SIZE;
  const totalItemHeight = ROWS * ITEM_SIZE;
  const remainingWidth = WALL_WIDTH - totalItemWidth;
  const remainingHeight = WALL_HEIGHT - totalItemHeight;
  const gapWidth = remainingWidth / (COLUMNS + 1);
  const gapHeight = remainingHeight / (ROWS + 1);
  
  // Calculate center position for each item
  const startX = -(WALL_WIDTH / 2) + gapWidth + (ITEM_SIZE / 2);
  const startY = (WALL_HEIGHT / 2) - gapHeight - (ITEM_SIZE / 2);
  
  return {
    x: startX + col * (ITEM_SIZE + gapWidth),
    y: startY - row * (ITEM_SIZE + gapHeight),
    z: 0.1, // Slightly in front of wall
  };
}

// Platform definitions - 2 rows, 3 columns
// Row 0: WINDOW | RECORD | RECORD
// Row 1: RECORD | RECORD | RECORD
export const platforms: Record<number, Platform> = {
  // Row 0 (top)
  0: {
    id: 0,
    grid: { row: 0, col: 0 },
    position: calculateEvenPosition(0, 0),
    connections: { left: null, right: 1, up: null, down: 3 },
    type: 'window',
    records: [],
  },
  1: {
    id: 1,
    grid: { row: 0, col: 1 },
    position: calculateEvenPosition(0, 1),
    connections: { left: 0, right: 2, up: null, down: 4 },
    type: 'shelf',
    records: [0],
  },
  2: {
    id: 2,
    grid: { row: 0, col: 2 },
    position: calculateEvenPosition(0, 2),
    connections: { left: 1, right: null, up: null, down: 5 },
    type: 'shelf',
    records: [1],
  },
  // Row 1 (bottom)
  3: {
    id: 3,
    grid: { row: 1, col: 0 },
    position: calculateEvenPosition(1, 0),
    connections: { left: null, right: 4, up: 0, down: null },
    type: 'shelf',
    records: [2],
  },
  4: {
    id: 4,
    grid: { row: 1, col: 1 },
    position: calculateEvenPosition(1, 1),
    connections: { left: 3, right: 5, up: 1, down: null },
    type: 'shelf',
    records: [3],
  },
  5: {
    id: 5,
    grid: { row: 1, col: 2 },
    position: calculateEvenPosition(1, 2),
    connections: { left: 4, right: null, up: 2, down: null },
    type: 'shelf',
    records: [4],
  },
};

export const CAT_START_PLATFORM = 4; // Start in middle of bottom row
export const CAT_START_RECORD = 0;

// Helper function to get platform by ID
export function getPlatform(id: number): Platform | undefined {
  return platforms[id];
}

// Helper function to get all platforms
export function getAllPlatforms(): Platform[] {
  return Object.values(platforms);
}
