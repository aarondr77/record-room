import { useRef } from 'react';
import { Mesh } from 'three';
import { Platform } from './Platform';

interface WindowProps {
  position: [number, number, number];
  hasPlatform?: boolean;
}

export function Window({ position, hasPlatform = true }: WindowProps) {
  const frameRef = useRef<Mesh>(null);
  const glassRef = useRef<Mesh>(null);
  const WINDOW_SIZE = 2;

  return (
    <group position={position}>
      {/* Window frame - deep brown from style guide */}
      <mesh ref={frameRef} position={[0, 0, 0.01]} castShadow>
        <boxGeometry args={[WINDOW_SIZE, WINDOW_SIZE, 0.2]} />
        <meshStandardMaterial color="#5C4A37" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Glass */}
      <mesh ref={glassRef} position={[0, 0, 0.05]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          transparent 
          opacity={0.3}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>

      {/* Sky view (simple gradient effect) */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Single platform underneath - same size as window */}
      {hasPlatform && (
        <Platform position={[0, -1.1, 0]} size={[WINDOW_SIZE, 0.1, 1.5]} />
      )}
    </group>
  );
}

