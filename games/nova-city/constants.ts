export const SPAWN_POINT = {
  x: 0,
  y: 0,
  z: 6,
} as const;

export const PLAYER_HEIGHT = 1.7;
export const PLAYER_RADIUS = 0.38;
export const MOVE_SPEED = 8;
export const SPRINT_MULTIPLIER = 1.35;
export const JUMP_VELOCITY = 8.2;
export const GRAVITY = 22;
export const CAMERA_DISTANCE = 6.4;
export const CAMERA_HEIGHT = 1.55;
export const MOUSE_SENSITIVITY = 0.0022;
export const PITCH_MIN = -0.55;
export const PITCH_MAX = 0.85;

export type BuildingSpec = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  accent?: string;
};

export const BUILDINGS: BuildingSpec[] = [
  { x: -22, z: -20, w: 12, d: 10, h: 18, color: "#3b82f6", accent: "#dbeafe" },
  { x: 22, z: -22, w: 11, d: 12, h: 24, color: "#64748b", accent: "#93c5fd" },
  { x: -24, z: 18, w: 10, d: 12, h: 16, color: "#60a5fa", accent: "#ffffff" },
  { x: 24, z: 20, w: 12, d: 10, h: 20, color: "#475569", accent: "#38bdf8" },
  { x: -8, z: -28, w: 8, d: 8, h: 12, color: "#2563eb", accent: "#bfdbfe" },
  { x: 8, z: -30, w: 9, d: 7, h: 28, color: "#38bdf8", accent: "#eff6ff" },
  { x: -36, z: -4, w: 8, d: 14, h: 14, color: "#94a3b8", accent: "#67e8f9" },
  { x: 36, z: 2, w: 9, d: 13, h: 22, color: "#1d4ed8", accent: "#dbeafe" },
  { x: -10, z: 30, w: 10, d: 8, h: 10, color: "#7dd3fc", accent: "#ffffff" },
  { x: 12, z: 32, w: 8, d: 9, h: 15, color: "#4f46e5", accent: "#c7d2fe" },
  { x: -32, z: -28, w: 7, d: 7, h: 32, color: "#0ea5e9", accent: "#e0f2fe" },
  { x: 32, z: -32, w: 8, d: 8, h: 11, color: "#93c5fd", accent: "#ffffff" },
];

export const CITY_BOUNDS = 48;
