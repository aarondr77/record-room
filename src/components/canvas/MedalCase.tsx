import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { Platform } from './Platform';

interface MedalCaseProps {
  position?: [number, number, number];
}

export function MedalCase({ position = [0, 0, 0] }: MedalCaseProps) {
  // Platform size - match the medal case width
  const PLATFORM_WIDTH = 2.0; // Slightly wider than frame for cat to stand
  // Case dimensions - sized to match the 2x2 item size used by records
  const CASE_WIDTH = 1.6;
  const CASE_HEIGHT = 1.8;
  const CASE_DEPTH = 0.05;

  // Frame dimensions - multi-layer ornate frame (similar to LoveLetter)
  const OUTER_FRAME_WIDTH = 0.08;
  const MIDDLE_FRAME_WIDTH = 0.1;
  const INNER_FRAME_WIDTH = 0.06;
  const TOTAL_FRAME_WIDTH = OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH + INNER_FRAME_WIDTH;
  
  const FRAME_DEPTH = 0.1;
  
  // Overall frame dimensions
  const FRAME_OUTER_WIDTH = CASE_WIDTH + (TOTAL_FRAME_WIDTH * 2);
  const FRAME_OUTER_HEIGHT = CASE_HEIGHT + (TOTAL_FRAME_WIDTH * 2);
  
  // Z-layers for depth (from back to front)
  const Z_BACK = -FRAME_DEPTH / 2;
  const Z_FRONT = FRAME_DEPTH / 2;

  // Medal dimensions
  const MEDAL_RADIUS = 0.25;
  const MEDAL_THICKNESS = 0.04;
  const RIBBON_WIDTH = 0.25;
  const RIBBON_LENGTH = 0.5;

  // Plaque dimensions
  const PLAQUE_WIDTH = CASE_WIDTH * 0.85;
  const PLAQUE_HEIGHT = 0.3;
  const PLAQUE_DEPTH = 0.02;
  const PLAQUE_TEXT = "The most athletic\n person I know";

  // Rich aged wood - warm golden brown
  const woodMaterial = useMemo(() => ({
    color: "#9B7B4A",
    roughness: 0.75,
    metalness: 0.05,
  }), []);

  // Darker wood for shadow/depth areas
  const darkWoodMaterial = useMemo(() => ({
    color: "#5C4028",
    roughness: 0.85,
    metalness: 0.0,
  }), []);

  // Gold/gilt accent for highlights
  const goldMaterial = useMemo(() => ({
    color: "#C9A84C",
    roughness: 0.4,
    metalness: 0.6,
  }), []);

  // Antique gold - darker, aged
  const antiqueGoldMaterial = useMemo(() => ({
    color: "#8B7332",
    roughness: 0.5,
    metalness: 0.4,
  }), []);

  // Light wood for contrast
  const lightWoodMaterial = useMemo(() => ({
    color: "#BFA068",
    roughness: 0.7,
    metalness: 0.05,
  }), []);

  // Bright gold for medal - enhanced for shine
  const brightGoldMaterial = useMemo(() => ({
    color: "#FFD700",
    roughness: 0.15, // Lower roughness = more reflective/shiny
    metalness: 0.9, // Higher metalness = more metallic shine
    emissive: "#FFD700", // Slight emissive glow
    emissiveIntensity: 0.1,
  }), []);

  // Ribbon colors (red, white, blue stripes)
  const redMaterial = useMemo(() => ({
    color: "#C41E3A",
    roughness: 0.6,
    metalness: 0.0,
  }), []);

  const whiteMaterial = useMemo(() => ({
    color: "#F5F5F5",
    roughness: 0.7,
    metalness: 0.0,
  }), []);

  const blueMaterial = useMemo(() => ({
    color: "#1E3A8A",
    roughness: 0.6,
    metalness: 0.0,
  }), []);

  // Velvet background material (deep red)
  const velvetMaterial = useMemo(() => ({
    color: "#4A1A2C",
    roughness: 0.95,
    metalness: 0.0,
  }), []);

  return (
    <group position={position}>
      {/* Ornate multi-layer wooden frame */}
      <group position={[0, 0, Z_BACK]}>
        
        {/* === OUTER FRAME LAYER - Darkest, furthest back === */}
        {/* Top outer */}
        <mesh castShadow receiveShadow position={[0, FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH / 2, 0]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH, OUTER_FRAME_WIDTH, FRAME_DEPTH * 0.6]} />
          <meshStandardMaterial {...darkWoodMaterial} />
        </mesh>
        {/* Bottom outer */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH / 2, 0]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH, OUTER_FRAME_WIDTH, FRAME_DEPTH * 0.6]} />
          <meshStandardMaterial {...darkWoodMaterial} />
        </mesh>
        {/* Left outer */}
        <mesh castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + OUTER_FRAME_WIDTH / 2, 0, 0]}>
          <boxGeometry args={[OUTER_FRAME_WIDTH, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 2, FRAME_DEPTH * 0.6]} />
          <meshStandardMaterial {...darkWoodMaterial} />
        </mesh>
        {/* Right outer */}
        <mesh castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH / 2, 0, 0]}>
          <boxGeometry args={[OUTER_FRAME_WIDTH, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 2, FRAME_DEPTH * 0.6]} />
          <meshStandardMaterial {...darkWoodMaterial} />
        </mesh>

        {/* === MIDDLE FRAME LAYER - Main body === */}
        {/* Top middle */}
        <mesh castShadow receiveShadow position={[0, FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH / 2, FRAME_DEPTH * 0.3]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 2, MIDDLE_FRAME_WIDTH, FRAME_DEPTH * 0.8]} />
          <meshStandardMaterial {...woodMaterial} />
        </mesh>
        {/* Bottom middle */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH / 2, FRAME_DEPTH * 0.3]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 2, MIDDLE_FRAME_WIDTH, FRAME_DEPTH * 0.8]} />
          <meshStandardMaterial {...woodMaterial} />
        </mesh>
        {/* Left middle */}
        <mesh castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.3]}>
          <boxGeometry args={[MIDDLE_FRAME_WIDTH, FRAME_OUTER_HEIGHT - (OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH) * 2, FRAME_DEPTH * 0.8]} />
          <meshStandardMaterial {...woodMaterial} />
        </mesh>
        {/* Right middle */}
        <mesh castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.3]}>
          <boxGeometry args={[MIDDLE_FRAME_WIDTH, FRAME_OUTER_HEIGHT - (OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH) * 2, FRAME_DEPTH * 0.8]} />
          <meshStandardMaterial {...woodMaterial} />
        </mesh>

        {/* === GOLD TRIM between outer and middle layers === */}
        {/* Top gold trim */}
        <mesh castShadow receiveShadow position={[0, FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - 0.01, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 1.5, 0.015, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Bottom gold trim */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + 0.01, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 1.5, 0.015, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Left gold trim */}
        <mesh castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + OUTER_FRAME_WIDTH + 0.01, 0, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[0.015, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 3, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Right gold trim */}
        <mesh castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH - 0.01, 0, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[0.015, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 3, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* === INNER LIP/BEVEL === */}
        {/* Top inner */}
        <mesh castShadow receiveShadow position={[0, FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH - INNER_FRAME_WIDTH / 2, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[CASE_WIDTH + INNER_FRAME_WIDTH * 2, INNER_FRAME_WIDTH, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Bottom inner */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH + INNER_FRAME_WIDTH / 2, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[CASE_WIDTH + INNER_FRAME_WIDTH * 2, INNER_FRAME_WIDTH, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Left inner */}
        <mesh castShadow receiveShadow position={[-CASE_WIDTH / 2 - INNER_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[INNER_FRAME_WIDTH, CASE_HEIGHT, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Right inner */}
        <mesh castShadow receiveShadow position={[CASE_WIDTH / 2 + INNER_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[INNER_FRAME_WIDTH, CASE_HEIGHT, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>

        {/* === INNER GOLD TRIM around case opening === */}
        <mesh castShadow receiveShadow position={[0, CASE_HEIGHT / 2 + 0.01, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[CASE_WIDTH + 0.02, 0.012, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -CASE_HEIGHT / 2 - 0.01, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[CASE_WIDTH + 0.02, 0.012, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[-CASE_WIDTH / 2 - 0.01, 0, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[0.012, CASE_HEIGHT, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[CASE_WIDTH / 2 + 0.01, 0, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[0.012, CASE_HEIGHT, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>

        {/* === CORNER DECORATIONS === */}
        {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([xSign, ySign], i) => (
          <mesh 
            key={`corner-${i}`} 
            castShadow 
            receiveShadow 
            position={[
              xSign * (FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH - 0.03), 
              ySign * (FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - 0.03), 
              FRAME_DEPTH * 0.7
            ]}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial {...goldMaterial} />
          </mesh>
        ))}

        {/* === CONTINUOUS BEADING along outer edge === */}
        {Array.from({ length: 14 }, (_, i) => i).map((i) => {
          const t = (i / 13) * 2 - 1;
          return (
            <mesh key={`bead-top-${i}`} castShadow receiveShadow position={[t * (FRAME_OUTER_WIDTH / 2 - 0.06), FRAME_OUTER_HEIGHT / 2 - 0.03, FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 14 }, (_, i) => i).map((i) => {
          const t = (i / 13) * 2 - 1;
          return (
            <mesh key={`bead-bottom-${i}`} castShadow receiveShadow position={[t * (FRAME_OUTER_WIDTH / 2 - 0.06), -FRAME_OUTER_HEIGHT / 2 + 0.03, FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 12 }, (_, i) => i).map((i) => {
          const t = (i / 11) * 2 - 1;
          return (
            <mesh key={`bead-left-${i}`} castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + 0.03, t * (FRAME_OUTER_HEIGHT / 2 - 0.08), FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 12 }, (_, i) => i).map((i) => {
          const t = (i / 11) * 2 - 1;
          return (
            <mesh key={`bead-right-${i}`} castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - 0.03, t * (FRAME_OUTER_HEIGHT / 2 - 0.08), FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
      </group>

      {/* Velvet background - positioned forward from frame */}
      <mesh castShadow receiveShadow position={[0, 0, Z_FRONT + CASE_DEPTH / 2]}>
        <boxGeometry args={[CASE_WIDTH, CASE_HEIGHT, CASE_DEPTH]} />
        <meshStandardMaterial {...velvetMaterial} />
      </mesh>

      {/* === RIBBON === */}
      {/* Ribbon hangs from top, medal hangs from ribbon */}
      <group position={[0, CASE_HEIGHT / 2 - RIBBON_LENGTH / 2 - 0.1, Z_FRONT + CASE_DEPTH + 0.02]}>
        {/* Red stripe (left) */}
        <mesh castShadow receiveShadow position={[-RIBBON_WIDTH / 3, 0, 0]}>
          <boxGeometry args={[RIBBON_WIDTH / 3, RIBBON_LENGTH, 0.02]} />
          <meshStandardMaterial {...redMaterial} />
        </mesh>
        {/* White stripe (center) */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[RIBBON_WIDTH / 3, RIBBON_LENGTH, 0.02]} />
          <meshStandardMaterial {...whiteMaterial} />
        </mesh>
        {/* Blue stripe (right) */}
        <mesh castShadow receiveShadow position={[RIBBON_WIDTH / 3, 0, 0]}>
          <boxGeometry args={[RIBBON_WIDTH / 3, RIBBON_LENGTH, 0.02]} />
          <meshStandardMaterial {...blueMaterial} />
        </mesh>
      </group>

      {/* === GOLD MEDAL === */}
      <group position={[0, CASE_HEIGHT / 2 - RIBBON_LENGTH - MEDAL_RADIUS - 0.15, Z_FRONT + CASE_DEPTH + 0.03]}>
        {/* Subtle point light to illuminate the medal without visible cone */}
        <pointLight
          position={[0, 0, 0.2]}
          intensity={1.2}
          color="#FFD700"
          distance={0.5}
          decay={3}
        />
        
        {/* Medal body - flat disc facing forward */}
        <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[MEDAL_RADIUS, MEDAL_RADIUS, MEDAL_THICKNESS, 32]} />
          <meshStandardMaterial {...brightGoldMaterial} />
        </mesh>
        
        {/* Medal outer rim - raised edge */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[MEDAL_RADIUS - 0.015, 0.025, 16, 32]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        
        {/* Inner decorative ring */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[MEDAL_RADIUS * 0.65, 0.012, 16, 32]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>

        {/* "#1" text on medal face */}
        <Text
          position={[0, 0, MEDAL_THICKNESS / 2 + 0.01]}
          fontSize={0.22}
          color="#8B6914"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          fontWeight="bold"
          outlineWidth={0.008}
          outlineColor="#5C4A0A"
        >
          #1
        </Text>
        
        {/* Medal ring at top for ribbon attachment */}
        <mesh castShadow receiveShadow position={[0, MEDAL_RADIUS - 0.02, 0]}>
          <torusGeometry args={[0.04, 0.015, 8, 16]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
      </group>

      {/* === PLAQUE === */}
      <group position={[0, -CASE_HEIGHT / 2 + PLAQUE_HEIGHT / 2 + 0.1, Z_FRONT + CASE_DEPTH + PLAQUE_DEPTH / 2 + 0.01]}>
        {/* Plaque base - dark wood */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[PLAQUE_WIDTH, PLAQUE_HEIGHT, PLAQUE_DEPTH]} />
          <meshStandardMaterial {...darkWoodMaterial} />
        </mesh>
        
        {/* Plaque inner surface - lighter wood */}
        <mesh castShadow receiveShadow position={[0, 0, PLAQUE_DEPTH / 2 + 0.001]}>
          <boxGeometry args={[PLAQUE_WIDTH - 0.06, PLAQUE_HEIGHT - 0.04, 0.005]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        
        {/* Gold border */}
        {/* Top */}
        <mesh castShadow receiveShadow position={[0, PLAQUE_HEIGHT / 2 - 0.015, PLAQUE_DEPTH / 2 + 0.003]}>
          <boxGeometry args={[PLAQUE_WIDTH - 0.02, 0.015, 0.008]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Bottom */}
        <mesh castShadow receiveShadow position={[0, -PLAQUE_HEIGHT / 2 + 0.015, PLAQUE_DEPTH / 2 + 0.003]}>
          <boxGeometry args={[PLAQUE_WIDTH - 0.02, 0.015, 0.008]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Left */}
        <mesh castShadow receiveShadow position={[-PLAQUE_WIDTH / 2 + 0.015, 0, PLAQUE_DEPTH / 2 + 0.003]}>
          <boxGeometry args={[0.015, PLAQUE_HEIGHT - 0.02, 0.008]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Right */}
        <mesh castShadow receiveShadow position={[PLAQUE_WIDTH / 2 - 0.015, 0, PLAQUE_DEPTH / 2 + 0.003]}>
          <boxGeometry args={[0.015, PLAQUE_HEIGHT - 0.02, 0.008]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        
        {/* Plaque text */}
        <Text
          position={[0, 0, PLAQUE_DEPTH / 2 + 0.01]}
          fontSize={0.08}
          color="#2A1810"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          letterSpacing={0.02}
          lineHeight={1.3}
          outlineWidth={0.001}
          outlineColor="#1A0F08"
        >
          {PLAQUE_TEXT}
        </Text>
      </group>

      {/* Platform underneath for cat to stand on */}
      <Platform position={[0, -1.1, 0]} size={[PLATFORM_WIDTH, 0.1, 1.5]} />
    </group>
  );
}

