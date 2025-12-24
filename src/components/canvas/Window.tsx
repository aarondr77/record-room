import { useRef, useMemo } from 'react';
import { Group, DataTexture, RGBAFormat, ClampToEdgeWrapping } from 'three';
import { useFrame } from '@react-three/fiber';
import { Platform } from './Platform';

interface WindowProps {
  position: [number, number, number];
  hasPlatform?: boolean;
}

// Generate a sky texture with gradient - wintery gray/white
function createSkyTexture(width: number, height: number): DataTexture {
  const size = width * height;
  const data = new Uint8Array(size * 4);
  
  // Sky gradient colors - dark gray at top, lighter gray toward horizon (wintery)
  const topColor = { r: 120, g: 130, b: 140 };    // Dark gray
  const bottomColor = { r: 180, g: 190, b: 200 }; // Light gray near horizon
  
  for (let i = 0; i < size; i++) {
    const y = Math.floor(i / width) / height;
    
    // Gradient from top to bottom
    const t = Math.pow(y, 0.5); // Ease the gradient
    
    const r = topColor.r + (bottomColor.r - topColor.r) * t;
    const g = topColor.g + (bottomColor.g - topColor.g) * t;
    const b = topColor.b + (bottomColor.b - topColor.b) * t;
    
    const stride = i * 4;
    data[stride] = r;
    data[stride + 1] = g;
    data[stride + 2] = b;
    data[stride + 3] = 255;
  }
  
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Snowflake component that falls down - constrained within bounds
function Snowflake({ initialPosition, speed, scale, bounds }: { 
  initialPosition: [number, number, number]; 
  speed: number;
  scale: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}) {
  const snowflakeRef = useRef<Group>(null);
  const startY = initialPosition[1];
  const startX = initialPosition[0];
  const rangeY = bounds.maxY - bounds.minY;
  const rangeX = bounds.maxX - bounds.minX;
  
  useFrame((state) => {
    if (snowflakeRef.current) {
      // Move snowflake down, wrap around when it goes below bounds
      const time = state.clock.elapsedTime * speed;
      // Wrap Y within the bounds (falling down, reset at top)
      // Start at top (maxY), fall down (decrease Y), wrap to top when below minY
      const fallDistance = time;
      const normalizedY = ((startY - bounds.minY - fallDistance) % rangeY);
      const y = bounds.minY + (normalizedY < 0 ? normalizedY + rangeY : normalizedY);
      snowflakeRef.current.position.y = y;
      
      // Slight horizontal drift (wind effect) - keep within bounds
      const drift = Math.sin(time * 0.5) * 0.05;
      const normalizedX = ((startX - bounds.minX + drift) % rangeX);
      const x = bounds.minX + (normalizedX < 0 ? normalizedX + rangeX : normalizedX);
      snowflakeRef.current.position.x = x;
      
      // Gentle rotation as it falls
      snowflakeRef.current.rotation.z = time * 0.5;
    }
  });
  
  return (
    <group ref={snowflakeRef} position={initialPosition}>
      {/* Simple snowflake - small white cross shape */}
      {/* Main cross */}
      <mesh position={[0, 0, 0]} scale={[scale, scale, scale * 0.1]} renderOrder={1}>
        <boxGeometry args={[0.02 * scale, 0.08 * scale, 0.01]} />
        <meshBasicMaterial color="#ffffff" depthWrite={true} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[scale, scale, scale * 0.1]} renderOrder={1}>
        <boxGeometry args={[0.02 * scale, 0.08 * scale, 0.01]} />
        <meshBasicMaterial color="#ffffff" depthWrite={true} />
      </mesh>
      {/* Diagonal arms */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]} scale={[scale, scale, scale * 0.1]} renderOrder={1}>
        <boxGeometry args={[0.015 * scale, 0.06 * scale, 0.01]} />
        <meshBasicMaterial color="#ffffff" depthWrite={true} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]} scale={[scale, scale, scale * 0.1]} renderOrder={1}>
        <boxGeometry args={[0.015 * scale, 0.06 * scale, 0.01]} />
        <meshBasicMaterial color="#ffffff" depthWrite={true} />
      </mesh>
    </group>
  );
}

export function Window({ position, hasPlatform = true }: WindowProps) {
  const WINDOW_SIZE = 2;
  const OPENING_SIZE = 1.6; // The visible opening size
  const FRAME_THICKNESS = (WINDOW_SIZE - OPENING_SIZE) / 2; // 0.2
  const FRAME_DEPTH = 0.15;
  const PANE_DIVIDER_WIDTH = 0.05;
  
  // Create sky texture
  const skyTexture = useMemo(() => createSkyTexture(256, 256), []);
  
  // Snowflake bounds - keep snowflakes within the window opening
  // Add padding to keep snowflakes visible within the frame
  const PADDING = 0.15;
  const snowflakeBounds = { 
    minX: -OPENING_SIZE / 2 + PADDING, 
    maxX: OPENING_SIZE / 2 - PADDING,
    minY: -OPENING_SIZE / 2 + PADDING,  // Bottom of window opening
    maxY: OPENING_SIZE / 2 - PADDING    // Top of window opening
  };

  // Z positions - window is at z=0.1, wall is at z=0
  // To be visible, sky must have absolute z > 0
  // Frame front at wall (z=0 absolute) = -0.1 relative to window
  // Frame back recessed = -0.1 - 0.15 = -0.25 relative
  // But sky at -0.25 relative = -0.15 absolute (behind wall!)
  // Solution: Position sky so it's visible (abs z > 0.05 for safety)
  const WALL_Z_RELATIVE = -0.1; // Wall is 0.1 units back from window position
  const Z_FRAME_FRONT = WALL_Z_RELATIVE;           // Frame front flush with wall
  const Z_FRAME_BACK = WALL_Z_RELATIVE - FRAME_DEPTH; // -0.25 relative
  const Z_SKY = -0.08;                              // Sky visible (absolute z = 0.02)
  const Z_CLOUDS = -0.06;                           // Clouds just in front of sky
  const Z_MULLIONS = 0.01;                          // Pane dividers in front
  const Z_GLASS = 0.02;                             // Glass surface - frontmost
  const FRAME_CENTER_Z = (Z_FRAME_FRONT + Z_FRAME_BACK) / 2; // Center of frame depth

  return (
    <group position={position}>
      {/* ===== RECESSED CONTENT (inside the wall) ===== */}
      
      {/* Sky background - furthest back, uses BasicMaterial so lighting doesn't affect it */}
      <mesh position={[0, 0, Z_SKY]}>
        <planeGeometry args={[OPENING_SIZE, OPENING_SIZE]} />
        <meshBasicMaterial map={skyTexture} />
      </mesh>
      
      {/* Animated snowflakes - falling down behind mullions */}
      <group position={[0, 0, Z_CLOUDS]} renderOrder={1}>
        <Snowflake 
          initialPosition={[-0.3, 0.6, 0]} 
          speed={0.15} 
          scale={0.8} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.2, 0.7, 0]} 
          speed={0.12} 
          scale={1.0} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.1, 0.8, 0]} 
          speed={0.18} 
          scale={0.7} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.4, 0.5, 0]} 
          speed={0.14} 
          scale={0.9} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.5, 0.9, 0]} 
          speed={0.16} 
          scale={0.75} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.1, 0.65, 0]} 
          speed={0.13} 
          scale={0.85} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.4, 0.55, 0]} 
          speed={0.17} 
          scale={0.95} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.3, 0.75, 0]} 
          speed={0.11} 
          scale={0.8} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.2, 0.85, 0]} 
          speed={0.19} 
          scale={0.65} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.5, 0.6, 0]} 
          speed={0.10} 
          scale={1.1} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.25, 0.5, 0]} 
          speed={0.20} 
          scale={0.6} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.15, 0.9, 0]} 
          speed={0.09} 
          scale={0.9} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[-0.35, 0.7, 0]} 
          speed={0.21} 
          scale={0.7} 
          bounds={snowflakeBounds}
        />
        <Snowflake 
          initialPosition={[0.45, 0.8, 0]} 
          speed={0.22} 
          scale={0.75} 
          bounds={snowflakeBounds}
        />
      </group>
      
      {/* Glass panes - subtle tint */}
      <mesh position={[0, 0, Z_GLASS]}>
        <planeGeometry args={[OPENING_SIZE, OPENING_SIZE]} />
        <meshStandardMaterial 
          color="#E8F4FC" 
          transparent 
          opacity={0.1}
          metalness={0.2}
          roughness={0.05}
        />
      </mesh>
      
      {/* ===== WINDOW FRAME (hollow - 4 bars around edges) ===== */}
      
      {/* Top frame bar */}
      <mesh position={[0, (WINDOW_SIZE - FRAME_THICKNESS) / 2, FRAME_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[WINDOW_SIZE, FRAME_THICKNESS, FRAME_DEPTH]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} />
      </mesh>
      
      {/* Bottom frame bar */}
      <mesh position={[0, -(WINDOW_SIZE - FRAME_THICKNESS) / 2, FRAME_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[WINDOW_SIZE, FRAME_THICKNESS, FRAME_DEPTH]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} />
      </mesh>
      
      {/* Left frame bar */}
      <mesh position={[-(WINDOW_SIZE - FRAME_THICKNESS) / 2, 0, FRAME_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[FRAME_THICKNESS, WINDOW_SIZE - FRAME_THICKNESS * 2, FRAME_DEPTH]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} />
      </mesh>
      
      {/* Right frame bar */}
      <mesh position={[(WINDOW_SIZE - FRAME_THICKNESS) / 2, 0, FRAME_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[FRAME_THICKNESS, WINDOW_SIZE - FRAME_THICKNESS * 2, FRAME_DEPTH]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} />
      </mesh>
      
      {/* ===== MULLIONS (pane dividers - cross in middle) ===== */}
      
      {/* Vertical mullion - divides left and right panes */}
      <mesh position={[0, 0, Z_MULLIONS]} castShadow receiveShadow renderOrder={10}>
        <boxGeometry args={[PANE_DIVIDER_WIDTH, OPENING_SIZE, 0.1]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} depthWrite={true} />
      </mesh>
      
      {/* Horizontal mullion - divides top and bottom panes */}
      <mesh position={[0, 0, Z_MULLIONS]} castShadow receiveShadow renderOrder={10}>
        <boxGeometry args={[OPENING_SIZE, PANE_DIVIDER_WIDTH, 0.1]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.1} roughness={0.85} depthWrite={true} />
      </mesh>
      
      {/* ===== INNER REVEAL (sides of the recess) ===== */}
      
      {/* Top reveal */}
      <mesh position={[0, OPENING_SIZE / 2 + FRAME_THICKNESS / 2 - 0.1, FRAME_CENTER_Z]} receiveShadow>
        <boxGeometry args={[OPENING_SIZE, 0.02, FRAME_DEPTH]} />
        <meshStandardMaterial color="#4A3B2E" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* Bottom reveal (window sill) */}
      <mesh position={[0, -OPENING_SIZE / 2 - FRAME_THICKNESS / 2 + 0.1, FRAME_CENTER_Z]} receiveShadow>
        <boxGeometry args={[OPENING_SIZE + 0.1, 0.04, FRAME_DEPTH + 0.05]} />
        <meshStandardMaterial color="#4A3B2E" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Platform underneath */}
      {hasPlatform && (
        <Platform position={[0, -1.1, 0]} size={[WINDOW_SIZE, 0.1, 1.5]} />
      )}
    </group>
  );
}
