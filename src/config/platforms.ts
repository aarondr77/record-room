import { Platform, FLOOR_PLATFORM_ID, FLOOR_Y, FLOOR_Z } from '../types';

// Dynamic platform generation constants
const ITEM_SIZE = 2; // Size of each record/window
const WALL_HEIGHT = 6; // Total wall height in 3D units
const GAP_WIDTH = 0.5; // Gap between columns
const GAP_HEIGHT = 0.5; // Gap between rows
const VERTICAL_OFFSET = 0.6; // Move everything up by this amount

// Floor platform constants
export const FLOOR_BOUNDS = {
  minX: -10,
  maxX: 15,
};

// ===== SPECIAL OBJECT POSITION CONFIGURATION =====
// Configure positions of special objects (window, medal, etc.) in the grid
// Row 0 = top shelf, Row 1 = bottom shelf
// Column 0 = leftmost position, Column 1+ = shelf positions
export type SpecialObjectType = 'window' | 'medal';

export interface SpecialObjectPosition {
  type: SpecialObjectType;
  row: number;
  col: number;
}

// Array of special objects - you can add multiple windows, medals, etc.
export const SPECIAL_OBJECT_POSITIONS: SpecialObjectPosition[] = [
  { type: 'window', row: 0, col: 2 },
  { type: 'medal', row: 1, col: 4 },
  { type: 'window', row: 0, col: 5 },
];

// Calculate position for a platform at a given row and column
// All columns use the same positioning formula for consistency
function calculatePosition(row: number, col: number): { x: number; y: number; z: number } {
  // Base X position for column 0
  const BASE_X = -4;
  
  // Calculate X position: column 0 is at BASE_X, each subsequent column adds spacing
  // Column 0: BASE_X
  // Column 1: BASE_X + ITEM_SIZE + GAP_WIDTH
  // Column 2: BASE_X + ITEM_SIZE + GAP_WIDTH + (ITEM_SIZE + GAP_WIDTH)
  // etc.
  const startX = col === 0 
    ? BASE_X 
    : BASE_X + ITEM_SIZE + GAP_WIDTH + ((col - 1) * (ITEM_SIZE + GAP_WIDTH));
  
  // Calculate Y position based on row
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
  
  // Create all special objects (windows, medals, etc.) from configuration
  const specialObjectIds: Record<string, number[]> = { window: [], medal: [] };
  const occupiedPositions = new Set<string>(); // Track occupied positions as "row,col"
  
  SPECIAL_OBJECT_POSITIONS.forEach((config) => {
    const positionKey = `${config.row},${config.col}`;
    if (occupiedPositions.has(positionKey)) {
      console.warn(`Position (${config.row}, ${config.col}) is already occupied, skipping ${config.type}`);
      return;
    }
    
    const specialId = platformId++;
    platforms[specialId] = {
      id: specialId,
      grid: { row: config.row, col: config.col },
      position: calculatePosition(config.row, config.col),
      connections: { left: null, right: null, up: null, down: null },
      type: config.type,
      records: [],
    };
    
    specialObjectIds[config.type].push(specialId);
    occupiedPositions.add(positionKey);
  });
  
  // Generate shelves in 2 rows, extending to the right
  // Special items are placed at specific positions, tracks fill remaining slots
  const ROWS = 2;
  const shelvesByRow: Record<number, Platform[]> = { 0: [], 1: [] };
  
  // Calculate how many columns we need (accounting for special objects taking slots)
  const specialObjectCount = SPECIAL_OBJECT_POSITIONS.length;
  const columnsNeeded = Math.ceil((trackCount + specialObjectCount) / ROWS);
  
  // Create platforms column by column, starting from column 0
  // Skip positions already occupied by special objects
  for (let col = 0; col <= columnsNeeded; col++) {
    for (let row = 0; row < ROWS; row++) {
      const positionKey = `${row},${col}`;
      
      // Skip if this position is occupied by a special object
      if (occupiedPositions.has(positionKey)) {
        // Check if it's a medal or window that should be in shelvesByRow
        const specialObj = SPECIAL_OBJECT_POSITIONS.find(s => s.row === row && s.col === col);
        if (specialObj && (specialObj.type === 'medal' || specialObj.type === 'window')) {
          const specialPlatform = Object.values(platforms).find(
            p => p.grid.row === row && p.grid.col === col
          );
          if (specialPlatform) {
            shelvesByRow[row].push(specialPlatform);
          }
        }
        continue;
      }
      
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
  
  // Add floor platform with special ID
  platforms[FLOOR_PLATFORM_ID] = {
    id: FLOOR_PLATFORM_ID,
    grid: { row: 2, col: 0 }, // Virtual row below bottom shelves
    position: { x: 0, y: FLOOR_Y, z: FLOOR_Z },
    connections: { left: null, right: null, up: null, down: null },
    type: 'floor',
    records: [],
  };
  
  // Helper to find a platform (shelf or medal) in a row at or near a column
  const findPlatformInRow = (row: number, col: number, direction: 'left' | 'right' | 'exact'): Platform | undefined => {
    const platformsInRow = shelvesByRow[row] || [];
    
    if (direction === 'exact') {
      return platformsInRow.find(p => p.grid.col === col);
    }
    
    if (direction === 'left') {
      // Find rightmost platform with col < target col
      return platformsInRow
        .filter(p => p.grid.col < col)
        .sort((a, b) => b.grid.col - a.grid.col)[0];
    } else {
      // Find leftmost platform with col > target col  
      return platformsInRow
        .filter(p => p.grid.col > col)
        .sort((a, b) => a.grid.col - b.grid.col)[0];
    }
  };

  // Helper to find a special object (window/medal) at a specific position
  const findSpecialObjectAt = (row: number, col: number): Platform | undefined => {
    return Object.values(platforms).find(
      p => (p.type === 'window' || p.type === 'medal') && p.grid.row === row && p.grid.col === col
    );
  };
  
  // Set up connections for shelves and medals (all navigable platforms)
  Object.values(platforms).forEach(platform => {
    if (platform.type === 'shelf' || platform.type === 'medal') {
      const { row, col } = platform.grid;
      
      // Left connection: connect to whatever is in the previous column (col - 1)
      if (col > 0) {
        // Check if there's a special object (window/medal) in previous column, same row
        const leftSpecial = findSpecialObjectAt(row, col - 1);
        if (leftSpecial) {
          platform.connections.left = leftSpecial.id;
        } else {
          // Otherwise, find platform in same row, previous column
          const leftPlatform = findPlatformInRow(row, col - 1, 'exact');
          platform.connections.left = leftPlatform?.id ?? null;
        }
      } else {
        // Column 0: no left connection
        platform.connections.left = null;
      }
      
      // Right connection: connect to platform in same row, next column
      const rightPlatform = findPlatformInRow(row, col, 'right');
      if (rightPlatform) {
        platform.connections.right = rightPlatform.id;
      } else {
        // Check if there's a special object to the right
        const rightSpecial = findSpecialObjectAt(row, col + 1);
        platform.connections.right = rightSpecial?.id ?? null;
      }
      
      // Up connection (only for bottom row, which is row 1)
      if (row === 1) {
        // Check if there's a special object above (same column, row 0)
        const upSpecial = findSpecialObjectAt(0, col);
        if (upSpecial) {
          platform.connections.up = upSpecial.id;
        } else {
          const platformAbove = findPlatformInRow(0, col, 'exact');
          platform.connections.up = platformAbove?.id ?? null;
        }
      }
      
      // Down connection
      if (row === 0) {
        // Top row: check if there's a special object below (same column, row 1)
        const downSpecial = findSpecialObjectAt(1, col);
        if (downSpecial) {
          platform.connections.down = downSpecial.id;
        } else {
          const platformBelow = findPlatformInRow(1, col, 'exact');
          platform.connections.down = platformBelow?.id ?? null;
        }
      } else {
        // Bottom row (row === 1): connect down to floor
        platform.connections.down = FLOOR_PLATFORM_ID;
      }
    }
  });
  
  // Update connections for all windows and medals
  specialObjectIds.window.forEach(windowId => {
    const window = platforms[windowId];
    if (!window) return;
    
    const { row: windowRow, col: windowCol } = window.grid;
    
    // Right: next platform in same row
    const rightPlatform = findPlatformInRow(windowRow, windowCol, 'right');
    if (rightPlatform) {
      window.connections.right = rightPlatform.id;
    } else {
      // Check if there's a special object to the right
      const rightSpecial = findSpecialObjectAt(windowRow, windowCol + 1);
      window.connections.right = rightSpecial?.id ?? null;
    }
    
    // Left: previous platform in same row (if col > 0)
    if (windowCol > 0) {
      const leftPlatform = findPlatformInRow(windowRow, windowCol - 1, 'exact');
      if (leftPlatform) {
        window.connections.left = leftPlatform.id;
      } else {
        // Check if there's a special object to the left
        const leftSpecial = findSpecialObjectAt(windowRow, windowCol - 1);
        window.connections.left = leftSpecial?.id ?? null;
      }
    }
    
    // Up: platform above (if window is on bottom row)
    if (windowRow === 1) {
      const platformAbove = findPlatformInRow(0, windowCol, 'exact');
      if (platformAbove) {
        window.connections.up = platformAbove.id;
      } else {
        const upSpecial = findSpecialObjectAt(0, windowCol);
        window.connections.up = upSpecial?.id ?? null;
      }
      // Window is on bottom row, so it can connect down to floor
      window.connections.down = FLOOR_PLATFORM_ID;
    } else {
      // Window is on top row (row 0), connect down to platform below
      const platformBelow = findPlatformInRow(1, windowCol, 'exact');
      if (platformBelow) {
        window.connections.down = platformBelow.id;
      } else {
        const downSpecial = findSpecialObjectAt(1, windowCol);
        window.connections.down = downSpecial?.id ?? null;
      }
    }
  });
  
  // Update connections for medals (similar to windows)
  specialObjectIds.medal.forEach(medalId => {
    const medal = platforms[medalId];
    if (!medal) return;
    
    const { row: medalRow, col: medalCol } = medal.grid;
    
    // Right: next platform in same row
    const rightPlatform = findPlatformInRow(medalRow, medalCol, 'right');
    if (rightPlatform) {
      medal.connections.right = rightPlatform.id;
    } else {
      const rightSpecial = findSpecialObjectAt(medalRow, medalCol + 1);
      medal.connections.right = rightSpecial?.id ?? null;
    }
    
    // Left: previous platform in same row (if col > 0)
    if (medalCol > 0) {
      const leftPlatform = findPlatformInRow(medalRow, medalCol - 1, 'exact');
      if (leftPlatform) {
        medal.connections.left = leftPlatform.id;
      } else {
        const leftSpecial = findSpecialObjectAt(medalRow, medalCol - 1);
        medal.connections.left = leftSpecial?.id ?? null;
      }
    }
    
    // Up/Down connections
    if (medalRow === 1) {
      const platformAbove = findPlatformInRow(0, medalCol, 'exact');
      if (platformAbove) {
        medal.connections.up = platformAbove.id;
      } else {
        const upSpecial = findSpecialObjectAt(0, medalCol);
        medal.connections.up = upSpecial?.id ?? null;
      }
      medal.connections.down = FLOOR_PLATFORM_ID;
    } else {
      const platformBelow = findPlatformInRow(1, medalCol, 'exact');
      if (platformBelow) {
        medal.connections.down = platformBelow.id;
      } else {
        const downSpecial = findSpecialObjectAt(1, medalCol);
        medal.connections.down = downSpecial?.id ?? null;
      }
    }
  });
  
  // Floor platform connections: up connects to all bottom row shelves
  // We'll handle floor movement specially in the movement hook
  // The floor doesn't have traditional left/right connections - it uses continuous X position
  
  // Cache the result
  cachedPlatforms = platforms;
  cachedTrackCount = trackCount;
  
  return platforms;
}

// Get medal platform (useful for zoom functionality)
export function getMedalPlatform(): Platform | undefined {
  if (!cachedPlatforms) return undefined;
  return Object.values(cachedPlatforms).find(p => p.type === 'medal');
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

// Get the floor platform
export function getFloorPlatform(): Platform | undefined {
  return cachedPlatforms?.[FLOOR_PLATFORM_ID];
}

// Find the closest bottom row shelf to a given X position (for jumping up from floor)
export function findClosestBottomShelf(x: number): Platform | null {
  if (!cachedPlatforms) return null;
  
  const bottomShelves = Object.values(cachedPlatforms).filter(
    p => p.type === 'shelf' && p.grid.row === 1
  );
  
  if (bottomShelves.length === 0) return null;
  
  // Find the shelf with the closest X position
  let closest = bottomShelves[0];
  let closestDist = Math.abs(x - closest.position.x);
  
  for (const shelf of bottomShelves) {
    const dist = Math.abs(x - shelf.position.x);
    if (dist < closestDist) {
      closest = shelf;
      closestDist = dist;
    }
  }
  
  return closest;
}

// Get all bottom row shelves (for floor-to-shelf navigation)
export function getBottomRowShelves(): Platform[] {
  if (!cachedPlatforms) return [];
  return Object.values(cachedPlatforms).filter(
    p => p.type === 'shelf' && p.grid.row === 1
  );
}
