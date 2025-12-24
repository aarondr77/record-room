import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShelfLampProps {
  position?: [number, number, number];
  lampPostColor?: string; // Accent color for the lamp
  lightColor?: string;
}

export function ShelfLamp({ 
  position = [0, 0, 0],
  lampPostColor = '#E8B4B8', // Soft pink default
  lightColor = '#FFD080'
}: ShelfLampProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Small desk lamp dimensions
  const baseRadius = 0.2;
  const baseHeight = 0.05;
  const neckRadius = 0.05;
  const neckHeight = 0.35; // Taller neck
  const shadeBottomRadius = 0.25;
  const shadeTopRadius = 0.15;
  const shadeHeight = 0.2;
  const bulbRadius = 0.04;
  
  // Create geometries
  const { baseGeometry, neckGeometry, shadeGeometry, bulbGeometry } = useMemo(() => {
    // Base: small flat cylinder
    const base = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 16);
    
    // Neck: thin cylinder, slightly curved would be nice but keeping it simple
    const neck = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 8);
    
    // Shade: truncated cone
    const shade = new THREE.CylinderGeometry(shadeTopRadius, shadeBottomRadius, shadeHeight, 16, 1, true);
    
    // Bulb: small sphere
    const bulb = new THREE.SphereGeometry(bulbRadius, 16, 16);
    
    return {
      baseGeometry: base,
      neckGeometry: neck,
      shadeGeometry: shade,
      bulbGeometry: bulb,
    };
  }, []);
  
  // Calculate positions
  const neckY = baseHeight / 2 + neckHeight / 2;
  const shadeY = baseHeight / 2 + neckHeight + shadeHeight / 2;
  const bulbY = baseHeight / 2 + neckHeight + shadeHeight * 0.3;
  
  // Subtle warm glow pulse
  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 0.9 + Math.sin(t * 1.2) * 0.1;
      mat.emissiveIntensity = 3 * pulse;
    }
  });
  
  return (
    <group position={position}>
      {/* Base */}
      <mesh 
        geometry={baseGeometry}
        position={[0, baseHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={lampPostColor}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Neck */}
      <mesh 
        geometry={neckGeometry}
        position={[0, neckY, 0]}
        castShadow
      >
        <meshStandardMaterial 
          color="#C4A052"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      
      {/* Shade - glowing */}
      <mesh 
        geometry={shadeGeometry}
        position={[0, shadeY, 0]}
      >
        <meshStandardMaterial 
          color="#FFF8E7"
          emissive="#FFD699"
          emissiveIntensity={1.5}
          roughness={0.8}
          metalness={0}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Bulb - bright core */}
      <mesh 
        ref={glowRef}
        geometry={bulbGeometry}
        position={[0, bulbY, 0]}
      >
        <meshStandardMaterial 
          color="#FFEEAA"
          emissive="#FFCC55"
          emissiveIntensity={3}
          roughness={0}
          metalness={0}
        />
      </mesh>
      
      {/* Point light */}
      <pointLight
        position={[0, bulbY, 0]}
        color={lightColor}
        intensity={2}
        distance={10}
        decay={1}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-radius={3}
      />
    
    </group>
  );
}

