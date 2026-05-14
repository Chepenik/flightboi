"use client";

import { Stars, Trail } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Group, MathUtils, Object3D, Vector3 } from "three";
import { useGameStore } from "@/lib/flight/store";
import { GridRunHudState } from "@/lib/flight/types";

type GridRunGate = {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
};

type GridRunObstacle = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color: string;
};

type GridRunState = {
  x: number;
  y: number;
  z: number;
  xVelocity: number;
  yVelocity: number;
  speed: number;
  boost: number;
  score: number;
  combo: number;
  nextGate: number;
  crashed: boolean;
  message: string;
  elapsed: number;
};

const gateColors = ["#00f5ff", "#ff2bd6", "#ffb000", "#7cff6b"];
const laneXs = [-24, -12, 0, 12, 24];
const scratchLook = new Vector3();
const scratchCamera = new Vector3();

export function GridRunScene() {
  const setGridRunHud = useGameStore((state) => state.setGridRunHud);
  const restartGridRun = useGameStore((state) => state.restartGridRun);
  const revision = useGameStore((state) => state.gridRunRevision);
  const craftRef = useRef<Group>(null);
  const gridRef = useRef<Object3D>(null);
  const stateRef = useRef<GridRunState>(createInitialGridRunState());
  const keysRef = useRef(new Set<string>());
  const lastHud = useRef(0);
  const { camera } = useThree();
  const gates = useMemo(() => createGridRunGates(), []);
  const obstacles = useMemo(() => createGridRunObstacles(), []);

  useEffect(() => {
    stateRef.current = createInitialGridRunState();
    setGridRunHud(toHudState(stateRef.current));
  }, [revision, setGridRunHud]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (shouldIgnoreGridRunTarget(event.target)) return;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift"].includes(key)) {
        event.preventDefault();
      }

      if (stateRef.current.crashed && ["r", "enter", " "].includes(key)) {
        event.preventDefault();
        restartGridRun();
        return;
      }

      keysRef.current.add(key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [restartGridRun]);

  useFrame(({ clock }, rawDelta) => {
    const state = stateRef.current;
    const delta = Math.min(rawDelta, 1 / 30);
    state.elapsed += delta;

    if (!state.crashed) {
      stepGridRun(state, keysRef.current, gates, obstacles, delta);
    }

    updateGridRunObjects({
      state,
      craft: craftRef.current,
      grid: gridRef.current,
      camera,
      delta,
      elapsed: clock.elapsedTime,
    });

    if (clock.elapsedTime - lastHud.current > 0.08) {
      setGridRunHud(toHudState(state));
      lastHud.current = clock.elapsedTime;
    }
  });

  return (
    <>
      <color attach="background" args={["#02040d"]} />
      <fog attach="fog" args={["#05091a", 120, 760]} />
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 42, 24]} color="#00f5ff" intensity={2.1} distance={180} />
      <pointLight position={[48, 26, -90]} color="#ff2bd6" intensity={1.35} distance={240} />
      <pointLight position={[-48, 24, -180]} color="#ffb000" intensity={1.1} distance={220} />
      <Stars radius={850} depth={120} count={1000} factor={4} saturation={0.8} fade speed={0.45} />

      <group ref={gridRef}>
        <gridHelper args={[680, 68, "#00f5ff", "#122c58"]} position={[0, 0, -220]} />
        <mesh position={[0, -0.04, -220]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[680, 920]} />
          <meshBasicMaterial color="#020711" transparent opacity={0.72} />
        </mesh>
      </group>

      <TrackRails />
      <GateField gates={gates} />
      <ObstacleField obstacles={obstacles} />

      <group ref={craftRef}>
        <Trail
          width={5}
          length={34}
          color="#00f5ff"
          attenuation={(width) => width * width}
        >
          <mesh position={[0, 0.2, 5.6]}>
            <sphereGeometry args={[0.28, 12, 8]} />
            <meshBasicMaterial color="#00f5ff" transparent opacity={0.7} />
          </mesh>
        </Trail>
        <LightRunnerCraft />
      </group>
    </>
  );
}

function stepGridRun(
  state: GridRunState,
  keys: Set<string>,
  gates: GridRunGate[],
  obstacles: GridRunObstacle[],
  delta: number,
) {
  const left = Number(keys.has("arrowleft"));
  const right = Number(keys.has("arrowright"));
  const up = Number(keys.has("arrowup"));
  const down = Number(keys.has("arrowdown"));
  const drifting = keys.has("shift");
  const overdrive = keys.has(" ") && state.boost > 0.04;
  const steering = right - left;
  const vertical = up - down;
  const baseSpeed = Math.min(176, 82 + state.elapsed * 1.8);
  const targetSpeed = (baseSpeed + (overdrive ? 66 : 0)) * (drifting ? 0.72 : 1);

  state.speed = MathUtils.lerp(state.speed, targetSpeed, delta * 2.4);
  state.boost = MathUtils.clamp(state.boost + (overdrive ? -0.36 : 0.105) * delta, 0, 1);
  state.xVelocity = MathUtils.lerp(
    state.xVelocity,
    steering * (drifting ? 82 : 58),
    delta * (drifting ? 4.2 : 3.1),
  );
  state.yVelocity = MathUtils.lerp(state.yVelocity, vertical * 32, delta * 2.4);
  state.x = MathUtils.clamp(state.x + state.xVelocity * delta, -34, 34);
  state.y = MathUtils.clamp(state.y + state.yVelocity * delta, 3.4, 22);
  state.z -= state.speed * delta;
  state.score += Math.round(delta * state.speed * state.combo * 0.16);

  if (Math.abs(state.x) > 33.5 || state.y < 3.5 || state.y > 21.8) {
    crashGridRun(state, "Boundary rail clipped.");
    return;
  }

  const activeGate = gates[state.nextGate];
  if (activeGate && Math.abs(state.z - activeGate.z) < 12) {
    const gateDistance = Math.hypot(state.x - activeGate.x, state.y - activeGate.y);
    if (gateDistance < activeGate.radius) {
      state.score += Math.round(550 * state.combo);
      state.combo = Math.min(9.9, state.combo + 0.35);
      state.boost = Math.min(1, state.boost + 0.18);
      state.message = "Gate synced. Combo climbing.";
    } else {
      state.combo = Math.max(1, state.combo * 0.68);
      state.message = "Gate missed. Re-center on the next vector.";
    }
    state.nextGate += 1;
  } else if (activeGate && state.z < activeGate.z - 16) {
    state.combo = Math.max(1, state.combo * 0.72);
    state.nextGate += 1;
  }

  for (const obstacle of obstacles) {
    if (Math.abs(state.z - obstacle.z) > obstacle.depth + 4) continue;
    const hitX = Math.abs(state.x - obstacle.x) < obstacle.width * 0.5 + 1.8;
    const hitY = Math.abs(state.y - obstacle.y) < obstacle.height * 0.5 + 1.6;
    if (hitX && hitY) {
      crashGridRun(state, "Trace wall collision.");
      break;
    }
  }
}

function updateGridRunObjects({
  state,
  craft,
  grid,
  camera,
  delta,
  elapsed,
}: {
  state: GridRunState;
  craft: Group | null;
  grid: Object3D | null;
  camera: Object3D & { fov?: number; updateProjectionMatrix?: () => void };
  delta: number;
  elapsed: number;
}) {
  if (craft) {
    craft.position.set(state.x, state.y, state.z);
    craft.rotation.set(
      MathUtils.degToRad(state.yVelocity * -0.18),
      Math.sin(elapsed * 2.4) * 0.025,
      MathUtils.degToRad(state.xVelocity * -0.28),
    );
  }

  if (grid) {
    grid.position.z = state.z - 180;
  }

  scratchCamera.set(
    MathUtils.lerp(camera.position.x, state.x * 0.38, delta * 2.6),
    MathUtils.lerp(camera.position.y, state.y + 24, delta * 2.8),
    MathUtils.lerp(camera.position.z, state.z + 68, delta * 3.4),
  );
  camera.position.copy(scratchCamera);
  scratchLook.set(state.x * 0.28, state.y + 2, state.z - 96);
  camera.lookAt(scratchLook);

  if (typeof camera.fov === "number") {
    camera.fov = MathUtils.lerp(camera.fov, state.crashed ? 72 : 63 + Math.min(18, state.speed * 0.055), 0.05);
    camera.updateProjectionMatrix?.();
  }
}

function LightRunnerCraft() {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <mesh castShadow scale={[1.2, 0.58, 4.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#061226" emissive="#00f5ff" emissiveIntensity={0.58} metalness={0.75} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.55, -0.8]} scale={[0.85, 0.42, 1.6]}>
        <sphereGeometry args={[1, 20, 10]} />
        <meshBasicMaterial color="#9ffcff" transparent opacity={0.76} />
      </mesh>
      <mesh position={[0, 0, -3.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.15, 3.5, 4]} />
        <meshStandardMaterial color="#101a35" emissive="#ff2bd6" emissiveIntensity={0.7} metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[-2.7, -0.05, 0.55]} scale={[3.8, 0.12, 0.35]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#00f5ff" toneMapped={false} />
      </mesh>
      <mesh position={[2.7, -0.05, 0.55]} scale={[3.8, 0.12, 0.35]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ff2bd6" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.4, 2.7]} scale={[0.7, 0.18, 0.7]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffb000" toneMapped={false} />
      </mesh>
    </group>
  );
}

function GateField({ gates }: { gates: GridRunGate[] }) {
  return (
    <group>
      {gates.map((gate, index) => (
        <group key={`${gate.z}-${index}`} position={[gate.x, gate.y, gate.z]}>
          <mesh>
            <torusGeometry args={[gate.radius, 0.42, 8, 36]} />
            <meshBasicMaterial color={gate.color} transparent opacity={0.82} toneMapped={false} />
          </mesh>
          <mesh scale={[1.18, 1.18, 1]}>
            <torusGeometry args={[gate.radius, 0.08, 6, 36]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.32} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ObstacleField({ obstacles }: { obstacles: GridRunObstacle[] }) {
  return (
    <group>
      {obstacles.map((obstacle, index) => (
        <mesh
          key={`${obstacle.z}-${index}`}
          position={[obstacle.x, obstacle.y, obstacle.z]}
          scale={[obstacle.width, obstacle.height, obstacle.depth]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={obstacle.color}
            transparent
            opacity={0.72}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function TrackRails() {
  return (
    <group>
      {[-38, 38].map((x) => (
        <mesh key={x} position={[x, 1.2, -12200]} scale={[0.4, 2.4, 24200]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={x < 0 ? "#00f5ff" : "#ff2bd6"} transparent opacity={0.44} toneMapped={false} />
        </mesh>
      ))}
      {laneXs.map((x) => (
        <mesh key={x} position={[x, 0.12, -12200]} scale={[0.06, 0.06, 24200]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#143b78" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function createGridRunGates(): GridRunGate[] {
  return Array.from({ length: 130 }).map((_, index) => ({
    x: laneXs[(index * 2 + Math.floor(index / 3)) % laneXs.length],
    y: 8 + ((index * 5) % 4) * 2.8,
    z: -180 - index * 175,
    radius: 7.5,
    color: gateColors[index % gateColors.length],
  }));
}

function createGridRunObstacles(): GridRunObstacle[] {
  return Array.from({ length: 210 }).map((_, index) => {
    const wide = index % 7 === 0;
    const earlySafeLane = index < 8 ? laneXs[index % 2 === 0 ? 0 : laneXs.length - 1] : undefined;
    return {
      x: earlySafeLane ?? laneXs[(index * 3 + 1) % laneXs.length] + (index % 5 === 0 ? 5 : 0),
      y: 5.5 + ((index * 7) % 5) * 3.1,
      z: -720 - index * 118,
      width: wide ? 18 : 7.2,
      height: wide ? 2.5 : 7.8,
      depth: wide ? 6 : 5.4,
      color: index % 3 === 0 ? "#ff2bd6" : index % 3 === 1 ? "#00f5ff" : "#ffb000",
    };
  });
}

function createInitialGridRunState(): GridRunState {
  return {
    x: 0,
    y: 8,
    z: 0,
    xVelocity: 0,
    yVelocity: 0,
    speed: 82,
    boost: 1,
    score: 0,
    combo: 1,
    nextGate: 0,
    crashed: false,
    message: "Vector locked. Arrows steer, Space overdrives.",
    elapsed: 0,
  };
}

function toHudState(state: GridRunState): GridRunHudState {
  return {
    score: state.score,
    combo: state.combo,
    speed: state.speed,
    boost: state.boost,
    crashed: state.crashed,
    message: state.message,
  };
}

function crashGridRun(state: GridRunState, message: string) {
  state.crashed = true;
  state.speed = 0;
  state.combo = Math.max(1, state.combo);
  state.message = `${message} Press R to retry or Esc to exit.`;
}

function shouldIgnoreGridRunTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, input, select, textarea, [contenteditable='true'], [data-flight-ui='true']",
    ),
  );
}
