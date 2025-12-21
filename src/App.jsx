import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Loader } from "@react-three/drei";
import Lights from "./components/Lights";
import PlayerController from "./components/Player/PlayerController";
import { Physics } from "@react-three/rapier";
import ShowcaseScene from "./scenes/ShowcaseScene";
import "./styles/globals.css";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 70, position: [0, 1.6, 8] }}
        gl={{ antialias: true, physicallyCorrectLights: true }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <Suspense fallback={null}>
          <Environment
            files="/textures/hdr/citrus_orchard_road_puresky_4k.hdr"
            background
          />
          <Lights />
          <Physics gravity={[0, -9.81, 0]}>
            <PlayerController />
            <ShowcaseScene />
          </Physics>
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
