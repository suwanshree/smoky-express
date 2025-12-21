import { useGLTF } from "@react-three/drei";

export default function Model({
  src = "/models/sagaV/Bottle_Shape_032_Full.gltf",
  scale = 1,
}) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} scale={scale} />;
}
