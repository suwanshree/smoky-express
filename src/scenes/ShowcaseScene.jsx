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

function ServiceDoor({ width, height, position, color }) {
  return (
    <group position={position}>
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

function SideCarDoor({ side, width, height, position, color }) {
  const rotationY = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <GateDoor width={width} height={height} position={[0, 0, 0]} color={color} />
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
  ribCount = 6,
}) {
  const overhang = 1.3;
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
        <mesh position={[0, wallHeight + 0.1, -run]} castShadow>
          <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.35} />
        </mesh>
        <mesh position={[0, wallHeight + 0.1, run]} castShadow>
          <boxGeometry args={[ridgeLength, 0.32, 0.3]} />
          <meshStandardMaterial color={ridgeColor} roughness={0.35} />
        </mesh>
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
      <mesh position={[0, wallHeight + 0.1, -ridgeLength / 2]} castShadow>
        <boxGeometry args={[width + overhang * 2.1, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
      <mesh position={[0, wallHeight + 0.1, ridgeLength / 2]} castShadow>
        <boxGeometry args={[width + overhang * 2.1, 0.32, 0.3]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} />
      </mesh>
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
  ribCount = 6,
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
  roofRibCount = 6,
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
          ribCount={5}
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
  roofRibCount = 6,
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
  const PLAZA_WIDTH = 200;
  const PLAZA_DEPTH = 200;

  const ooltewahColors = useControls(
    "Ooltewah Colors",
    OOLTEWAH_COLOR_CONTROLS,
  );

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y - 0.01, 0]}
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
        roofRibCount={24}
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

    </>
  );
}
