interface WallProps {
  position: [number, number, number];
  size: [number, number];
}

export function Wall({ position = [0, 0, 0], size = [50, 30] }: WallProps) {

  return (
    <mesh position={position} receiveShadow renderOrder={0}>
      <planeGeometry args={size} />
      <meshStandardMaterial 
        color="#F5F1E8"
        roughness={0.9}
        metalness={0.0}
        depthWrite={true}
      />
    </mesh>
  );
}
