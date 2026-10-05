"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from ".././lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type WorldObject = {
  id: string;
  type: "part" | "tree" | "car";
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
};

type WorldData = {
  version?: number;
  objects?: WorldObject[];
  spawn?: {
    x: number;
    y: number;
    z: number;
  };
};

/* =========================================================
   KEYBOARD
========================================================= */

const keys: Record<string, boolean> = {};

function Keyboard() {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys[event.code] = true;
    };

    const up = (event: KeyboardEvent) => {
      keys[event.code] = false;
    };

    const blur = () => {
      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return null;
}

/* =========================================================
   CAMERA STATE
========================================================= */

let currentCameraYaw = 0;

function getCameraYaw() {
  return currentCameraYaw;
}

/* =========================================================
   ROBLOX STYLE THIRD PERSON CAMERA
========================================================= */

function PlayerCamera({
  player,
}: {
  player: React.RefObject<THREE.Group | null>;
}) {
  const { camera, gl } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0.15);

  /* Camera zoom */
  const distance = useRef(7);
  const targetDistance = useRef(7);

  useEffect(() => {
    const canvas = gl.domElement;

    /* =====================================================
       MOUSE CLICK / POINTER LOCK
    ===================================================== */

    const click = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };

    /* =====================================================
       MOUSE MOVEMENT
    ===================================================== */

    const mouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) {
        return;
      }

      /*
        Mouse right = camera right
        Mouse left  = camera left
      */

      yaw.current += event.movementX * 0.003;

      /*
        Mouse up = camera up
        Mouse down = camera down
      */

      pitch.current -= event.movementY * 0.003;

      /*
        Limit vertical camera movement.
      */

      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        -0.35,
        0.75
      );
    };

    /* =====================================================
       MOUSE WHEEL ZOOM
    ===================================================== */

    const wheel = (event: WheelEvent) => {
      /*
        Scroll up   = zoom in
        Scroll down = zoom out
      */

      targetDistance.current += event.deltaY * 0.01;

      targetDistance.current = THREE.MathUtils.clamp(
        targetDistance.current,
        3,
        12
      );
    };

    canvas.addEventListener("click", click);
    canvas.addEventListener("wheel", wheel, {
      passive: true,
    });

    window.addEventListener("mousemove", mouseMove);

    return () => {
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const p = player.current;

    if (!p) return;

    /* =====================================================
       CAMERA YAW FOR PLAYER MOVEMENT
    ===================================================== */

    currentCameraYaw = yaw.current;

    /* =====================================================
       SMOOTH ZOOM
    ===================================================== */

    distance.current = THREE.MathUtils.lerp(
      distance.current,
      targetDistance.current,
      Math.min(1, delta * 10)
    );

    /* =====================================================
       PLAYER TARGET
    ===================================================== */

    const target = new THREE.Vector3(
      p.position.x,
      p.position.y + 1.55,
      p.position.z
    );

    /* =====================================================
       CAMERA DISTANCE
    ===================================================== */

    const horizontalDistance =
      Math.cos(pitch.current) *
      distance.current;

    /* =====================================================
       CAMERA POSITION
    ===================================================== */

    const desired = new THREE.Vector3(
      target.x +
        Math.sin(yaw.current) *
          horizontalDistance,

      target.y +
        Math.sin(pitch.current) *
          distance.current +
        2.2,

      target.z +
        Math.cos(yaw.current) *
          horizontalDistance
    );

    /* =====================================================
       SMOOTH CAMERA FOLLOW
    ===================================================== */

    camera.position.lerp(
      desired,
      Math.min(1, delta * 12)
    );

    /* =====================================================
       CAMERA LOOK AT PLAYER
    ===================================================== */

    camera.lookAt(target);
  });

  return null;
}

/* =========================================================
   PLAYER
========================================================= */

function Player({
  spawn,
  playerRef,
}: {
  spawn: [number, number, number];
  playerRef: React.RefObject<THREE.Group | null>;
}) {
  const velocityY = useRef(0);

  const wasJumping = useRef(false);

  const characterRef =
    useRef<THREE.Group>(null);

  const leftLegRef =
    useRef<THREE.Group>(null);

  const rightLegRef =
    useRef<THREE.Group>(null);

  const leftArmRef =
    useRef<THREE.Group>(null);

  const rightArmRef =
    useRef<THREE.Group>(null);

  const headRef =
    useRef<THREE.Group>(null);

  const bodyRef =
    useRef<THREE.Mesh>(null);

  const animationTime =
    useRef(0);

  useFrame((_, delta) => {
    const player = playerRef.current;

    if (!player) return;

    const dt = Math.min(delta, 0.05);

    /* =====================================================
       INPUT
    ===================================================== */

    let forward = 0;
    let right = 0;

    /* W / ArrowUp */

    if (
      keys["KeyW"] ||
      keys["ArrowUp"]
    ) {
      forward += 1;
    }

    /* S / ArrowDown */

    if (
      keys["KeyS"] ||
      keys["ArrowDown"]
    ) {
      forward -= 1;
    }

    /* D / ArrowRight */

    if (
      keys["KeyD"] ||
      keys["ArrowRight"]
    ) {
      right += 1;
    }

    /* A / ArrowLeft */

    if (
      keys["KeyA"] ||
      keys["ArrowLeft"]
    ) {
      right -= 1;
    }

    const isMoving =
      forward !== 0 ||
      right !== 0;

    const sprint =
      keys["ShiftLeft"] ||
      keys["ShiftRight"];

    /* =====================================================
       ROBLOX CAMERA RELATIVE MOVEMENT
    ===================================================== */

    if (isMoving) {
      const yaw = getCameraYaw();

      /*
        CAMERA FORWARD

        W moves toward the direction
        the camera is looking.
      */

      const forwardVector =
        new THREE.Vector3(
          -Math.sin(yaw),
          0,
          -Math.cos(yaw)
        );

      /*
        CAMERA RIGHT

        D = right
        A = left
      */

      const rightVector =
        new THREE.Vector3(
          Math.cos(yaw),
          0,
          -Math.sin(yaw)
        );

      /*
        Combine forward + right.
      */

      const direction =
        new THREE.Vector3();

      direction.addScaledVector(
        forwardVector,
        forward
      );

      direction.addScaledVector(
        rightVector,
        right
      );

      /*
        Prevent diagonal movement
        from being faster.
      */

      if (direction.lengthSq() > 0) {
        direction.normalize();
      }

      /* ===================================================
         WALK / SPRINT SPEED
      =================================================== */

      const speed =
        sprint ? 9 : 5;

      /* ===================================================
         MOVE PLAYER
      =================================================== */

      player.position.x +=
        direction.x *
        speed *
        dt;

      player.position.z +=
        direction.z *
        speed *
        dt;

      /* ===================================================
         CHARACTER ROTATION
      =================================================== */

      const targetRotation =
        Math.atan2(
          direction.x,
          -direction.z
        );

      /*
        Shortest rotation path.
      */

      const rotationDifference =
        THREE.MathUtils.euclideanModulo(
          targetRotation -
            player.rotation.y +
            Math.PI,
          Math.PI * 2
        ) - Math.PI;

      /*
        Smooth character turning.
      */

      player.rotation.y +=
        rotationDifference *
        Math.min(
          1,
          dt * 18
        );
    }

    /* =====================================================
       JUMP
    ===================================================== */

    const onGround =
      player.position.y <= 0.01;

    if (
      keys["Space"] &&
      onGround
    ) {
      velocityY.current = 8;

      keys["Space"] = false;

      wasJumping.current = true;
    }

    /* Gravity */

    velocityY.current -=
      20 * dt;

    player.position.y +=
      velocityY.current *
      dt;

    /* =====================================================
       LANDING
    ===================================================== */

    if (player.position.y < 0) {
      player.position.y = 0;

      velocityY.current = 0;

      if (wasJumping.current) {
        wasJumping.current = false;

        if (characterRef.current) {
          characterRef.current.position.y =
            -0.04;
        }
      }
    }

    /* =====================================================
       ANIMATION TIME
    ===================================================== */

    animationTime.current += dt;

    const time =
      animationTime.current;

    const walkingSpeed =
      sprint ? 13 : 9;

    const walkCycle =
      Math.sin(
        time *
          walkingSpeed
      );

    const jumpHeight =
      player.position.y > 0.05 ||
      velocityY.current > 0.1;

    /* =====================================================
       WALK / RUN
    ===================================================== */

    if (
      isMoving &&
      !jumpHeight
    ) {
      const legAmount =
        sprint ? 0.85 : 0.65;

      const armAmount =
        sprint ? 0.7 : 0.55;

      if (leftLegRef.current) {
        leftLegRef.current.rotation.x =
          walkCycle *
          legAmount;

        leftLegRef.current.rotation.z =
          walkCycle *
          0.035;
      }

      if (rightLegRef.current) {
        rightLegRef.current.rotation.x =
          -walkCycle *
          legAmount;

        rightLegRef.current.rotation.z =
          -walkCycle *
          0.035;
      }

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x =
          -walkCycle *
          armAmount;

        leftArmRef.current.rotation.z =
          -0.08;
      }

      if (rightArmRef.current) {
        rightArmRef.current.rotation.x =
          walkCycle *
          armAmount;

        rightArmRef.current.rotation.z =
          0.08;
      }

      if (bodyRef.current) {
        bodyRef.current.rotation.z =
          walkCycle *
          0.025;
      }

      if (headRef.current) {
        headRef.current.rotation.x =
          Math.sin(time * 8) *
          0.015;

        headRef.current.rotation.y =
          Math.sin(time * 4) *
          0.025;

        headRef.current.rotation.z =
          Math.sin(time * 7) *
          0.012;
      }

      if (characterRef.current) {
        characterRef.current.position.y =
          Math.abs(walkCycle) *
          (sprint
            ? 0.055
            : 0.035);
      }
    }

    /* =====================================================
       IDLE
    ===================================================== */

    if (
      !isMoving &&
      !jumpHeight
    ) {
      const idle =
        Math.sin(time * 2);

      const idleSmall =
        Math.sin(time * 1.4);

      if (leftLegRef.current) {
        leftLegRef.current.rotation.x =
          THREE.MathUtils.lerp(
            leftLegRef.current.rotation.x,
            0,
            Math.min(
              1,
              dt * 8
            )
          );

        leftLegRef.current.rotation.z =
          THREE.MathUtils.lerp(
            leftLegRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 8
            )
          );
      }

      if (rightLegRef.current) {
        rightLegRef.current.rotation.x =
          THREE.MathUtils.lerp(
            rightLegRef.current.rotation.x,
            0,
            Math.min(
              1,
              dt * 8
            )
          );

        rightLegRef.current.rotation.z =
          THREE.MathUtils.lerp(
            rightLegRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 8
            )
          );
      }

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x =
          THREE.MathUtils.lerp(
            leftArmRef.current.rotation.x,
            0,
            Math.min(
              1,
              dt * 8
            )
          );

        leftArmRef.current.rotation.z =
          THREE.MathUtils.lerp(
            leftArmRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 8
            )
          );
      }

      if (rightArmRef.current) {
        rightArmRef.current.rotation.x =
          THREE.MathUtils.lerp(
            rightArmRef.current.rotation.x,
            0,
            Math.min(
              1,
              dt * 8
            )
          );

        rightArmRef.current.rotation.z =
          THREE.MathUtils.lerp(
            rightArmRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 8
            )
          );
      }

      if (characterRef.current) {
        characterRef.current.position.y =
          idle * 0.012;
      }

      if (headRef.current) {
        headRef.current.rotation.x =
          Math.sin(
            time * 1.8
          ) * 0.012;

        headRef.current.rotation.y =
          idleSmall * 0.025;

        headRef.current.rotation.z =
          Math.sin(
            time * 1.1
          ) * 0.015;
      }

      if (bodyRef.current) {
        bodyRef.current.scale.y =
          1 +
          idle * 0.008;

        bodyRef.current.rotation.z =
          THREE.MathUtils.lerp(
            bodyRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 6
            )
          );
      }
    }

    /* =====================================================
       JUMP ANIMATION
    ===================================================== */

    if (jumpHeight) {
      const jumpVelocity =
        velocityY.current;

      if (jumpVelocity > 1) {
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x =
            -0.65;

          leftArmRef.current.rotation.z =
            -0.16;
        }

        if (rightArmRef.current) {
          rightArmRef.current.rotation.x =
            -0.65;

          rightArmRef.current.rotation.z =
            0.16;
        }

        if (leftLegRef.current) {
          leftLegRef.current.rotation.x =
            0.28;

          leftLegRef.current.rotation.z =
            0.04;
        }

        if (rightLegRef.current) {
          rightLegRef.current.rotation.x =
            -0.28;

          rightLegRef.current.rotation.z =
            -0.04;
        }

        if (headRef.current) {
          headRef.current.rotation.x =
            -0.06;

          headRef.current.rotation.y =
            0;

          headRef.current.rotation.z =
            0;
        }

        if (bodyRef.current) {
          bodyRef.current.rotation.z = 0;
        }
      } else {
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x =
            -0.25;

          leftArmRef.current.rotation.z =
            -0.1;
        }

        if (rightArmRef.current) {
          rightArmRef.current.rotation.x =
            -0.25;

          rightArmRef.current.rotation.z =
            0.1;
        }

        if (leftLegRef.current) {
          leftLegRef.current.rotation.x =
            0.15;
        }

        if (rightLegRef.current) {
          rightLegRef.current.rotation.x =
            -0.15;
        }

        if (headRef.current) {
          headRef.current.rotation.x =
            0.04;

          headRef.current.rotation.y =
            0;

          headRef.current.rotation.z =
            0;
        }
      }

      if (characterRef.current) {
        characterRef.current.rotation.z =
          Math.sin(time * 4) *
          0.025;

        characterRef.current.position.y =
          Math.sin(time * 8) *
          0.015;
      }
    } else {
      if (characterRef.current) {
        characterRef.current.rotation.z =
          THREE.MathUtils.lerp(
            characterRef.current.rotation.z,
            0,
            Math.min(
              1,
              dt * 8
            )
          );

        characterRef.current.position.y =
          THREE.MathUtils.lerp(
            characterRef.current.position.y,
            0,
            Math.min(
              1,
              dt * 12
            )
          );
      }
    }
  });

  return (
    <group
      ref={playerRef}
      position={[
        spawn[0],
        Math.max(
          0,
          spawn[1]
        ),
        spawn[2],
      ]}
    >
      <group ref={characterRef}>

        {/* =================================================
            LEGS
        ================================================= */}

        <group
          ref={leftLegRef}
          position={[
            -0.25,
            1.05,
            0,
          ]}
        >
          <mesh
            position={[
              0,
              -0.4,
              0,
            ]}
            castShadow
          >
            <capsuleGeometry
              args={[
                0.18,
                0.85,
                8,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#20242d"
            />
          </mesh>

          <mesh
            position={[
              0,
              -0.97,
              -0.08,
            ]}
            castShadow
          >
            <boxGeometry
              args={[
                0.5,
                0.22,
                0.75,
              ]}
            />

            <meshStandardMaterial
              color="#08090c"
            />
          </mesh>
        </group>

        <group
          ref={rightLegRef}
          position={[
            0.25,
            1.05,
            0,
          ]}
        >
          <mesh
            position={[
              0,
              -0.4,
              0,
            ]}
            castShadow
          >
            <capsuleGeometry
              args={[
                0.18,
                0.85,
                8,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#20242d"
            />
          </mesh>

          <mesh
            position={[
              0,
              -0.97,
              -0.08,
            ]}
            castShadow
          >
            <boxGeometry
              args={[
                0.5,
                0.22,
                0.75,
              ]}
            />

            <meshStandardMaterial
              color="#08090c"
            />
          </mesh>
        </group>

        {/* =================================================
            BODY
        ================================================= */}

        <mesh
          ref={bodyRef}
          position={[
            0,
            1.55,
            0,
          ]}
          castShadow
        >
          <capsuleGeometry
            args={[
              0.48,
              0.75,
              8,
              16,
            ]}
          />

          <meshStandardMaterial
            color="#2563eb"
            roughness={0.65}
          />
        </mesh>

        {/* NOVA LOGO */}

        <mesh
          position={[
            0,
            1.65,
            -0.49,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <circleGeometry
            args={[
              0.13,
              24,
            ]}
          />

          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* =================================================
            LEFT ARM
        ================================================= */}

        <group
          ref={leftArmRef}
          position={[
            -0.62,
            1.95,
            0,
          ]}
        >
          <mesh
            position={[
              0,
              -0.37,
              0,
            ]}
            castShadow
          >
            <capsuleGeometry
              args={[
                0.16,
                0.85,
                8,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#2563eb"
            />
          </mesh>

          <mesh
            position={[
              0,
              -0.92,
              0,
            ]}
            castShadow
          >
            <sphereGeometry
              args={[
                0.19,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#d89b72"
            />
          </mesh>
        </group>

        {/* =================================================
            RIGHT ARM
        ================================================= */}

        <group
          ref={rightArmRef}
          position={[
            0.62,
            1.95,
            0,
          ]}
        >
          <mesh
            position={[
              0,
              -0.37,
              0,
            ]}
            castShadow
          >
            <capsuleGeometry
              args={[
                0.16,
                0.85,
                8,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#2563eb"
            />
          </mesh>

          <mesh
            position={[
              0,
              -0.92,
              0,
            ]}
            castShadow
          >
            <sphereGeometry
              args={[
                0.19,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#d89b72"
            />
          </mesh>
        </group>

        {/* =================================================
            NECK
        ================================================= */}

        <mesh
          position={[
            0,
            2.25,
            0,
          ]}
          castShadow
        >
          <cylinderGeometry
            args={[
              0.17,
              0.17,
              0.25,
              20,
            ]}
          />

          <meshStandardMaterial
            color="#d89b72"
          />
        </mesh>

        {/* =================================================
            HEAD
        ================================================= */}

        <group
          ref={headRef}
          position={[
            0,
            0,
            0,
          ]}
        >
          <mesh
            position={[
              0,
              2.7,
              0,
            ]}
            castShadow
          >
            <sphereGeometry
              args={[
                0.47,
                32,
                32,
              ]}
            />

            <meshStandardMaterial
              color="#e4ad83"
              roughness={0.7}
            />
          </mesh>

          {/* HAIR */}

          <mesh
            position={[
              0,
              2.96,
              -0.02,
            ]}
            scale={[
              1.03,
              0.72,
              1.03,
            ]}
            castShadow
          >
            <sphereGeometry
              args={[
                0.49,
                32,
                20,
              ]}
            />

            <meshStandardMaterial
              color="#17120f"
              roughness={0.5}
            />
          </mesh>

          <mesh
            position={[
              -0.4,
              2.72,
              -0.02,
            ]}
            scale={[
              0.25,
              0.65,
              0.75,
            ]}
          >
            <sphereGeometry
              args={[
                0.4,
                20,
                20,
              ]}
            />

            <meshStandardMaterial
              color="#17120f"
            />
          </mesh>

          <mesh
            position={[
              0.4,
              2.72,
              -0.02,
            ]}
            scale={[
              0.25,
              0.65,
              0.75,
            ]}
          >
            <sphereGeometry
              args={[
                0.4,
                20,
                20,
              ]}
            />

            <meshStandardMaterial
              color="#17120f"
            />
          </mesh>

          {/* EARS */}

          <mesh
            position={[
              -0.47,
              2.7,
              0,
            ]}
          >
            <sphereGeometry
              args={[
                0.09,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#d89b72"
            />
          </mesh>

          <mesh
            position={[
              0.47,
              2.7,
              0,
            ]}
          >
            <sphereGeometry
              args={[
                0.09,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#d89b72"
            />
          </mesh>

          {/* EYES */}

          <mesh
            position={[
              -0.16,
              2.73,
              -0.43,
            ]}
          >
            <sphereGeometry
              args={[
                0.055,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#111111"
            />
          </mesh>

          <mesh
            position={[
              0.16,
              2.73,
              -0.43,
            ]}
          >
            <sphereGeometry
              args={[
                0.055,
                16,
                16,
              ]}
            />

            <meshStandardMaterial
              color="#111111"
            />
          </mesh>

          {/* EYE HIGHLIGHTS */}

          <mesh
            position={[
              -0.16,
              2.75,
              -0.48,
            ]}
          >
            <sphereGeometry
              args={[
                0.015,
                8,
                8,
              ]}
            />

            <meshStandardMaterial
              color="#ffffff"
            />
          </mesh>

          <mesh
            position={[
              0.16,
              2.75,
              -0.48,
            ]}
          >
            <sphereGeometry
              args={[
                0.015,
                8,
                8,
              ]}
            />

            <meshStandardMaterial
              color="#ffffff"
            />
          </mesh>

          {/* NOSE */}

          <mesh
            position={[
              0,
              2.62,
              -0.46,
            ]}
            rotation={[
              Math.PI / 2,
              0,
              0,
            ]}
          >
            <coneGeometry
              args={[
                0.06,
                0.15,
                8,
              ]}
            />

            <meshStandardMaterial
              color="#c48765"
            />
          </mesh>

          {/* MOUTH */}

          <mesh
            position={[
              0,
              2.48,
              -0.44,
            ]}
            rotation={[
              Math.PI / 2,
              0,
              0,
            ]}
          >
            <torusGeometry
              args={[
                0.08,
                0.018,
                8,
                20,
                Math.PI,
              ]}
            />

            <meshStandardMaterial
              color="#7f2935"
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* =========================================================
   WORLD OBJECTS
========================================================= */

function WorldObjects({
  objects,
}: {
  objects: WorldObject[];
}) {
  return (
    <>
      {objects.map((object) => {
        /* =================================================
           PART
        ================================================= */

        if (object.type === "part") {
          return (
            <mesh
              key={object.id}
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  2,
                  1,
                  2,
                ]}
              />

              <meshStandardMaterial
                color={
                  object.color ||
                  "#64748b"
                }
                roughness={0.65}
              />
            </mesh>
          );
        }

        /* =================================================
           TREE
        ================================================= */

        if (object.type === "tree") {
          return (
            <group
              key={object.id}
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
            >
              <mesh
                position={[
                  0,
                  2,
                  0,
                ]}
                castShadow
              >
                <cylinderGeometry
                  args={[
                    0.35,
                    0.5,
                    4,
                    12,
                  ]}
                />

                <meshStandardMaterial
                  color="#70452a"
                />
              </mesh>

              <mesh
                position={[
                  0,
                  4.5,
                  0,
                ]}
                castShadow
              >
                <icosahedronGeometry
                  args={[
                    1.5,
                    1,
                  ]}
                />

                <meshStandardMaterial
                  color="#267a32"
                />
              </mesh>

              <mesh
                position={[
                  -1,
                  4,
                  0,
                ]}
                castShadow
              >
                <icosahedronGeometry
                  args={[
                    1.2,
                    1,
                  ]}
                />

                <meshStandardMaterial
                  color="#2f8b3b"
                />
              </mesh>

              <mesh
                position={[
                  1,
                  4.1,
                  0,
                ]}
                castShadow
              >
                <icosahedronGeometry
                  args={[
                    1.2,
                    1,
                  ]}
                />

                <meshStandardMaterial
                  color="#24732d"
                />
              </mesh>
            </group>
          );
        }

        /* =================================================
           CAR
        ================================================= */

        if (object.type === "car") {
          return (
            <group
              key={object.id}
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
            >
              <mesh
                position={[
                  0,
                  0.75,
                  0,
                ]}
                castShadow
              >
                <boxGeometry
                  args={[
                    5,
                    0.8,
                    2,
                  ]}
                />

                <meshStandardMaterial
                  color={
                    object.color ||
                    "#dc2626"
                  }
                  metalness={0.15}
                  roughness={0.45}
                />
              </mesh>

              <mesh
                position={[
                  -0.35,
                  1.35,
                  0,
                ]}
                castShadow
              >
                <boxGeometry
                  args={[
                    2.4,
                    0.9,
                    1.7,
                  ]}
                />

                <meshStandardMaterial
                  color="#1d2735"
                  metalness={0.25}
                  roughness={0.2}
                />
              </mesh>

              <mesh
                position={[
                  0.35,
                  1.38,
                  -0.01,
                ]}
              >
                <boxGeometry
                  args={[
                    0.9,
                    0.55,
                    1.73,
                  ]}
                />

                <meshStandardMaterial
                  color="#111827"
                  transparent
                  opacity={0.82}
                />
              </mesh>

              <mesh
                position={[
                  -0.9,
                  1.38,
                  0,
                ]}
              >
                <boxGeometry
                  args={[
                    0.65,
                    0.55,
                    1.73,
                  ]}
                />

                <meshStandardMaterial
                  color="#111827"
                  transparent
                  opacity={0.82}
                />
              </mesh>

              {[
                [-1.65, 0.4, -1.05],
                [-1.65, 0.4, 1.05],
                [1.65, 0.4, -1.05],
                [1.65, 0.4, 1.05],
              ].map(
                (
                  position,
                  index
                ) => (
                  <mesh
                    key={index}
                    position={
                      position as [
                        number,
                        number,
                        number
                      ]
                    }
                    rotation={[
                      Math.PI / 2,
                      0,
                      0,
                    ]}
                    castShadow
                  >
                    <cylinderGeometry
                      args={[
                        0.42,
                        0.42,
                        0.3,
                        24,
                      ]}
                    />

                    <meshStandardMaterial
                      color="#080808"
                    />
                  </mesh>
                )
              )}
            </group>
          );
        }

        return null;
      })}
    </>
  );
}

/* =========================================================
   PLAY SCENE
========================================================= */

function PlayScene({
  objects,
  spawn,
}: {
  objects: WorldObject[];
  spawn: [number, number, number];
}) {
  const playerRef =
    useRef<THREE.Group>(null);

  return (
    <>
      <color
        attach="background"
        args={[
          "#101522",
        ]}
      />

      <ambientLight
        intensity={1.8}
      />

      <directionalLight
        position={[
          10,
          20,
          10,
        ]}
        intensity={3}
        castShadow
      />

      {/* GROUND */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          -0.05,
          0,
        ]}
        receiveShadow
      >
        <planeGeometry
          args={[
            500,
            500,
          ]}
        />

        <meshStandardMaterial
          color="#30343b"
          roughness={0.9}
        />
      </mesh>

      {/* GRID */}

      <Grid
        infiniteGrid
        fadeDistance={80}
        fadeStrength={5}
        cellSize={1}
        sectionSize={5}
        sectionThickness={1}
        cellThickness={0.5}
      />

      <WorldObjects
        objects={objects}
      />

      <Player
        spawn={spawn}
        playerRef={playerRef}
      />

      <PlayerCamera
        player={playerRef}
      />
    </>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function PlayPage() {
  const [worldId, setWorldId] =
    useState<string | null>(
      null
    );

  const [objects, setObjects] =
    useState<WorldObject[]>(
      []
    );

  const [spawn, setSpawn] =
    useState<
      [number, number, number]
    >([
      0,
      0,
      0,
    ]);

  const [worldName, setWorldName] =
    useState(
      "Nova World"
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const id =
      params.get("world");

    setWorldId(id);

    async function loadWorld() {
      if (!id) {
        setLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("worlds")
        .select(
          "name, world_data"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(
          "World loading error:",
          error
        );

        setWorldName(
          "Nova World"
        );

        setLoading(false);
        return;
      }

      setWorldName(
        data?.name ||
          "Nova World"
      );

      const worldData =
        data?.world_data as
          | WorldData
          | null;

      if (
        worldData &&
        Array.isArray(
          worldData.objects
        )
      ) {
        setObjects(
          worldData.objects
        );
      }

      if (
        worldData?.spawn
      ) {
        setSpawn([
          worldData.spawn.x,
          worldData.spawn.y,
          worldData.spawn.z,
        ]);
      } else {
        setSpawn([
          0,
          0,
          0,
        ]);
      }

      setLoading(false);
    }

    loadWorld();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#070b12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-black tracking-widest">
            NOVA
          </div>

          <div className="text-gray-400 mt-3">
            Loading Play Mode...
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen bg-black overflow-hidden relative">
      <Keyboard />

      <Canvas
        className="absolute inset-0 w-full h-full"
        shadows
        camera={{
          position: [
            0,
            4,
            8,
          ],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
        }}
      >
        <PlayScene
          objects={objects}
          spawn={spawn}
        />
      </Canvas>

      {/* =================================================
          TOP LEFT
      ================================================= */}

      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
          <div className="text-white font-black text-lg">
            NOVA
          </div>

          <div className="text-gray-400 text-xs">
            {worldName}
          </div>
        </div>
      </div>

      {/* =================================================
          TOP RIGHT
      ================================================= */}

      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-right">
          <div className="text-green-400 text-sm font-bold">
            ● PLAYING
          </div>

          <div className="text-gray-400 text-xs mt-1">
            {worldId
              ? "Connected to world"
              : "Test World"}
          </div>
        </div>
      </div>

      {/* =================================================
          CROSSHAIR
      ================================================= */}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-5 h-5">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-2 bg-white/80" />

          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[2px] h-2 bg-white/80" />

          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-[2px] bg-white/80" />

          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-[2px] bg-white/80" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="absolute bottom-5 left-5 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-white">
          <div className="font-semibold mb-2">
            Controls
          </div>

          <div className="text-xs text-gray-400">
            <span className="text-white font-medium">
              W A S D
            </span>{" "}
            — Move
          </div>

          <div className="text-xs text-gray-400 mt-1">
            <span className="text-white font-medium">
              Shift
            </span>{" "}
            — Sprint
          </div>

          <div className="text-xs text-gray-400 mt-1">
            <span className="text-white font-medium">
              Space
            </span>{" "}
            — Jump
          </div>

          <div className="text-xs text-gray-400 mt-1">
            <span className="text-white font-medium">
              Mouse
            </span>{" "}
            — Camera
          </div>

          <div className="text-xs text-gray-400 mt-1">
            <span className="text-white font-medium">
              Wheel
            </span>{" "}
            — Zoom
          </div>
        </div>
      </div>
    </main>
  );
}