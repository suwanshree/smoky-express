import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function VideoWall({
  src = "/videos/demo.mp4",
  position = [0, 1.6, -9],
  size = [6, 3.4],
}) {
  const meshRef = useRef();
  useEffect(() => {
    const vid = document.createElement("video");
    vid.src = src;
    vid.crossOrigin = "anonymous";
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.play().catch(() => {
      // will start after user gesture (pointer lock)
    });

    const tex = new THREE.VideoTexture(vid);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;

    if (meshRef.current) {
      meshRef.current.material.map = tex;
      meshRef.current.material.needsUpdate = true;
    }

    return () => {
      vid.pause();
      vid.src = "";
      tex.dispose();
    };
  }, [src]);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        toneMapped={false}
        emissive={"white"}
        emissiveIntensity={1}
      />
    </mesh>
  );
}
