export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1.0}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight
        skyColor={"#e7f0ff"}
        groundColor={"#101016"}
        intensity={0.4}
      />
    </>
  );
}
