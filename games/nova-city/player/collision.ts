import { BUILDINGS, CITY_BOUNDS, PLAYER_RADIUS } from "../constants";

function hitsBuilding(x: number, z: number) {
  for (const building of BUILDINGS) {
    const halfW = building.w / 2 + PLAYER_RADIUS;
    const halfD = building.d / 2 + PLAYER_RADIUS;

    if (
      x > building.x - halfW &&
      x < building.x + halfW &&
      z > building.z - halfD &&
      z < building.z + halfD
    ) {
      return true;
    }
  }

  return false;
}

export function resolveHorizontalMove(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
) {
  const clampedX = Math.min(CITY_BOUNDS, Math.max(-CITY_BOUNDS, toX));
  const clampedZ = Math.min(CITY_BOUNDS, Math.max(-CITY_BOUNDS, toZ));

  let nextX = clampedX;
  let nextZ = clampedZ;

  if (hitsBuilding(nextX, fromZ)) {
    nextX = fromX;
  }

  if (hitsBuilding(nextX, nextZ)) {
    nextZ = fromZ;
  }

  return { x: nextX, z: nextZ };
}
