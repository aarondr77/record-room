import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOOR_Y, FLOOR_Z } from '../../types';

interface ArcLampProps {
  position?: [number, number, number];
}

export function ArcLamp({ position = [4, FLOOR_Y, FLOOR_Z + 0.5] }: ArcLampProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Lamp dimensions - taller to hang above shelves
  const baseRadius = 0.3;
  const baseHeight = 0.1;
  const poleRadius = 0.03;
  const poleHeight = 5.5; // Much taller to reach above shelves
  const arcRadius = 1.8; // Wider arc
  const globeRadius = 0.25;
  const dropLength = 0.4; // How far the globe hangs down
  
  // Create geometries
  const { baseGeometry, poleGeometry, arcGeometry, globeGeometry, innerGlobeGeometry, filamentGeometry } = useMemo(() => {
    // Base: heavy round base
    const base = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 24);
    
    // Vertical pole
    const pole = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 12);
    
    // Arc: curved tube that arches over to the LEFT (negative X), then drops down
    const arcPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, 0.5, 0),
      new THREE.Vector3(-0.9, 0.7, 0),
      new THREE.Vector3(-1.4, 0.6, 0),
      new THREE.Vector3(-arcRadius, 0.3, 0),
      new THREE.Vector3(-arcRadius - 0.05, 0, 0),
      new THREE.Vector3(-arcRadius - 0.05, -dropLength, 0), // Drop down
    ]);
    const arc = new THREE.TubeGeometry(arcPath, 48, poleRadius * 0.8, 8, false);
    
    // Globe shade: sphere
    const globe = new THREE.SphereGeometry(globeRadius, 32, 32);
    
    // Inner glow sphere (slightly smaller)
    const innerGlobe = new THREE.SphereGeometry(globeRadius * 0.7, 24, 24);
    
    // Bright filament core
    const filament = new THREE.SphereGeometry(globeRadius * 0.25, 16, 16);
    
    return {
      baseGeometry: base,
      poleGeometry: pole,
      arcGeometry: arc,
      globeGeometry: globe,
      innerGlobeGeometry: innerGlobe,
      filamentGeometry: filament,
    };
  }, []);
  
  // Globe hangs at end of arc (to the left, dropping down)
  const globeX = -(arcRadius + 0.05);
  const globeY = baseHeight / 2 + poleHeight - dropLength - 0.1;
  
  // Subtle color pulse animation
  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      // Subtle warm pulse
      const pulse = 0.85 + Math.sin(t * 0.8) * 0.15;
      mat.emissiveIntensity = 4 * pulse;
    }
  });
  
  return (
    <group position={position}>
      {/* Heavy base */}
      <mesh 
        geometry={baseGeometry}
        position={[0, baseHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Vertical pole */}
      <mesh 
        geometry={poleGeometry}
        position={[0, baseHeight / 2 + poleHeight / 2, 0]}
        castShadow
      >
        <meshStandardMaterial 
          color="#C4A052"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Curved arc */}
      <mesh 
        geometry={arcGeometry}
        position={[0, baseHeight / 2 + poleHeight, 0]}
        castShadow
      >
        <meshStandardMaterial 
          color="#C4A052"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Globe shade - outer frosted glass with strong glow */}
      <mesh 
        geometry={globeGeometry}
        position={[globeX, globeY, 0]}
      >
        <meshStandardMaterial 
          color="#FFCC88"
          emissive="#FFAA44"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner glow layer */}
      <mesh 
        ref={glowRef}
        geometry={innerGlobeGeometry}
        position={[globeX, globeY, 0]}
      >
        <meshStandardMaterial 
          color="#FFDD66"
          emissive="#FFBB33"
          emissiveIntensity={4}
          roughness={0}
          metalness={0}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Bright filament core - always bright using BasicMaterial */}
      <mesh 
        geometry={filamentGeometry}
        position={[globeX, globeY, 0]}
      >
        <meshBasicMaterial 
          color="#FFFFFF"
          transparent
          opacity={1}
        />
      </mesh>
      
      {/* Main warm point light */}
      <pointLight
        position={[globeX, globeY, 0]}
        color="#FFAA55"
        intensity={6}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-radius={4}
      />
      
      {/* Soft fill light */}
      <pointLight
        position={[globeX, globeY, 0]}
        color="#FF9944"
        intensity={7}
        distance={14}
        decay={1.5}
      />
    </group>
  );
}

