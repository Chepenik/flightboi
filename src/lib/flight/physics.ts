import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { getRouteForMap } from "./navigation";
import {
  AircraftProfile,
  FlightTelemetry,
  InputFrame,
  MapProfile,
  PayloadState,
  RealismSettings,
} from "./types";

export type FlightModelState = {
  position: Vector3;
  velocity: Vector3;
  quaternion: Quaternion;
  speedKt: number;
  throttle: number;
  boost: number;
  trim: number;
  flaps: number;
  gearDown: boolean;
  fuelPercent: number;
  engineTemp: number;
  elapsed: number;
  score: number;
  combo: number;
  checkpointIndex: number;
  checkpointDistance: number;
  message: string;
  lessonGrade: number;
  lastGearToggle: boolean;
};

const forwardAxis = new Vector3(0, 0, -1);
const upAxis = new Vector3(0, 1, 0);
const rightAxis = new Vector3(1, 0, 0);
const scratchForward = new Vector3();
const scratchUp = new Vector3();
const scratchRight = new Vector3();
const scratchWind = new Vector3();
const scratchEuler = new Euler();
const scratchQuaternion = new Quaternion();
const scratchVec = new Vector3();

export function createInitialFlightState(
  aircraft: AircraftProfile,
  map: MapProfile,
  payload: PayloadState,
): FlightModelState {
  const headingRad = MathUtils.degToRad(map.runwayHeading);
  const initialQuaternion = new Quaternion().setFromEuler(new Euler(0, headingRad, 0, "YXZ"));
  const fuelWeightPenalty = 1 + (payload.fuelPercent - 55) / 420;
  const startSpeed = Math.min(aircraft.cruiseSpeed * 0.74, aircraft.maxSpeed * 0.54);
  const forward = forwardAxis.clone().applyQuaternion(initialQuaternion);

  return {
    position: new Vector3(0, 260, 560),
    velocity: forward.multiplyScalar(startSpeed * 0.72),
    quaternion: initialQuaternion,
    speedKt: startSpeed / fuelWeightPenalty,
    throttle: 0.64,
    boost: 0,
    trim: 0,
    flaps: 0,
    gearDown: false,
    fuelPercent: payload.fuelPercent,
    engineTemp: 0.42,
    elapsed: 0,
    score: 0,
    combo: 1,
    checkpointIndex: 0,
    checkpointDistance: 9999,
    message: "Airborne. Arrow keys fly, scroll sets throttle.",
    lessonGrade: 100,
    lastGearToggle: false,
  };
}

export function payloadMassKg(aircraft: AircraftProfile, payload: PayloadState) {
  return aircraft.mass + payload.passengers * 86 + payload.cargoKg + payload.fuelPercent * 4.8;
}

export function simulateFlight(
  state: FlightModelState,
  input: InputFrame,
  context: {
    aircraft: AircraftProfile;
    map: MapProfile;
    payload: PayloadState;
    realism: RealismSettings;
    modeId: string;
  },
  rawDelta: number,
): FlightTelemetry {
  const dt = Math.min(rawDelta, 1 / 24);
  const { aircraft, map, payload, realism, modeId } = context;
  const massFactor = MathUtils.clamp(payloadMassKg(aircraft, payload) / aircraft.mass, 1, 1.85);
  const cgOffset = (payload.cgPercent - 50) / 50;
  const densityAltitudeFt =
    realism.densityAltitude && (map.id === "crimson-dunes" || map.id === "alpine-dominion")
      ? Math.max(0, state.position.y * 3.28084 + (map.id === "crimson-dunes" ? 2600 : 1900))
      : Math.max(0, state.position.y * 3.28084);
  const densityFactor = realism.densityAltitude
    ? MathUtils.clamp(1 - densityAltitudeFt / 42000, 0.64, 1)
    : 1;
  const flapsLift = realism.flaps ? state.flaps * 0.16 : 0;
  const trimAssist = realism.trim ? state.trim * 0.22 : 0;
  const boostActive = input.boost && state.boost > 0.04;
  const airBrake = input.airBrake ? 1 : 0;

  state.elapsed += dt;
  state.throttle = MathUtils.clamp(state.throttle + input.throttleDelta * 0.0018, 0, 1);

  if (input.trimUp) state.trim = MathUtils.clamp(state.trim + dt * 0.34, -1, 1);
  if (input.trimDown) state.trim = MathUtils.clamp(state.trim - dt * 0.34, -1, 1);
  if (input.flapsDown) state.flaps = MathUtils.clamp(state.flaps + dt * 0.7, 0, 1);
  if (input.flapsUp) state.flaps = MathUtils.clamp(state.flaps - dt * 0.7, 0, 1);
  if (input.gearToggle && !state.lastGearToggle) state.gearDown = !state.gearDown;
  state.lastGearToggle = input.gearToggle;

  const rollAuthority =
    aircraft.rollRate * (1.05 - Math.abs(cgOffset) * 0.16) * MathUtils.clamp(state.speedKt / 140, 0.52, 1.4);
  const pitchAuthority =
    aircraft.pitchRate *
    (1 - Math.max(0, massFactor - 1) * 0.24) *
    MathUtils.clamp(state.speedKt / 130, 0.48, 1.28);
  const yawAuthority = aircraft.yawRate * MathUtils.clamp(state.speedKt / 160, 0.35, 1.1);

  const pitchInput = MathUtils.clamp(input.pitch + trimAssist - cgOffset * 0.08, -1, 1);
  const rollInput = MathUtils.clamp(input.roll, -1, 1);
  const yawInput = MathUtils.clamp(input.yaw, -1, 1);

  state.quaternion.multiply(
    scratchQuaternion.setFromAxisAngle(rightAxis, pitchInput * pitchAuthority * dt),
  );
  state.quaternion.multiply(
    scratchQuaternion.setFromAxisAngle(forwardAxis, -rollInput * rollAuthority * dt),
  );
  state.quaternion.multiply(
    scratchQuaternion.setFromAxisAngle(upAxis, yawInput * yawAuthority * dt),
  );

  scratchEuler.setFromQuaternion(state.quaternion, "YXZ");
  const bankAutoYaw =
    -Math.sin(scratchEuler.z) *
    aircraft.yawRate *
    0.36 *
    MathUtils.clamp(state.speedKt / 180, 0.28, 1.1);
  state.quaternion.multiply(scratchQuaternion.setFromAxisAngle(upAxis, bankAutoYaw * dt));
  state.quaternion.normalize();

  scratchForward.copy(forwardAxis).applyQuaternion(state.quaternion).normalize();
  scratchUp.copy(upAxis).applyQuaternion(state.quaternion).normalize();
  scratchRight.copy(rightAxis).applyQuaternion(state.quaternion).normalize();

  const windSpeed = realism.wind ? map.wind.speedKt + Math.sin(state.elapsed * 0.9) * map.wind.gustKt * 0.25 : 0;
  const windDirection = MathUtils.degToRad(map.wind.directionDeg);
  scratchWind.set(Math.sin(windDirection), 0, Math.cos(windDirection)).multiplyScalar(windSpeed * 0.16);
  const crosswindKt = Math.abs(scratchRight.dot(scratchWind)) * 4.8;
  const turbulence =
    realism.turbulence || modeId === "canyon-rush"
      ? (Math.sin(state.elapsed * 2.7) + Math.sin(state.elapsed * 5.3 + state.position.x * 0.002)) * 0.5
      : 0;

  const targetSpeed =
    aircraft.stallSpeed * 0.86 +
    state.throttle * aircraft.maxSpeed * densityFactor +
    (boostActive ? aircraft.boostThrust * 3.6 : 0) -
    airBrake * 96 -
    state.flaps * 34 -
    (state.gearDown ? 28 : 0);
  const climbPenalty = Math.max(0, scratchForward.y) * 88 * massFactor;
  const diveBonus = Math.max(0, -scratchForward.y) * 54 * aircraft.energyRetention;
  const dragPenalty = aircraft.drag * state.speedKt * state.speedKt * 0.00056;
  const acceleration =
    ((targetSpeed - state.speedKt) * 0.82 + diveBonus - climbPenalty - dragPenalty) /
    MathUtils.lerp(1, massFactor, 0.45);
  state.speedKt = MathUtils.clamp(state.speedKt + acceleration * dt, 24, aircraft.maxSpeed + 160);

  const aoaDeg = MathUtils.radToDeg(
    Math.atan2(
      scratchUp.dot(state.velocity.clone().normalize()) - 0.04,
      Math.max(0.2, scratchForward.dot(state.velocity.clone().normalize())),
    ),
  );
  const stall =
    realism.stalls &&
    (state.speedKt < aircraft.stallSpeed * (1 + state.flaps * 0.08) || Math.abs(aoaDeg) > 17.5);
  if (stall) {
    state.quaternion.multiply(
      scratchQuaternion.setFromAxisAngle(rightAxis, -MathUtils.degToRad(16) * dt),
    );
    state.lessonGrade = Math.max(0, state.lessonGrade - dt * 9);
  }

  const liftReserve = MathUtils.clamp(
    (state.speedKt - aircraft.stallSpeed * 0.72) / (aircraft.stallSpeed * 1.8),
    -0.65,
    1.4,
  );
  const liftForce =
    (liftReserve * aircraft.lift + flapsLift) * 15.8 * densityFactor - (massFactor - 1) * 7.2;
  const gravity = realism.preset === "game" ? 4.8 : 8.2;
  const gravityDrop = (gravity - liftForce) * dt;
  const desiredVelocity = scratchVec
    .copy(scratchForward)
    .multiplyScalar(state.speedKt * 0.53)
    .add(scratchWind)
    .addScaledVector(scratchUp, Math.max(-8, liftForce * 0.18));
  const agility = MathUtils.clamp(aircraft.stability * 0.035 + 0.035, 0.045, 0.11);
  state.velocity.lerp(desiredVelocity, MathUtils.clamp(agility * 60 * dt, 0, 0.18));
  state.velocity.y -= gravityDrop;
  state.velocity.y += turbulence * (modeId === "canyon-rush" ? 0.7 : 0.28);
  state.position.addScaledVector(state.velocity, dt);

  if (state.position.y < 9) {
    const landingFirmness = Math.abs(state.velocity.y);
    state.position.y = 9;
    state.velocity.y = Math.max(0, state.velocity.y) * 0.18;
    state.speedKt *= landingFirmness > 18 ? 0.82 : 0.95;
    state.combo = 1;
    state.lessonGrade = Math.max(0, state.lessonGrade - Math.max(0, landingFirmness - 6) * 0.35);
    state.message =
      landingFirmness > 18
        ? "Firm touchdown. Stabilize earlier: speed, descent rate, centerline."
        : "Smooth runway contact. Hold attitude and bleed speed.";
  }

  if (boostActive) {
    state.boost = Math.max(0, state.boost - dt * 0.23);
  } else {
    state.boost = Math.min(1, state.boost + dt * 0.058);
  }

  const fuelBurn = (state.throttle * 0.018 + (boostActive ? 0.038 : 0.004)) * dt;
  state.fuelPercent = Math.max(0, state.fuelPercent - fuelBurn);
  state.engineTemp = MathUtils.clamp(
    state.engineTemp + (state.throttle * 0.04 + (boostActive ? 0.12 : -0.025)) * dt,
    0.2,
    1.15,
  );

  const route = getRouteForMap(map, modeId);
  const activeWaypoint = route.waypoints[state.checkpointIndex % route.waypoints.length];
  state.checkpointDistance = state.position.distanceTo(activeWaypoint);
  if (state.checkpointDistance < (modeId === "canyon-rush" ? 72 : 92)) {
    state.score += Math.round(200 * state.combo + Math.max(0, 520 - state.checkpointDistance));
    state.combo = Math.min(9, state.combo + 0.35);
    state.checkpointIndex += 1;
    state.boost = Math.min(1, state.boost + 0.22);
    state.message = checkpointMessage(modeId, state.checkpointIndex);
  } else {
    state.combo = Math.max(1, state.combo - dt * 0.045);
  }

  const terrainRush = state.position.y < 80 && state.speedKt > 180;
  if (terrainRush) {
    state.score += Math.round(dt * state.speedKt * 0.4);
    state.combo = Math.min(9, state.combo + dt * 0.12);
  }

  const gForce = MathUtils.clamp(
    1 + Math.abs(rollInput) * 1.4 + Math.max(0, pitchInput) * 1.8 + state.speedKt / 920,
    0.2,
    8.5,
  );
  const stress = MathUtils.clamp((gForce - 4.2) / 3.2 + (airBrake && state.speedKt > 360 ? 0.35 : 0), 0, 1);
  if (realism.structuralStress && stress > 0.86) {
    state.lessonGrade = Math.max(0, state.lessonGrade - dt * 6);
    state.message = "High-G stress. Unload the wing before tightening the turn.";
  }

  const verticalSpeedFpm = state.velocity.y * 118.11;
  const headingDeg = headingFromQuaternion(state.quaternion);
  const rpm = MathUtils.clamp(820 + state.throttle * 2200 + (boostActive ? 620 : 0), 700, 3800);

  if (stall) {
    state.message = "Stall warning: lower the nose, level wings, then add power.";
  } else if (state.engineTemp > 1 && realism.engineStress) {
    state.message = "Engine temperature high. Reduce boost or enrich the climb profile.";
  } else if (modeId === "sky-academy" && Math.abs(verticalSpeedFpm) < 120 && state.speedKt > aircraft.stallSpeed * 1.35) {
    state.message = "Instructor: stable attitude. Small corrections are doing the work.";
  }

  input.throttleDelta = 0;

  return {
    speedKt: state.speedKt,
    altitudeFt: Math.max(0, state.position.y * 3.28084),
    verticalSpeedFpm,
    headingDeg,
    throttle: state.throttle,
    boost: state.boost,
    aoaDeg,
    trim: state.trim,
    flaps: state.flaps,
    gearDown: state.gearDown,
    fuelPercent: state.fuelPercent,
    rpm,
    engineTemp: state.engineTemp,
    gForce,
    stall,
    stress,
    score: state.score,
    combo: state.combo,
    checkpointIndex: state.checkpointIndex,
    checkpointDistance: state.checkpointDistance,
    elapsed: state.elapsed,
    lessonGrade: state.lessonGrade,
    densityAltitudeFt,
    crosswindKt,
    message: state.message,
  };
}

export function defaultTelemetry(): FlightTelemetry {
  return {
    speedKt: 0,
    altitudeFt: 0,
    verticalSpeedFpm: 0,
    headingDeg: 0,
    throttle: 0,
    boost: 0,
    aoaDeg: 0,
    trim: 0,
    flaps: 0,
    gearDown: false,
    fuelPercent: 0,
    rpm: 0,
    engineTemp: 0,
    gForce: 1,
    stall: false,
    stress: 0,
    score: 0,
    combo: 1,
    checkpointIndex: 0,
    checkpointDistance: 0,
    elapsed: 0,
    lessonGrade: 100,
    densityAltitudeFt: 0,
    crosswindKt: 0,
    message: "Loading flight systems.",
  };
}

function headingFromQuaternion(quaternion: Quaternion) {
  scratchForward.copy(forwardAxis).applyQuaternion(quaternion);
  const radians = Math.atan2(scratchForward.x, -scratchForward.z);
  return (MathUtils.radToDeg(radians) + 360) % 360;
}

function checkpointMessage(modeId: string, index: number) {
  if (modeId === "sky-delivery") return `Cargo route checkpoint ${index}. Smooth handling bonus armed.`;
  if (modeId === "sky-academy") return `Lesson gate ${index}. Cross-check speed, altitude, and attitude.`;
  if (modeId === "canyon-rush") return `Rush gate ${index}. Near-terrain combo climbing.`;
  if (modeId === "time-trial") return `Gate ${index}. Carry momentum into the next turn.`;
  return `Waypoint ${index}. Route updated.`;
}
