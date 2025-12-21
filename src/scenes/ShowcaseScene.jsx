import * as THREE from "three";

/* ================================================================= */
/* 🔧 HELPER: ROUNDED CANOPY (Rounded X/Y, Sharp Z)                   */
/* ================================================================= */
/**
 * Creates a canopy with:
 * - Rounded corners in X/Y (like border-radius)
 * - Sharp edges in Z (front/back)
 *
 * Uses ExtrudeGeometry instead of RoundedBox
 */
function RoundedCanopy({ width, height, depth, radius, position, material }) {
  const shape = new THREE.Shape();

  const hw = width / 2;
  const hd = depth / 2;

  // Rounded rectangle in X–Z plane
  shape.moveTo(-hw + radius, -hd);
  shape.lineTo(hw - radius, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  shape.lineTo(hw, hd - radius);
  shape.quadraticCurveTo(hw, hd, hw - radius, hd);
  shape.lineTo(-hw + radius, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  shape.lineTo(-hw, -hd + radius);
  shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height, // thickness (Y)
    bevelEnabled: false, // flat top & bottom
  });

  // 🔑 Rotate geometry so extrusion goes UP (Y), not forward (Z)
  geometry.rotateX(-Math.PI / 2);

  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      {material}
    </mesh>
  );
}

/* ================================================================= */
/* 🏗️ MAIN SCENE                                                     */
/* ================================================================= */

export default function ShowcaseScene() {
  /* ---------------------------------------------------------------- */
  /* 🌍 GLOBAL SCENE CONSTANTS                                         */
  /* ---------------------------------------------------------------- */

  const GROUND_Y = 0;

  /* ---------------------------------------------------------------- */
  /* 🧱 GROUND / PLAZA                                                 */
  /* ---------------------------------------------------------------- */

  const PLAZA_WIDTH = 800;
  const PLAZA_DEPTH = 600;

  /* ---------------------------------------------------------------- */
  /* 🟦 SHARED CANOPY CONSTANTS                                        */
  /* ---------------------------------------------------------------- */

  const CANOPY_DEPTH = 7; // shared across site
  const CANOPY_THICKNESS = 1.5;
  const CANOPY_RADIUS = 0.8;

  const PILLAR_RADIUS = 0.35;

  /* ---------------------------------------------------------------- */
  /* 🏧 PAY STATION (LEFT)                                             */
  /* ---------------------------------------------------------------- */

  const PAY_X = 40;
  const PAY_Z = -20;
  const PAY_HEIGHT = 5;

  const PAY_CANOPY_WIDTH = 10;
  const PAY_CANOPY_Y = PAY_HEIGHT + 1;

  const PAY_PILLAR_X = [-0.5, 4]; // drive-through

  /* ---------------------------------------------------------------- */
  /* 🚗 MAIN CAR WASH BUILDING                                         */
  /* ---------------------------------------------------------------- */

  const WASH_X = 6;
  const WASH_Z = 8;

  const WASH_WIDTH = 40;
  const WASH_HEIGHT = 8;
  const WASH_DEPTH = 24;

  // Canopy intentionally smaller + offset
  const WASH_CANOPY_WIDTH = WASH_WIDTH - 6;
  const WASH_CANOPY_OFFSET_X = 2;
  const WASH_CANOPY_OUTSET = 4;

  /* ---------------------------------------------------------------- */
  /* 🧹 VACUUM AREA (FRONT)                                            */
  /* ---------------------------------------------------------------- */

  const VACUUM_Z = -25;
  const VACUUM_CANOPY_WIDTH = 22;
  const VACUUM_CANOPY_HEIGHT = 8;

  const VACUUM_PILLAR_X = [-7, 2, 7];

  /* ---------------------------------------------------------------- */
  /* 🎨 MATERIALS (TEMP – WILL BE UI-DRIVEN LATER)                     */
  /* ---------------------------------------------------------------- */

  const wallMaterial = <meshStandardMaterial color="#d1d5db" roughness={0.7} />;

  const roofMaterial = (
    <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.3} />
  );

  const pillarMaterial = (
    <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.4} />
  );

  return (
    <>
      {/* ============================================================= */}
      {/* 🌍 PLAZA GROUND                                               */}
      {/* ============================================================= */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y - 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[PLAZA_WIDTH, PLAZA_DEPTH]} />
        <meshStandardMaterial color="#2f3030" roughness={0.85} />
      </mesh>

      {/* ============================================================= */}
      {/* 🏧 PAY STATION (DRIVE-THROUGH)                                 */}
      {/* ============================================================= */}
      <group position={[PAY_X, GROUND_Y, PAY_Z]}>
        {/* Pillars */}
        {PAY_PILLAR_X.map((x, i) => (
          <mesh key={i} position={[x, PAY_HEIGHT / 2, 0]} castShadow>
            <cylinderGeometry
              args={[PILLAR_RADIUS, PILLAR_RADIUS, PAY_HEIGHT + 4, 24]}
            />
            {pillarMaterial}
          </mesh>
        ))}

        {/* Canopy */}
        <RoundedCanopy
          width={PAY_CANOPY_WIDTH}
          height={CANOPY_THICKNESS}
          depth={CANOPY_DEPTH}
          radius={CANOPY_RADIUS}
          position={[0, PAY_CANOPY_Y, 0]}
          material={roofMaterial}
        />
      </group>

      {/* ============================================================= */}
      {/* 🚗 MAIN CAR WASH BUILDING                                     */}
      {/* ============================================================= */}
      <group position={[WASH_X, GROUND_Y, WASH_Z]}>
        {/* Building Body */}
        <mesh position={[0, WASH_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[WASH_WIDTH, WASH_HEIGHT + 8, WASH_DEPTH]} />
          {wallMaterial}
        </mesh>

        {/* Building Canopy */}
        <RoundedCanopy
          width={WASH_CANOPY_WIDTH}
          height={CANOPY_THICKNESS}
          depth={CANOPY_DEPTH}
          radius={CANOPY_RADIUS}
          position={[
            WASH_CANOPY_OFFSET_X,
            WASH_HEIGHT,
            -WASH_DEPTH / 2 - CANOPY_DEPTH / 2 + 1,
          ]}
          material={roofMaterial}
        />

        {/* Canopy Pillars – 6 total (left / center / right) */}
        {[-1, 0, 1].map((xIndex) => (
          <mesh
            key={xIndex}
            position={[
              xIndex * (WASH_CANOPY_WIDTH / 2 - 1.5) + WASH_CANOPY_OFFSET_X,
              WASH_HEIGHT / 2,
              -WASH_DEPTH / 2 - CANOPY_DEPTH + 2,
            ]}
            castShadow
          >
            <cylinderGeometry
              args={[PILLAR_RADIUS, PILLAR_RADIUS, WASH_HEIGHT, 24]}
            />
            {pillarMaterial}
          </mesh>
        ))}
      </group>

      {/* ============================================================= */}
      {/* 🧹 VACUUM AREA CANOPY                                         */}
      {/* ============================================================= */}
      <group position={[0, GROUND_Y, VACUUM_Z]}>
        {/* Canopy */}
        <RoundedCanopy
          width={VACUUM_CANOPY_WIDTH}
          height={CANOPY_THICKNESS}
          depth={CANOPY_DEPTH}
          radius={CANOPY_RADIUS}
          position={[0, VACUUM_CANOPY_HEIGHT, 0]}
          material={roofMaterial}
        />

        {/* Pillars */}
        {VACUUM_PILLAR_X.map((x, i) => (
          <mesh key={i} position={[x, VACUUM_CANOPY_HEIGHT / 2, 0]} castShadow>
            <cylinderGeometry
              args={[PILLAR_RADIUS, PILLAR_RADIUS, VACUUM_CANOPY_HEIGHT, 24]}
            />
            {pillarMaterial}
          </mesh>
        ))}
      </group>
    </>
  );
}
