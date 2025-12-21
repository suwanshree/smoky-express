import * as THREE from "three";

export default function GlassPedestal({
  position = [0, 0, 0],
  radius = 0.6,
  height = 0.9,
  children,
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.9, radius, 0.24, 32]} />
        <meshStandardMaterial color="#222428" metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, 0.12, 32]} />
        <meshStandardMaterial color="#111217" metalness={0.2} roughness={0.3} />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[radius * 1.6, height, radius * 1.6]} />
        <meshPhysicalMaterial
          color="#e8f5ff"
          metalness={0}
          roughness={0}
          transmission={0.85}
          thickness={0.5}
          clearcoat={0.2}
          clearcoatRoughness={0.02}
          ior={1.45}
          opacity={1}
          side={THREE.FrontSide}
        />
      </mesh>

      <group position={[0, 0.9, 0]}>{children}</group>
    </group>
  );
}
