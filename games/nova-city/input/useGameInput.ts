"use client";

import { useEffect, useRef, useState } from "react";
import { MOUSE_SENSITIVITY, PITCH_MAX, PITCH_MIN } from "../constants";

export type KeyState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
};

const emptyKeys = (): KeyState => ({
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
});

function applyKey(keys: KeyState, code: string, pressed: boolean) {
  switch (code) {
    case "KeyW":
    case "ArrowUp":
      keys.forward = pressed;
      break;
    case "KeyS":
    case "ArrowDown":
      keys.back = pressed;
      break;
    case "KeyA":
    case "ArrowLeft":
      keys.left = pressed;
      break;
    case "KeyD":
    case "ArrowRight":
      keys.right = pressed;
      break;
    case "Space":
      keys.jump = pressed;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      keys.sprint = pressed;
      break;
  }
}

export function useGameInput() {
  const keys = useRef<KeyState>(emptyKeys());
  const yaw = useRef(0);
  const pitch = useRef(0.28);
  const [pointerLocked, setPointerLocked] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
      }
      applyKey(keys.current, event.code, true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      applyKey(keys.current, event.code, false);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement == null) {
        return;
      }

      yaw.current -= event.movementX * MOUSE_SENSITIVITY;
      pitch.current = Math.min(
        PITCH_MAX,
        Math.max(PITCH_MIN, pitch.current - event.movementY * MOUSE_SENSITIVITY),
      );
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement != null;
      setPointerLocked(locked);
      if (!locked) {
        keys.current = emptyKeys();
      }
    };

    const onBlur = () => {
      keys.current = emptyKeys();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerlockchange", onPointerLockChange);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, []);

  return { keys, yaw, pitch, pointerLocked };
}
