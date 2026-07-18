import { useEffect, useMemo } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useControls } from "leva";

const SHOW_BUILDING_SIDE_LABELS = false;
const OOLTEWAH_COLOR_CONTROLS = {
  pillarColor: { value: "#000000", label: "Pillars" },
  canopySideColor: { value: "#ed2024", label: "Canopy Top + Side" },
  canopyTopColor: { value: "#000000", label: "Canopy Underside" },
  buildingWallsColor: { value: "#ed2024", label: "Walls" },
  buildingStripeColor: { value: "#000000", label: "Building Stripe" },
  buildingDoorColor: { value: "#000000", label: "Door" },
  roofColor: { value: "#000000", label: "Roof" },
  roofRidgeColor: { value: "#000000", label: "Ridges / Gutters" },
  windowColor: { value: "#2a2a2a", label: "Windows" },
  windowTrimColor: { value: "#000000", label: "Window Trim" },
  carwashTextColor: { value: "#000000", label: "CARWASH Text" },
};

const CHATTANOOGA_COLOR_CONTROLS = {
  buildingWallsColor: { value: "#ed2024", label: "Walls" },
  buildingDoorColor: { value: "#000000", label: "Doors + Front Stripe" },
  roofColor: { value: "#000000", label: "Main + Tent Roof" },
  roofRidgeColor: { value: "#000000", label: "Ridges / Gutters" },
  arcTrimColor: { value: "#000000", label: "Arc + Cavetto Trim" },
  windowColor: { value: "#2a2a2a", label: "Windows" },
  windowTrimColor: { value: "#000000", label: "Window Trim" },
  payCanopyRoofColor: { value: "#ed2024", label: "Pay Canopy Roof" },
  payCanopyPoleColor: { value: "#000000", label: "Pay Canopy Poles" },
  payTerminalColor: { value: "#ed2024", label: "Pay Terminals" },
};

/*
  Site orientation map:
  Side 1: front, facing -Z toward the initial camera
  Side 2: right, facing +X
  Side 3: back, facing +Z
  Side 4: left, facing -X

  Keep this map stable so later site-specific edits have a clear target.
*/

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

  shape.moveTo(-hw + radius, -hd);
  shape.lineTo(hw - radius, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  shape.lineTo(hw, hd - radius);
  shape.quadraticCurveTo(hw, hd, hw - radius, hd);
  shape.lineTo(-hw + radius, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  shape.lineTo(-hw, -hd + radius);
  shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  const sideGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  sideGeometry.rotateX(-Math.PI / 2);
  sideGeometry.translate(0, 0.01, 0);

  const bottomGeometry = new THREE.ShapeGeometry(shape);
  bottomGeometry.rotateX(-Math.PI / 2);
  bottomGeometry.translate(0, -height / 2, 0);

  return (
    <group position={position} castShadow receiveShadow>
      <mesh geometry={sideGeometry}>
        <meshStandardMaterial color={sideColor} roughness={0.45} />
      </mesh>
      <mesh geometry={bottomGeometry}>
        <meshStandardMaterial color={topBottomColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

function InnerWhitePlate({ width, depth, position, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.2, depth]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

function CanvasLabel({
  text,
  width,
  height,
  position,
  rotation = [0, 0, 0],
  background = "#0f172a",
  foreground = "#f8fafc",
  fontSize = 58,
  fontWeight = 700,
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const aspect = height / width;
    canvas.width = 1024;
    canvas.height = Math.round(canvas.width * aspect);

    const context = canvas.getContext("2d");
    const lines = text.split("\n");
    const lineHeight = fontSize * 1.18;
    const startY =
      canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.fillStyle = foreground;
    context.font = `${fontWeight} ${fontSize}px Inter, Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    const labelTexture = new THREE.CanvasTexture(canvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.anisotropy = 4;

    return labelTexture;
  }, [background, foreground, fontSize, fontWeight, height, text, width]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        transparent={!background}
      />
    </mesh>
  );
}

function GateDoor({ width, height, position, color }) {
  const slatCount = 8;

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.58} metalness={0.08} />
      </mesh>
      {Array.from({ length: slatCount }).map((_, index) => (
        <mesh
          key={index}
          position={[
            0,
            (height / (slatCount + 1)) * (index + 1),
            -0.09,
          ]}
        >
          <boxGeometry args={[width + 0.08, 0.045, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ServiceDoor({ width, height, position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.56} metalness={0.05} />
      </mesh>
      <mesh position={[width * 0.32, height * 0.53, -0.08]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.28} />
      </mesh>
    </group>
  );
}

function DoubleServiceDoor({
  width,
  height,
  position,
  rotation = [0, 0, 0],
  color,
}) {
  const gap = 0.08;
  const panelWidth = (width - gap) / 2;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0.025]} castShadow>
        <boxGeometry args={[width + 0.28, height + 0.28, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.52} metalness={0.06} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh
          key={`panel-${direction}`}
          position={[
            direction * (panelWidth / 2 + gap / 2),
            height / 2,
            -0.045,
          ]}
          castShadow
        >
          <boxGeometry args={[panelWidth, height, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.58} metalness={0.06} />
        </mesh>
      ))}
      <mesh position={[0, height / 2, -0.13]} castShadow>
        <boxGeometry args={[0.06, height - 0.2, 0.04]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.44} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh
          key={`handle-${direction}`}
          position={[direction * 0.18, height * 0.52, -0.16]}
          castShadow
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function SideCarDoor({ side, width, height, position, color }) {
  const rotationY = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <GateDoor width={width} height={height} position={[0, 0, 0]} color={color} />
    </group>
  );
}

function CavettoMoldingStrip({
  length,
  projection,
  drop,
  position,
  rotation = [0, 0, 0],
  color,
}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(projection, 0);
  shape.quadraticCurveTo(
    projection * 0.88,
    -drop * 0.2,
    projection * 0.64,
    -drop * 0.46,
  );
  shape.quadraticCurveTo(projection * 0.36, -drop * 0.76, 0, -drop);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 10,
  });

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.52}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function PillarCavettoCap({ centerX, centerZ, topY, width, depth, color }) {
  const projection = 0.28;
  const drop = 0.34;
  const capHeight = 0.14;
  const topLift = 0.08;
  const xLength = width + projection * 2;
  const zLength = depth + projection * 2;

  return (
    <group>
      <mesh
        position={[centerX, topY + capHeight / 2 + topLift, centerZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[xLength, capHeight, zLength]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <CavettoMoldingStrip
        length={zLength}
        projection={projection}
        drop={drop}
        position={[centerX + width / 2, topY + topLift, centerZ - zLength / 2]}
        color={color}
      />
      <CavettoMoldingStrip
        length={zLength}
        projection={projection}
        drop={drop}
        position={[centerX - width / 2, topY + topLift, centerZ + zLength / 2]}
        rotation={[0, Math.PI, 0]}
        color={color}
      />
      <CavettoMoldingStrip
        length={xLength}
        projection={projection}
        drop={drop}
        position={[centerX - xLength / 2, topY + topLift, centerZ - depth / 2]}
        rotation={[0, Math.PI / 2, 0]}
        color={color}
      />
      <CavettoMoldingStrip
        length={xLength}
        projection={projection}
        drop={drop}
        position={[centerX + xLength / 2, topY + topLift, centerZ + depth / 2]}
        rotation={[0, -Math.PI / 2, 0]}
        color={color}
      />
    </group>
  );
}

function WindowBank({
  panelCount,
  totalWidth,
  height,
  position,
  trimColor,
  windowColor = "#9ad7ee",
  grilleColor = trimColor,
}) {
  const gap = 0.18;
  const panelWidth = (totalWidth - gap * (panelCount - 1)) / panelCount;
  const grilleY = height * 0.85;

  return (
    <group position={position}>
      <mesh position={[0, height / 2, -0.035]}>
        <boxGeometry args={[totalWidth + 0.28, height + 0.28, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.4} />
      </mesh>
      {Array.from({ length: panelCount }).map((_, index) => {
        const x =
          -totalWidth / 2 +
          panelWidth / 2 +
          index * (panelWidth + gap);

        return (
          <group key={index}>
            <mesh position={[x, height / 2, -0.1]} castShadow>
              <boxGeometry args={[panelWidth, height, 0.08]} />
              <meshPhysicalMaterial
                color={windowColor}
                roughness={0.16}
                metalness={0.06}
                transmission={0.12}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[x, grilleY, -0.15]} castShadow>
              <boxGeometry args={[panelWidth + 0.02, 0.08, 0.08]} />
              <meshStandardMaterial color={grilleColor} roughness={0.38} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GableEnd({ width, rise, position, rotation = [0, 0, 0], color }) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.lineTo(-width / 2, 0);

  const geometry = new THREE.ShapeGeometry(shape);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.56}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GabledRoof({
  width,
  depth,
  wallHeight,
  rise,
  roofColor,
  ridgeColor,
  ridgeAxis = "z",
  ribCount = 12,
  overhang = 1.3,
  showFrontEave = true,
  showBackEave = true,
}) {
  const ridgeLength =
    ridgeAxis === "x" ? width + overhang * 2 : depth + overhang * 2;
  const run = (ridgeAxis === "x" ? depth : width) / 2 + overhang;
  const slope = Math.atan2(rise, run);
  const panelLength = Math.hypot(run, rise);
  const ribPositions = Array.from({ length: ribCount }, (_, index) => {
    if (ribCount === 1) {
      return 0;
    }

    return -0.46 + (0.92 * index) / (ribCount - 1);
  });

  if (ridgeAxis === "x") {
    const roofRib = (side, fraction) => {
      const direction = side === "front" ? -1 : 1;
      const x = ridgeLength * fraction;

      return (
        <mesh
          key={`${side}-${fraction}`}
          position={[x, wallHeight + rise / 2 + 0.2, direction * run / 2]}
          rotation={[direction === -1 ? -slope : slope, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.16, 0.2, panelLength + 0.25]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.32} />
        </mesh>
      );
    };

    return (
      <group>
        <mesh
          position={[0, wallHeight + rise / 2, -run / 2]}
          rotation={[-slope, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[ridgeLength, 0.36, panelLength]} />
          <meshStandardMaterial color={roofColor} roughness={0.4} />
        </mesh>
        <mesh
          position={[0, wallHeight + rise / 2, run / 2]}
          rotation={[slope, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[ridgeLength, 0.36, panelLength]} />
          <meshStandardMaterial color={roofColor} roughness={0.4} />
        </mesh>
        {ribPositions.map((fraction) => roofRib("front", fraction))}
        {ribPositions.map((fraction) => roofRib("back", fraction))}
        <mesh
          position={[0, wallHeight + rise + 0.13, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.2, 0.2, ridgeLength + 0.3, 16]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.28} />
        </mesh>
        {showFrontEave ? (
          <mesh position={[0, wallHeight + 0.1, -run]} castShadow>
            <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
            <meshStandardMaterial color={ridgeColor} roughness={0.35} />
          </mesh>
        ) : null}
        {showBackEave ? (
          <mesh position={[0, wallHeight + 0.1, run]} castShadow>
            <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
            <meshStandardMaterial color={ridgeColor} roughness={0.35} />
          </mesh>
        ) : null}
      </group>
    );
  }

  const roofRib = (side, fraction) => {
    const direction = side === "left" ? -1 : 1;
    const z = ridgeLength * fraction;

    return (
      <mesh
        key={`${side}-${fraction}`}
        position={[direction * run / 2, wallHeight + rise / 2 + 0.2, z]}
        rotation={[0, 0, direction === -1 ? slope : -slope]}
        castShadow
      >
        <boxGeometry args={[panelLength + 0.25, 0.2, 0.16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.32} />
      </mesh>
    );
  };

  return (
    <group>
      <mesh
        position={[-run / 2, wallHeight + rise / 2, 0]}
        rotation={[0, 0, slope]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[panelLength, 0.36, ridgeLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      <mesh
        position={[run / 2, wallHeight + rise / 2, 0]}
        rotation={[0, 0, -slope]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[panelLength, 0.36, ridgeLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      {ribPositions.map((fraction) => roofRib("left", fraction))}
      {ribPositions.map((fraction) => roofRib("right", fraction))}
      <mesh
        position={[0, wallHeight + rise + 0.13, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, ridgeLength + 0.3, 16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.28} />
      </mesh>
      {showFrontEave ? (
        <mesh position={[0, wallHeight + 0.1, -ridgeLength / 2]} castShadow>
          <boxGeometry args={[width + overhang * 2.1, 0.32, 0.3]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.35} />
        </mesh>
      ) : null}
      {showBackEave ? (
        <mesh position={[0, wallHeight + 0.1, ridgeLength / 2]} castShadow>
          <boxGeometry args={[width + overhang * 2.1, 0.32, 0.3]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.35} />
        </mesh>
      ) : null}
    </group>
  );
}

function FrontGableRoof({
  width,
  depth,
  wallHeight,
  rise,
  position,
  roofColor,
  ridgeColor,
  gableColor = roofColor,
  ribCount = 12,
  overhang,
  showFrontEave,
  showBackEave,
}) {
  return (
    <group position={position}>
      <GableEnd
        width={width}
        rise={rise}
        position={[0, wallHeight, -depth / 2 - 0.12]}
        color={gableColor}
      />
      <GableEnd
        width={width}
        rise={rise}
        position={[0, wallHeight, depth / 2 + 0.12]}
        color={gableColor}
      />
      <GabledRoof
        width={width}
        depth={depth}
        wallHeight={wallHeight}
        rise={rise}
        roofColor={roofColor}
        ridgeColor={ridgeColor}
        ridgeAxis="z"
        ribCount={ribCount}
        overhang={overhang}
        showFrontEave={showFrontEave}
        showBackEave={showBackEave}
      />
    </group>
  );
}

function SiteBillboard({ label, position }) {
  const width = 5.8;
  const height = 1.25;
  const depth = 0.28;

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#111827" roughness={0.42} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.025]}>
        <boxGeometry args={[width - 0.36, height - 0.28, 0.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>
      <CanvasLabel
        text={label}
        position={[0, height / 2, depth / 2 + 0.06]}
        width={width - 0.74}
        height={height - 0.56}
        background="#f8fafc"
        foreground="#111827"
        fontSize={126}
      />
    </group>
  );
}

function SideDebugLabels({ siteName, width, depth, labelHeight }) {
  if (!SHOW_BUILDING_SIDE_LABELS) {
    return null;
  }

  const labels = [
    {
      id: "Side 1",
      face: "Front",
      position: [0, labelHeight, -depth / 2 - 2.2],
    },
    {
      id: "Side 2",
      face: "Right",
      position: [width / 2 + 2.2, labelHeight, 0],
    },
    {
      id: "Side 3",
      face: "Back",
      position: [0, labelHeight, depth / 2 + 2.2],
    },
    {
      id: "Side 4",
      face: "Left",
      position: [-width / 2 - 2.2, labelHeight, 0],
    },
  ];

  return labels.map(({ id, face, position }) => (
    <Billboard key={`${siteName}-${id}`} position={position}>
      <CanvasLabel
        text={`${siteName}\n${id} (${face})`}
        position={[0, 0, 0.02]}
        width={5.7}
        height={1.55}
        background="#0f172a"
        foreground="#f8fafc"
        fontSize={74}
        fontWeight={650}
      />
    </Billboard>
  ));
}

function PayStation({
  position,
  pillarColor,
  canopySideColor,
  canopyTopColor,
  canopyWidth = 10,
  canopyOffsetX = 0,
  pillarX = [-3.8, 3.8],
  supportHeight = 4.35,
}) {
  const canopyDepth = 7;
  const canopyThickness = 1.5;
  const canopyY = supportHeight + 0.65;
  const pillarRadius = 0.32;

  return (
    <group position={position}>
      {pillarX.map((x) => (
        <mesh key={x} position={[x, canopyY / 2, 0]} castShadow>
          <cylinderGeometry args={[pillarRadius, pillarRadius, canopyY, 24]} />
          <meshStandardMaterial color={pillarColor} roughness={0.38} />
        </mesh>
      ))}
      <RoundedCanopy
        width={canopyWidth}
        height={canopyThickness}
        depth={canopyDepth}
        radius={0.8}
        position={[canopyOffsetX, canopyY, 0]}
        sideColor={canopySideColor}
        topBottomColor={canopyTopColor}
      />
      <InnerWhitePlate
        width={canopyWidth * 0.9}
        depth={canopyDepth * 0.86}
        position={[canopyOffsetX, canopyY - canopyThickness / 2 + 0.7, 0]}
        color={canopyTopColor}
      />
    </group>
  );
}

function VacuumCanopy({
  position,
  pillarColor,
  canopySideColor,
  canopyTopColor,
  canopyWidth = 22,
  canopyBottomWidth,
  pillarX = [-7.5, 0, 7.5],
  canopyHeight = 6.25,
}) {
  const canopyDepth = 7;
  const canopyThickness = 1.35;
  const pillarRadius = 0.3;

  return (
    <group position={position}>
      <RoundedCanopy
        width={canopyWidth}
        height={canopyThickness}
        depth={canopyDepth}
        radius={0.8}
        position={[0, canopyHeight, 0]}
        sideColor={canopySideColor}
        topBottomColor={canopyTopColor}
      />
      <InnerWhitePlate
        width={canopyBottomWidth ?? canopyWidth * 0.9}
        depth={canopyDepth * 0.86}
        position={[0, canopyHeight - canopyThickness / 2 + 0.62, 0]}
        color={canopyTopColor}
      />
      {pillarX.map((x) => (
        <mesh key={x} position={[x, canopyHeight / 2, 0]} castShadow>
          <cylinderGeometry
            args={[pillarRadius, pillarRadius, canopyHeight, 24]}
          />
          <meshStandardMaterial color={pillarColor} roughness={0.36} />
        </mesh>
      ))}
    </group>
  );
}

function BuildingStripe({
  width,
  depth,
  wallHeight,
  leftExtensionWidth = 0,
  leftExtensionFrontBump = 0,
  color,
}) {
  const stripeHeight = 2.2;
  const stripeY = wallHeight - 4.35;
  const faceThickness = 0.14;
  const faceOffset = 0.1;
  const leftExtensionDepth = depth + leftExtensionFrontBump;
  const leftExtensionCenterX = -width / 2 - leftExtensionWidth / 2;
  const leftExtensionCenterZ = -leftExtensionFrontBump / 2;
  const faces = [
    {
      key: "main-front",
      position: [0, stripeY, -depth / 2 - faceOffset],
      args: [width + faceThickness, stripeHeight, faceThickness],
    },
    {
      key: "main-back",
      position: [0, stripeY, depth / 2 + faceOffset],
      args: [width + faceThickness, stripeHeight, faceThickness],
    },
    {
      key: "main-right",
      position: [width / 2 + faceOffset, stripeY, 0],
      args: [faceThickness, stripeHeight, depth + faceThickness],
    },
  ];

  if (leftExtensionWidth > 0) {
    faces.push(
      {
        key: "extension-front",
        position: [
          leftExtensionCenterX,
          stripeY,
          -depth / 2 - leftExtensionFrontBump - faceOffset,
        ],
        args: [
          leftExtensionWidth + faceThickness,
          stripeHeight,
          faceThickness,
        ],
      },
      {
        key: "extension-back",
        position: [leftExtensionCenterX, stripeY, depth / 2 + faceOffset],
        args: [
          leftExtensionWidth + faceThickness,
          stripeHeight,
          faceThickness,
        ],
      },
      {
        key: "extension-left",
        position: [
          -width / 2 - leftExtensionWidth - faceOffset,
          stripeY,
          leftExtensionCenterZ,
        ],
        args: [
          faceThickness,
          stripeHeight,
          leftExtensionDepth + faceThickness,
        ],
      },
    );

    if (leftExtensionFrontBump > 0) {
      faces.push({
        key: "extension-right-return",
        position: [
          -width / 2 + faceOffset,
          stripeY,
          -depth / 2 - leftExtensionFrontBump / 2,
        ],
        args: [
          faceThickness,
          stripeHeight,
          leftExtensionFrontBump + faceThickness,
        ],
      });
    }
  } else {
    faces.push({
      key: "main-left",
      position: [-width / 2 - faceOffset, stripeY, 0],
      args: [faceThickness, stripeHeight, depth + faceThickness],
    });
  }

  return (
    <group>
      {faces.map((face) => (
        <mesh
          key={face.key}
          position={face.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={face.args} />
          <meshStandardMaterial color={color} roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

function PlainWindow({
  width,
  height,
  position,
  rotation = [0, 0, 0],
  trimColor,
  windowColor,
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, -0.035]} castShadow>
        <boxGeometry args={[width + 0.24, height + 0.24, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.42} />
      </mesh>
      <mesh position={[0, height / 2, -0.1]} castShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshPhysicalMaterial
          color={windowColor}
          roughness={0.2}
          metalness={0.05}
          transparent
          opacity={0.78}
        />
      </mesh>
    </group>
  );
}

function ChattanoogaRoofEnd({
  x,
  depth,
  wallHeight,
  frontRise,
  backRise,
  frontRidgeZ,
  backRidgeZ,
  frontOverhang,
  backOverhang,
  color,
}) {
  const shape = new THREE.Shape();
  shape.moveTo(-depth / 2 - frontOverhang, 0);
  shape.lineTo(frontRidgeZ, frontRise);
  shape.lineTo(backRidgeZ, backRise);
  shape.lineTo(depth / 2 + backOverhang, 0);
  shape.lineTo(-depth / 2 - frontOverhang, 0);

  const geometry = new THREE.ShapeGeometry(shape);

  return (
    <mesh
      geometry={geometry}
      position={[x, wallHeight, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.56}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ChattanoogaOffsetRoof({
  width,
  depth,
  wallHeight,
  frontRise,
  backRise,
  roofColor,
  ridgeColor,
  wallColor,
  frontOverhang = 0.55,
  backOverhang = 1.25,
  ribCount = 36,
  showLeftEnd = true,
  ridgeGapLeftInset = 0,
  ridgeGapRightInset = 0,
}) {
  const ridgePlateDepth = 0.18;
  const frontRidgeZ = 0;
  const backRidgeZ = 0;
  const frontEaveZ = -depth / 2 - frontOverhang;
  const backEaveZ = depth / 2 + backOverhang;
  const frontRun = frontRidgeZ - frontEaveZ;
  const backRun = backEaveZ - backRidgeZ;
  const frontSlope = Math.atan2(frontRise, frontRun);
  const backSlope = Math.atan2(backRise, backRun);
  const frontPanelLength = Math.hypot(frontRun, frontRise);
  const backPanelLength = Math.hypot(backRun, backRise);
  const ridgeLength = width + Math.max(frontOverhang, backOverhang) * 2;
  const ridgeGapHeight = Math.max(0.16, backRise - frontRise);
  const ridgeGapLength = Math.max(
    0.1,
    ridgeLength - ridgeGapLeftInset - ridgeGapRightInset,
  );
  const ridgeGapX = (ridgeGapLeftInset - ridgeGapRightInset) / 2;
  const ribPositions = Array.from({ length: ribCount }, (_, index) => {
    if (ribCount === 1) {
      return 0;
    }

    return -0.46 + (0.92 * index) / (ribCount - 1);
  });
  const panelRib = (side, fraction) => {
    const isFront = side === "front";
    const run = isFront ? frontRun : backRun;
    const rise = isFront ? frontRise : backRise;
    const slope = isFront ? frontSlope : backSlope;
    const eaveZ = isFront ? frontEaveZ : backEaveZ;
    const ridgeZ = isFront ? frontRidgeZ : backRidgeZ;
    const x = ridgeLength * fraction;

    return (
      <mesh
        key={`${side}-${fraction}`}
        position={[
          x,
          wallHeight + rise / 2 + 0.2,
          (eaveZ + ridgeZ) / 2,
        ]}
        rotation={[isFront ? -slope : slope, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.15, 0.2, Math.hypot(run, rise) + 0.18]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.32} />
      </mesh>
    );
  };

  return (
    <group>
      {showLeftEnd ? (
        <ChattanoogaRoofEnd
          x={-width / 2 - 0.08}
          depth={depth}
          wallHeight={wallHeight}
          frontRise={frontRise}
          backRise={backRise}
          frontRidgeZ={frontRidgeZ}
          backRidgeZ={backRidgeZ}
          frontOverhang={frontOverhang}
          backOverhang={backOverhang}
          color={wallColor}
        />
      ) : null}
      <mesh
        position={[0, wallHeight + frontRise / 2, (frontEaveZ + frontRidgeZ) / 2]}
        rotation={[-frontSlope, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[ridgeLength, 0.36, frontPanelLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      <mesh
        position={[0, wallHeight + backRise / 2, (backEaveZ + backRidgeZ) / 2]}
        rotation={[backSlope, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[ridgeLength, 0.36, backPanelLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      <mesh
        position={[
          ridgeGapX,
          wallHeight + frontRise + ridgeGapHeight / 2,
          frontRidgeZ,
        ]}
        castShadow
      >
        <boxGeometry args={[ridgeGapLength, ridgeGapHeight, ridgePlateDepth]} />
        <meshStandardMaterial color={wallColor} roughness={0.5} />
      </mesh>
      {ribPositions.map((fraction) => panelRib("front", fraction))}
      {ribPositions.map((fraction) => panelRib("back", fraction))}
      <mesh
        position={[0, wallHeight + frontRise + 0.13, frontRidgeZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, ridgeLength + 0.3, 16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.28} />
      </mesh>
      <mesh
        position={[0, wallHeight + backRise + 0.13, backRidgeZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, ridgeLength + 0.3, 16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.28} />
      </mesh>
      <mesh position={[0, wallHeight + 0.1, frontEaveZ]} castShadow>
        <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
      <mesh position={[0, wallHeight + 0.1, backEaveZ]} castShadow>
        <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RightSideRearRoofInfill({
  x,
  wallHeight,
  startZ,
  endZ,
  roofHeightAtStart,
  color,
}) {
  const shape = new THREE.Shape();
  shape.moveTo(startZ, wallHeight);
  shape.lineTo(startZ, roofHeightAtStart);
  shape.lineTo(endZ, wallHeight);
  shape.lineTo(startZ, wallHeight);

  const geometry = new THREE.ShapeGeometry(shape);

  return (
    <mesh
      geometry={geometry}
      position={[x, 0, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.54}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function LeftRoofTriangleInfill({ x, points, color }) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([z, y]) => {
    shape.lineTo(z, y);
  });
  shape.lineTo(points[0][0], points[0][1]);

  const geometry = new THREE.ShapeGeometry(shape);

  return (
    <mesh
      geometry={geometry}
      position={[x, 0, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.54}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ChattanoogaRearRoofExtension({
  xCenter,
  width,
  roofCenterZ,
  roofDepth,
  wallHeight,
  frontRise,
  backRise,
  backOverhang,
  roofColor,
  ridgeColor,
  wallColor,
  ribCount = 6,
  ridgeGapLeftInset = 0,
  ridgeGapRightInset = 0,
}) {
  const ridgePlateDepth = 0.18;
  const ridgeZ = roofCenterZ;
  const backEaveZ = roofCenterZ + roofDepth / 2 + backOverhang;
  const backRun = backEaveZ - ridgeZ;
  const backSlope = Math.atan2(backRise, backRun);
  const backPanelLength = Math.hypot(backRun, backRise);
  const ridgeGapHeight = Math.max(0.16, backRise - frontRise);
  const ridgeGapLength = Math.max(
    0.1,
    width - ridgeGapLeftInset - ridgeGapRightInset,
  );
  const ridgeGapX = xCenter + (ridgeGapLeftInset - ridgeGapRightInset) / 2;
  const ribPositions = Array.from({ length: ribCount }, (_, index) => {
    if (ribCount === 1) {
      return 0;
    }

    return -0.44 + (0.88 * index) / (ribCount - 1);
  });

  return (
    <group>
      <mesh
        position={[xCenter, wallHeight + backRise / 2, (backEaveZ + ridgeZ) / 2]}
        rotation={[backSlope, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, 0.36, backPanelLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      <mesh
        position={[
          ridgeGapX,
          wallHeight + frontRise + ridgeGapHeight / 2,
          ridgeZ,
        ]}
        castShadow
      >
        <boxGeometry args={[ridgeGapLength, ridgeGapHeight, ridgePlateDepth]} />
        <meshStandardMaterial color={wallColor} roughness={0.5} />
      </mesh>
      {ribPositions.map((fraction) => (
        <mesh
          key={fraction}
          position={[
            xCenter + width * fraction,
            wallHeight + backRise / 2 + 0.2,
            (backEaveZ + ridgeZ) / 2,
          ]}
          rotation={[backSlope, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.15, 0.2, backPanelLength + 0.18]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.32} />
        </mesh>
      ))}
      <mesh
        position={[xCenter, wallHeight + backRise + 0.13, ridgeZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, width + 0.3, 16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.28} />
      </mesh>
      <mesh position={[xCenter, wallHeight + 0.1, backEaveZ]} castShadow>
        <boxGeometry args={[width, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

function ChattanoogaFrontRoofExtension({
  xCenter,
  width,
  roofCenterZ,
  roofDepth,
  wallHeight,
  frontRise,
  frontOverhang,
  roofColor,
  ridgeColor,
  ribCount = 6,
}) {
  const ridgeZ = roofCenterZ;
  const frontEaveZ = roofCenterZ - roofDepth / 2 - frontOverhang;
  const frontRun = ridgeZ - frontEaveZ;
  const frontSlope = Math.atan2(frontRise, frontRun);
  const frontPanelLength = Math.hypot(frontRun, frontRise);
  const ribPositions = Array.from({ length: ribCount }, (_, index) => {
    if (ribCount === 1) {
      return 0;
    }

    return -0.44 + (0.88 * index) / (ribCount - 1);
  });

  return (
    <group>
      <mesh
        position={[
          xCenter,
          wallHeight + frontRise / 2,
          (frontEaveZ + ridgeZ) / 2,
        ]}
        rotation={[-frontSlope, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, 0.36, frontPanelLength]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      {ribPositions.map((fraction) => (
        <mesh
          key={fraction}
          position={[
            xCenter + width * fraction,
            wallHeight + frontRise / 2 + 0.2,
            (frontEaveZ + ridgeZ) / 2,
          ]}
          rotation={[-frontSlope, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.15, 0.2, frontPanelLength + 0.18]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.32} />
        </mesh>
      ))}
      <mesh
        position={[xCenter, wallHeight + frontRise + 0.13, ridgeZ]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, width + 0.3, 16]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.28} />
      </mesh>
      <mesh position={[xCenter, wallHeight + 0.1, frontEaveZ]} castShadow>
        <boxGeometry args={[width, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RightArcCavettoBand({
  span,
  springY,
  apexY,
  shoulderX,
  shoulderY,
  depth,
  position,
  color,
}) {
  const lift = 0.12;
  const drop = 0.44;
  const shape = new THREE.Shape();

  shape.moveTo(-span / 2, springY + lift);
  shape.quadraticCurveTo(-shoulderX, shoulderY + lift, 0, apexY + lift);
  shape.quadraticCurveTo(shoulderX, shoulderY + lift, span / 2, springY + lift);
  shape.lineTo(span / 2, springY - drop);
  shape.quadraticCurveTo(shoulderX, shoulderY - drop, 0, apexY - drop);
  shape.quadraticCurveTo(-shoulderX, shoulderY - drop, -span / 2, springY - drop);
  shape.lineTo(-span / 2, springY + lift);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 16,
  });

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={[0, Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.42}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RightArcOvalTrim({ width, height, thickness, depth, position, color }) {
  const outer = new THREE.Shape();
  const inner = new THREE.Path();
  const innerWidth = Math.max(0.1, width - thickness * 2);
  const innerHeight = Math.max(0.1, height - thickness * 2);

  outer.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false);
  inner.absellipse(
    0,
    0,
    innerWidth / 2,
    innerHeight / 2,
    0,
    Math.PI * 2,
    true,
  );
  outer.holes.push(inner);

  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: false,
    curveSegments: 32,
  });

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={[0, Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.42}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RightArcFacade({
  rightX,
  wallHeight,
  span,
  color,
  trimColor = color,
  columnDepth = 3.15,
}) {
  const springY = wallHeight + 3.15;
  const archRise = 3.8;
  const apexY = springY + archRise;
  const archShoulderX = span * 0.18;
  const archShoulderY = springY + archRise * 0.97;
  const columnHeight = wallHeight + 3.2;
  const facadeLeftReach = 1.3;
  const facadeFaceX = rightX - 0.14;
  const archTrimThickness = 0.44;
  const arcOvalCenterY = wallHeight + (apexY - wallHeight) * 0.54;
  const facadeWallWidth = 0.58 + facadeLeftReach;
  const facadeWallRightX = rightX + 0.15;
  const trimDepth = facadeLeftReach + 0.34;
  const columnBaseWidth = 1.28;
  const columnWidth = columnBaseWidth + facadeLeftReach;
  const columnRightX = rightX + 0.2 + columnBaseWidth / 2;
  const columnCenterX = columnRightX - columnWidth / 2;
  const shape = new THREE.Shape();

  shape.moveTo(-span / 2, wallHeight);
  shape.lineTo(-span / 2, springY);
  shape.quadraticCurveTo(-archShoulderX, archShoulderY, 0, apexY);
  shape.quadraticCurveTo(
    archShoulderX,
    archShoulderY,
    span / 2,
    springY,
  );
  shape.lineTo(span / 2, wallHeight);
  shape.lineTo(-span / 2, wallHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: facadeLeftReach,
    bevelEnabled: false,
  });

  return (
    <group>
      <mesh
        position={[
          facadeWallRightX - facadeWallWidth / 2,
          wallHeight / 2,
          0,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[facadeWallWidth, wallHeight, span + columnDepth]} />
        <meshStandardMaterial color={color} roughness={0.54} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[facadeFaceX - facadeLeftReach, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.54}
          side={THREE.DoubleSide}
        />
      </mesh>
      <RightArcCavettoBand
        span={span}
        springY={springY}
        apexY={apexY}
        shoulderX={archShoulderX}
        shoulderY={archShoulderY}
        depth={trimDepth}
        position={[facadeFaceX - facadeLeftReach - 0.04, 0, 0]}
        color={trimColor}
      />
      <RightArcOvalTrim
        width={span * 0.31875}
        height={3.1875}
        thickness={archTrimThickness}
        depth={0.3}
        position={[facadeFaceX + 0.08, arcOvalCenterY, 0]}
        color={trimColor}
      />
      {[-1, 1].map((direction) => (
        <group key={direction}>
          <mesh
            position={[
              columnCenterX,
              columnHeight / 2,
              direction * (span / 2),
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[columnWidth, columnHeight, columnDepth]} />
            <meshStandardMaterial color={color} roughness={0.54} />
          </mesh>
          <PillarCavettoCap
            centerX={columnCenterX}
            centerZ={direction * (span / 2)}
            topY={columnHeight}
            width={columnWidth}
            depth={columnDepth}
            color={trimColor}
          />
        </group>
      ))}
    </group>
  );
}

function LeftSlantedDoorCanopy({
  wallX,
  centerZ,
  doorWidth,
  canopyWidth,
  attachY,
  projection = 9.2,
  drop = 1.25,
  roofThickness = 0.34,
  color,
  poleColor,
}) {
  const resolvedCanopyWidth = canopyWidth ?? doorWidth + 1.25;
  const slopeLength = Math.hypot(projection, drop);
  const slope = Math.atan2(drop, projection);
  const lowEdgeY = attachY - drop;
  const poleHeight = Math.max(0.1, lowEdgeY - roofThickness / 2);
  const poleX = wallX - projection + 0.18;
  const poleRadius = 0.375;
  const poleZOffset = resolvedCanopyWidth / 2 - 0.52;
  const sideShape = new THREE.Shape();

  sideShape.moveTo(0, 0);
  sideShape.lineTo(0, -drop);
  sideShape.lineTo(-projection, -drop);
  sideShape.lineTo(0, 0);

  const sideGeometry = new THREE.ShapeGeometry(sideShape);

  return (
    <group>
      <mesh
        position={[wallX - projection / 2, attachY - drop / 2, centerZ]}
        rotation={[0, 0, slope]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[slopeLength, roofThickness, resolvedCanopyWidth]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh
          key={direction}
          position={[poleX, poleHeight / 2, centerZ + direction * poleZOffset]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[poleRadius, poleRadius, poleHeight, 24]} />
          <meshStandardMaterial color={poleColor} roughness={0.38} />
        </mesh>
      ))}
      {[-1, 1].map((direction) => (
        <mesh
          key={`side-fill-${direction}`}
          geometry={sideGeometry}
          position={[
            wallX,
            attachY,
            centerZ + direction * (resolvedCanopyWidth / 2),
          ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={color}
            roughness={0.44}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function CantileverPayCanopy({
  position,
  rotation = [0, 0, 0],
  width = 4.2,
  length = 4.3,
  roofY = 4.25,
  roofThickness = 0.32,
  curveRise = 0.55,
  supportSide = 1,
  roofColor,
  poleColor,
  terminalColor = roofColor,
}) {
  const halfWidth = width / 2;
  const halfLength = length / 2;
  const poleRadius = 0.18;
  const supportX = supportSide * (halfWidth - 0.42);
  const poleHeight = roofY - roofThickness * 0.75;
  const poleZOffset = halfLength - 0.7;
  const terminalHeight = 1.95;
  const terminalDepth = 0.74;
  const terminalWidth = 0.62;
  const terminalX = supportX - supportSide * 0.08;
  const screenX = terminalX - supportSide * (terminalDepth / 2 + 0.03);
  const roofShape = new THREE.Shape();

  roofShape.moveTo(-halfWidth, 0);
  roofShape.quadraticCurveTo(0, curveRise, halfWidth, 0);
  roofShape.lineTo(halfWidth, -roofThickness);
  roofShape.quadraticCurveTo(
    0,
    curveRise - roofThickness * 0.72,
    -halfWidth,
    -roofThickness,
  );
  roofShape.lineTo(-halfWidth, 0);

  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 18,
  });
  roofGeometry.translate(0, 0, -halfLength);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={roofGeometry}
        position={[0, roofY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={roofColor} roughness={0.43} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh
          key={direction}
          position={[
            supportX,
            poleHeight / 2,
            direction * poleZOffset,
          ]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[poleRadius, poleRadius, poleHeight, 24]} />
          <meshStandardMaterial color={poleColor} roughness={0.36} />
        </mesh>
      ))}
      <group position={[terminalX, 0, 0]}>
        <mesh
          position={[0, terminalHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[terminalDepth, terminalHeight, terminalWidth]} />
          <meshStandardMaterial color={terminalColor} roughness={0.48} />
        </mesh>
        <mesh
          position={[
            screenX - terminalX,
            terminalHeight * 0.68,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[0.06, 0.58, 0.34]} />
          <meshStandardMaterial
            color="#111827"
            emissive="#1d4ed8"
            emissiveIntensity={0.2}
            roughness={0.22}
          />
        </mesh>
        <mesh
          position={[
            screenX - terminalX,
            terminalHeight * 0.34,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[0.07, 0.22, 0.28]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function ChattanoogaPayCanopies({
  position,
  rotation = [0, 0, 0],
  canopyLength,
  roofY,
  supportSide = 1,
  roofColor,
  poleColor,
  terminalColor,
}) {
  const laneOffset = 2.75;

  return (
    <group position={position} rotation={rotation}>
      {[-laneOffset, laneOffset].map((offset) => (
        <CantileverPayCanopy
          key={offset}
          position={[offset, 0, 0]}
          length={canopyLength}
          roofY={roofY}
          supportSide={supportSide}
          roofColor={roofColor}
          poleColor={poleColor}
          terminalColor={terminalColor}
        />
      ))}
    </group>
  );
}

function ChattanoogaBuilding({ colors }) {
  const width = 34;
  const archSpan = 20.2;
  const archColumnDepth = 3.15;
  const mainFrontZ = -archSpan / 2 - archColumnDepth / 2 + 0.45;
  const mainBackZ = 15;
  const depth = mainBackZ - mainFrontZ;
  const bodyCenterZ = (mainFrontZ + mainBackZ) / 2;
  const wallHeight = 6.55;
  const leftExtensionWidth = 12;
  const leftExtensionFrontBump = 4.45;
  const roofRightClearance = 2.5;
  const frontRoofRise = 4.85;
  const rearRoofRise = 5.85;
  const rearRoofOverhang = 1.25;
  const leftCascadeStepWidth = 3.25;
  const leftTriangleInfillInset = 0.05;
  const roofWidth = width + leftExtensionWidth - roofRightClearance;
  const roofDepth = depth;
  const roofCenterX = -leftExtensionWidth / 2 - roofRightClearance / 2;
  const roofCenterZ = bodyCenterZ;
  const roofFrontEaveZ = mainFrontZ - 0.45;
  const roofRightEdgeX =
    roofCenterX + roofWidth / 2 + Math.max(0.45, rearRoofOverhang);
  const rearRoofEaveLocalZ = roofDepth / 2 + rearRoofOverhang;
  const rearRoofEaveZ = roofCenterZ + rearRoofEaveLocalZ;
  const leftExtensionLeftX = -width / 2 - leftExtensionWidth;
  const leftFrontStepLeftX = leftExtensionLeftX - leftCascadeStepWidth;
  const leftRearStepLeftX = leftFrontStepLeftX - leftCascadeStepWidth;
  const leftFrontStepCenterX = (leftFrontStepLeftX + leftExtensionLeftX) / 2;
  const leftRearStepCenterX = (leftRearStepLeftX + leftExtensionLeftX) / 2;
  const leftRearVisibleFrontCenterX =
    (leftRearStepLeftX + leftFrontStepLeftX) / 2;
  const leftFrontStepDepth = roofCenterZ - mainFrontZ;
  const leftFrontStepCenterZ = (mainFrontZ + roofCenterZ) / 2;
  const leftRearStepDepth = mainBackZ - roofCenterZ;
  const leftRearStepCenterZ = (roofCenterZ + mainBackZ) / 2;
  const leftRoofExtensionOverhang = 0.65;
  const leftFrontRoofExtensionWidth =
    leftCascadeStepWidth + leftRoofExtensionOverhang;
  const leftFrontRoofExtensionCenterX =
    leftFrontStepCenterX - leftRoofExtensionOverhang / 4;
  const leftRearRoofWidth = leftExtensionLeftX - leftRearStepLeftX + 0.65;
  const leftRearRoofCenterX =
    (leftRearStepLeftX + leftExtensionLeftX) / 2 - 0.18;
  const leftRearUpperFillZ = roofCenterZ - 0.08;
  const leftExtensionCenterX = -width / 2 - leftExtensionWidth / 2;
  const leftExtensionFrontFaceZ = mainFrontZ - leftExtensionFrontBump;
  const leftExtensionCenterZ = (leftExtensionFrontFaceZ + mainBackZ) / 2;
  const leftExtensionDepth = mainBackZ - leftExtensionFrontFaceZ;
  const leftExtensionFrontZ = leftExtensionFrontFaceZ - 0.04;
  const leftExtensionReturnZ = (leftExtensionFrontFaceZ + mainFrontZ) / 2;
  const leftFacingRotation = [0, Math.PI / 2, 0];
  const leftWindowSurfaceX = leftExtensionLeftX - 0.04;
  const leftSmallDoorSurfaceX = leftFrontStepLeftX - 0.06;
  const leftLargeDoorSurfaceX = leftRearStepLeftX - 0.08;
  const leftProtrusionSideWindowZ = leftExtensionReturnZ;
  const leftFrontStepDoorZ = roofCenterZ - 3.15;
  const leftRearLargeDoorZ = leftRearStepCenterZ;
  const payCanopyPairZ = leftExtensionFrontFaceZ - 6.4;
  const standardWindowBaseY = 2.25;
  const standardWindowHeight = 2.65;
  const standardWindowTopY = standardWindowBaseY + standardWindowHeight;
  const leftRearCanopyWallX = leftRearStepLeftX - 0.05;
  const leftRearCanopyAttachY = wallHeight + 0.42;
  const leftRearCanopyProjection = 9.2;
  const leftRearCanopyDrop = 1.25;
  const leftRearCanopyLowEdgeY = leftRearCanopyAttachY - leftRearCanopyDrop;
  const leftRearCanopyPoleX =
    leftRearCanopyWallX - leftRearCanopyProjection + 0.18;
  const leftRearCanopyWidth = leftRearStepDepth - 1.05;
  const payCanopyLength = 4.3;
  const payCanopyPairX = leftRearCanopyPoleX + payCanopyLength / 2;
  const rightFaceX = width / 2 + 0.17;
  const rightLargeDoorX = rightFaceX + 0.14;
  const rightSmallDoorX = rightFaceX - 0.18;
  const mainFrontWindowXs = [-10, -0.85, 8.3];
  const protrusionWindowOffsets = [-0.6, 3.3];
  const frontStripeHeight = 2.02;
  const frontStripeZ = mainFrontZ - 0.25;
  const rightDoorGap = 2.2;
  const rightPillarInnerZ = archSpan / 2 - archColumnDepth / 2;
  const rightDoorWidth = rightPillarInnerZ - rightDoorGap / 2;
  const rightDoorCenterZ = rightDoorGap / 2 + rightDoorWidth / 2;
  const rearPillarBackZ = archSpan / 2 + archColumnDepth / 2;
  const rearPillarBackLocalZ = rearPillarBackZ - roofCenterZ;
  const rearRoofHeightAtPillar =
    wallHeight +
    rearRoofRise * (1 - rearPillarBackLocalZ / rearRoofEaveLocalZ);

  return (
    <group>
      <mesh position={[0, wallHeight / 2, bodyCenterZ]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, depth]} />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[leftExtensionCenterX, wallHeight / 2, leftExtensionCenterZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[leftExtensionWidth, wallHeight, leftExtensionDepth]} />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[
          leftFrontStepCenterX,
          wallHeight / 2,
          leftFrontStepCenterZ,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[leftCascadeStepWidth, wallHeight, leftFrontStepDepth]}
        />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[leftRearStepCenterX, wallHeight / 2, leftRearStepCenterZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[
            leftExtensionLeftX - leftRearStepLeftX,
            wallHeight,
            leftRearStepDepth,
          ]}
        />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[
          leftRearVisibleFrontCenterX,
          wallHeight / 2,
          roofCenterZ - 0.07,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[leftCascadeStepWidth, wallHeight, 0.14]} />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[
          leftRearVisibleFrontCenterX,
          wallHeight + frontRoofRise / 2,
          leftRearUpperFillZ,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[leftCascadeStepWidth, frontRoofRise, 0.14]} />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <mesh
        position={[-width / 2 + 0.08, wallHeight / 2, leftExtensionReturnZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.16, wallHeight, leftExtensionFrontBump]} />
        <meshStandardMaterial
          color={colors.buildingWallsColor}
          roughness={0.54}
        />
      </mesh>
      <group position={[roofCenterX, 0, roofCenterZ]}>
        <ChattanoogaOffsetRoof
          width={roofWidth}
          depth={roofDepth}
          wallHeight={wallHeight}
          frontRise={frontRoofRise}
          backRise={rearRoofRise}
          roofColor={colors.roofColor}
          ridgeColor={colors.roofRidgeColor}
          wallColor={colors.buildingWallsColor}
          frontOverhang={0.45}
          backOverhang={rearRoofOverhang}
          ribCount={40}
          showLeftEnd={false}
          ridgeGapLeftInset={0.9}
        />
      </group>
      <ChattanoogaFrontRoofExtension
        xCenter={leftFrontRoofExtensionCenterX}
        width={leftFrontRoofExtensionWidth}
        roofCenterZ={roofCenterZ}
        roofDepth={roofDepth}
        wallHeight={wallHeight}
        frontRise={frontRoofRise}
        frontOverhang={0.45}
        roofColor={colors.roofColor}
        ridgeColor={colors.roofRidgeColor}
        ribCount={6}
      />
      <ChattanoogaRearRoofExtension
        xCenter={leftRearRoofCenterX}
        width={leftRearRoofWidth}
        roofCenterZ={roofCenterZ}
        roofDepth={roofDepth}
        wallHeight={wallHeight}
        frontRise={frontRoofRise}
        backRise={rearRoofRise}
        backOverhang={rearRoofOverhang}
        roofColor={colors.roofColor}
        ridgeColor={colors.roofRidgeColor}
        wallColor={colors.buildingWallsColor}
        ribCount={6}
        ridgeGapLeftInset={0.42}
      />
      <LeftRoofTriangleInfill
        x={leftFrontStepLeftX + leftTriangleInfillInset}
        points={[
          [roofFrontEaveZ, wallHeight],
          [roofCenterZ, wallHeight + frontRoofRise],
          [roofCenterZ, wallHeight],
        ]}
        color={colors.buildingWallsColor}
      />
      <LeftRoofTriangleInfill
        x={leftRearStepLeftX + leftTriangleInfillInset}
        points={[
          [roofCenterZ, wallHeight],
          [roofCenterZ, wallHeight + rearRoofRise],
          [rearRoofEaveZ, wallHeight],
        ]}
        color={colors.buildingWallsColor}
      />
      <RightSideRearRoofInfill
        x={roofRightEdgeX + 0.04}
        wallHeight={wallHeight}
        startZ={rearPillarBackZ}
        endZ={rearRoofEaveZ}
        roofHeightAtStart={rearRoofHeightAtPillar}
        color={colors.buildingWallsColor}
      />
      <FrontGableRoof
        width={leftExtensionWidth}
        depth={leftExtensionFrontBump}
        wallHeight={wallHeight}
        rise={2.45}
        position={[leftExtensionCenterX, 0, leftExtensionReturnZ + 0.12]}
        roofColor={colors.roofColor}
        ridgeColor={colors.roofRidgeColor}
        gableColor={colors.buildingWallsColor}
        ribCount={10}
        overhang={0.28}
        showFrontEave={false}
      />
      {protrusionWindowOffsets.map((offset) => (
        <PlainWindow
          key={offset}
          width={2.65}
          height={standardWindowHeight}
          position={[
            leftExtensionCenterX + offset,
            standardWindowBaseY,
            leftExtensionFrontZ,
          ]}
          trimColor={colors.windowTrimColor}
          windowColor={colors.windowColor}
        />
      ))}
      <PlainWindow
        width={2.4}
        height={standardWindowHeight}
        position={[
          leftWindowSurfaceX,
          standardWindowBaseY,
          leftProtrusionSideWindowZ,
        ]}
        rotation={leftFacingRotation}
        trimColor={colors.windowTrimColor}
        windowColor={colors.windowColor}
      />
      <ServiceDoor
        width={1.9}
        height={standardWindowTopY}
        position={[
          leftSmallDoorSurfaceX,
          0,
          leftFrontStepDoorZ,
        ]}
        rotation={leftFacingRotation}
        color={colors.buildingDoorColor}
      />
      <SideCarDoor
        side="left"
        width={rightDoorWidth}
        height={wallHeight}
        position={[
          leftLargeDoorSurfaceX,
          0,
          leftRearLargeDoorZ,
        ]}
        color={colors.buildingDoorColor}
      />
      <LeftSlantedDoorCanopy
        wallX={leftRearCanopyWallX}
        centerZ={leftRearLargeDoorZ}
        doorWidth={rightDoorWidth}
        canopyWidth={leftRearCanopyWidth}
        attachY={leftRearCanopyAttachY}
        projection={leftRearCanopyProjection}
        drop={leftRearCanopyDrop}
        color={colors.roofColor}
        poleColor={colors.roofRidgeColor}
      />
      <ChattanoogaPayCanopies
        position={[payCanopyPairX, 0, payCanopyPairZ]}
        rotation={[0, Math.PI / 2, 0]}
        canopyLength={payCanopyLength}
        roofY={leftRearCanopyLowEdgeY}
        supportSide={-1}
        roofColor={colors.payCanopyRoofColor}
        poleColor={colors.payCanopyPoleColor}
        terminalColor={colors.payTerminalColor}
      />
      <mesh
        position={[0, frontStripeHeight / 2, frontStripeZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, frontStripeHeight, 0.12]} />
        <meshStandardMaterial
          color={colors.buildingDoorColor}
          roughness={0.48}
        />
      </mesh>
      {mainFrontWindowXs.map((x) => (
        <PlainWindow
          key={x}
          width={2.65}
          height={standardWindowHeight}
          position={[x, standardWindowBaseY, mainFrontZ - 0.18]}
          trimColor={colors.windowTrimColor}
          windowColor={colors.windowColor}
        />
      ))}
      <DoubleServiceDoor
        width={3.25}
        height={standardWindowTopY}
        position={[-width / 2 + 0.18, 0, leftExtensionReturnZ]}
        rotation={[0, -Math.PI / 2, 0]}
        color={colors.buildingDoorColor}
      />
      {[-rightDoorCenterZ, rightDoorCenterZ].map((z) => (
        <SideCarDoor
          key={z}
          side="right"
          width={rightDoorWidth}
          height={wallHeight}
          position={[rightLargeDoorX, 0, z]}
          color={colors.buildingDoorColor}
        />
      ))}
      <ServiceDoor
        width={1.55}
        height={standardWindowTopY}
        position={[rightSmallDoorX, 0, 13.25]}
        rotation={[0, -Math.PI / 2, 0]}
        color={colors.buildingDoorColor}
      />
      <PlainWindow
        width={2.65}
        height={standardWindowHeight}
        position={[14.35, standardWindowBaseY, mainBackZ + 0.04]}
        rotation={[0, Math.PI, 0]}
        trimColor={colors.windowTrimColor}
        windowColor={colors.windowColor}
      />
      <RightArcFacade
        rightX={rightFaceX}
        wallHeight={wallHeight}
        span={archSpan}
        color={colors.buildingWallsColor}
        trimColor={colors.arcTrimColor}
        columnDepth={archColumnDepth}
      />
      <SideDebugLabels
        siteName="Chattanooga"
        width={roofWidth}
        depth={leftExtensionDepth}
        labelHeight={wallHeight + 7.2}
      />
    </group>
  );
}

function ChattanoogaSite({ position, rotation = [0, 0, 0], colors }) {
  const depth = 30;

  return (
    <group position={position} rotation={rotation}>
      <ChattanoogaBuilding colors={colors} />
      <SiteBillboard
        label="Chattanooga"
        position={[0, 0, -depth / 2 - 13]}
      />
    </group>
  );
}

function BaseBuilding({
  siteName,
  width,
  depth,
  wallHeight,
  roofRise,
  wallColor,
  roofColor,
  roofRidgeColor,
  doorColor,
  windowColor,
  windowTrimColor,
  stripeColor,
  carwashTextColor,
  soffitColor = roofColor,
  hasOoltewahFront,
  roofRidgeAxis = "z",
  frontWindowPanelCount,
  leftExtensionWidth = 0,
  leftExtensionFrontBump = 0,
  rightGableExtensionWidth = 0,
  hasSideCarDoors = false,
  hasCentralDoorGable = false,
  roofRibCount = 12,
}) {
  const frontZ = -depth / 2 - 0.09;
  const backZ = depth / 2 + 0.09;
  const gateWidth = hasOoltewahFront ? 6.4 : 7.2;
  const frontPanelCount = frontWindowPanelCount ?? (hasOoltewahFront ? 4 : 3);
  const mainWindowWidth = frontPanelCount >= 6 ? 11.2 : 9.2;
  const mainWindowOffsetX = frontPanelCount >= 6 ? 10.1 : 10.6;
  const roofWidth = width + leftExtensionWidth + rightGableExtensionWidth;
  const roofDepth = depth;
  const labelDepth = depth + leftExtensionFrontBump;
  const roofCenterX = (rightGableExtensionWidth - leftExtensionWidth) / 2;
  const roofCenterZ = 0;
  const leftExtensionCenterX = -width / 2 - leftExtensionWidth / 2;
  const leftExtensionDepth = depth + leftExtensionFrontBump;
  const leftExtensionCenterZ = -leftExtensionFrontBump / 2;
  const leftExtensionFrontZ = -depth / 2 - leftExtensionFrontBump - 0.18;
  const leftOuterX = -width / 2 - leftExtensionWidth - 0.17;
  const rightOuterX = width / 2 + 0.17;
  const rightGableOuterX = width / 2 + rightGableExtensionWidth;
  const rightGableSoffitWidth = rightGableExtensionWidth + 0.25;
  const sideDoorWidth = Math.min(6.4, depth * 0.58);

  return (
    <group>
      <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.54} />
      </mesh>
      {leftExtensionWidth > 0 ? (
        <mesh
          position={[leftExtensionCenterX, wallHeight / 2, leftExtensionCenterZ]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[leftExtensionWidth, wallHeight, leftExtensionDepth]}
          />
          <meshStandardMaterial color={wallColor} roughness={0.54} />
        </mesh>
      ) : null}
      {stripeColor ? (
        <BuildingStripe
          width={width}
          depth={depth}
          wallHeight={wallHeight}
          leftExtensionWidth={leftExtensionWidth}
          leftExtensionFrontBump={leftExtensionFrontBump}
          color={stripeColor}
        />
      ) : null}
      {roofRidgeAxis === "x" ? (
        <>
          <GableEnd
            width={roofDepth}
            rise={roofRise}
            position={[
              roofCenterX - roofWidth / 2 - 0.09,
              wallHeight,
              roofCenterZ,
            ]}
            rotation={[0, Math.PI / 2, 0]}
            color={wallColor}
          />
          <GableEnd
            width={roofDepth}
            rise={roofRise}
            position={[
              roofCenterX + roofWidth / 2 + 0.09,
              wallHeight,
              roofCenterZ,
            ]}
            rotation={[0, Math.PI / 2, 0]}
            color={wallColor}
          />
        </>
      ) : (
        <>
          <GableEnd
            width={width}
            rise={roofRise}
            position={[0, wallHeight, frontZ]}
            color={wallColor}
          />
          <GableEnd
            width={width}
            rise={roofRise}
            position={[0, wallHeight, backZ]}
            color={wallColor}
          />
        </>
      )}
      <group position={[roofCenterX, 0, roofCenterZ]}>
        <GabledRoof
          width={roofWidth}
          depth={roofDepth}
          wallHeight={wallHeight}
          rise={roofRise}
          roofColor={roofColor}
          ridgeColor={roofRidgeColor}
          ridgeAxis={roofRidgeAxis}
          ribCount={roofRibCount}
        />
      </group>
      {leftExtensionWidth > 0 && leftExtensionFrontBump > 0 ? (
        <FrontGableRoof
          width={leftExtensionWidth}
          depth={leftExtensionFrontBump + 1.2}
          wallHeight={wallHeight}
          rise={roofRise * 0.55}
          position={[
            leftExtensionCenterX,
            0,
            -depth / 2 - leftExtensionFrontBump / 2 + 0.45,
          ]}
          roofColor={roofColor}
          ridgeColor={roofRidgeColor}
          gableColor={roofColor}
        />
      ) : null}
      {hasCentralDoorGable ? (
        <FrontGableRoof
          width={gateWidth + 2.2}
          depth={1.7}
          wallHeight={wallHeight}
          rise={roofRise * 0.34}
          position={[0, 0, -depth / 2 - 0.58]}
          roofColor={roofColor}
          ridgeColor={roofRidgeColor}
          gableColor={wallColor}
          ribCount={10}
        />
      ) : null}
      {rightGableExtensionWidth > 0 ? (
        <>
          <mesh
            position={[
              width / 2 + rightGableExtensionWidth / 2 - 0.05,
              wallHeight + 0.14,
              0,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[rightGableSoffitWidth, 0.34, depth - 0.95]}
            />
            <meshStandardMaterial color={soffitColor} roughness={0.54} />
          </mesh>
          {[-1, 1].map((direction) => (
            <mesh
              key={direction}
              position={[
                rightGableOuterX - 0.45,
                wallHeight / 2,
                direction * (depth / 2 - 1.2),
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.85, wallHeight, 0.85]} />
              <meshStandardMaterial color={soffitColor} roughness={0.54} />
            </mesh>
          ))}
          <CanvasLabel
            text="CARWASH"
            width={8.6}
            height={1.35}
            position={[
              rightGableOuterX + 0.16,
              wallHeight + roofRise * 0.42,
              0,
            ]}
            rotation={[0, Math.PI / 2, 0]}
            background={null}
            foreground={carwashTextColor ?? doorColor}
            fontSize={142}
            fontWeight={800}
          />
        </>
      ) : null}
      <GateDoor
        width={gateWidth}
        height={wallHeight * 0.66}
        position={[0, 0, -depth / 2 - 0.17]}
        color={doorColor}
      />
      {hasSideCarDoors ? (
        <>
          <SideCarDoor
            side="left"
            width={sideDoorWidth}
            height={wallHeight * 0.66}
            position={[leftOuterX, 0, 0]}
            color={doorColor}
          />
          <SideCarDoor
            side="right"
            width={sideDoorWidth}
            height={wallHeight * 0.66}
            position={[rightOuterX, 0, 0]}
            color={doorColor}
          />
        </>
      ) : null}
      {hasOoltewahFront ? (
        <>
          <WindowBank
            panelCount={frontPanelCount}
            totalWidth={mainWindowWidth}
            height={3.2}
            position={[-mainWindowOffsetX, 2.25, -depth / 2 - 0.18]}
            trimColor={windowTrimColor}
            windowColor={windowColor}
            grilleColor={windowTrimColor}
          />
          <WindowBank
            panelCount={frontPanelCount}
            totalWidth={mainWindowWidth}
            height={3.2}
            position={[mainWindowOffsetX, 2.25, -depth / 2 - 0.18]}
            trimColor={windowTrimColor}
            windowColor={windowColor}
            grilleColor={windowTrimColor}
          />
          {leftExtensionWidth > 0 ? (
            <>
              <ServiceDoor
                width={1.35}
                height={3.1}
                position={[
                  leftExtensionCenterX - leftExtensionWidth / 2 + 1.45,
                  0,
                  leftExtensionFrontZ,
                ]}
                color={doorColor}
              />
              <WindowBank
                panelCount={2}
                totalWidth={3.8}
                height={2.8}
                position={[
                  leftExtensionCenterX,
                  2.25,
                  leftExtensionFrontZ - 0.01,
                ]}
                trimColor={windowTrimColor}
                windowColor={windowColor}
                grilleColor={windowTrimColor}
              />
              <ServiceDoor
                width={1.35}
                height={3.1}
                position={[
                  leftExtensionCenterX + leftExtensionWidth / 2 - 1.45,
                  0,
                  leftExtensionFrontZ,
                ]}
                color={doorColor}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          <WindowBank
            panelCount={3}
            totalWidth={6.8}
            height={2.8}
            position={[-9.6, 2.35, -depth / 2 - 0.18]}
            trimColor={windowTrimColor}
            windowColor={windowColor}
            grilleColor={windowTrimColor}
          />
          <mesh position={[9.8, 2.8, -depth / 2 - 0.18]} castShadow>
            <boxGeometry args={[3.4, 3.8, 0.12]} />
            <meshStandardMaterial color={doorColor} roughness={0.54} />
          </mesh>
        </>
      )}
      <group position={[roofCenterX, 0, roofCenterZ]}>
        <SideDebugLabels
          siteName={siteName}
          width={roofWidth}
          depth={labelDepth}
          labelHeight={wallHeight + roofRise + 1.4}
        />
      </group>
    </group>
  );
}

function SiteStructure({
  siteName,
  position,
  width,
  depth,
  wallHeight,
  roofRise,
  hasOoltewahFront = false,
  hasVacuumCanopy = false,
  hasPayStation = false,
  roofRidgeAxis = "z",
  frontWindowPanelCount,
  leftExtensionWidth = 0,
  leftExtensionFrontBump = 0,
  rightGableExtensionWidth = 0,
  hasSideCarDoors = false,
  hasCentralDoorGable = false,
  roofRibCount = 12,
  signForwardOffset = 19,
  canopyForwardOffset = 12,
  vacuumCanopyWidth = 22,
  vacuumPillarX = [-7.5, 0, 7.5],
  vacuumPositionX = -5.5,
  nearVacuumCanopy,
  payStationPositionX,
  payForwardOffset = canopyForwardOffset,
  payCanopyWidth = 10,
  payCanopyOffsetX = 0,
  payPillarX = [-3.8, 3.8],
  colors,
}) {
  const payStationX =
    payStationPositionX ?? -width / 2 - leftExtensionWidth - 11;

  return (
    <group position={position}>
      <BaseBuilding
        siteName={siteName}
        width={width}
        depth={depth}
        wallHeight={wallHeight}
        roofRise={roofRise}
        wallColor={colors.buildingWallsColor}
        roofColor={colors.roofColor}
        roofRidgeColor={colors.roofRidgeColor}
        doorColor={colors.buildingDoorColor}
        windowColor={colors.windowColor}
        windowTrimColor={colors.windowTrimColor}
        stripeColor={colors.buildingStripeColor}
        carwashTextColor={colors.carwashTextColor}
        hasOoltewahFront={hasOoltewahFront}
        roofRidgeAxis={roofRidgeAxis}
        frontWindowPanelCount={frontWindowPanelCount}
        leftExtensionWidth={leftExtensionWidth}
        leftExtensionFrontBump={leftExtensionFrontBump}
        rightGableExtensionWidth={rightGableExtensionWidth}
        hasSideCarDoors={hasSideCarDoors}
        hasCentralDoorGable={hasCentralDoorGable}
        roofRibCount={roofRibCount}
      />
      <SiteBillboard
        label={siteName}
        position={[0, 0, -depth / 2 - signForwardOffset]}
      />
      {nearVacuumCanopy ? (
        <VacuumCanopy
          position={[
            nearVacuumCanopy.positionX,
            0,
            -depth / 2 - nearVacuumCanopy.forwardOffset,
          ]}
          pillarColor={colors.pillarColor}
          canopySideColor={colors.canopySideColor}
          canopyTopColor={colors.canopyTopColor}
          canopyWidth={nearVacuumCanopy.width}
          canopyBottomWidth={nearVacuumCanopy.bottomWidth}
          pillarX={nearVacuumCanopy.pillarX}
        />
      ) : null}
      {hasVacuumCanopy ? (
        <VacuumCanopy
          position={[vacuumPositionX, 0, -depth / 2 - canopyForwardOffset]}
          pillarColor={colors.pillarColor}
          canopySideColor={colors.canopySideColor}
          canopyTopColor={colors.canopyTopColor}
          canopyWidth={vacuumCanopyWidth}
          pillarX={vacuumPillarX}
        />
      ) : null}
      {hasPayStation ? (
        <PayStation
          position={[payStationX, 0, -depth / 2 - payForwardOffset]}
          pillarColor={colors.pillarColor}
          canopySideColor={colors.canopySideColor}
          canopyTopColor={colors.canopyTopColor}
          canopyWidth={payCanopyWidth}
          canopyOffsetX={payCanopyOffsetX}
          pillarX={payPillarX}
        />
      ) : null}
    </group>
  );
}

export default function ShowcaseScene() {
  const GROUND_Y = 0;
  const PLAZA_WIDTH = 140;
  const PLAZA_DEPTH = 172;
  const PLAZA_CENTER = [-40, GROUND_Y - 0.01, -32];

  const ooltewahColors = useControls(
    "Ooltewah Colors",
    OOLTEWAH_COLOR_CONTROLS,
  );
  const chattanoogaColors = useControls(
    "Chattanooga Colors",
    CHATTANOOGA_COLOR_CONTROLS,
  );

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={PLAZA_CENTER}
        receiveShadow
      >
        <planeGeometry args={[PLAZA_WIDTH, PLAZA_DEPTH]} />
        <meshStandardMaterial color="#2f3030" roughness={0.85} />
      </mesh>

      <SiteStructure
        siteName="Ooltewah"
        position={[-38, GROUND_Y, 14]}
        width={33}
        depth={15}
        wallHeight={8}
        roofRise={6.3}
        hasOoltewahFront
        hasVacuumCanopy
        hasPayStation
        hasSideCarDoors
        hasCentralDoorGable
        roofRidgeAxis="x"
        roofRibCount={48}
        frontWindowPanelCount={6}
        leftExtensionWidth={12}
        leftExtensionFrontBump={4}
        rightGableExtensionWidth={4.5}
        signForwardOffset={47}
        canopyForwardOffset={36.5}
        vacuumCanopyWidth={32}
        vacuumPillarX={[-13, -4.35, 4.35, 13]}
        vacuumPositionX={-13}
        nearVacuumCanopy={{
          width: 45,
          bottomWidth: 42,
          pillarX: [-20.5, -10.25, 0, 10.25, 20.5],
          positionX: -6,
          forwardOffset: 8.75,
        }}
        payStationPositionX={-46}
        payForwardOffset={20.5}
        payCanopyWidth={19}
        payCanopyOffsetX={-3.5}
        payPillarX={[-8.4, -2.2, 4.3]}
        colors={ooltewahColors}
      />

      <ChattanoogaSite
        position={[-38, GROUND_Y, -92]}
        rotation={[0, Math.PI, 0]}
        colors={chattanoogaColors}
      />
    </>
  );
}
