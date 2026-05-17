import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { getRouteForMap } from "./navigation";
import {
  AircraftProfile,
  FlightEventKind,
  FlightMedal,
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
  streak: number;
  checkpointIndex: number;
  checkpointDistance: number;
  message: string;
  lessonGrade: number;
  event: FlightEventKind;
  eventLabel: string;
  eventIntensity: number;
  eventTimer: number;
  boostActive: boolean;
  shake: number;
  thrill: number;
  nearMissCount: number;
  completedRuns: number;
  runComplete: boolean;
  lastNearMissIndex: number;
  lowAltitudeCooldown: number;
  landingCooldown: number;
  wasStalled: boolean;
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

type ModeTuning = {
  gateRadius: number;
  checkpointScore: number;
  comboGain: number;
  comboDecay: number;
  completionBonus: number;
  speedBonus: number;
  lowAltitudeBonus: number;
  timePressure: number;
};

export function createInitialFlightState(
  aircraft: AircraftProfile,
  map: MapProfile,
  payload: PayloadState,
  modeId = "free-flight",
): FlightModelState {
  const startPosition = new Vector3(0, 260, 560);
  const firstWaypoint = getRouteForMap(map, modeId).waypoints[0];
  const routeVector = firstWaypoint.clone().sub(startPosition).normalize();
  const headingRad = -Math.atan2(routeVector.x, -routeVector.z);
  const initialQuaternion = new Quaternion().setFromEuler(new Euler(0, headingRad, 0, "YXZ"));
  const fuelWeightPenalty = 1 + (payload.fuelPercent - 55) / 420;
  const startSpeed = Math.min(aircraft.cruiseSpeed * 0.74, aircraft.maxSpeed * 0.54);
  const forward = forwardAxis.clone().applyQuaternion(initialQuaternion);

  return {
    position: startPosition,
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
    streak: 0,
    checkpointIndex: 0,
    checkpointDistance: 9999,
    message: "Airborne. Follow the first glowing gate.",
    lessonGrade: 100,
    event: "none",
    eventLabel: "",
    eventIntensity: 0,
    eventTimer: 0,
    boostActive: false,
    shake: 0,
    thrill: 0,
    nearMissCount: 0,
    completedRuns: 0,
    runComplete: false,
    lastNearMissIndex: -1,
    lowAltitudeCooldown: 0,
    landingCooldown: 0,
    wasStalled: false,
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
  const tuning = modeTuningFor(modeId);
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
  const boostStarted = boostActive && !state.boostActive;

  const emitEvent = (event: FlightEventKind, label: string, intensity = 0.55) => {
    state.event = event;
    state.eventLabel = label;
    state.eventIntensity = intensity;
    state.eventTimer = 0.72;
    state.shake = Math.max(state.shake, intensity);
  };

  const addScore = (amount: number) => {
    state.score += Math.max(0, Math.round(amount));
  };

  state.elapsed += dt;
  state.eventTimer = Math.max(0, state.eventTimer - dt);
  state.eventIntensity = state.eventTimer > 0 ? state.eventIntensity : 0;
  state.shake = Math.max(0, state.shake - dt * 1.45);
  state.lowAltitudeCooldown = Math.max(0, state.lowAltitudeCooldown - dt);
  state.landingCooldown = Math.max(0, state.landingCooldown - dt);
  state.runComplete = false;
  state.throttle = MathUtils.clamp(state.throttle + input.throttleDelta * 0.0018, 0, 1);

  if (boostStarted) {
    emitEvent("boost", "Boost burn. Hold the line.", 0.68);
  }

  if (input.trimUp) state.trim = MathUtils.clamp(state.trim + dt * 0.34, -1, 1);
  if (input.trimDown) state.trim = MathUtils.clamp(state.trim - dt * 0.34, -1, 1);
  if (input.flapsDown) state.flaps = MathUtils.clamp(state.flaps + dt * 0.7, 0, 1);
  if (input.flapsUp) state.flaps = MathUtils.clamp(state.flaps - dt * 0.7, 0, 1);
  if (input.gearToggle) {
    state.gearDown = !state.gearDown;
    input.gearToggle = false;
  }

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
    state.streak = 0;
    state.combo = Math.max(1, state.combo - dt * 0.7);
    if (!state.wasStalled) {
      emitEvent("stall", "Stall warning. Nose down, wings level.", 0.78);
    }
  } else if (state.wasStalled && state.speedKt > aircraft.stallSpeed * 1.22) {
    const recoveryBonus = 160 * state.combo;
    addScore(recoveryBonus);
    state.combo = Math.min(10.5, state.combo + 0.18);
    emitEvent("recovery", `Clean recovery +${Math.round(recoveryBonus)}`, 0.58);
  }
  state.wasStalled = stall;

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
    state.streak = 0;
    state.lessonGrade = Math.max(0, state.lessonGrade - Math.max(0, landingFirmness - 6) * 0.35);
    if (state.landingCooldown === 0) {
      if (landingFirmness > 18) {
        state.message = "Firm bounce. Recover attitude, add a little power, keep flying.";
        emitEvent("impact", "Firm contact. Recover, do not quit.", 0.82);
      } else {
        const landingBonus = 240 + Math.max(0, 130 - state.speedKt);
        addScore(landingBonus);
        state.message = "Smooth runway contact. Hold attitude and bleed speed.";
        emitEvent("landing", `Smooth touchdown +${Math.round(landingBonus)}`, 0.46);
      }
      state.landingCooldown = 3.5;
    }
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
  const route = getRouteForMap(map, modeId);
  const activeWaypoint = route.waypoints[state.checkpointIndex % route.waypoints.length];
  state.checkpointDistance = weightedGateDistance(state.position, activeWaypoint);
  const nearGate =
    state.checkpointDistance < tuning.gateRadius + 42 &&
    state.checkpointDistance > tuning.gateRadius &&
    state.lastNearMissIndex !== state.checkpointIndex;

  if (nearGate && state.speedKt > aircraft.stallSpeed * 1.8) {
    const nearMissBonus = (90 + state.speedKt * 0.28) * state.combo;
    addScore(nearMissBonus);
    state.nearMissCount += 1;
    state.lastNearMissIndex = state.checkpointIndex;
    state.combo = Math.min(10.5, state.combo + 0.12);
    emitEvent("near-miss", `Gate edge skim +${Math.round(nearMissBonus)}`, 0.52);
  }

  if (state.checkpointDistance < tuning.gateRadius) {
    const timeBonus = Math.max(0, 720 - state.elapsed * tuning.timePressure);
    const speedBonus = Math.max(0, state.speedKt - aircraft.cruiseSpeed * 0.72) * tuning.speedBonus;
    const smoothBonus =
      modeId === "sky-delivery" && gForce < 2.45 && Math.abs(verticalSpeedFpm) < 680 ? 240 : 0;
    const academyBonus =
      modeId === "sky-academy" && !stall && Math.abs(state.speedKt - aircraft.cruiseSpeed) < 90 ? 180 : 0;
    const checkpointScore =
      (tuning.checkpointScore + speedBonus + timeBonus + smoothBonus + academyBonus) * state.combo;

    addScore(checkpointScore);
    state.streak += 1;
    state.combo = Math.min(11, state.combo + tuning.comboGain + Math.min(0.22, state.streak * 0.012));
    state.checkpointIndex += 1;
    state.boost = Math.min(1, state.boost + (modeId === "time-trial" ? 0.3 : 0.23));
    state.lessonGrade = Math.min(100, state.lessonGrade + (modeId === "sky-academy" ? 1.8 : 0.6));

    if (state.checkpointIndex % route.waypoints.length === 0) {
      const completionBonus =
        tuning.completionBonus + Math.max(0, 1800 - state.elapsed * tuning.timePressure) * state.combo;
      addScore(completionBonus);
      state.completedRuns += 1;
      state.runComplete = true;
      state.boost = 1;
      state.message = `Route clear. ${gradeForMedal(medalForScore(modeId, state.score, state.elapsed))} run banked.`;
      emitEvent("run-complete", `Route clear +${Math.round(completionBonus)}`, 0.9);
    } else {
      state.message = checkpointMessage(modeId, state.checkpointIndex, Math.round(checkpointScore));
      emitEvent("checkpoint", `Gate ${state.checkpointIndex} +${Math.round(checkpointScore)}`, 0.66);
    }
  } else {
    state.combo = Math.max(1, state.combo - dt * tuning.comboDecay);
  }

  const terrainRush = state.position.y < 80 && state.speedKt > 180;
  state.thrill = MathUtils.lerp(state.thrill, terrainRush ? 1 : 0, dt * 4.8);
  if (terrainRush) {
    const rushScore = dt * state.speedKt * tuning.lowAltitudeBonus * state.combo;
    addScore(rushScore);
    state.combo = Math.min(10.5, state.combo + dt * 0.16);
    if (state.lowAltitudeCooldown === 0 && state.position.y < 48) {
      const lowBonus = (140 + state.speedKt * 0.45) * state.combo;
      addScore(lowBonus);
      state.nearMissCount += 1;
      state.lowAltitudeCooldown = modeId === "canyon-rush" ? 0.85 : 1.35;
      emitEvent("low-altitude", `Low pass +${Math.round(lowBonus)}`, 0.6);
    }
  }

  const headingDeg = headingFromQuaternion(state.quaternion);
  scratchEuler.setFromQuaternion(state.quaternion, "YXZ");
  const pitchDeg = MathUtils.radToDeg(scratchEuler.x);
  const bankDeg = MathUtils.radToDeg(scratchEuler.z);
  const rpm = MathUtils.clamp(820 + state.throttle * 2200 + (boostActive ? 620 : 0), 700, 3800);

  if (stall) {
    state.message = "Stall warning: lower the nose, level wings, then add power.";
  } else if (state.engineTemp > 1 && realism.engineStress) {
    state.message = "Engine temperature high. Reduce boost or enrich the climb profile.";
  } else if (modeId === "sky-academy" && Math.abs(verticalSpeedFpm) < 120 && state.speedKt > aircraft.stallSpeed * 1.35) {
    state.message = "Instructor: stable attitude. Small corrections are doing the work.";
  }

  state.boostActive = boostActive;
  input.throttleDelta = 0;
  const activeEvent = state.eventTimer > 0 ? state.event : "none";
  const medal = medalForScore(modeId, state.score, state.elapsed);
  const routeProgress = route.waypoints.length
    ? (state.checkpointIndex % route.waypoints.length) / route.waypoints.length
    : 0;

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
    pitchDeg,
    bankDeg,
    stall,
    stress,
    score: state.score,
    combo: state.combo,
    streak: state.streak,
    checkpointIndex: state.checkpointIndex,
    checkpointDistance: state.checkpointDistance,
    elapsed: state.elapsed,
    lessonGrade: state.lessonGrade,
    densityAltitudeFt,
    crosswindKt,
    event: activeEvent,
    eventLabel: activeEvent === "none" ? "" : state.eventLabel,
    eventIntensity: activeEvent === "none" ? 0 : state.eventIntensity,
    boostActive,
    boostReady: state.boost > 0.96,
    thrill: state.thrill,
    nearMissCount: state.nearMissCount,
    routeProgress,
    runComplete: state.runComplete,
    medal,
    grade: gradeForMedal(medal),
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
    pitchDeg: 0,
    bankDeg: 0,
    stall: false,
    stress: 0,
    score: 0,
    combo: 1,
    streak: 0,
    checkpointIndex: 0,
    checkpointDistance: 0,
    elapsed: 0,
    lessonGrade: 100,
    densityAltitudeFt: 0,
    crosswindKt: 0,
    event: "none",
    eventLabel: "",
    eventIntensity: 0,
    boostActive: false,
    boostReady: false,
    thrill: 0,
    nearMissCount: 0,
    routeProgress: 0,
    runComplete: false,
    medal: "none",
    grade: "Warmup",
    message: "Loading flight systems.",
  };
}

function headingFromQuaternion(quaternion: Quaternion) {
  scratchForward.copy(forwardAxis).applyQuaternion(quaternion);
  const radians = Math.atan2(scratchForward.x, -scratchForward.z);
  return (MathUtils.radToDeg(radians) + 360) % 360;
}

function weightedGateDistance(position: Vector3, waypoint: Vector3) {
  const dx = position.x - waypoint.x;
  const dy = (position.y - waypoint.y) * 0.42;
  const dz = position.z - waypoint.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function checkpointMessage(modeId: string, index: number, score: number) {
  if (modeId === "sky-delivery") return `Cargo gate ${index} delivered +${score}. Keep the cabin smooth.`;
  if (modeId === "sky-academy") return `Lesson gate ${index} +${score}. Cross-check speed, altitude, attitude.`;
  if (modeId === "canyon-rush") return `Rush gate ${index} +${score}. Low line bonus is live.`;
  if (modeId === "time-trial") return `Gate ${index} +${score}. Boost toward the next ring.`;
  if (modeId === "pilot-sandbox") return `Practice waypoint ${index} +${score}. Try the same line in another aircraft.`;
  return `Waypoint ${index} +${score}. Route updated.`;
}

function modeTuningFor(modeId: string): ModeTuning {
  if (modeId === "time-trial") {
    return {
      gateRadius: 118,
      checkpointScore: 360,
      comboGain: 0.52,
      comboDecay: 0.06,
      completionBonus: 2200,
      speedBonus: 2.2,
      lowAltitudeBonus: 0.2,
      timePressure: 7.2,
    };
  }

  if (modeId === "canyon-rush") {
    return {
      gateRadius: 92,
      checkpointScore: 420,
      comboGain: 0.6,
      comboDecay: 0.04,
      completionBonus: 2600,
      speedBonus: 2.8,
      lowAltitudeBonus: 0.78,
      timePressure: 5.4,
    };
  }

  if (modeId === "sky-delivery") {
    return {
      gateRadius: 128,
      checkpointScore: 300,
      comboGain: 0.34,
      comboDecay: 0.08,
      completionBonus: 2100,
      speedBonus: 0.9,
      lowAltitudeBonus: 0.18,
      timePressure: 3.2,
    };
  }

  if (modeId === "sky-academy") {
    return {
      gateRadius: 132,
      checkpointScore: 280,
      comboGain: 0.28,
      comboDecay: 0.035,
      completionBonus: 1800,
      speedBonus: 0.8,
      lowAltitudeBonus: 0.12,
      timePressure: 2.6,
    };
  }

  if (modeId === "pilot-sandbox") {
    return {
      gateRadius: 146,
      checkpointScore: 240,
      comboGain: 0.24,
      comboDecay: 0.025,
      completionBonus: 1600,
      speedBonus: 0.7,
      lowAltitudeBonus: 0.18,
      timePressure: 1.8,
    };
  }

  return {
    gateRadius: 136,
    checkpointScore: 260,
    comboGain: 0.3,
    comboDecay: 0.03,
    completionBonus: 1800,
    speedBonus: 1,
    lowAltitudeBonus: 0.32,
    timePressure: 2.4,
  };
}

function medalForScore(modeId: string, score: number, elapsed: number): FlightMedal {
  const timeAdjustment = Math.max(0, 1 - elapsed / 420);
  const adjustedScore = score * (1 + timeAdjustment * (modeId === "time-trial" ? 0.18 : 0.08));
  const ace =
    modeId === "canyon-rush" ? 15000 : modeId === "time-trial" ? 13800 : modeId === "sky-delivery" ? 11200 : 10400;
  const gold = ace * 0.72;
  const silver = ace * 0.48;
  const bronze = ace * 0.28;

  if (adjustedScore >= ace) return "ace";
  if (adjustedScore >= gold) return "gold";
  if (adjustedScore >= silver) return "silver";
  if (adjustedScore >= bronze) return "bronze";
  return "none";
}

function gradeForMedal(medal: FlightMedal) {
  if (medal === "ace") return "Ace";
  if (medal === "gold") return "Gold";
  if (medal === "silver") return "Silver";
  if (medal === "bronze") return "Bronze";
  return "Warmup";
}
