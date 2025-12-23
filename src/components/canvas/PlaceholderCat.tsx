import { useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Euler, Group, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { getPlatform } from '../../config/platforms';
import type { CatState } from '../../types';

interface PlaceholderCatProps {
  catState: CatState & { currentTrackIndex: number | null };
}

// Cat scale - sized to fit on shelf platforms (records are 2x2 units)
// Cat should be clearly visible - about 0.6-0.8 units tall when sitting
const CAT_SCALE = 1.0;
const JUMP_DURATION_S = 0.6; // slightly longer to allow body animations to be visible
const JUMP_MIN_HEIGHT = 0.18;
const JUMP_MAX_HEIGHT = 0.42;

// Window hanging animation constants
const WINDOW_PAUSE_DURATION = 1.0; // seconds to pause before swinging starts
const WINDOW_TRANSITION_DURATION = 0.5; // seconds to transition into hanging pose

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function parabola01(t: number) {
  // 0..1..0, peak at t=0.5
  return 4 * t * (1 - t);
}

type TransformSnapshot = {
  pos: Vector3;
  rot: Euler;
  scale: Vector3;
};

function snapTransform(m: Mesh | Group): TransformSnapshot {
  return {
    pos: m.position.clone(),
    rot: m.rotation.clone(),
    scale: m.scale.clone(),
  };
}

// Material definitions for tuxedo cat appearance - created once and reused
const blackFurMaterial = new MeshStandardMaterial({
  color: new Color('#1A1A1A'), // Deep black fur
  roughness: 0.85,
  metalness: 0.0,
});

const whiteFurMaterial = new MeshStandardMaterial({
  color: new Color('#F5F5F5'), // Bright white fur
  roughness: 0.9,
  metalness: 0.0,
});

const eyeMaterial = new MeshStandardMaterial({
  color: new Color('#4A9F4A'), // Bright green cat eyes
  emissive: new Color('#2D6B2D'),
  emissiveIntensity: 0.5,
  roughness: 0.1,
  metalness: 0.2,
});

const pupilMaterial = new MeshStandardMaterial({
  color: new Color('#050505'), // Black pupils
  roughness: 0.1,
  metalness: 0.0,
});

const noseMaterial = new MeshStandardMaterial({
  color: new Color('#2A2A2A'), // Dark nose (tuxedo cats often have dark noses)
  roughness: 0.5,
  metalness: 0.0,
});

const innerEarMaterial = new MeshStandardMaterial({
  color: new Color('#E8B4B8'), // Pink inner ear
  roughness: 0.8,
  metalness: 0.0,
});

// Create a sitting tuxedo cat model facing forward (+Z direction, toward camera)
function createCatModel(): {
  group: Group;
  tail: Group | null;
  body: Mesh;
  head: Mesh;
  frontLegsGroup: Group;
  backLegsGroup: Group;
} {
  const catGroup = new Group();
  let tailMesh: Group | null = null;
  
  // Create groups for animatable leg parts
  const frontLegsGroup = new Group();
  const backLegsGroup = new Group();
  
  // === BODY (sitting cat - oval shaped, slightly tilted back) - BLACK ===
  const bodyGeometry = new SphereGeometry(0.18, 10, 8); // Minimal segments
  bodyGeometry.scale(1.0, 1.3, 0.85); // Taller than wide for sitting pose
  const body = new Mesh(bodyGeometry, blackFurMaterial);
  body.position.set(0, 0.15, 0);
  body.rotation.x = -0.15; // Slight tilt back for sitting pose
  body.castShadow = true;
  body.receiveShadow = true;
  catGroup.add(body);
  
  // === CHEST/FRONT - WHITE (tuxedo marking) ===
  const chestGeometry = new SphereGeometry(0.13, 8, 6); // Minimal segments
  chestGeometry.scale(0.85, 1.1, 0.65);
  const chest = new Mesh(chestGeometry, whiteFurMaterial);
  chest.position.set(0, 0.1, 0.09);
  chest.castShadow = true;
  catGroup.add(chest);
  
  // === BELLY - WHITE (extends down from chest) ===
  const bellyGeometry = new SphereGeometry(0.1, 8, 6); // Minimal segments
  bellyGeometry.scale(0.9, 1.0, 0.6);
  const belly = new Mesh(bellyGeometry, whiteFurMaterial);
  belly.position.set(0, -0.02, 0.06);
  belly.castShadow = true;
  catGroup.add(belly);
  
  // === HEAD - BLACK ===
  const headGeometry = new SphereGeometry(0.14, 10, 8); // Minimal segments
  headGeometry.scale(1.1, 1.0, 0.95); // Slightly wider for cat face
  const head = new Mesh(headGeometry, blackFurMaterial);
  head.position.set(0, 0.42, 0.08);
  head.castShadow = true;
  head.receiveShadow = true;
  catGroup.add(head);
  
  // === MUZZLE (snout area) - WHITE (tuxedo marking) ===
  const muzzleGeometry = new SphereGeometry(0.065, 8, 6); // Minimal segments
  muzzleGeometry.scale(1.3, 0.85, 1.0);
  const muzzle = new Mesh(muzzleGeometry, whiteFurMaterial);
  muzzle.position.set(0, 0.37, 0.17);
  muzzle.castShadow = true;
  catGroup.add(muzzle);
  
  // === CHIN - WHITE (connects to chest) ===
  const chinGeometry = new SphereGeometry(0.04, 6, 6); // Minimal segments
  chinGeometry.scale(1.2, 1.0, 0.8);
  const chin = new Mesh(chinGeometry, whiteFurMaterial);
  chin.position.set(0, 0.32, 0.14);
  catGroup.add(chin);
  
  // === EARS (triangular, pointing up) - BLACK ===
  const earGeometry = new ConeGeometry(0.05, 0.1, 3); // Minimal segments (3 is minimum)
  
  // Left ear
  const leftEar = new Mesh(earGeometry, blackFurMaterial);
  leftEar.position.set(-0.08, 0.54, 0.04);
  leftEar.rotation.z = -0.25;
  leftEar.rotation.x = 0.1;
  leftEar.castShadow = true;
  catGroup.add(leftEar);
  
  // Left inner ear
  const innerEarGeometry = new ConeGeometry(0.03, 0.06, 3); // Minimal segments
  const leftInnerEar = new Mesh(innerEarGeometry, innerEarMaterial);
  leftInnerEar.position.set(-0.08, 0.53, 0.06);
  leftInnerEar.rotation.z = -0.25;
  leftInnerEar.rotation.x = 0.1;
  catGroup.add(leftInnerEar);
  
  // Right ear
  const rightEar = new Mesh(earGeometry, blackFurMaterial);
  rightEar.position.set(0.08, 0.54, 0.04);
  rightEar.rotation.z = 0.25;
  rightEar.rotation.x = 0.1;
  rightEar.castShadow = true;
  catGroup.add(rightEar);
  
  // Right inner ear
  const rightInnerEar = new Mesh(innerEarGeometry, innerEarMaterial);
  rightInnerEar.position.set(0.08, 0.53, 0.06);
  rightInnerEar.rotation.z = 0.25;
  rightInnerEar.rotation.x = 0.1;
  catGroup.add(rightInnerEar);
  
  // === EYES (almond-shaped with pupils) ===
  const eyeWhiteGeometry = new SphereGeometry(0.028, 8, 6); // Minimal segments
  eyeWhiteGeometry.scale(1.3, 1.0, 0.5);
  
  // Left eye
  const leftEyeWhite = new Mesh(eyeWhiteGeometry, eyeMaterial);
  leftEyeWhite.position.set(-0.05, 0.44, 0.16);
  leftEyeWhite.rotation.y = -0.2;
  catGroup.add(leftEyeWhite);
  
  // Left pupil (vertical slit)
  const pupilGeometry = new SphereGeometry(0.015, 4, 4); // Minimal segments
  pupilGeometry.scale(0.5, 1.2, 0.5);
  const leftPupil = new Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.05, 0.44, 0.175);
  catGroup.add(leftPupil);
  
  // Right eye
  const rightEyeWhite = new Mesh(eyeWhiteGeometry, eyeMaterial);
  rightEyeWhite.position.set(0.05, 0.44, 0.16);
  rightEyeWhite.rotation.y = 0.2;
  catGroup.add(rightEyeWhite);
  
  // Right pupil
  const rightPupil = new Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.05, 0.44, 0.175);
  catGroup.add(rightPupil);
  
  // === NOSE (small triangle) - DARK ===
  const noseGeometry = new SphereGeometry(0.02, 4, 4); // Minimal segments
  noseGeometry.scale(1.2, 0.8, 0.8);
  const nose = new Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 0.39, 0.2);
  catGroup.add(nose);
  
  // === WHISKER MARKS (small bumps on muzzle) - WHITE ===
  // Removed whisker bumps for performance - they're very small and hard to see
  
  // === FRONT LEGS (sitting, vertical) - BLACK ===
  const frontLegGeometry = new CylinderGeometry(0.035, 0.04, 0.18, 6); // Minimal segments
  
  const frontLeftLeg = new Mesh(frontLegGeometry, blackFurMaterial);
  frontLeftLeg.position.set(-0.08, -0.02, 0.1);
  frontLeftLeg.castShadow = true;
  frontLeftLeg.receiveShadow = true;
  frontLegsGroup.add(frontLeftLeg);
  
  const frontRightLeg = new Mesh(frontLegGeometry, blackFurMaterial);
  frontRightLeg.position.set(0.08, -0.02, 0.1);
  frontRightLeg.castShadow = true;
  frontRightLeg.receiveShadow = true;
  frontLegsGroup.add(frontRightLeg);
  
  // === FRONT PAWS - WHITE (tuxedo "socks") ===
  const pawGeometry = new SphereGeometry(0.04, 6, 4); // Minimal segments
  pawGeometry.scale(1.0, 0.5, 1.2);
  
  const frontLeftPaw = new Mesh(pawGeometry, whiteFurMaterial);
  frontLeftPaw.position.set(-0.08, -0.12, 0.12);
  frontLeftPaw.castShadow = true;
  frontLegsGroup.add(frontLeftPaw);
  
  const frontRightPaw = new Mesh(pawGeometry, whiteFurMaterial);
  frontRightPaw.position.set(0.08, -0.12, 0.12);
  frontRightPaw.castShadow = true;
  frontLegsGroup.add(frontRightPaw);
  
  catGroup.add(frontLegsGroup);
  
  // === BACK LEGS (haunches - sitting pose) - BLACK ===
  const haunchGeometry = new SphereGeometry(0.08, 8, 6); // Minimal segments
  haunchGeometry.scale(0.9, 1.1, 1.0);
  
  const leftHaunch = new Mesh(haunchGeometry, blackFurMaterial);
  leftHaunch.position.set(-0.1, 0.02, -0.05);
  leftHaunch.castShadow = true;
  leftHaunch.receiveShadow = true;
  backLegsGroup.add(leftHaunch);
  
  const rightHaunch = new Mesh(haunchGeometry, blackFurMaterial);
  rightHaunch.position.set(0.1, 0.02, -0.05);
  rightHaunch.castShadow = true;
  rightHaunch.receiveShadow = true;
  backLegsGroup.add(rightHaunch);
  
  // === BACK PAWS (tucked under) - WHITE (tuxedo "socks") ===
  const backPawGeometry = new SphereGeometry(0.035, 6, 4); // Minimal segments
  backPawGeometry.scale(1.0, 0.5, 1.1);
  
  const backLeftPaw = new Mesh(backPawGeometry, whiteFurMaterial);
  backLeftPaw.position.set(-0.12, -0.1, 0.0);
  backLeftPaw.castShadow = true;
  backLegsGroup.add(backLeftPaw);
  
  const backRightPaw = new Mesh(backPawGeometry, whiteFurMaterial);
  backRightPaw.position.set(0.12, -0.1, 0.0);
  backRightPaw.castShadow = true;
  backLegsGroup.add(backRightPaw);
  
  catGroup.add(backLegsGroup);
  
  // === TAIL (curved, coming from back) - BLACK ===
  // Create a group to hold all tail parts so they rotate together
  const tailGroup = new Group();
  
  const tailCurve = new CatmullRomCurve3([
    new Vector3(0, 0.08, -0.15),
    new Vector3(0.05, 0.12, -0.22),
    new Vector3(0.12, 0.2, -0.25),
    new Vector3(0.15, 0.32, -0.22),
    new Vector3(0.12, 0.38, -0.18),
  ]);
  const tailGeometry = new TubeGeometry(tailCurve, 8, 0.025, 4, false); // Minimal segments
  const tail = new Mesh(tailGeometry, blackFurMaterial);
  tail.castShadow = true;
  tailGroup.add(tail);
  
  // Tail tip (slightly fluffy end) - BLACK with small white tip
  const tailTipGeometry = new SphereGeometry(0.03, 4, 4); // Minimal segments
  const tailTip = new Mesh(tailTipGeometry, blackFurMaterial);
  tailTip.position.set(0.12, 0.38, -0.18);
  tailTip.castShadow = true;
  tailGroup.add(tailTip);
  
  // Small white tip at very end of tail
  const tailWhiteTipGeometry = new SphereGeometry(0.015, 4, 4); // Reduced segments
  const tailWhiteTip = new Mesh(tailWhiteTipGeometry, whiteFurMaterial);
  tailWhiteTip.position.set(0.11, 0.4, -0.17);
  tailGroup.add(tailWhiteTip);
  
  // Use tailGroup as the animatable tail
  tailMesh = tailGroup;
  catGroup.add(tailGroup);
  
  return {
    group: catGroup,
    tail: tailMesh,
    body: body,
    head: head,
    frontLegsGroup: frontLegsGroup,
    backLegsGroup: backLegsGroup,
  };
}

export function PlaceholderCat({ catState }: PlaceholderCatProps) {
  const catRef = useRef<Group>(null);
  const { platform, recordIndex, facing, isMoving } = catState;

  const jumpRef = useRef<{
    active: boolean;
    t0: number; // seconds from R3F clock
    start: Vector3;
    end: Vector3;
    height: number;
    lastTarget: Vector3 | null;
    startRotationY: number; // Starting rotation for smooth turning
    targetRotationY: number; // Target rotation to face jump direction
  }>({
    active: false,
    t0: 0,
    start: new Vector3(),
    end: new Vector3(),
    height: JUMP_MIN_HEIGHT,
    lastTarget: null,
    startRotationY: 0,
    targetRotationY: 0,
  });

  // Window hanging animation state
  const windowHangRef = useRef<{
    phase: 'none' | 'pausing' | 'transitioning' | 'swinging';
    landedTime: number; // When the cat landed on the window
    swingStartTime: number; // When swinging started
  }>({
    phase: 'none',
    landedTime: 0,
    swingStartTime: 0,
  });

  const tmpPos = useMemo(() => new Vector3(), []);

  // Create the procedural cat model and store refs
  const catModelData = useMemo(() => {
    const { group, tail, body, head, frontLegsGroup, backLegsGroup } = createCatModel();
    
    // Apply scale
    group.scale.set(CAT_SCALE, CAT_SCALE, CAT_SCALE);

    // Capture base transforms for all animatable parts (following .cursorrules pattern)
    const tailBase = tail ? snapTransform(tail) : null;
    const bodyBase = snapTransform(body);
    const headBase = snapTransform(head);
    const frontLegsBase = snapTransform(frontLegsGroup);
    const backLegsBase = snapTransform(backLegsGroup);
    
    return { 
      group, 
      tail, 
      tailBase,
      body,
      bodyBase,
      head,
      headBase,
      frontLegsGroup,
      frontLegsBase,
      backLegsGroup,
      backLegsBase,
    };
  }, []);
  
  const { 
    group: catModel, 
    tail: tailMesh, 
    tailBase,
    body,
    bodyBase,
    head,
    headBase,
    frontLegsGroup,
    frontLegsBase,
    backLegsGroup,
    backLegsBase,
  } = catModelData;

  const platformData = getPlatform(platform);
  if (!platformData) return null;

  // Calculate cat position
  let catPosition = { ...platformData.position };
  
  if (platformData.type === 'shelf' && recordIndex !== null && recordIndex < platformData.records.length) {
    // Position cat next to the current record on the shelf
    // Records are now 2x2 and spaced 2.2 apart
    const recordCount = platformData.records.length;
    const RECORD_SPACING = 2.2;
    const totalWidth = (recordCount - 1) * RECORD_SPACING;
    const startOffset = -totalWidth / 2;
    catPosition.x += startOffset + recordIndex * RECORD_SPACING;
  }

  // Position cat on the platform (platform is at y - 1.1 from record center)
  // Adjust Y so the cat sits properly on the platform
  catPosition.y = platformData.position.y - 1.1 + 0.15;
  // Move cat forward (positive Z) so it's in front of the record, not behind
  catPosition.z = platformData.position.z + 0.6;

  // Initialize position on mount - set to current target
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (catRef.current && !isInitializedRef.current) {
      const initialPos = new Vector3(catPosition.x, catPosition.y, catPosition.z);
      catRef.current.position.copy(initialPos);
      // Set initial rotation based on facing direction
      const baseYaw = 0; // cat model faces +Z by default
      catRef.current.rotation.y = facing === 'left' ? baseYaw + Math.PI / 2 : baseYaw - Math.PI / 2;
      jumpRef.current.lastTarget = initialPos.clone();
      jumpRef.current.startRotationY = catRef.current.rotation.y;
      jumpRef.current.targetRotationY = catRef.current.rotation.y;
      isInitializedRef.current = true;
    }
  }, [catPosition.x, catPosition.y, catPosition.z, facing]);

  // Start a jump whenever the target position changes (platform jump OR record move).
  useEffect(() => {
    if (!isInitializedRef.current) return; // Wait for initialization
    
    const target = new Vector3(catPosition.x, catPosition.y, catPosition.z);
    const jump = jumpRef.current;
    const last = jump.lastTarget;
    
    if (!last) {
      jump.lastTarget = target.clone();
      return;
    }
    
    if (last.distanceTo(target) < 0.0001) return;

    // CRITICAL: Use the ACTUAL current position, not the last target
    // This ensures we jump from where the cat actually is, not where it should be
    const currentPos = catRef.current?.position?.clone();
    if (!currentPos) return;
    
    // Calculate jump direction to determine target rotation
    const jumpDir = new Vector3().subVectors(target, currentPos).normalize();
    // Calculate angle to face jump direction (cat faces +Z by default, so we need to adjust)
    // For left/right movement, we want to face the direction of travel
    const angleToTarget = Math.atan2(jumpDir.x, jumpDir.z);
    
    // Reset window hanging state when starting a new jump
    windowHangRef.current.phase = 'none';
    // Reset any rotation.z from swinging animation
    if (catRef.current) {
      catRef.current.rotation.z = 0;
    }
    
    jump.active = true;
    // t0 set in useFrame to the current clock time (more reliable than Date/perf).
    jump.t0 = -1;
    jump.start.copy(currentPos);
    jump.end.copy(target);
    jump.lastTarget = target.clone();
    jump.startRotationY = catRef.current?.rotation.y ?? 0;
    jump.targetRotationY = angleToTarget;

    const dist = currentPos.distanceTo(target);
    // Height scales with distance, clamped so short hops still read.
    jump.height = Math.max(JUMP_MIN_HEIGHT, Math.min(JUMP_MAX_HEIGHT, 0.12 + dist * 0.35));
  }, [platform, recordIndex, catPosition.x, catPosition.y, catPosition.z]);

  // Animation and movement
  useFrame((state) => {
    if (catRef.current) {
      const jump = jumpRef.current;
      const targetPos = tmpPos.set(catPosition.x, catPosition.y, catPosition.z);

      // If a jump was queued, stamp start time on the first frame.
      if (jump.active && jump.t0 < 0) {
        jump.t0 = state.clock.elapsedTime;
      }

      if (jump.active && jump.t0 >= 0) {
        const t = clamp01((state.clock.elapsedTime - jump.t0) / JUMP_DURATION_S);

        // === LEAP ANIMATION PHASES ===
        // Phase 1: Prepare (0-0.15): Turn to face direction, crouch
        // Phase 2: Leap (0.15-0.85): Arc movement with body tilt
        // Phase 3: Land (0.85-1.0): Extend legs to absorb impact
        
        const PREPARE_PHASE = 0.2;  // 20% = 120ms for crouch
        const LAND_PHASE = 0.8;    // Landing starts at 80%, giving 20% = 120ms for impact
        
        // Smoothly turn to face jump direction during prepare phase
        if (t < PREPARE_PHASE) {
          const turnT = t / PREPARE_PHASE;
          const turnEased = easeInOutCubic(turnT);
          catRef.current.rotation.y = jump.startRotationY + (jump.targetRotationY - jump.startRotationY) * turnEased;
        } else {
          catRef.current.rotation.y = jump.targetRotationY;
        }
        
        // Face the correct direction when not jumping
        const baseYaw = 0; // cat model faces +Z by default
        if (!jump.active) {
          catRef.current.rotation.y = facing === 'left' ? baseYaw + Math.PI / 2 : baseYaw - Math.PI / 2;
        }

        // World-space arc path (only during leap phase)
        if (t >= PREPARE_PHASE) {
          const leapT = clamp01((t - PREPARE_PHASE) / (LAND_PHASE - PREPARE_PHASE));
          const leapEased = easeInOutCubic(leapT);
          tmpPos.lerpVectors(jump.start, jump.end, leapEased);
          tmpPos.y += jump.height * parabola01(leapT);
          catRef.current.position.copy(tmpPos);
        }

        // === BODY ANIMATION ===
        // Reset to base before applying relative changes (following .cursorrules)
        body.position.copy(bodyBase.pos);
        body.rotation.copy(bodyBase.rot);
        head.position.copy(headBase.pos);
        head.rotation.copy(headBase.rot);
        frontLegsGroup.position.copy(frontLegsBase.pos);
        frontLegsGroup.rotation.copy(frontLegsBase.rot);
        backLegsGroup.position.copy(backLegsBase.pos);
        backLegsGroup.rotation.copy(backLegsBase.rot);

        if (t < PREPARE_PHASE) {
          // === PREPARE PHASE: Crouch (bend knees) ===
          // Use eased ramp-up that HOLDS at the end (not a pulse)
          const crouchT = easeInOutCubic(t / PREPARE_PHASE);
          const crouchAmount = crouchT * 0.15; // Ramp up and hold
          
          // Lower body and compress legs for the crouch
          body.position.y -= crouchAmount * 0.5;
          body.rotation.x += crouchAmount * 0.8; // Body hunches forward
          
          // Legs bend (lower position, rotate to show bend)
          frontLegsGroup.position.y -= crouchAmount * 0.3;
          backLegsGroup.position.y -= crouchAmount * 0.4;
          frontLegsGroup.rotation.x += crouchAmount * 3; // Bend knees forward
          backLegsGroup.rotation.x += crouchAmount * 2.5;
          
          // Head tilts down to look at landing spot
          head.position.y -= crouchAmount * 0.2;
          head.rotation.x += crouchAmount * 1.2;
          
        } else if (t < LAND_PHASE) {
          // === LEAP PHASE: Body stretches out during arc ===
          const leapT = (t - PREPARE_PHASE) / (LAND_PHASE - PREPARE_PHASE);
          const leapEased = easeInOutCubic(leapT);
          
          // Start from crouched position, then extend
          // Crouch amount at start of leap (full crouch), decreasing as we extend
          const remainingCrouch = (1 - leapEased) * 0.15;
          
          // Body tilts based on arc phase
          // Forward during ascent (first half), backward preparing for landing (second half)
          const arcPhase = parabola01(leapT); // 0 -> 1 -> 0
          const bodyTilt = (leapT < 0.5) 
            ? leapEased * 0.4  // Tilt forward during ascent
            : 0.4 - (leapT - 0.5) * 2 * 0.5; // Tilt back during descent
          
          body.position.y -= remainingCrouch * 0.3;
          body.rotation.x -= bodyTilt;
          
          // Head follows body, looking ahead during leap
          head.rotation.x -= bodyTilt * 0.8;
          head.position.y += arcPhase * 0.05; // Slight head lift at peak
          
          // Legs extend during leap (stretch out behind and in front)
          const legExtension = arcPhase * 0.12;
          frontLegsGroup.position.y += legExtension * 0.5;
          frontLegsGroup.position.z += legExtension * 0.3; // Reach forward
          frontLegsGroup.rotation.x -= legExtension * 4; // Extend forward
          
          backLegsGroup.position.y += legExtension * 0.3;
          backLegsGroup.position.z -= legExtension * 0.2; // Push back
          backLegsGroup.rotation.x -= legExtension * 3; // Extend backward
          
        } else {
          // === LAND PHASE: Compress to absorb impact, then recover ===
          const landT = (t - LAND_PHASE) / (1 - LAND_PHASE);
          
          // Impact compression - peaks at start, then recovers
          const impactCurve = Math.cos(landT * Math.PI * 0.5); // 1 -> 0 (compress then release)
          const impactCompression = impactCurve * 0.12;
          
          // Body compresses on impact
          body.position.y -= impactCompression * 0.4;
          body.rotation.x += impactCompression * 0.3; // Slight forward hunch on impact
          
          // Legs compress to absorb shock
          frontLegsGroup.position.y -= impactCompression * 0.5;
          backLegsGroup.position.y -= impactCompression * 0.6;
          frontLegsGroup.rotation.x += impactCompression * 2.5;
          backLegsGroup.rotation.x += impactCompression * 2;
          
          // Head dips on impact
          head.position.y -= impactCompression * 0.15;
          head.rotation.x += impactCompression * 0.5;
        }

        // Tail whips more during jump
        const pose = Math.sin(Math.PI * t);
        if (tailMesh && tailBase) {
          tailMesh.position.copy(tailBase.pos);
          tailMesh.rotation.copy(tailBase.rot);
          tailMesh.rotation.y += Math.sin(state.clock.elapsedTime * 9) * 0.55 * pose;
          tailMesh.rotation.x += Math.sin(state.clock.elapsedTime * 7) * 0.2 * pose;
        }

        // Land / cleanup
        if (t >= 1) {
          jump.active = false;
          
          // Keep the rotation at the landing direction (don't reset it)
          // The rotation is already set to jump.targetRotationY, so we preserve it
          
          // If landing on window, start the pause phase
          if (platformData.type === 'window') {
            windowHangRef.current.phase = 'pausing';
            windowHangRef.current.landedTime = state.clock.elapsedTime;
          } else {
            windowHangRef.current.phase = 'none';
          }
          
          // Restore all parts to base transforms (following .cursorrules)
          if (tailMesh && tailBase) {
            tailMesh.position.copy(tailBase.pos);
            tailMesh.rotation.copy(tailBase.rot);
            tailMesh.scale.copy(tailBase.scale);
          }
          body.position.copy(bodyBase.pos);
          body.rotation.copy(bodyBase.rot);
          body.scale.copy(bodyBase.scale);
          head.position.copy(headBase.pos);
          head.rotation.copy(headBase.rot);
          head.scale.copy(headBase.scale);
          frontLegsGroup.position.copy(frontLegsBase.pos);
          frontLegsGroup.rotation.copy(frontLegsBase.rot);
          frontLegsGroup.scale.copy(frontLegsBase.scale);
          backLegsGroup.position.copy(backLegsBase.pos);
          backLegsGroup.rotation.copy(backLegsBase.rot);
          backLegsGroup.scale.copy(backLegsBase.scale);
        }
      } else {
        // When idle (not jumping), preserve the current rotation
        // The rotation persists from the last jump, so we don't override it
        
        const windowHang = windowHangRef.current;
        const isOnWindow = platformData.type === 'window';
        
        // === WINDOW HANGING ANIMATION ===
        if (isOnWindow && windowHang.phase !== 'none') {
          const timeSinceLanding = state.clock.elapsedTime - windowHang.landedTime;
          
          // Phase transitions
          if (windowHang.phase === 'pausing' && timeSinceLanding >= WINDOW_PAUSE_DURATION) {
            windowHang.phase = 'transitioning';
            windowHang.swingStartTime = state.clock.elapsedTime;
          } else if (windowHang.phase === 'transitioning') {
            const transitionT = (state.clock.elapsedTime - windowHang.swingStartTime) / WINDOW_TRANSITION_DURATION;
            if (transitionT >= 1) {
              windowHang.phase = 'swinging';
            }
          }
          
          // Reset to base before applying hanging pose
          body.position.copy(bodyBase.pos);
          body.rotation.copy(bodyBase.rot);
          body.scale.copy(bodyBase.scale);
          head.position.copy(headBase.pos);
          head.rotation.copy(headBase.rot);
          head.scale.copy(headBase.scale);
          frontLegsGroup.position.copy(frontLegsBase.pos);
          frontLegsGroup.rotation.copy(frontLegsBase.rot);
          frontLegsGroup.scale.copy(frontLegsBase.scale);
          backLegsGroup.position.copy(backLegsBase.pos);
          backLegsGroup.rotation.copy(backLegsBase.rot);
          backLegsGroup.scale.copy(backLegsBase.scale);
          if (tailMesh && tailBase) {
            tailMesh.position.copy(tailBase.pos);
            tailMesh.rotation.copy(tailBase.rot);
            tailMesh.scale.copy(tailBase.scale);
          }
          
          if (windowHang.phase === 'pausing') {
            // Just sitting normally during pause, maybe looking around
            const lookTime = state.clock.elapsedTime * 1.5;
            head.rotation.y += Math.sin(lookTime) * 0.2; // Look left and right
            head.rotation.x -= 0.1; // Look up at window
            
            // Tail sways gently
            if (tailMesh) {
              tailMesh.rotation.y += Math.sin(state.clock.elapsedTime * 0.8) * 0.4;
            }
            
          } else if (windowHang.phase === 'transitioning' || windowHang.phase === 'swinging') {
            // Calculate transition progress (0 to 1)
            const transitionT = windowHang.phase === 'transitioning'
              ? easeInOutCubic(clamp01((state.clock.elapsedTime - windowHang.swingStartTime) / WINDOW_TRANSITION_DURATION))
              : 1;
            
            // Move cat DOWN to hang from window frame (body hangs below hands)
            const hangOffset = transitionT * 0.15;
            catRef.current.position.y = targetPos.y + hangOffset;
            
            // Face the window (rotate to face -Z, toward the window)
            catRef.current.rotation.y = Math.PI * transitionT; // Turn to face window
            
            // === HANGING POSE ===
            // Body hangs down and slightly forward
            body.rotation.x -= transitionT * 0.25;
            body.position.y -= transitionT * 0.05;
            body.position.z += transitionT * 0.03;
            
            // Front legs reach up above head (holding window frame)
            // Scale legs longer so they can reach above head while staying attached
            frontLegsGroup.scale.set(
              1 + transitionT * 0.3,  // Slightly wider
              1 + transitionT * 1.8,  // MUCH longer (stretch up)
              1 + transitionT * 0.3   // Slightly deeper
            );
            // Rotate to point upward - less extreme rotation since legs are now longer
            frontLegsGroup.rotation.x -= transitionT * 1.8;
            // Position adjusted to keep attached to body while reaching up
            // The legs start at y=-0.02, when stretched they extend more
            frontLegsGroup.position.y += transitionT * 0.25;
            frontLegsGroup.position.z -= transitionT * 0.05;
            
            // Back legs dangle down loosely
            backLegsGroup.rotation.x += transitionT * 1.0;
            backLegsGroup.position.y -= transitionT * 0.12;
            // Stretch back legs slightly for dangling effect
            backLegsGroup.scale.set(1, 1 + transitionT * 0.3, 1);
            
            // Head tilts up to look at paws/window frame
            head.rotation.x -= transitionT * 0.5;
            head.position.y += transitionT * 0.03;
            
            // Tail hangs down
            if (tailMesh) {
              tailMesh.rotation.x += transitionT * 1.4;
            }
            
            // === SWINGING MOTION (only when fully in hanging pose) ===
            if (windowHang.phase === 'swinging') {
              const swingTime = state.clock.elapsedTime - windowHang.swingStartTime - WINDOW_TRANSITION_DURATION;
              const swingSpeed = 2.0; // Slow, pendulum-like swing
              const swingAmount = Math.sin(swingTime * swingSpeed);
              
              // Whole body swings side to side
              catRef.current.rotation.z = swingAmount * 0.18;
              catRef.current.position.x = targetPos.x + swingAmount * 0.15;
              
              // Back legs swing with momentum (delayed from body, more pronounced)
              const legSwing = Math.sin(swingTime * swingSpeed - 0.4) * 0.35;
              backLegsGroup.rotation.z += legSwing;
              // Front legs (holding on) barely move
              frontLegsGroup.rotation.z += swingAmount * 0.05;
              
              // Tail swings opposite to body
              if (tailMesh) {
                tailMesh.rotation.y += Math.sin(swingTime * swingSpeed + 0.5) * 0.6;
                tailMesh.rotation.z -= swingAmount * 0.4;
              }
              
              // Head sways slightly
              head.rotation.z += swingAmount * 0.1;
            }
          }
          
          // Breathing
          const breathScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
          catModel.scale.set(CAT_SCALE * breathScale, CAT_SCALE, CAT_SCALE * breathScale);
          
        } else {
          // === NORMAL IDLE (not on window or window animation not started) ===
          // Reset window hang state when not on window
          if (!isOnWindow) {
            windowHang.phase = 'none';
          }
          
          // Not jumping: only lerp if we're close to target (to avoid interfering with jump start)
          const distToTarget = catRef.current.position.distanceTo(targetPos);
          if (distToTarget > 0.01) {
            // Only lerp if we're not already very close (prevents fighting with jump animation)
            catRef.current.position.lerp(targetPos, 0.18);
          }

          // Reset all parts to base transforms (following .cursorrules)
          body.position.copy(bodyBase.pos);
          body.rotation.copy(bodyBase.rot);
          body.scale.copy(bodyBase.scale);
          head.position.copy(headBase.pos);
          head.rotation.copy(headBase.rot);
          head.scale.copy(headBase.scale);
          frontLegsGroup.position.copy(frontLegsBase.pos);
          frontLegsGroup.rotation.copy(frontLegsBase.rot);
          frontLegsGroup.scale.copy(frontLegsBase.scale);
          backLegsGroup.position.copy(backLegsBase.pos);
          backLegsGroup.rotation.copy(backLegsBase.rot);
          backLegsGroup.scale.copy(backLegsBase.scale);

          // Idle tail sway + breathing
          if (tailMesh && tailBase) {
            tailMesh.position.copy(tailBase.pos);
            tailMesh.rotation.copy(tailBase.rot);
            tailMesh.scale.copy(tailBase.scale);

            if (isMoving) {
              // When moving, smaller faster sway
              const amp = 0.35;
              const spd = 4.5;
              tailMesh.rotation.y += Math.sin(state.clock.elapsedTime * spd) * amp;
              tailMesh.rotation.x += Math.sin(state.clock.elapsedTime * (spd * 0.7)) * (amp * 0.35);
            } else {
              // When stationary, big slow swaying motion
              const amp = 0.8; // Much larger amplitude for big motions
              const spd = 0.6; // Slower speed for smooth, deliberate sway
              tailMesh.rotation.y += Math.sin(state.clock.elapsedTime * spd) * amp;
              tailMesh.rotation.x += Math.sin(state.clock.elapsedTime * (spd * 0.8)) * (amp * 0.4);
            }
          }

          const breathScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
          catModel.scale.set(CAT_SCALE * breathScale, CAT_SCALE, CAT_SCALE * breathScale);
        }
      }
    }
  });

  // Initialize position - don't set it in JSX to avoid conflicts with animation
  const initialPosition = useMemo(() => {
    return [catPosition.x, catPosition.y, catPosition.z] as [number, number, number];
  }, []); // Only set once on mount

  return (
    <group ref={catRef} position={initialPosition}>
      <primitive 
        object={catModel} 
        castShadow 
        receiveShadow
      />
    </group>
  );
}

