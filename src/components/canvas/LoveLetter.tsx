import { useRef, useMemo, useState } from 'react';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';

interface LoveLetterProps {
  position?: [number, number, number];
  onEnter?: () => void;
}

export function LoveLetter({ position = [0, 2, 0], onEnter }: LoveLetterProps) {
  const letterRef = useRef<Mesh>(null);
  const textRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  const LETTER_DEPTH = 0.05;
  const PADDING = 0.4; // Padding around text in all directions
  const FONT_SIZE = 0.25;
  
  // Main text without "Come in."
  const letterText = `This is our record room.

A place for our songs,
our trinkets,
and us.
`

  // Calculate text dimensions based on content
  const lines = letterText.split('\n');
  const maxLineLength = Math.max(...lines.map(line => line.length || 1));
  const lineCount = lines.filter(line => line.trim().length > 0).length || lines.length;
  
  const estimatedTextWidth = Math.max(maxLineLength * FONT_SIZE * 0.55, 2.0);
  const estimatedTextHeight = lineCount * FONT_SIZE * 2;
  
  const LETTER_WIDTH = estimatedTextWidth + (PADDING * 2);
  const LETTER_HEIGHT = estimatedTextHeight + (PADDING * 2);

  // Frame dimensions - multi-layer ornate frame
  const OUTER_FRAME_WIDTH = 0.12; // Outermost decorative edge
  const MIDDLE_FRAME_WIDTH = 0.15; // Main frame body
  const INNER_FRAME_WIDTH = 0.08; // Inner lip/bevel
  const TOTAL_FRAME_WIDTH = OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH + INNER_FRAME_WIDTH;
  
  const FRAME_DEPTH = 0.12; // Main depth
  const CORNER_SIZE = 0.35; // Size of corner decorations
  
  // Overall frame dimensions
  const FRAME_OUTER_WIDTH = LETTER_WIDTH + (TOTAL_FRAME_WIDTH * 2);
  const FRAME_OUTER_HEIGHT = LETTER_HEIGHT + (TOTAL_FRAME_WIDTH * 2);
  
  // Z-layers for depth (from back to front)
  const Z_BACK = -FRAME_DEPTH / 2;
  const Z_FRONT = FRAME_DEPTH / 2;

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

        {/* === MIDDLE FRAME LAYER - Main body with carved details === */}
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
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 1.5, 0.02, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Bottom gold trim */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + 0.01, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[FRAME_OUTER_WIDTH - OUTER_FRAME_WIDTH * 1.5, 0.02, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Left gold trim */}
        <mesh castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + OUTER_FRAME_WIDTH + 0.01, 0, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[0.02, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 3, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        {/* Right gold trim */}
        <mesh castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH - 0.01, 0, FRAME_DEPTH * 0.5]}>
          <boxGeometry args={[0.02, FRAME_OUTER_HEIGHT - OUTER_FRAME_WIDTH * 3, FRAME_DEPTH * 0.3]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* === INNER LIP/BEVEL - closest to paper === */}
        {/* Top inner */}
        <mesh castShadow receiveShadow position={[0, FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH - INNER_FRAME_WIDTH / 2, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[LETTER_WIDTH + INNER_FRAME_WIDTH * 2, INNER_FRAME_WIDTH, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Bottom inner */}
        <mesh castShadow receiveShadow position={[0, -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH + INNER_FRAME_WIDTH / 2, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[LETTER_WIDTH + INNER_FRAME_WIDTH * 2, INNER_FRAME_WIDTH, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Left inner */}
        <mesh castShadow receiveShadow position={[-LETTER_WIDTH / 2 - INNER_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[INNER_FRAME_WIDTH, LETTER_HEIGHT, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>
        {/* Right inner */}
        <mesh castShadow receiveShadow position={[LETTER_WIDTH / 2 + INNER_FRAME_WIDTH / 2, 0, FRAME_DEPTH * 0.6]}>
          <boxGeometry args={[INNER_FRAME_WIDTH, LETTER_HEIGHT, FRAME_DEPTH * 0.5]} />
          <meshStandardMaterial {...lightWoodMaterial} />
        </mesh>

        {/* === INNER GOLD TRIM around paper opening === */}
        <mesh castShadow receiveShadow position={[0, LETTER_HEIGHT / 2 + 0.01, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[LETTER_WIDTH + 0.02, 0.015, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -LETTER_HEIGHT / 2 - 0.01, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[LETTER_WIDTH + 0.02, 0.015, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[-LETTER_WIDTH / 2 - 0.01, 0, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[0.015, LETTER_HEIGHT, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>
        <mesh castShadow receiveShadow position={[LETTER_WIDTH / 2 + 0.01, 0, FRAME_DEPTH * 0.75]}>
          <boxGeometry args={[0.015, LETTER_HEIGHT, FRAME_DEPTH * 0.2]} />
          <meshStandardMaterial {...antiqueGoldMaterial} />
        </mesh>

        {/* === DECORATIVE ELEMENTS ALONG FRAME EDGES === */}
        {/* Top edge decorations - rosettes and beading */}
        {[-0.35, -0.15, 0.15, 0.35].map((offset, i) => (
          <group key={`top-decor-${i}`} position={[offset * (FRAME_OUTER_WIDTH - CORNER_SIZE * 2), FRAME_OUTER_HEIGHT / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH / 2, FRAME_DEPTH * 0.7]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...goldMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0.06, 0, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[-0.06, 0, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
          </group>
        ))}

        {/* Bottom edge decorations */}
        {[-0.35, -0.15, 0.15, 0.35].map((offset, i) => (
          <group key={`bottom-decor-${i}`} position={[offset * (FRAME_OUTER_WIDTH - CORNER_SIZE * 2), -FRAME_OUTER_HEIGHT / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH / 2, FRAME_DEPTH * 0.7]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...goldMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0.06, 0, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[-0.06, 0, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
          </group>
        ))}

        {/* Left edge decorations */}
        {[-0.35, -0.15, 0.15, 0.35].map((offset, i) => (
          <group key={`left-decor-${i}`} position={[-FRAME_OUTER_WIDTH / 2 + OUTER_FRAME_WIDTH + MIDDLE_FRAME_WIDTH / 2, offset * (FRAME_OUTER_HEIGHT - CORNER_SIZE * 2), FRAME_DEPTH * 0.7]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...goldMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 0.06, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, -0.06, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
          </group>
        ))}

        {/* Right edge decorations */}
        {[-0.35, -0.15, 0.15, 0.35].map((offset, i) => (
          <group key={`right-decor-${i}`} position={[FRAME_OUTER_WIDTH / 2 - OUTER_FRAME_WIDTH - MIDDLE_FRAME_WIDTH / 2, offset * (FRAME_OUTER_HEIGHT - CORNER_SIZE * 2), FRAME_DEPTH * 0.7]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...goldMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 0.06, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, -0.06, -0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshStandardMaterial {...darkWoodMaterial} />
            </mesh>
          </group>
        ))}

        {/* === CONTINUOUS BEADING along outer edge === */}
        {Array.from({ length: 20 }, (_, i) => i).map((i) => {
          const t = (i / 19) * 2 - 1; // -1 to 1
          return (
            <mesh key={`bead-top-${i}`} castShadow receiveShadow position={[t * (FRAME_OUTER_WIDTH / 2 - 0.08), FRAME_OUTER_HEIGHT / 2 - 0.04, FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 20 }, (_, i) => i).map((i) => {
          const t = (i / 19) * 2 - 1;
          return (
            <mesh key={`bead-bottom-${i}`} castShadow receiveShadow position={[t * (FRAME_OUTER_WIDTH / 2 - 0.08), -FRAME_OUTER_HEIGHT / 2 + 0.04, FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 16 }, (_, i) => i).map((i) => {
          const t = (i / 15) * 2 - 1;
          return (
            <mesh key={`bead-left-${i}`} castShadow receiveShadow position={[-FRAME_OUTER_WIDTH / 2 + 0.04, t * (FRAME_OUTER_HEIGHT / 2 - 0.12), FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
        {Array.from({ length: 16 }, (_, i) => i).map((i) => {
          const t = (i / 15) * 2 - 1;
          return (
            <mesh key={`bead-right-${i}`} castShadow receiveShadow position={[FRAME_OUTER_WIDTH / 2 - 0.04, t * (FRAME_OUTER_HEIGHT / 2 - 0.12), FRAME_DEPTH * 0.35]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial {...antiqueGoldMaterial} />
            </mesh>
          );
        })}
      </group>

      {/* Letter paper - positioned forward from frame */}
      <mesh ref={letterRef} castShadow receiveShadow position={[0, 0, Z_FRONT + LETTER_DEPTH / 2]}>
        <boxGeometry args={[LETTER_WIDTH, LETTER_HEIGHT, LETTER_DEPTH]} />
        <meshStandardMaterial color="#FFF8DC" />
      </mesh>

      {/* Letter text */}
      <Text
        ref={textRef}
        position={[-LETTER_WIDTH / 2 + PADDING, LETTER_HEIGHT / 2 - PADDING, Z_FRONT + LETTER_DEPTH + 0.01]}
        fontSize={FONT_SIZE}
        color="#2C1810"
        anchorX="left"
        anchorY="top"
        maxWidth={LETTER_WIDTH - (PADDING * 2)}
        textAlign="left"
      >
        {letterText}
      </Text>
      
      {/* "Come in." as clickable link - positioned with blank line gap after main text */}
      <Text
        position={[-LETTER_WIDTH / 2 + PADDING, LETTER_HEIGHT / 2 - PADDING - FONT_SIZE * 7.5, Z_FRONT + LETTER_DEPTH + 0.01]}
        fontSize={FONT_SIZE}
        color={isHovered ? "#8B4513" : "#2C1810"}
        anchorX="left"
        anchorY="top"
        maxWidth={LETTER_WIDTH - (PADDING * 2)}
        textAlign="left"
        onClick={onEnter}
        onPointerOver={() => {
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {isHovered ? '→ Come in.' : 'Come in.'}
      </Text>
    </group>
  );
}

