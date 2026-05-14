"use client";

import { PerspectiveCamera, Stars } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, Object3D, Quaternion, Vector3 } from "three";
import { AircraftModel } from "./AircraftModel";
import { GridRunScene } from "./GridRunScene";
import { CheckpointRings, FlightParticles, RunwaySystem, WorldGeometry } from "./World";
import { useFlightInput } from "@/hooks/useFlightInput";
import { getAircraft, getMap } from "@/lib/flight/catalog";
import { getRouteForMap } from "@/lib/flight/navigation";
import { createInitialFlightState, FlightModelState, simulateFlight } from "@/lib/flight/physics";
import { useGameStore } from "@/lib/flight/store";

const forwardAxis = new Vector3(0, 0, -1);
const upAxis = new Vector3(0, 1, 0);
const rightAxis = new Vector3(1, 0, 0);
const cameraTarget = new Vector3();
const lookTarget = new Vector3();
const forward = new Vector3();
const up = new Vector3();
const right = new Vector3();
const tempQuaternion = new Quaternion();

export function FlightScene() {
  const easterEggMode = useGameStore((state) => state.easterEggMode);

  if (easterEggMode === "grid-run") return <GridRunScene />;

  return <NormalFlightScene />;
}

function NormalFlightScene() {
  const inputRef = useFlightInput();
  const aircraftId = useGameStore((state) => state.aircraftId);
  const mapId = useGameStore((state) => state.mapId);
  const modeId = useGameStore((state) => state.modeId);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const payload = useGameStore((state) => state.payload);
  const realism = useGameStore((state) => state.realism);
  const setTelemetry = useGameStore((state) => state.setTelemetry);
  const revision = useGameStore((state) => state.revision);
  const quality = useGameStore((state) => state.quality);
  const checkpointIndex = useGameStore((state) => state.telemetry.checkpointIndex);
  const aircraft = useMemo(() => getAircraft(aircraftId), [aircraftId]);
  const map = useMemo(() => getMap(mapId), [mapId]);
  const route = useMemo(() => getRouteForMap(map, modeId), [map, modeId]);
  const flightRef = useRef<FlightModelState>(createInitialFlightState(aircraft, map, payload));
  const payloadRef = useRef(payload);
  const aircraftGroup = useRef<Group>(null);
  const lastTelemetry = useRef(0);
  const flybyAnchor = useRef(new Vector3(-260, 120, 320));
  const { camera } = useThree();

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    flightRef.current.fuelPercent = payload.fuelPercent;
  }, [payload.fuelPercent]);

  useEffect(() => {
    flightRef.current = createInitialFlightState(aircraft, map, payloadRef.current);
    lastTelemetry.current = 0;
  }, [aircraft, map, revision]);

  useFrame((renderState, delta) => {
    const flight = flightRef.current;
    const input = inputRef.current;

    if (input.reset) {
      flightRef.current = createInitialFlightState(aircraft, map, payload);
      input.reset = false;
      return;
    }

    const telemetry = simulateFlight(
      flight,
      input,
      { aircraft, map, payload, realism, modeId },
      delta,
    );

    if (aircraftGroup.current) {
      aircraftGroup.current.position.copy(flight.position);
      aircraftGroup.current.quaternion.copy(flight.quaternion);
    }

    updateCamera({
      camera,
      flight,
      aircraft,
      cameraMode,
      elapsed: renderState.clock.elapsedTime,
      flybyAnchor: flybyAnchor.current,
      delta,
    });

    if (renderState.clock.elapsedTime - lastTelemetry.current > 0.08) {
      setTelemetry(telemetry);
      lastTelemetry.current = renderState.clock.elapsedTime;
    }
  });

  const isNight = map.id === "neon-pacific";
  const lightIntensity = isNight ? 0.75 : 1.65;

  return (
    <>
      <color attach="background" args={[map.skyBottom]} />
      <fog attach="fog" args={[map.fogColor, 760, map.id === "crimson-dunes" ? 3900 : 5200]} />
      <ambientLight intensity={isNight ? 0.5 : 0.72} />
      <directionalLight
        castShadow
        position={[420, 620, 260]}
        intensity={lightIntensity}
        color={map.sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={1800}
        shadow-camera-left={-900}
        shadow-camera-right={900}
        shadow-camera-top={900}
        shadow-camera-bottom={-900}
      />
      <hemisphereLight args={[map.skyTop, map.groundColor, isNight ? 0.42 : 0.88]} />
      {isNight && <Stars radius={2600} depth={180} count={1600} factor={4} saturation={0.4} fade speed={0.35} />}
      <WorldGeometry map={map} quality={quality} />
      <RunwaySystem map={map} />
      <CheckpointRings route={route} activeIndex={checkpointIndex} accent={aircraft.accent} modeId={modeId} />
      <group ref={aircraftGroup}>
        <AircraftModel aircraft={aircraft} hidden={cameraMode === "cockpit"} />
      </group>
      <FlightParticles
        aircraft={aircraft}
        map={map}
        flight={flightRef}
        cameraMode={cameraMode}
      />
      <PerspectiveCamera makeDefault={false} />
    </>
  );
}

function updateCamera({
  camera,
  flight,
  aircraft,
  cameraMode,
  elapsed,
  flybyAnchor,
  delta,
}: {
  camera: Object3D & { fov?: number; updateProjectionMatrix?: () => void };
  flight: FlightModelState;
  aircraft: { cameraShake: number; maxSpeed: number };
  cameraMode: string;
  elapsed: number;
  flybyAnchor: Vector3;
  delta: number;
}) {
  forward.copy(forwardAxis).applyQuaternion(flight.quaternion).normalize();
  up.copy(upAxis).applyQuaternion(flight.quaternion).normalize();
  right.copy(rightAxis).applyQuaternion(flight.quaternion).normalize();

  const speedRatio = MathUtils.clamp(flight.speedKt / aircraft.maxSpeed, 0, 1.25);
  const shake =
    Math.sin(elapsed * 24) * aircraft.cameraShake * speedRatio * 0.35 +
    Math.sin(elapsed * 41) * aircraft.cameraShake * speedRatio * 0.12;
  const lag = MathUtils.clamp(delta * 3.6, 0.02, 0.18);

  if (cameraMode === "external") {
    cameraTarget
      .copy(flight.position)
      .addScaledVector(forward, -190)
      .addScaledVector(upAxis, 80 + speedRatio * 22)
      .addScaledVector(right, 58);
  } else if (cameraMode === "cinematic") {
    cameraTarget
      .copy(flight.position)
      .addScaledVector(forward, -230 - speedRatio * 70)
      .addScaledVector(upAxis, 58 + Math.sin(elapsed * 0.7) * 24)
      .addScaledVector(right, Math.sin(elapsed * 0.45) * 130);
  } else if (cameraMode === "flyby") {
    if (flight.position.distanceTo(flybyAnchor) < 130) {
      flybyAnchor
        .copy(flight.position)
        .addScaledVector(forward, 460)
        .addScaledVector(right, Math.sin(elapsed) > 0 ? 220 : -220)
        .addScaledVector(upAxis, 90);
    }
    cameraTarget.copy(flybyAnchor);
  } else if (cameraMode === "cockpit") {
    cameraTarget.copy(flight.position).addScaledVector(forward, 13).addScaledVector(up, 4.8);
    camera.position.lerp(cameraTarget, MathUtils.clamp(delta * 11, 0.08, 0.65));
    lookTarget.copy(flight.position).addScaledVector(forward, 420).addScaledVector(up, 9 + shake);
    tempQuaternion.copy(flight.quaternion);
    camera.quaternion.slerp(tempQuaternion, MathUtils.clamp(delta * 8, 0.08, 0.42));
    camera.lookAt(lookTarget);
    setCameraFov(camera, MathUtils.lerp(68, 82, speedRatio));
    return;
  } else if (cameraMode === "free-look") {
    cameraTarget
      .copy(flight.position)
      .addScaledVector(forward, -140)
      .addScaledVector(upAxis, 155)
      .addScaledVector(right, Math.sin(elapsed * 0.32) * 180);
  } else {
    cameraTarget
      .copy(flight.position)
      .addScaledVector(forward, -118 - speedRatio * 34)
      .addScaledVector(upAxis, 33 + speedRatio * 16)
      .addScaledVector(right, -flight.quaternion.z * 42);
  }

  cameraTarget.y += shake;
  camera.position.lerp(cameraTarget, lag);
  lookTarget
    .copy(flight.position)
    .addScaledVector(forward, 190 + speedRatio * 120)
    .addScaledVector(upAxis, 9 + shake * 0.2);
  camera.lookAt(lookTarget);
  setCameraFov(camera, MathUtils.lerp(62, cameraMode === "cinematic" ? 86 : 76, speedRatio));
}

function setCameraFov(camera: Object3D & { fov?: number; updateProjectionMatrix?: () => void }, fov: number) {
  if (typeof camera.fov !== "number") return;
  camera.fov = MathUtils.lerp(camera.fov, fov, 0.06);
  camera.updateProjectionMatrix?.();
}

export function stopPropagation(event: ThreeEvent<PointerEvent>) {
  event.stopPropagation();
}
