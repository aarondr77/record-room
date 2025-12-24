import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  CylinderGeometry,
  ConeGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  Color,
} from 'three';

interface LobsterToyProps {
  position: [number, number, number];
  isCarried?: boolean;
}

// Lobster scale - visible and cute, about half the cat's size
const LOBSTER_SCALE = 0.7;

// Materials for the lobster toy - plush red appearance
const redPlushMaterial = new MeshStandardMaterial({
  color: new Color('#C41E3A'), // Deep red
  roughness: 0.95, // Very matte for plush look
  metalness: 0.0,
});

const darkRedMaterial = new MeshStandardMaterial({
  color: new Color('#8B0000'), // Darker red for details
  roughness: 0.9,
  metalness: 0.0,
});

const eyeWhiteMaterial = new MeshStandardMaterial({
  color: new Color('#FFFFFF'),
  roughness: 0.3,
  metalness: 0.0,
});

const eyePupilMaterial = new MeshStandardMaterial({
  color: new Color('#1A1A1A'),
  roughness: 0.1,
  metalness: 0.0,
});

// Create the lobster toy model
function createLobsterModel(): Group {
  const lobsterGroup = new Group();

  // === BODY (main oval body) ===
  const bodyGeometry = new SphereGeometry(0.15, 10, 8);
  bodyGeometry.scale(1.0, 0.7, 1.4); // Elongated oval
  const body = new Mesh(bodyGeometry, redPlushMaterial);
  body.position.set(0, 0, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  lobsterGroup.add(body);

  // === HEAD (smaller sphere at front) ===
  const headGeometry = new SphereGeometry(0.1, 8, 6);
  headGeometry.scale(1.1, 0.9, 1.0);
  const head = new Mesh(headGeometry, redPlushMaterial);
  head.position.set(0, 0.02, 0.18);
  head.castShadow = true;
  lobsterGroup.add(head);

  // === EYES (googly style, on stalks) ===
  // Left eye stalk
  const eyeStalkGeometry = new CylinderGeometry(0.015, 0.02, 0.06, 6);
  const leftEyeStalk = new Mesh(eyeStalkGeometry, redPlushMaterial);
  leftEyeStalk.position.set(-0.05, 0.08, 0.2);
  leftEyeStalk.rotation.z = -0.3;
  lobsterGroup.add(leftEyeStalk);

  // Left eye white
  const eyeWhiteGeometry = new SphereGeometry(0.025, 6, 4);
  const leftEyeWhite = new Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  leftEyeWhite.position.set(-0.065, 0.11, 0.21);
  lobsterGroup.add(leftEyeWhite);

  // Left pupil
  const pupilGeometry = new SphereGeometry(0.012, 4, 4);
  const leftPupil = new Mesh(pupilGeometry, eyePupilMaterial);
  leftPupil.position.set(-0.065, 0.11, 0.235);
  lobsterGroup.add(leftPupil);

  // Right eye stalk
  const rightEyeStalk = new Mesh(eyeStalkGeometry, redPlushMaterial);
  rightEyeStalk.position.set(0.05, 0.08, 0.2);
  rightEyeStalk.rotation.z = 0.3;
  lobsterGroup.add(rightEyeStalk);

  // Right eye white
  const rightEyeWhite = new Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  rightEyeWhite.position.set(0.065, 0.11, 0.21);
  lobsterGroup.add(rightEyeWhite);

  // Right pupil
  const rightPupil = new Mesh(pupilGeometry, eyePupilMaterial);
  rightPupil.position.set(0.065, 0.11, 0.235);
  lobsterGroup.add(rightPupil);

  // === ANTENNAE (two curved whiskers) ===
  const leftAntennaCurve = new CatmullRomCurve3([
    new Vector3(-0.03, 0.06, 0.22),
    new Vector3(-0.06, 0.1, 0.28),
    new Vector3(-0.08, 0.08, 0.35),
    new Vector3(-0.05, 0.04, 0.4),
  ]);
  const antennaGeometry = new TubeGeometry(leftAntennaCurve, 8, 0.008, 4, false);
  const leftAntenna = new Mesh(antennaGeometry, darkRedMaterial);
  leftAntenna.castShadow = true;
  lobsterGroup.add(leftAntenna);

  const rightAntennaCurve = new CatmullRomCurve3([
    new Vector3(0.03, 0.06, 0.22),
    new Vector3(0.06, 0.1, 0.28),
    new Vector3(0.08, 0.08, 0.35),
    new Vector3(0.05, 0.04, 0.4),
  ]);
  const rightAntennaGeometry = new TubeGeometry(rightAntennaCurve, 8, 0.008, 4, false);
  const rightAntenna = new Mesh(rightAntennaGeometry, darkRedMaterial);
  rightAntenna.castShadow = true;
  lobsterGroup.add(rightAntenna);

  // === CLAWS (big pincer arms) ===
  // Left claw arm
  const clawArmGeometry = new CylinderGeometry(0.025, 0.03, 0.12, 6);
  const leftClawArm = new Mesh(clawArmGeometry, redPlushMaterial);
  leftClawArm.position.set(-0.12, -0.02, 0.12);
  leftClawArm.rotation.z = Math.PI / 3;
  leftClawArm.rotation.x = -0.3;
  leftClawArm.castShadow = true;
  lobsterGroup.add(leftClawArm);

  // Left claw pincer (main part)
  const clawPincerGeometry = new SphereGeometry(0.05, 6, 4);
  clawPincerGeometry.scale(1.5, 0.6, 1.0);
  const leftClawPincer = new Mesh(clawPincerGeometry, redPlushMaterial);
  leftClawPincer.position.set(-0.2, 0.03, 0.15);
  leftClawPincer.rotation.z = 0.2;
  leftClawPincer.castShadow = true;
  lobsterGroup.add(leftClawPincer);

  // Left claw finger (top)
  const clawFingerGeometry = new ConeGeometry(0.02, 0.06, 4);
  const leftClawFingerTop = new Mesh(clawFingerGeometry, darkRedMaterial);
  leftClawFingerTop.position.set(-0.27, 0.06, 0.15);
  leftClawFingerTop.rotation.z = Math.PI / 2 + 0.3;
  lobsterGroup.add(leftClawFingerTop);

  // Left claw finger (bottom)
  const leftClawFingerBottom = new Mesh(clawFingerGeometry, darkRedMaterial);
  leftClawFingerBottom.position.set(-0.27, 0.0, 0.15);
  leftClawFingerBottom.rotation.z = Math.PI / 2 - 0.3;
  lobsterGroup.add(leftClawFingerBottom);

  // Right claw arm
  const rightClawArm = new Mesh(clawArmGeometry, redPlushMaterial);
  rightClawArm.position.set(0.12, -0.02, 0.12);
  rightClawArm.rotation.z = -Math.PI / 3;
  rightClawArm.rotation.x = -0.3;
  rightClawArm.castShadow = true;
  lobsterGroup.add(rightClawArm);

  // Right claw pincer
  const rightClawPincer = new Mesh(clawPincerGeometry, redPlushMaterial);
  rightClawPincer.position.set(0.2, 0.03, 0.15);
  rightClawPincer.rotation.z = -0.2;
  rightClawPincer.castShadow = true;
  lobsterGroup.add(rightClawPincer);

  // Right claw finger (top)
  const rightClawFingerTop = new Mesh(clawFingerGeometry, darkRedMaterial);
  rightClawFingerTop.position.set(0.27, 0.06, 0.15);
  rightClawFingerTop.rotation.z = -Math.PI / 2 - 0.3;
  lobsterGroup.add(rightClawFingerTop);

  // Right claw finger (bottom)
  const rightClawFingerBottom = new Mesh(clawFingerGeometry, darkRedMaterial);
  rightClawFingerBottom.position.set(0.27, 0.0, 0.15);
  rightClawFingerBottom.rotation.z = -Math.PI / 2 + 0.3;
  lobsterGroup.add(rightClawFingerBottom);

  // === LEGS (small legs on sides) ===
  const legGeometry = new CylinderGeometry(0.012, 0.015, 0.08, 4);
  
  // Left legs (3 pairs)
  for (let i = 0; i < 3; i++) {
    const leg = new Mesh(legGeometry, redPlushMaterial);
    leg.position.set(-0.1, -0.06, -0.05 + i * 0.08);
    leg.rotation.z = Math.PI / 4;
    leg.rotation.x = 0.2;
    leg.castShadow = true;
    lobsterGroup.add(leg);
  }

  // Right legs (3 pairs)
  for (let i = 0; i < 3; i++) {
    const leg = new Mesh(legGeometry, redPlushMaterial);
    leg.position.set(0.1, -0.06, -0.05 + i * 0.08);
    leg.rotation.z = -Math.PI / 4;
    leg.rotation.x = 0.2;
    leg.castShadow = true;
    lobsterGroup.add(leg);
  }

  // === TAIL (segmented tail with fan) ===
  // Tail segments
  const tailSegmentGeometry = new SphereGeometry(0.08, 6, 4);
  tailSegmentGeometry.scale(0.9, 0.5, 1.0);
  
  const tailSeg1 = new Mesh(tailSegmentGeometry, redPlushMaterial);
  tailSeg1.position.set(0, -0.02, -0.18);
  tailSeg1.castShadow = true;
  lobsterGroup.add(tailSeg1);

  const tailSeg2Geometry = new SphereGeometry(0.06, 6, 4);
  tailSeg2Geometry.scale(0.85, 0.5, 1.0);
  const tailSeg2 = new Mesh(tailSeg2Geometry, redPlushMaterial);
  tailSeg2.position.set(0, -0.025, -0.26);
  tailSeg2.castShadow = true;
  lobsterGroup.add(tailSeg2);

  const tailSeg3Geometry = new SphereGeometry(0.045, 6, 4);
  tailSeg3Geometry.scale(0.8, 0.5, 1.0);
  const tailSeg3 = new Mesh(tailSeg3Geometry, redPlushMaterial);
  tailSeg3.position.set(0, -0.03, -0.32);
  tailSeg3.castShadow = true;
  lobsterGroup.add(tailSeg3);

  // Tail fan (center)
  const tailFanCenterGeometry = new SphereGeometry(0.04, 6, 4);
  tailFanCenterGeometry.scale(1.2, 0.3, 1.5);
  const tailFanCenter = new Mesh(tailFanCenterGeometry, redPlushMaterial);
  tailFanCenter.position.set(0, -0.03, -0.4);
  tailFanCenter.castShadow = true;
  lobsterGroup.add(tailFanCenter);

  // Tail fan (left)
  const tailFanSideGeometry = new SphereGeometry(0.03, 6, 4);
  tailFanSideGeometry.scale(1.5, 0.3, 1.2);
  const tailFanLeft = new Mesh(tailFanSideGeometry, redPlushMaterial);
  tailFanLeft.position.set(-0.04, -0.03, -0.38);
  tailFanLeft.rotation.y = 0.4;
  tailFanLeft.castShadow = true;
  lobsterGroup.add(tailFanLeft);

  // Tail fan (right)
  const tailFanRight = new Mesh(tailFanSideGeometry, redPlushMaterial);
  tailFanRight.position.set(0.04, -0.03, -0.38);
  tailFanRight.rotation.y = -0.4;
  tailFanRight.castShadow = true;
  lobsterGroup.add(tailFanRight);

  return lobsterGroup;
}

export function LobsterToy({ position, isCarried = false }: LobsterToyProps) {
  const groupRef = useRef<Group>(null);

  // Create the lobster model once
  const lobsterModel = useMemo(() => {
    const model = createLobsterModel();
    model.scale.set(LOBSTER_SCALE, LOBSTER_SCALE, LOBSTER_SCALE);
    return model;
  }, []);

  // Gentle idle animation when not carried
  useFrame((state) => {
    if (groupRef.current && !isCarried) {
      // Subtle breathing/bobbing animation
      const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.005;
      groupRef.current.position.y = position[1] + breathe;
      
      // Very subtle rotation wiggle
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  // Position the lobster on the floor, offset Y so it sits on the surface
  // Floor is at y = -3, so we add a small offset for the lobster's base
  const floorOffset = 0.05; // Lift slightly so it sits on floor surface

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1] + floorOffset, position[2]]}
      rotation={[0, Math.PI, 0]} // Face forward (toward camera)
    >
      <primitive object={lobsterModel} castShadow receiveShadow />
    </group>
  );
}

