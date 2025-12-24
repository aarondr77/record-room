import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Shape,
  ExtrudeGeometry,
  Color,
} from 'three';

interface BaseballHatProps {
  position: [number, number, number];
  isWorn?: boolean;
}

// Hat scale - cute and visible
const HAT_SCALE = 0.7;
const HAT_COLOR = '#f77205';

// Materials for the baseball hat
const hatMainMaterial = new MeshStandardMaterial({
  color: new Color(HAT_COLOR), // Burnt orange
  roughness: 0.85,
  metalness: 0.0,
});

const hatBrimMaterial = new MeshStandardMaterial({
  color: new Color(HAT_COLOR), // Same burnt orange
  roughness: 0.7,
  metalness: 0.0,
});

// Create the baseball hat model
function createBaseballHatModel(): Group {
  const hatGroup = new Group();

  // === CROWN (main dome of the hat) ===
  // Use a full sphere, then position it so only the top half shows (dome effect)
  // This ensures a solid dome with no holes
  const crownGeometry = new SphereGeometry(0.12, 16, 12);
  crownGeometry.scale(1.0, 0.7, 1.0); // Flatten slightly for cap shape
  const crown = new Mesh(crownGeometry, hatMainMaterial);
  // Position so the bottom half is below the head (creates dome effect)
  crown.position.set(0, -0.05, 0); // Lower the sphere so top half forms dome
  crown.castShadow = true;
  crown.receiveShadow = true;
  hatGroup.add(crown);

  // === PANEL SEAMS (stitching lines on the crown) ===
  // Removed seams for now - they were appearing as vertical pillars
  // Can add back later as subtle texture or very thin lines if needed

  // === TOP BUTTON ===
  // Removed button - was potentially causing vertical pillar appearance

  // === BRIM (horizontal flap extending backward) ===
  // For a backwards hat, the brim extends backward (opposite the cat's face)
  // Create a curved brim shape that extends horizontally backward
  // Made the brim shorter - reduced width and curve height
  const brimShape = new Shape();
  brimShape.moveTo(-0.08, 0); // Narrower starting width
  // Use bezier curves for a smoother, more rounded end (less pointy)
  // Shorter brim - reduced control points and end height
  brimShape.bezierCurveTo(-0.11, 0.12, -0.06, 0.16, 0, 0.18);
  brimShape.bezierCurveTo(0.06, 0.16, 0.11, 0.12, 0.08, 0);
  brimShape.lineTo(-0.08, 0);

  const brimExtrudeSettings = {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.002,
    bevelSegments: 2,
  };

  const brimGeometry = new ExtrudeGeometry(brimShape, brimExtrudeSettings);
  const brim = new Mesh(brimGeometry, hatBrimMaterial);
  // Position brim lower and closer to the crown for better connection
  // Lower Y position to sit at the base of the crown where it meets the head
  brim.position.set(0, -0.03, -0.08); // Lower Y, closer Z to connect to crown
  brim.rotation.x = -Math.PI / 2; // Horizontal (not angled down)
  brim.rotation.y = Math.PI; // Flip so curved part faces backward
  brim.castShadow = false;
  brim.receiveShadow = false;
  hatGroup.add(brim);

  return hatGroup;
}

export function BaseballHat({ position, isWorn = false }: BaseballHatProps) {
  const groupRef = useRef<Group>(null);

  // Create the hat model once
  const hatModel = useMemo(() => {
    const model = createBaseballHatModel();
    model.scale.set(HAT_SCALE, HAT_SCALE, HAT_SCALE);
    return model;
  }, []);

  // Gentle idle animation when not worn (sitting on floor)
  useFrame((state) => {
    if (groupRef.current && !isWorn) {
      // Subtle bobbing animation
      const bob = Math.sin(state.clock.elapsedTime * 1.2) * 0.003;
      groupRef.current.position.y = position[1] + bob;
      
      // Very subtle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  // Position the hat on the floor, offset Y so it sits on the surface
  const floorOffset = 0.08; // Lift slightly so it sits on floor surface

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1] + floorOffset, position[2]]}
      rotation={[0, Math.PI / 2, 0]} // No rotation - hat is already built backwards
    >
      <primitive object={hatModel} castShadow receiveShadow />
    </group>
  );
}

// Export a component specifically for when the hat is worn on the cat's head
// This is rendered inside a group that's positioned by PlaceholderCat
export function WornBaseballHat() {
  const hatModel = useMemo(() => {
    const model = createBaseballHatModel();
    // Make it comically large - bigger scale for visibility
    model.scale.set(1.3, 1.3, 1.3);
    return model;
  }, []);

  // Hat position is relative to the hatRef group (which is positioned by PlaceholderCat)
  // The hat model is already built with brim pointing backward (-Z direction)
  // No rotation needed - hat is already oriented correctly for backwards wear
  return (
    <group 
      position={[0, 0, 0]} // Position handled by parent group
      rotation={[0, 0, 0]} // No rotation - hat is already built backwards
    >
      <primitive object={hatModel} castShadow receiveShadow />
    </group>
  );
}

