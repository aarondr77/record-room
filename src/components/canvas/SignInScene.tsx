import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Wall } from './Wall';
import { Floor } from './Floor';
import { Window } from './Window';
import { LoveLetter } from './LoveLetter';

interface SignInSceneProps {
  onEnter?: () => void;
  onReady?: () => void;
}

export function SignInScene({ onEnter, onReady }: SignInSceneProps) {
  return (
    <Canvas 
      shadows
      onCreated={() => {
        // Scene is ready - notify parent after a brief delay to ensure first frame is rendered
        if (onReady) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              onReady();
            });
          });
        }
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
      
      <directionalLight
        position={[10, 2, 2]}
        intensity={0.15}
        color="#FFFFFF"
      />  
      
      {/* Wall - extends beyond viewport */}
      <Wall position={[0, 0, 0]} size={[50, 30]} />
      
      {/* Floor - detailed wooden planks with realistic grain and variation */}
      <Floor position={[0, -3, 2]} width={50} depth={10} />
      
      {/* Window (same component as room) */}
      <Window position={[-3, 2, 0.1]} hasPlatform={true} />
      
      {/* Love letter with spotlight effect */}
      <LoveLetter position={[2, 2, 0.1]} onEnter={onEnter} />
      
      {/* Warm golden spotlight pointing at love letter */}
      <spotLight
        position={[8, 10, 3]}
        angle={0.4}
        penumbra={0.2}
        intensity={200.0}
        color="#FFE5B4"
        castShadow
        target-position={[5, 2, 0]}
      />
    </Canvas>
  );
}

