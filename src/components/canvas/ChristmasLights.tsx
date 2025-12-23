import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Platform {
  position: { x: number; y: number; z: number };
  grid?: { row: number; col: number };
}

interface ChristmasLightsProps {
  platforms: Platform[];
  zOffset?: number;
}

// Classic Christmas light colors (matching reference image)
const BULB_COLORS = [
  '#00E5E5', // cyan
  '#FFD700', // yellow/gold
  '#00CC44', // green
  '#FF3333', // red
  '#FF00FF', // magenta
  '#00CC44', // green
  '#3399FF', // blue
  '#FFD700', // yellow
];

// Shelf/item dimensions (should match platforms.ts)
const ITEM_SIZE = 2;

export function ChristmasLights({ 
  platforms,
  zOffset = 0.4 // Position in front of records
}: ChristmasLightsProps) {
  const bulbRefs = useRef<THREE.Mesh[]>([]);
  const lightRefs = useRef<THREE.PointLight[]>([]);
  
  // Get top row shelves sorted by x position (for horizontal span)
  const topRowShelves = useMemo(() => {
    // Filter to only row 0 (top shelf) platforms
    const topRow = platforms.filter(p => p.grid?.row === 0);
    // Sort by x position (left to right)
    return topRow.sort((a, b) => a.position.x - b.position.x);
  }, [platforms]);
  
  // Calculate the Y position between rows
  const betweenRowsY = useMemo(() => {
    const topRow = platforms.filter(p => p.grid?.row === 0);
    const bottomRow = platforms.filter(p => p.grid?.row === 1);
    
    if (topRow.length === 0 || bottomRow.length === 0) {
      return 1; // Fallback
    }
    
    // Bottom of top row shelves
    const topRowBottomY = topRow[0].position.y - ITEM_SIZE / 2;
    // Top of bottom row shelves  
    const bottomRowTopY = bottomRow[0].position.y + ITEM_SIZE / 2;
    
    // Center between the two rows
    return (topRowBottomY + bottomRowTopY) / 2;
  }, [platforms]);
  
  // Calculate light positions and wire path between the two rows
  const { bulbPositions, wireGeometry, bulbGeometry, socketGeometry } = useMemo(() => {
    if (topRowShelves.length === 0) {
      // Fallback if no top row shelves
      return {
        bulbPositions: [],
        wireGeometry: new THREE.TubeGeometry(),
        bulbGeometry: new THREE.LatheGeometry([new THREE.Vector2(0, 0)]),
        socketGeometry: new THREE.CylinderGeometry(),
      };
    }
    
    const shelfHalfWidth = ITEM_SIZE / 2;
    const baseY = betweenRowsY;
    
    // Hardcoded variation patterns for organic look (not random, but not uniform)
    // Dip amounts for gaps between shelves - varies the sag depth
    const dipPatterns = [0.45, 0.18, 0.5, 0.12, 0.38, 0.28, 0.42, 0.2];
    // Horizontal offset for gap bulbs - shifts slightly left or right of center
    const gapXOffsets = [0.15, -0.12, 0.08, -0.18, 0.1, -0.08, 0.14, -0.1];
    // Y offsets for shelf bulbs - some hang a bit lower/higher
    const shelfYOffsets = [
      [-0.08, 0.06],   // shelf 0: left bulb down, right bulb up - noticeable difference
      [0.1, -0.05],    // shelf 1: left high, right low
      [-0.04, 0.08],   // shelf 2
      [0.07, -0.08],   // shelf 3
      [-0.06, 0.04],   // shelf 4
      [0.05, -0.07],   // shelf 5
      [-0.03, 0.06],   // shelf 6
      [0.08, -0.04],   // shelf 7
    ];
    // X nudge for shelf bulbs - shifts bulb position slightly
    const shelfXNudges = [
      [0.12, -0.1],    // shelf 0: more pronounced shifts
      [-0.15, 0.08],   // shelf 1: left bulb shifted left, right shifted right
      [0.06, 0.12],    // shelf 2
      [-0.1, -0.06],   // shelf 3
      [0.08, -0.12],   // shelf 4
      [-0.05, 0.1],    // shelf 5
      [0.1, -0.04],    // shelf 6
      [-0.08, 0.07],   // shelf 7
    ];
    
    // Build path that runs between the two rows with organic draping
    const pathPoints: THREE.Vector3[] = [];
    const bulbPositionsList: Array<{ x: number; y: number; z: number; color: string }> = [];
    let colorIndex = 0;
    
    topRowShelves.forEach((shelf, shelfIdx) => {
      const shelfX = shelf.position.x;
      const leftEdge = shelfX - shelfHalfWidth;
      const rightEdge = shelfX + shelfHalfWidth;
      
      // If not the first shelf, add draping wire from previous shelf
      if (shelfIdx > 0) {
        const prevShelf = topRowShelves[shelfIdx - 1];
        const prevRightEdge = prevShelf.position.x + shelfHalfWidth;
        const gapCenter = (prevRightEdge + leftEdge) / 2;
        
        // Use hardcoded patterns (cycle through if more shelves than patterns)
        const gapIdx = (shelfIdx - 1) % dipPatterns.length;
        const dipAmount = dipPatterns[gapIdx];
        const xOffset = gapXOffsets[gapIdx];
        
        // Add dip point in the gap (with a bulb hanging in the gap)
        pathPoints.push(new THREE.Vector3(gapCenter + xOffset, baseY - dipAmount, zOffset - 0.02));
        bulbPositionsList.push({
          x: gapCenter + xOffset,
          y: baseY - dipAmount,
          z: zOffset,
          color: BULB_COLORS[colorIndex++ % BULB_COLORS.length],
        });
      }
      
      // Add points along this shelf position (2 bulbs per shelf)
      const bulbSpacing = (rightEdge - leftEdge) / 3;
      const patternIdx = shelfIdx % shelfYOffsets.length;
      const [leftYOffset, rightYOffset] = shelfYOffsets[patternIdx];
      const [leftXNudge, rightXNudge] = shelfXNudges[patternIdx];
      
      // Left bulb
      const leftX = leftEdge + bulbSpacing + leftXNudge;
      const leftY = baseY + leftYOffset;
      pathPoints.push(new THREE.Vector3(leftX, leftY, zOffset - 0.02));
      bulbPositionsList.push({
        x: leftX,
        y: leftY,
        z: zOffset,
        color: BULB_COLORS[colorIndex++ % BULB_COLORS.length],
      });
      
      // Right bulb
      const rightX = rightEdge - bulbSpacing + rightXNudge;
      const rightY = baseY + rightYOffset;
      pathPoints.push(new THREE.Vector3(rightX, rightY, zOffset - 0.02));
      bulbPositionsList.push({
        x: rightX,
        y: rightY,
        z: zOffset,
        color: BULB_COLORS[colorIndex++ % BULB_COLORS.length],
      });
    });
    
    // Create smooth curve for wire
    const wireCurve = new THREE.CatmullRomCurve3(pathPoints);
    const wire = new THREE.TubeGeometry(wireCurve, 100, 0.012, 6, false);
    
    // Create teardrop/cone bulb shape using lathe geometry
    const bulbProfile: THREE.Vector2[] = [];
    const bulbHeight = 0.12;
    const bulbRadius = 0.04;
    const segments = 12;
    
    // Create teardrop profile (narrow at top, rounded at bottom)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Teardrop shape: narrow at top (socket end), bulbous at bottom
      const radius = Math.sin(t * Math.PI * 0.9) * bulbRadius * (0.3 + t * 0.7);
      const y = -t * bulbHeight;
      bulbProfile.push(new THREE.Vector2(radius, y));
    }
    // Close bottom
    bulbProfile.push(new THREE.Vector2(0, -bulbHeight));
    
    const bulb = new THREE.LatheGeometry(bulbProfile, 16);
    
    // Socket/cap geometry (small cylinder at top of bulb)
    const socket = new THREE.CylinderGeometry(0.025, 0.03, 0.035, 8);
    
    return {
      bulbPositions: bulbPositionsList,
      wireGeometry: wire,
      bulbGeometry: bulb,
      socketGeometry: socket,
    };
  }, [topRowShelves, betweenRowsY, zOffset]);
  
  // Animate bulb glow with subtle twinkle
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    bulbRefs.current.forEach((mesh, i) => {
      if (mesh?.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        // Subtle pulse with offset per bulb for wave effect
        const pulse = 0.7 + Math.sin(time * 1.5 + i * 0.5) * 0.3;
        mat.emissiveIntensity = pulse;
      }
    });
    
    // Also pulse the point lights slightly
    lightRefs.current.forEach((light, i) => {
      if (light) {
        const pulse = 0.35 + Math.sin(time * 1.5 + i * 0.5) * 0.15;
        light.intensity = pulse;
      }
    });
  });
  
  return (
    <group>
      {/* Wire/cable */}
      <mesh geometry={wireGeometry}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.8} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Bulbs with point lights */}
      {bulbPositions.map((bulb, index) => (
        <group key={`bulb-group-${index}`} position={[bulb.x, bulb.y, bulb.z]}>
          {/* Socket/cap */}
          <mesh 
            geometry={socketGeometry} 
            position={[0, 0.017, 0]}
          >
            <meshStandardMaterial 
              color="#3d3d2d" 
              roughness={0.6} 
              metalness={0.4}
            />
          </mesh>
          
          {/* Glowing bulb */}
          <mesh
            geometry={bulbGeometry}
            ref={(el) => { if (el) bulbRefs.current[index] = el; }}
          >
            <meshStandardMaterial
              color={bulb.color}
              emissive={bulb.color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          
          {/* Actual point light that illuminates the scene */}
          <pointLight
            ref={(el) => { if (el) lightRefs.current[index] = el; }}
            color={bulb.color}
            intensity={0.4}
            distance={4}
            decay={2}
            position={[0, -0.06, 0.05]} // Center of bulb, slightly forward
          />
        </group>
      ))}
    </group>
  );
}

