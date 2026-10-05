"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

export type HairOption =
  | "Default Hair"
  | "Male Hair"
  | "Female Hair";

type PlayerHairProps = {
  hair: HairOption;
  size: number;
};

export default function PlayerHair({
  hair,
  size,
}: PlayerHairProps) {
  const male = useGLTF("/models/hair/male.glb");
  const female = useGLTF("/models/hair/female.glb");

  const hairModel = useMemo(() => {
    if (hair === "Male Hair") {
      return SkeletonUtils.clone(male.scene);
    }

    if (hair === "Female Hair") {
      return SkeletonUtils.clone(female.scene);
    }

    return null;
  }, [hair, male.scene, female.scene]);

  if (!hairModel) {
    return null;
  }

  hairModel.traverse((object) => {
    object.visible = true;

    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return (
    <primitive
      object={hairModel}
      position={[0, 1.65, 0]}
      scale={[size, size, size]}
    />
  );
}