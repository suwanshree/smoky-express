import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei/core/PointerLockControls";
import * as THREE from "three";
import useKeyboardControls from "./useKeyboardControls";

export default function PlayerController() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const keys = useKeyboardControls();

  const speed = 10.0;

  // 🎯 INITIAL PLAYER SPAWN
  useEffect(() => {
    const START_POS = new THREE.Vector3(0, 1.6, -50);
    const LOOK_AT = new THREE.Vector3(0, 1.6, -1);

    camera.position.copy(START_POS);
    camera.lookAt(LOOK_AT);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    // compute forward, right vectors from camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, camera.up)
      .normalize();

    const move = new THREE.Vector3();
    if (keys.forward) move.add(forward);
    if (keys.backward) move.sub(forward);
    if (keys.left) move.sub(right);
    if (keys.right) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize();
      move.multiplyScalar(speed * delta);
      camera.position.add(move);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
