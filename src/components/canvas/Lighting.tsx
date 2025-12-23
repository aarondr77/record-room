import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { DirectionalLight } from 'three';

export function Lighting() {
  const scene = useThree((s) => s.scene);
  const directionalLightRef = useRef<DirectionalLight>(null);

  // Aim the key light at the shelf area so shadows read clearly on the wall.
  useEffect(() => {
    const key = directionalLightRef.current;
    if (!key) return;

    // Ensure the target is part of the scene graph (Three doesn't auto-add it).
    scene.add(key.target);
    key.target.position.set(0, 0.5, 0); // roughly the shelves / window cluster
    key.target.updateMatrixWorld();
    key.updateMatrixWorld();

    return () => {
      scene.remove(key.target);
    };
  }, [scene]);

  return (
    <>      
      {/* Key light: more centered and closer to wall for more direct lighting */}
      <directionalLight
        ref={directionalLightRef}
        position={[4, 6, 7]}
        intensity={.8}
        color="#FFEDDE"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        // Tighten the shadow frustum around the wall/shelf area for crisper shadows.
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
        shadow-radius={5}
      />
      
      {/* Secondary shadow-casting light from the other side for depth */}
      <directionalLight
        position={[-5, 4, 5]}
        intensity={0.18}
        color="#FFE8E0"
      />
    </>
  );
}
