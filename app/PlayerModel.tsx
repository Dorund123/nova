"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import PlayerHair from "./PlayerHair";

type BodyOption =
  | "Default"
  | "Slim"
  | "Strong";

type ClothingOption =
  | "Default Outfit"
  | "Black Outfit"
  | "Blue Outfit"
  | "Street Outfit";

type AccessoryOption =
  | "None"
  | "Cap"
  | "Crown"
  | "Glasses";

type HairOption =
  | "Default Hair"
  | "Male Hair"
  | "Female Hair";

type PlayerModelProps = {
  body: BodyOption;
  clothing: ClothingOption;
  accessory: AccessoryOption;
  hair: HairOption;
  hairSize: number;
};

export default function PlayerModel({
  body,
  clothing,
  accessory,
  hair,
  hairSize,
}: PlayerModelProps) {
  const bodyGLTF = useGLTF(
    "/models/XBot.glb"
  );

  const playerModel = useMemo(() => {
    return SkeletonUtils.clone(
      bodyGLTF.scene
    );
  }, [bodyGLTF.scene]);

  // BODY
  useEffect(() => {
    if (body === "Slim") {
      playerModel.scale.set(
        0.9,
        1,
        0.9
      );
    } else if (body === "Strong") {
      playerModel.scale.set(
        1.1,
        1,
        1.1
      );
    } else {
      playerModel.scale.set(
        1,
        1,
        1
      );
    }
  }, [body, playerModel]);

  // CLOTHING
  useEffect(() => {
    playerModel.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const materials = Array.isArray(
        object.material
      )
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        if (!material.color) {
          return;
        }

        if (
          clothing === "Default Outfit"
        ) {
          material.color.set("#d8d8d8");
        }

        if (
          clothing === "Black Outfit"
        ) {
          material.color.set("#171717");
        }

        if (
          clothing === "Blue Outfit"
        ) {
          material.color.set("#2563eb");
        }

        if (
          clothing === "Street Outfit"
        ) {
          material.color.set("#525252");
        }
      });
    });
  }, [clothing, playerModel]);

  return (
    <group
      position={[
        0,
        -1.15,
        0,
      ]}
    >
      {/* BODY */}
      <primitive
        object={playerModel}
      />

      {/* HAIR */}
      <PlayerHair
        hair={hair}
        size={hairSize}
      />
    </group>
  );
}