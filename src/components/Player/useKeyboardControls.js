import { useEffect, useState } from "react";

export default function useKeyboardControls() {
  const [state, setState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const down = (e) => {
      const code = e.code;
      setState((s) => ({
        ...s,
        forward: s.forward || code === "KeyW" || code === "ArrowUp",
        backward: s.backward || code === "KeyS" || code === "ArrowDown",
        left: s.left || code === "KeyA" || code === "ArrowLeft",
        right: s.right || code === "KeyD" || code === "ArrowRight",
      }));
    };
    const up = (e) => {
      const code = e.code;
      setState((s) => ({
        ...s,
        forward: code === "KeyW" || code === "ArrowUp" ? false : s.forward,
        backward: code === "KeyS" || code === "ArrowDown" ? false : s.backward,
        left: code === "KeyA" || code === "ArrowLeft" ? false : s.left,
        right: code === "KeyD" || code === "ArrowRight" ? false : s.right,
      }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return state;
}
