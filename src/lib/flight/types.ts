import type { ColorRepresentation } from "three";

export type AircraftId = "falcon-x" | "wraith-interceptor" | "atlas-cruiser";

export type MapId =
  | "alpine-dominion"
  | "neon-pacific"
  | "emerald-frontier"
  | "crimson-dunes"
  | "azure-archipelago";

export type GameModeId =
  | "free-flight"
  | "time-trial"
  | "canyon-rush"
  | "sky-delivery"
  | "sky-academy"
  | "pilot-sandbox";

export type RealismPreset =
  | "game"
  | "pilot-familiarization"
  | "near-sim"
  | "custom";

export type CameraMode =
  | "chase"
  | "external"
  | "cinematic"
  | "flyby"
  | "cockpit"
  | "free-look";

export type ControlMode = "keyboard" | "hybrid" | "mouse";

export type HudLayout = "clean" | "full" | "minimal";

export type WeatherKind =
  | "clear"
  | "snow"
  | "rain"
  | "storm"
  | "fog"
  | "dust"
  | "ocean-haze";

export type AcademyLessonId =
  | "basic-flight"
  | "turning-coordination"
  | "takeoffs"
  | "landings"
  | "crosswind"
  | "mountain-flying"
  | "storm-flying"
  | "navigation"
  | "energy-management"
  | "emergency-recovery";

export type AircraftProfile = {
  id: AircraftId;
  name: string;
  role: string;
  description: string;
  accent: string;
  secondaryAccent: string;
  hudColor: string;
  mass: number;
  wingArea: number;
  maxSpeed: number;
  cruiseSpeed: number;
  stallSpeed: number;
  thrust: number;
  boostThrust: number;
  lift: number;
  drag: number;
  rollRate: number;
  pitchRate: number;
  yawRate: number;
  stability: number;
  energyRetention: number;
  cameraShake: number;
  cockpit: {
    panel: string;
    instrumentColor: string;
    warningColor: string;
  };
  soundProfile: {
    idle: string;
    boost: string;
    wind: string;
  };
};

export type MapProfile = {
  id: MapId;
  name: string;
  inspiration: string;
  tagline: string;
  weather: WeatherKind;
  skyTop: string;
  skyBottom: string;
  sunColor: string;
  fogColor: string;
  groundColor: ColorRepresentation;
  waterColor: ColorRepresentation;
  accent: string;
  runwayHeading: number;
  wind: {
    directionDeg: number;
    speedKt: number;
    gustKt: number;
  };
  hazards: string[];
  features: string[];
};

export type GameModeProfile = {
  id: GameModeId;
  name: string;
  shortName: string;
  description: string;
  learningFocus: string;
};

export type AcademyLesson = {
  id: AcademyLessonId;
  title: string;
  objective: string;
  checkpoints: string[];
  mistakeCoaching: string;
};

export type PayloadState = {
  passengers: number;
  cargoKg: number;
  fuelPercent: number;
  cgPercent: number;
};

export type RealismSettings = {
  preset: RealismPreset;
  stalls: boolean;
  trim: boolean;
  flaps: boolean;
  densityAltitude: boolean;
  wind: boolean;
  turbulence: boolean;
  structuralStress: boolean;
  engineStress: boolean;
  icing: boolean;
  crosswind: boolean;
  gyroDrift: boolean;
};

export type ControlSettings = {
  mode: ControlMode;
  pitchSensitivity: number;
  rollSensitivity: number;
  yawSensitivity: number;
  mouseSensitivity: number;
  invertPitch: boolean;
  wasdEnabled: boolean;
};

export type HudSettings = {
  layout: HudLayout;
  opacity: number;
  showAdvancedRibbon: boolean;
};

export type FlightTelemetry = {
  speedKt: number;
  altitudeFt: number;
  verticalSpeedFpm: number;
  headingDeg: number;
  throttle: number;
  boost: number;
  aoaDeg: number;
  trim: number;
  flaps: number;
  gearDown: boolean;
  fuelPercent: number;
  rpm: number;
  engineTemp: number;
  gForce: number;
  pitchDeg: number;
  bankDeg: number;
  stall: boolean;
  stress: number;
  score: number;
  combo: number;
  checkpointIndex: number;
  checkpointDistance: number;
  elapsed: number;
  lessonGrade: number;
  densityAltitudeFt: number;
  crosswindKt: number;
  message: string;
};

export type InputFrame = {
  pitch: number;
  roll: number;
  yaw: number;
  throttleDelta: number;
  boost: boolean;
  airBrake: boolean;
  brakeRelease: boolean;
  trimUp: boolean;
  trimDown: boolean;
  flapsUp: boolean;
  flapsDown: boolean;
  gearToggle: boolean;
  reset: boolean;
};
