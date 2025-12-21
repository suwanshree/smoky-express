import * as THREE from "three";

/* ================================================================= */
/* 🔧 HELPER: ROUNDED CANOPY                                          */
/* - Rounded sides (X/Z)                                              */
/* - Flat top & bottom (Y)                                            */
/* - Sharp front/back edges                                          */
/* ================================================================= */
function RoundedCanopy({
  width,
  height,
  depth,
  radius,
  position,
  sideColor = "yellow",
  topBottomColor = "white",
}) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;

  // Rounded rectangle in X-Z
  shape.moveTo(-hw + radius, -hd);
  shape.lineTo(hw - radius, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  shape.lineTo(hw, hd - radius);
  shape.quadraticCurveTo(hw, hd, hw - radius, hd);
  shape.lineTo(-hw + radius, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  shape.lineTo(-hw, -hd + radius);
  shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  /* ---------------------------------- */
  /* SIDE SHELL (extrude only sides)    */
  /* ---------------------------------- */
  const sideGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });

  sideGeometry.rotateX(-Math.PI / 2);
  sideGeometry.translate(0, 0.01, 0); // small offset so bottom stays visible

  /* ---------------------------------- */
  /* BOTTOM CAP (white)                 */
  /* ---------------------------------- */
  const bottomGeometry = new THREE.ShapeGeometry(shape);
  bottomGeometry.rotateX(-Math.PI / 2);
  bottomGeometry.translate(0, -height / 2, 0);

  return (
    <group position={position} castShadow receiveShadow>
      {/* Sides */}
      <mesh geometry={sideGeometry}>
        <meshStandardMaterial color={sideColor} roughness={0.45} />
      </mesh>

      {/* Bottom */}
      <mesh geometry={bottomGeometry}>
        <meshStandardMaterial color={topBottomColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ================================================================= */
/* 🏗️ MAIN SCENE                                                     */
/* ================================================================= */
export default function ShowcaseScene() {
  /* ---------------------------------------------------------------- */
  /* 🌍 GLOBAL                                                        */
  /* ---------------------------------------------------------------- */

  const GROUND_Y = 0;

  /* ---------------------------------------------------------------- */
  /* 🎨 PAINT VARIABLES (UI WILL CONTROL THESE LATER)                 */
  /* ---------------------------------------------------------------- */

  const COLOR_PILLARS = "#ffffff"; // UI-driven
  const COLOR_CANOPY_SIDES = "#facc15"; // UI-driven (yellow)
  const COLOR_CANOPY_TOP = "#ffffff"; // static
  const COLOR_BUILDING = "#ffffff"; // UI-driven
  const COLOR_BUILDING_STRIPE = "#2563eb"; // UI-driven (blue)

  /* ---------------------------------------------------------------- */
  /* 🧱 PLAZA                                                         */
  /* ---------------------------------------------------------------- */

  const PLAZA_WIDTH = 800;
  const PLAZA_DEPTH = 600;

  /* ---------------------------------------------------------------- */
  /* 🟦 SHARED CANOPY SETTINGS                                        */
  /* ---------------------------------------------------------------- */

  const CANOPY_DEPTH = 7;
  const CANOPY_THICKNESS = 1.5;
  const CANOPY_RADIUS = 0.8;
  const PILLAR_RADIUS = 0.35;

  /* ---------------------------------------------------------------- */
  /* 🏧 PAY STATION                                                   */
  /* ---------------------------------------------------------------- */

  const PAY_X = 40;
  const PAY_Z = -20;
  const PAY_HEIGHT = 5;
  const PAY_CANOPY_WIDTH = 10;
  const PAY_CANOPY_Y = PAY_HEIGHT + 1;
  const PAY_PILLAR_X = [-0.5, 4];

  /* ---------------------------------------------------------------- */
  /* 🚗 MAIN BUILDING                                                 */
  /* ---------------------------------------------------------------- */

  const WASH_X = 6;
  const WASH_Z = 8;
  const WASH_WIDTH = 40;
  const WASH_HEIGHT = 8;
  const WASH_DEPTH = 24;

  const STRIPE_HEIGHT = 1.5;
  const STRIPE_Y = WASH_HEIGHT - 1.5;

  const WASH_CANOPY_WIDTH = WASH_WIDTH - 6;
  const WASH_CANOPY_OFFSET_X = 2;

  /* ---------------------------------------------------------------- */
  /* 🧹 VACUUM AREA                                                   */
  /* ---------------------------------------------------------------- */

  const VACUUM_Z = -25;
  const VACUUM_CANOPY_WIDTH = 22;
  const VACUUM_CANOPY_HEIGHT = 8;
  const VACUUM_PILLAR_X = [-7, 2, 7];

  return (
    <>
      {/* ============================================================= */}
      {/* 🌍 GROUND                                                     */}
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
      {/* 🏧 PAY STATION                                                */}
      {/* ============================================================= */}
      <group position={[PAY_X, GROUND_Y, PAY_Z]}>
        {PAY_PILLAR_X.map((x, i) => (
          <mesh key={i} position={[x, PAY_HEIGHT / 2, 0]} castShadow>
            <cylinderGeometry
              args={[PILLAR_RADIUS, PILLAR_RADIUS, PAY_HEIGHT + 4, 24]}
            />
            <meshStandardMaterial color={COLOR_PILLARS} />
          </mesh>
        ))}

        <RoundedCanopy
          width={PAY_CANOPY_WIDTH}
          height={CANOPY_THICKNESS}
          depth={CANOPY_DEPTH}
          radius={CANOPY_RADIUS}
          position={[0, PAY_CANOPY_Y, 0]}
          sideColor={COLOR_CANOPY_SIDES}
          topBottomColor={COLOR_CANOPY_TOP}
        />
      </group>

      {/* ============================================================= */}
      {/* 🚗 MAIN BUILDING                                              */}
      {/* ============================================================= */}
      <group position={[WASH_X, GROUND_Y, WASH_Z]}>
        {/* Main Walls */}
        <mesh position={[0, WASH_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[WASH_WIDTH, WASH_HEIGHT + 8, WASH_DEPTH]} />
          <meshStandardMaterial color={COLOR_BUILDING} />
        </mesh>

        {/* Blue Stripe */}
        <mesh position={[0, STRIPE_Y, 0]} castShadow>
          <boxGeometry
            args={[WASH_WIDTH + 0.01, STRIPE_HEIGHT, WASH_DEPTH + 0.01]}
          />
          <meshStandardMaterial color={COLOR_BUILDING_STRIPE} />
        </mesh>

        {/* Canopy */}
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
          sideColor={COLOR_CANOPY_SIDES}
          topBottomColor={COLOR_CANOPY_TOP}
        />

        {/* Canopy Pillars (6) */}
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
            <meshStandardMaterial color={COLOR_PILLARS} />
          </mesh>
        ))}
      </group>

      {/* ============================================================= */}
      {/* 🧹 VACUUM AREA                                                */}
      {/* ============================================================= */}
      <group position={[0, GROUND_Y, VACUUM_Z]}>
        <RoundedCanopy
          width={VACUUM_CANOPY_WIDTH}
          height={CANOPY_THICKNESS}
          depth={CANOPY_DEPTH}
          radius={CANOPY_RADIUS}
          position={[0, VACUUM_CANOPY_HEIGHT, 0]}
          sideColor={COLOR_CANOPY_SIDES}
          topBottomColor={COLOR_CANOPY_TOP}
        />

        {VACUUM_PILLAR_X.map((x, i) => (
          <mesh key={i} position={[x, VACUUM_CANOPY_HEIGHT / 2, 0]} castShadow>
            <cylinderGeometry
              args={[PILLAR_RADIUS, PILLAR_RADIUS, VACUUM_CANOPY_HEIGHT, 24]}
            />
            <meshStandardMaterial color={COLOR_PILLARS} />
          </mesh>
        ))}
      </group>
    </>
  );
}
