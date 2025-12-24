import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Group } from 'three';

interface ShelfLampProps {
  position?: [number, number, number];
  lampPostColor?: string; // Accent color for the lamp
  lightColor?: string;
}

// Create the shelf lamp model (without base, for wearing on head)
function createShelfLampModel(): { group: Group; bulbMesh: THREE.Mesh } {
  const lampGroup = new Group();
  
  // Small desk lamp dimensions
  const neckRadius = 0.05;
  const neckHeight = 0.35;
  const shadeBottomRadius = 0.25;
  const shadeTopRadius = 0.15;
  const shadeHeight = 0.2;
  const bulbRadius = 0.04;
  
  // Neck: thin cylinder
  const neckGeometry = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 8);
  const neck = new THREE.Mesh(
    neckGeometry,
    new THREE.MeshStandardMaterial({
      color: '#C4A052',
      roughness: 0.3,
      metalness: 0.6,
    })
  );
  const neckY = neckHeight / 2;
  neck.position.set(0, neckY, 0);
  neck.castShadow = true;
  lampGroup.add(neck);
  
  // Shade: truncated cone
  const shadeGeometry = new THREE.CylinderGeometry(shadeTopRadius, shadeBottomRadius, shadeHeight, 16, 1, true);
  const shade = new THREE.Mesh(
    shadeGeometry,
    new THREE.MeshStandardMaterial({
      color: '#FFF8E7',
      emissive: '#FFD699',
      emissiveIntensity: 1.5,
      roughness: 0.8,
      metalness: 0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
  );
  const shadeY = neckHeight + shadeHeight / 2;
  shade.position.set(0, shadeY, 0);
  lampGroup.add(shade);
  
  // Bulb: small sphere
  const bulbGeometry = new THREE.SphereGeometry(bulbRadius, 16, 16);
  const bulb = new THREE.Mesh(
    bulbGeometry,
    new THREE.MeshStandardMaterial({
      color: '#FFEEAA',
      emissive: '#FFCC55',
      emissiveIntensity: 3,
      roughness: 0,
      metalness: 0,
    })
  );
  const bulbY = neckHeight + shadeHeight * 0.3;
  bulb.position.set(0, bulbY, 0);
  lampGroup.add(bulb);
  
  return { group: lampGroup, bulbMesh: bulb };
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

// Export a component specifically for when the lamp is worn on the cat's head
// This is rendered inside a group that's positioned by PlaceholderCat
export function WornShelfLamp() {
  const glowRef = useRef<THREE.Mesh>(null);
  
  const { lampModel, bulbMesh } = useMemo(() => {
    const { group, bulbMesh } = createShelfLampModel();
    // Scale to match cat size - cat is 1.5x scale, so scale lamp appropriately
    // Hat uses 1.95 scale (1.3 * 1.5), lamp should be similar but adjusted for its size
    group.scale.set(1.2, 1.2, 1.2);
    return { lampModel: group, bulbMesh };
  }, []);

  // Subtle warm glow pulse (same as regular lamp)
  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 0.9 + Math.sin(t * 1.2) * 0.1;
      mat.emissiveIntensity = 3 * pulse;
    }
  });

  // Lamp position is relative to the lampRef group (which is positioned by PlaceholderCat)
  return (
    <group 
      position={[0, 0, 0]} // Position handled by parent group
      rotation={[0, 0, 0]} // No rotation needed
    >
      <primitive object={lampModel} castShadow receiveShadow />
      {/* Bulb with glow animation */}
      <primitive 
        ref={glowRef}
        object={bulbMesh} 
        castShadow 
      />
    </group>
  );
}

