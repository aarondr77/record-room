import { useMemo } from 'react';
import * as THREE from 'three';
import { FLOOR_Y, FLOOR_Z } from '../../types';

interface FloorLampProps {
  position?: [number, number, number];
}

export function FloorLamp({ position = [-4, FLOOR_Y, FLOOR_Z + 0.5] }: FloorLampProps) {
  // Lamp dimensions
  const baseRadius = 0.15;
  const baseHeight = 0.05;
  const poleHeight = 2.5;
  const poleRadius = 0.02;
  const shadeBottomRadius = 0.35;
  const shadeTopRadius = 0.15;
  const shadeHeight = 0.35;
  const bulbRadius = 0.06;
  
  // Create geometries
  const { baseGeometry, poleGeometry, shadeGeometry, bulbGeometry } = useMemo(() => {
    // Base: flat cylinder
    const base = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 16);
    
    // Pole: thin cylinder
    const pole = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 8);
    
    // Shade: truncated cone (wider at bottom, open) - flip it so wider part is down
    const shade = new THREE.CylinderGeometry(shadeTopRadius, shadeBottomRadius, shadeHeight, 24, 1, true);
    
    // Bulb: small sphere
    const bulb = new THREE.SphereGeometry(bulbRadius, 16, 16);
    
    return {
      baseGeometry: base,
      poleGeometry: pole,
      shadeGeometry: shade,
      bulbGeometry: bulb,
    };
  }, []);
  
  // Shade Y position (bottom of shade at top of pole)
  const shadeY = baseHeight / 2 + poleHeight + shadeHeight / 2;
  // Bulb position (inside shade)
  const bulbY = baseHeight / 2 + poleHeight + shadeHeight * 0.4;
  // Light position (at bulb)
  const lightY = bulbY;
  
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
          color="#2a2a2a" 
          roughness={0.7} 
          metalness={0.3}
        />
      </mesh>
      
      {/* Pole */}
      <mesh 
        geometry={poleGeometry}
        position={[0, baseHeight / 2 + poleHeight / 2, 0]}
        castShadow
      >
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.6} 
          metalness={0.4}
        />
      </mesh>
      
      {/* Glowing Bulb */}
      <mesh 
        geometry={bulbGeometry}
        position={[0, bulbY, 0]}
      >
        <meshStandardMaterial 
          color="#FFDD44"
          emissive="#FFAA00"
          emissiveIntensity={3}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
      
      {/* Shade - glowing from inside */}
      <mesh 
        geometry={shadeGeometry}
        position={[0, shadeY, 0]}
      >
        <meshStandardMaterial 
          color="#FFF5E0"
          emissive="#FFB855"
          emissiveIntensity={0.8}
          roughness={0.9}
          metalness={0.0}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Main warm yellow point light */}
      <pointLight
        position={[0, lightY, 0]}
        color="#FFCC44"
        intensity={3}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-radius={4}
      />
      
      {/* Additional soft fill light for wider warm glow */}
      <pointLight
        position={[0, lightY, 0]}
        color="#FFB855"
        intensity={3}
        distance={12}
        decay={1.5}
      />
    </group>
  );
}

