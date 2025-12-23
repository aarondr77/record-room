import { Platform } from '../types';

// Dynamic platform generation constants
const ITEM_SIZE = 2; // Size of each record/window
const WALL_HEIGHT = 6; // Total wall height in 3D units
const RECORDS_PER_SHELF = 1; // Number of records per shelf initially
const RECORD_SPACING = 2.2; // Space between records on a shelf
const GAP_WIDTH = 0.5; // Gap between columns
const GAP_HEIGHT = 0.5; // Gap between rows
const VERTICAL_OFFSET = 0.6; // Move everything up by this amount

// Calculate position for a platform at a given row and column
function calculatePosition(row: number, col: number, isWindow: boolean = false): { x: number; y: number; z: number } {
  // Window is always at column 0, row 0
  if (isWindow) {
    const startX = -4; // Fixed position for window
    const startY = (WALL_HEIGHT / 2) - GAP_HEIGHT - (ITEM_SIZE / 2) + VERTICAL_OFFSET;
    return {
      x: startX,
      y: startY,
      z: 0.1, // Slightly in front of wall
    };
  }
  
  // For shelves, calculate position based on column
  // Column 0 is window, so shelves start at column 1
  const shelfCol = col - 1;
  const startX = -4 + ITEM_SIZE + GAP_WIDTH + (shelfCol * (ITEM_SIZE + GAP_WIDTH));
  const startY = (WALL_HEIGHT / 2) - GAP_HEIGHT - (ITEM_SIZE / 2) - (row * (ITEM_SIZE + GAP_HEIGHT)) + VERTICAL_OFFSET;
  
  return {
    x: startX,
    y: startY,
    z: 0.1, // Slightly in front of wall
  };
}

// Cache for generated platforms
let cachedPlatforms: Record<number, Platform> | null = null;
let cachedTrackCount: number = 0;

// Generate platforms dynamically based on track count
export function generatePlatforms(trackCount: number): Record<number, Platform> {
  // Return cached platforms if track count hasn't changed
  if (cachedPlatforms && cachedTrackCount === trackCount) {
    return cachedPlatforms;
  }
  
  const platforms: Record<number, Platform> = {};
  let platformId = 0;
  let trackIndex = 0;
  
  // Row 0: Window at (0,0)
  const windowId = platformId++;
  platforms[windowId] = {
    id: windowId,
    grid: { row: 0, col: 0 },
    position: calculatePosition(0, 0, true),
    connections: { left: null, right: null, up: null, down: null },
    type: 'window',
    records: [],
  };
  
  // Generate shelves in 2 rows, extending to the right
  // Distribute tracks: first to top row, then bottom row, alternating columns
  const ROWS = 2;
  const shelvesByRow: Record<number, Platform[]> = { 0: [], 1: [] };
  
  // Calculate how many columns we need
  const columnsNeeded = Math.ceil(trackCount / ROWS);
  
  // Create shelves column by column
  for (let col = 1; col <= columnsNeeded; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (trackIndex >= trackCount) break;
      
      const shelfId = platformId++;
      const shelfPosition = calculatePosition(row, col);
      
      platforms[shelfId] = {
        id: shelfId,
        grid: { row, col },
        position: shelfPosition,
        connections: { left: null, right: null, up: null, down: null },
        type: 'shelf',
        records: [trackIndex],
      };
      
      shelvesByRow[row].push(platforms[shelfId]);
      trackIndex++;
    }
  }
  
  // Set up connections
  Object.values(platforms).forEach(platform => {
    if (platform.type === 'shelf') {
      const { row, col } = platform.grid;
      
      // Left connection
      if (col === 1) {
        // First column: connect to window if top row, or shelf above if bottom row
        if (row === 0) {
          platform.connections.left = windowId;
        } else {
          const shelfAbove = shelvesByRow[0].find(p => p.grid.col === col);
          platform.connections.left = shelfAbove?.id ?? null;
        }
      } else {
        // Other columns: connect to shelf in same row, previous column
        const leftShelf = shelvesByRow[row].find(p => p.grid.col === col - 1);
        platform.connections.left = leftShelf?.id ?? null;
      }
      
      // Right connection
      const rightShelf = shelvesByRow[row].find(p => p.grid.col === col + 1);
      platform.connections.right = rightShelf?.id ?? null;
      
      // Up connection (only for bottom row)
      if (row === 1) {
        const shelfAbove = shelvesByRow[0].find(p => p.grid.col === col);
        platform.connections.up = shelfAbove?.id ?? null;
      }
      
      // Down connection (only for top row)
      if (row === 0) {
        const shelfBelow = shelvesByRow[1].find(p => p.grid.col === col);
        platform.connections.down = shelfBelow?.id ?? null;
      }
    }
  });
  
  // Update window connections
  const firstTopShelf = shelvesByRow[0][0];
  const firstBottomShelf = shelvesByRow[1][0];
  if (firstTopShelf) {
    platforms[windowId].connections.right = firstTopShelf.id;
  }
  if (firstBottomShelf) {
    platforms[windowId].connections.down = firstBottomShelf.id;
  }
  
  // Cache the result
  cachedPlatforms = platforms;
  cachedTrackCount = trackCount;
  
  return platforms;
}

// Calculate wall width based on platforms
export function calculateWallWidth(platforms: Record<number, Platform>): number {
  const allPlatforms = Object.values(platforms);
  if (allPlatforms.length === 0) return 50; // Default width
  
  // Find the rightmost platform
  let maxX = -Infinity;
  allPlatforms.forEach(platform => {
    const rightEdge = platform.position.x + ITEM_SIZE / 2;
    if (rightEdge > maxX) {
      maxX = rightEdge;
    }
  });
  
  // Add padding on the right
  const padding = 5;
  const wallWidth = Math.max(50, (maxX + padding) * 2); // Ensure minimum width
  
  return wallWidth;
}

export const CAT_START_PLATFORM = 4; // Will be updated dynamically
export const CAT_START_RECORD = 0;

// Helper function to get platform by ID
// Uses cached platforms if available, otherwise generates with default track count
export function getPlatform(id: number, trackCount?: number): Platform | undefined {
  if (cachedPlatforms && (!trackCount || cachedTrackCount === trackCount)) {
    return cachedPlatforms[id];
  }
  // If no cache or track count changed, generate platforms
  if (trackCount) {
    const platforms = generatePlatforms(trackCount);
    return platforms[id];
  }
  // Fallback: use cached or generate with default
  if (!cachedPlatforms) {
    cachedPlatforms = generatePlatforms(5);
  }
  return cachedPlatforms[id];
}

// Helper function to get all platforms (requires track count)
export function getAllPlatforms(trackCount: number = 5): Platform[] {
  const platforms = generatePlatforms(trackCount);
  return Object.values(platforms);
}
