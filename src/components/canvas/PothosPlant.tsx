import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  CylinderGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  Color,
  Shape,
  ExtrudeGeometry,
  DoubleSide,
} from 'three';

interface PothosPlantProps {
  position?: [number, number, number];
  vineLength?: number; // How far vines hang down
  potColor?: string;
}

// Create a heart-shaped pothos leaf geometry
function createLeafGeometry(size: number = 0.08): ExtrudeGeometry {
  const shape = new Shape();
  
  // Heart shape for pothos leaf
  const s = size;
  shape.moveTo(0, -s * 0.4);
  shape.bezierCurveTo(-s * 0.5, -s * 0.2, -s * 0.6, s * 0.3, -s * 0.3, s * 0.5);
  shape.bezierCurveTo(-s * 0.1, s * 0.7, 0, s * 0.6, 0, s * 0.5);
  shape.bezierCurveTo(0, s * 0.6, s * 0.1, s * 0.7, s * 0.3, s * 0.5);
  shape.bezierCurveTo(s * 0.6, s * 0.3, s * 0.5, -s * 0.2, 0, -s * 0.4);
  
  const extrudeSettings = {
    depth: 0.005,
    bevelEnabled: false,
  };
  
  return new ExtrudeGeometry(shape, extrudeSettings);
}

// Materials
const potMaterial = new MeshStandardMaterial({
  color: new Color('#B5651D'), // Terracotta
  roughness: 0.85,
  metalness: 0.0,
});

const potRimMaterial = new MeshStandardMaterial({
  color: new Color('#8B4513'), // Darker terracotta rim
  roughness: 0.8,
  metalness: 0.0,
});

const soilMaterial = new MeshStandardMaterial({
  color: new Color('#3D2B1F'), // Dark soil
  roughness: 1.0,
  metalness: 0.0,
});

// Different shades of green for variety - including darker tones
const leafMaterials = [
  new MeshStandardMaterial({
    color: new Color('#228B22'), // Forest green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#32CD32'), // Lime green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#006400'), // Dark green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#90EE90'), // Light green (variegated)
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#1B4D1B'), // Very dark forest green
    roughness: 0.65,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#355E3B'), // Hunter green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#2D5A27'), // Deep jungle green
    roughness: 0.65,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#4F7942'), // Fern green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#0B3B0B'), // Very dark green (almost black-green)
    roughness: 0.7,
    metalness: 0.1,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: new Color('#556B2F'), // Dark olive green
    roughness: 0.6,
    metalness: 0.1,
    side: DoubleSide,
  }),
];

const vineMaterial = new MeshStandardMaterial({
  color: new Color('#2E8B57'), // Sea green for vines
  roughness: 0.7,
  metalness: 0.0,
});

function createPothosModel(vineLength: number): { group: Group; vines: Mesh[] } {
  const plantGroup = new Group();
  const vines: Mesh[] = [];
  
  // === POT ===
  // Main pot body (tapered cylinder)
  const potGeometry = new CylinderGeometry(0.18, 0.12, 0.22, 12);
  const pot = new Mesh(potGeometry, potMaterial);
  pot.position.set(0, 0.11, 0);
  pot.castShadow = true;
  pot.receiveShadow = true;
  plantGroup.add(pot);
  
  // Pot rim
  const rimGeometry = new CylinderGeometry(0.2, 0.18, 0.04, 12);
  const rim = new Mesh(rimGeometry, potRimMaterial);
  rim.position.set(0, 0.24, 0);
  rim.castShadow = true;
  plantGroup.add(rim);
  
  // Soil surface
  const soilGeometry = new CylinderGeometry(0.16, 0.16, 0.02, 12);
  const soil = new Mesh(soilGeometry, soilMaterial);
  soil.position.set(0, 0.21, 0);
  plantGroup.add(soil);
  
  // === TOP FOLIAGE (bushy leaves at pot level) ===
  // More leaves leaning toward the right to complement the combover
  const topLeafCount = 14;
  
  for (let i = 0; i < topLeafCount; i++) {
    // Bias angles toward left/back of pot (opposite of cascade direction)
    // This creates leaves that look like they're growing toward the right
    const baseAngle = Math.PI * 0.3 + (i / topLeafCount) * Math.PI * 1.4;
    const angle = baseAngle + (Math.random() - 0.5) * 0.4;
    const radius = 0.06 + Math.random() * 0.08;
    const height = 0.26 + Math.random() * 0.1;
    
    // Vary top leaf sizes - larger leaves (0.12 to 0.18)
    const leafSize = 0.12 + Math.random() * 0.06;
    const topLeafGeometry = createLeafGeometry(leafSize);
    
    const leaf = new Mesh(topLeafGeometry, leafMaterials[Math.floor(Math.random() * leafMaterials.length)]);
    leaf.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    // Tilt leaves toward the right (+X direction)
    leaf.rotation.x = -0.2 - Math.random() * 0.3;
    leaf.rotation.y = -Math.PI * 0.3 + Math.random() * 0.4; // Face toward right
    leaf.rotation.z = -0.2 + Math.random() * 0.2; // Lean right
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  
  // === TRAILING VINES ===
  // "Combover" style: vines start from various positions but ALL cascade over the RIGHT side
  const vineCount = 6;
  const potRimY = 0.24;
  const potRimRadius = 0.2;
  
  // All vines cascade to the right (+X direction)
  const cascadeDirection = Math.PI * 0; // 0 = right side (+X)
  
  for (let v = 0; v < vineCount; v++) {
    // Starting positions spread around the pot (various origins)
    // Range from back-left to front-left, covering about 270 degrees NOT on the right
    const startAngle = Math.PI * 0.5 + (v / (vineCount - 1)) * Math.PI * 1.2 + (Math.random() - 0.5) * 0.3;
    
    // All vines curve toward the right side with slight spread
    const cascadeAngle = cascadeDirection + (Math.random() - 0.5) * 0.4; // Slight spread in cascade
    const cascadeSpreadZ = (v / (vineCount - 1) - 0.5) * 0.3; // Spread vines front-to-back on right side
    
    // Vine length varies
    const thisVineLength = vineLength * (0.7 + Math.random() * 0.4);
    
    // Create curved path for the vine - "combover" style
    const curvePoints: Vector3[] = [];
    
    // Height that this vine grows up to before cascading (varies per vine)
    const riseHeight = 0.25 + Math.random() * 0.15; // 0.25-0.4 units above rim
    
    // Point 0: Start at soil level, at origin position
    const startX = Math.cos(startAngle) * 0.06;
    const startZ = Math.sin(startAngle) * 0.06;
    curvePoints.push(new Vector3(startX, potRimY - 0.02, startZ));
    
    // Point 1: Rise up straight from soil
    curvePoints.push(new Vector3(
      startX * 0.8,
      potRimY + riseHeight * 0.4, // Growing upward
      startZ * 0.8
    ));
    
    // Point 2: Continue rising, starting to lean toward right
    curvePoints.push(new Vector3(
      startX * 0.5 + 0.03,
      potRimY + riseHeight * 0.8, // Near peak height
      startZ * 0.5 + cascadeSpreadZ * 0.3
    ));
    
    // Point 3: Peak height, arcing toward right
    curvePoints.push(new Vector3(
      0.06,
      potRimY + riseHeight, // Maximum height
      startZ * 0.3 + cascadeSpreadZ * 0.5
    ));
    
    // Point 4: Starting to descend, moving toward right edge
    curvePoints.push(new Vector3(
      potRimRadius * 0.6,
      potRimY + riseHeight * 0.7,
      cascadeSpreadZ * 0.7
    ));
    
    // Point 5: At the right rim edge, descending
    curvePoints.push(new Vector3(
      potRimRadius + 0.05,
      potRimY + riseHeight * 0.3,
      cascadeSpreadZ * 0.9
    ));
    
    // Point 6: Just past rim, starting to hang
    curvePoints.push(new Vector3(
      potRimRadius + 0.12,
      potRimY - 0.05,
      cascadeSpreadZ + 0.03
    ));
    
    // Randomize the hanging curve
    const swayX = Math.random() * 0.3; // Slight outward sway only
    const swayZ = (Math.random() - 0.5) * 0.4;
    
    // Remaining points: cascade downward with organic curves
    const hangingSegments = 7;
    for (let i = 1; i <= hangingSegments; i++) {
      const t = i / hangingSegments;
      const dropY = potRimY - 0.05 - t * thisVineLength;
      
      // S-curve pattern - vines sway gently as they hang
      const curveX = potRimRadius + 0.12 + swayX * Math.sin(t * Math.PI * 1.3) * t + t * 0.05;
      const curveZ = cascadeSpreadZ + 0.03 + swayZ * Math.sin(t * Math.PI * 1.5 + v) * t + t * 0.15;
      
      curvePoints.push(new Vector3(curveX, dropY, curveZ));
    }
    
    const vineCurve = new CatmullRomCurve3(curvePoints);
    const vineGeometry = new TubeGeometry(vineCurve, 36, 0.012, 6, false);
    const vine = new Mesh(vineGeometry, vineMaterial);
    vine.castShadow = true;
    plantGroup.add(vine);
    vines.push(vine);
    
    // Add MORE leaves along the vine for density
    const leafCount = Math.floor(thisVineLength * 6) + 6; // More leaves!
    for (let l = 0; l < leafCount; l++) {
      // Start leaves partway up the rising section (t > 0.08)
      const t = 0.08 + (l + 1) / (leafCount + 1) * 0.92;
      const point = vineCurve.getPointAt(Math.min(t, 0.99));
      const tangent = vineCurve.getTangentAt(Math.min(t, 0.99));
      
      // Skip fewer positions for denser foliage
      if (Math.random() < 0.05) continue;
      
      // Leaf size varies - larger overall (0.1 to 0.16), smaller toward tip
      const baseSize = 0.1 + Math.random() * 0.06;
      const sizeScale = 0.75 + (1 - t) * 0.4;
      const leafMesh = new Mesh(
        createLeafGeometry(baseSize * sizeScale),
        leafMaterials[Math.floor(Math.random() * leafMaterials.length)]
      );
      
      leafMesh.position.copy(point);
      
      // Alternate sides with some randomness
      const side = l % 2 === 0 ? 1 : -1;
      const sideOffset = (0.02 + Math.random() * 0.015) * side;
      leafMesh.position.x += sideOffset * 0.5;
      leafMesh.position.z += sideOffset;
      
      // Orient leaf based on vine direction
      leafMesh.rotation.x = Math.atan2(tangent.y, 1) - 0.3;
      leafMesh.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2 * side;
      leafMesh.rotation.z = side * 0.3 + Math.random() * 0.2;
      
      leafMesh.castShadow = true;
      plantGroup.add(leafMesh);
    }
  }
  
  return { group: plantGroup, vines };
}

export function PothosPlant({ 
  position = [0, 0, 0], 
  vineLength = 2.5,
  potColor = '#B5651D'
}: PothosPlantProps) {
  const groupRef = useRef<Group>(null);
  
  // Create the plant model once
  const { group: plantModel, vines } = useMemo(() => {
    // Update pot color if custom
    if (potColor !== '#B5651D') {
      potMaterial.color.set(potColor);
    }
    return createPothosModel(vineLength);
  }, [vineLength, potColor]);
  
  // Gentle sway animation for the vines
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      
      // Very subtle overall sway
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.01;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <primitive object={plantModel} />
    </group>
  );
}

