"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLAYER_HEIGHT,
  SPAWN_POINT,
  SPRINT_MULTIPLIER,
} from "../constants";
import type { KeyState } from "../input/useGameInput";
import { resolveHorizontalMove } from "./collision";
import BlockyPlayer from "./BlockyPlayer";

type ThirdPersonPlayerProps = {
  keys: MutableRefObject<KeyState>;
  yaw: MutableRefObject<number>;
  pitch: MutableRefObject<number>;
  onHudUpdate?: (info: { x: number; z: number; grounded: boolean }) => void;
};

export default function ThirdPersonPlayer({
  keys,
  yaw,
  pitch,
  onHudUpdate,
}: ThirdPersonPlayerProps) {
  const group = useRef<THREE.Group>(null);
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const player = group.current;
    if (!player) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const input = keys.current;

    let moveX = 0;
    let moveZ = 0;
    if (input.forward) moveZ += 1;
    if (input.back) moveZ -= 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const length = Math.hypot(moveX, moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    const worldX = moveX * cos + moveZ * sin;
    const worldZ = -moveX * sin + moveZ * cos;
    const speed = MOVE_SPEED * (input.sprint ? SPRINT_MULTIPLIER : 1);

    const next = resolveHorizontalMove(
      player.position.x,
      player.position.z,
      player.position.x + worldX * speed * dt,
      player.position.z + worldZ * speed * dt,
    );

    player.position.x = next.x;
    player.position.z = next.z;

    if (length > 0) {
      player.rotation.y = Math.atan2(worldX, worldZ);
    }

    if (grounded.current && input.jump) {
      velocityY.current = JUMP_VELOCITY;
      grounded.current = false;
    }

    velocityY.current -= GRAVITY * dt;
    player.position.y += velocityY.current * dt;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY.current = 0;
      grounded.current = true;
    }

    const lookHeight = CAMERA_HEIGHT;
    const distance = CAMERA_DISTANCE;
    const camPitch = pitch.current;

    camera.position.set(
      player.position.x - Math.sin(yaw.current) * Math.cos(camPitch) * distance,
      player.position.y + lookHeight + Math.sin(camPitch) * distance,
      player.position.z - Math.cos(yaw.current) * Math.cos(camPitch) * distance,
    );

    lookTarget.current.set(
      player.position.x,
      player.position.y + PLAYER_HEIGHT * 0.72,
      player.position.z,
    );
    camera.lookAt(lookTarget.current);

    onHudUpdate?.({
      x: player.position.x,
      z: player.position.z,
      grounded: grounded.current,
    });
  });

  return (
    <group
      ref={group}
      position={[SPAWN_POINT.x, SPAWN_POINT.y, SPAWN_POINT.z]}
    >
      <BlockyPlayer />
    </group>
  );
}
