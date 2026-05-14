"use client";

import { Billboard, Line, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useLayoutEffect, useMemo, useRef } from "react";
import { BackSide, Group, InstancedMesh, MathUtils, Object3D } from "three";
import { AircraftProfile, CameraMode, GameModeId, MapProfile } from "@/lib/flight/types";
import { FlightModelState } from "@/lib/flight/physics";
import { FlightRoute } from "@/lib/flight/navigation";

const tempObject = new Object3D();

export function WorldGeometry({
  map,
  quality,
}: {
  map: MapProfile;
  quality: string;
}) {
  const featureCount = quality === "performance" ? 120 : quality === "ultra" ? 420 : 260;
  const features = useMemo(() => generateFeatures(map.id, featureCount), [map.id, featureCount]);
  const terrainScale: [number, number, number] = [1, 1, 1];

  return (
    <group>
      <SkyGradient map={map} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} scale={terrainScale}>
        <planeGeometry args={[7200, 7200, 96, 96]} />
        <meshStandardMaterial color={map.id === "azure-archipelago" ? map.waterColor : map.groundColor} roughness={0.86} metalness={map.id === "azure-archipelago" ? 0.18 : 0.02} />
      </mesh>

      {map.id === "azure-archipelago" && <OceanIslands features={features} map={map} />}
      {map.id !== "azure-archipelago" && <BiomeFeatures features={features} map={map} />}
      <AtmosphericSystems map={map} quality={quality} />
    </group>
  );
}

export function RunwaySystem({ map }: { map: MapProfile }) {
  const heading = MathUtils.degToRad(map.runwayHeading);
  const runwayColor = map.id === "crimson-dunes" ? "#493628" : map.id === "azure-archipelago" ? "#333a3f" : "#242a31";

  return (
    <group rotation={[0, -heading, 0]} position={[0, 0.14, 0]}>
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[56, 980, 0.18]} />
        <meshStandardMaterial color={runwayColor} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 930]} />
        <meshBasicMaterial color="#dce8f2" transparent opacity={0.82} />
      </mesh>
      {Array.from({ length: 18 }).map((_, index) => (
        <mesh key={index} position={[index % 2 === 0 ? -33 : 33, 0.9, -430 + index * 51]}>
          <sphereGeometry args={[2.3, 12, 8]} />
          <meshBasicMaterial color={index < 5 ? "#ff5252" : "#f8fbff"} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[-48, 6, -360]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 68, 12]} />
        <meshStandardMaterial color="#9aa6b4" metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[-47, 38, -332]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[7, 24, 3]} />
        <meshStandardMaterial color={map.accent} emissive={map.accent} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[58, 2.2, 312]}>
        <boxGeometry args={[42, 4, 28]} />
        <meshStandardMaterial color="#20252e" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[58, 14, 312]}>
        <boxGeometry args={[48, 20, 32]} />
        <meshStandardMaterial color="#39414d" roughness={0.42} metalness={0.22} />
      </mesh>
      <mesh position={[58, 28, 312]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[34, 34, 4]} />
        <meshStandardMaterial color="#596372" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function CheckpointRings({
  route,
  activeIndex,
  accent,
  modeId,
}: {
  route: FlightRoute;
  activeIndex: number;
  accent: string;
  modeId: GameModeId;
}) {
  const active = activeIndex % route.waypoints.length;

  if (modeId === "free-flight" || modeId === "pilot-sandbox") {
    return (
      <group>
        <Line
          points={route.waypoints.map((point) => [point.x, point.y, point.z])}
          color={accent}
          transparent
          opacity={0.18}
          lineWidth={1}
        />
      </group>
    );
  }

  return (
    <group>
      <Line
        points={route.waypoints.map((point) => [point.x, point.y, point.z])}
        color={accent}
        transparent
        opacity={0.32}
        lineWidth={1.2}
      />
      {route.waypoints.map((point, index) => {
        const isActive = index === active;
        return (
          <Billboard key={`${point.x}-${point.z}`} position={point}>
            <mesh scale={isActive ? 1.22 : 0.84}>
              <torusGeometry args={[42, isActive ? 2.7 : 1.5, 10, 64]} />
              <meshBasicMaterial
                color={isActive ? accent : "#dbe8ff"}
                transparent
                opacity={isActive ? 0.92 : 0.24}
                toneMapped={false}
              />
            </mesh>
            <mesh scale={isActive ? 1.02 : 0.68}>
              <torusGeometry args={[58, 0.7, 8, 64]} />
              <meshBasicMaterial color={accent} transparent opacity={isActive ? 0.38 : 0.12} toneMapped={false} />
            </mesh>
          </Billboard>
        );
      })}
    </group>
  );
}

export function FlightParticles({
  aircraft,
  map,
  flight,
  cameraMode,
}: {
  aircraft: AircraftProfile;
  map: MapProfile;
  flight: MutableRefObject<FlightModelState>;
  cameraMode: CameraMode;
}) {
  const particleCount = map.id === "neon-pacific" ? 90 : map.id === "alpine-dominion" ? 130 : 70;
  const visible = cameraMode !== "cockpit";
  const groupRef = useRef<Group>(null);
  const particleColor =
    map.id === "crimson-dunes" ? "#ffb15d" : map.id === "alpine-dominion" ? "#eff8ff" : aircraft.accent;

  useFrame(() => {
    groupRef.current?.position.copy(flight.current.position);
  });

  return (
    <group ref={groupRef} position={flight.current.position}>
      {visible && (
        <Sparkles
          count={particleCount}
          scale={[240, 110, 300]}
          size={map.id === "crimson-dunes" ? 5 : 2.2}
          speed={map.id === "neon-pacific" ? 0.7 : 0.36}
          color={particleColor}
          opacity={map.id === "neon-pacific" ? 0.32 : 0.22}
        />
      )}
    </group>
  );
}

function SkyGradient({ map }: { map: MapProfile }) {
  return (
    <mesh position={[0, 0, 0]} scale={[1, 1, 1]}>
      <sphereGeometry args={[3450, 48, 24]} />
      <meshBasicMaterial color={map.skyTop} side={BackSide} fog={false} />
    </mesh>
  );
}

function BiomeFeatures({
  features,
  map,
}: {
  features: Feature[];
  map: MapProfile;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const accentRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    features.forEach((feature, index) => {
      tempObject.position.set(feature.x, feature.y, feature.z);
      tempObject.rotation.set(feature.rx, feature.ry, feature.rz);
      tempObject.scale.set(feature.sx, feature.sy, feature.sz);
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(index, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [features]);

  useLayoutEffect(() => {
    if (!accentRef.current) return;
    features.slice(0, Math.floor(features.length * 0.18)).forEach((feature, index) => {
      tempObject.position.set(feature.x, feature.y + feature.sy * 0.6 + 8, feature.z);
      tempObject.rotation.set(feature.rx, feature.ry, feature.rz);
      tempObject.scale.set(feature.sx * 0.22, feature.sy * 0.16, feature.sz * 0.22);
      tempObject.updateMatrix();
      accentRef.current?.setMatrixAt(index, tempObject.matrix);
    });
    accentRef.current.instanceMatrix.needsUpdate = true;
  }, [features]);

  const geometry =
    map.id === "neon-pacific" ? (
      <boxGeometry args={[1, 1, 1]} />
    ) : map.id === "crimson-dunes" ? (
      <sphereGeometry args={[1, 18, 10]} />
    ) : map.id === "emerald-frontier" ? (
      <coneGeometry args={[1, 1, 9]} />
    ) : (
      <coneGeometry args={[1, 1, 8]} />
    );
  const color =
    map.id === "neon-pacific"
      ? "#171b2c"
      : map.id === "crimson-dunes"
        ? "#d47a3e"
        : map.id === "emerald-frontier"
          ? "#185f32"
          : "#e8f3ff";

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, features.length]} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial color={color} roughness={0.72} metalness={map.id === "neon-pacific" ? 0.28 : 0.04} />
      </instancedMesh>
      {map.id === "neon-pacific" && (
        <instancedMesh ref={accentRef} args={[undefined, undefined, Math.floor(features.length * 0.18)]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={map.accent} transparent opacity={0.7} toneMapped={false} />
        </instancedMesh>
      )}
    </>
  );
}

function OceanIslands({ features, map }: { features: Feature[]; map: MapProfile }) {
  const islandRef = useRef<InstancedMesh>(null);
  const palmRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!islandRef.current || !palmRef.current) return;
    features.forEach((feature, index) => {
      tempObject.position.set(feature.x, 1.3, feature.z);
      tempObject.rotation.set(0, feature.ry, 0);
      tempObject.scale.set(feature.sx * 8.8, 2.6, feature.sz * 8.8);
      tempObject.updateMatrix();
      islandRef.current?.setMatrixAt(index, tempObject.matrix);

      tempObject.position.set(feature.x + Math.sin(index) * 18, 13, feature.z + Math.cos(index * 1.7) * 18);
      tempObject.scale.set(4.5, 24 + (index % 4) * 3, 4.5);
      tempObject.updateMatrix();
      palmRef.current?.setMatrixAt(index, tempObject.matrix);
    });
    islandRef.current.instanceMatrix.needsUpdate = true;
    palmRef.current.instanceMatrix.needsUpdate = true;
  }, [features]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[7200, 7200, 1, 1]} />
        <meshStandardMaterial color={map.waterColor} roughness={0.18} metalness={0.24} transparent opacity={0.9} />
      </mesh>
      <instancedMesh ref={islandRef} args={[undefined, undefined, features.length]} receiveShadow castShadow>
        <sphereGeometry args={[1, 24, 10]} />
        <meshStandardMaterial color="#f0d19b" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={palmRef} args={[undefined, undefined, features.length]} castShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#18683f" roughness={0.7} />
      </instancedMesh>
    </>
  );
}

function AtmosphericSystems({ map, quality }: { map: MapProfile; quality: string }) {
  const cloudCount = quality === "performance" ? 10 : 18;
  const cloudColor =
    map.id === "neon-pacific" ? "#35406f" : map.id === "crimson-dunes" ? "#ef9a5d" : "#f0f7ff";

  return (
    <group>
      {Array.from({ length: cloudCount }).map((_, index) => (
        <mesh
          key={index}
          position={[
            Math.sin(index * 91.7) * 1400,
            300 + (index % 6) * 58,
            Math.cos(index * 57.3) * 1550,
          ]}
          scale={[120 + (index % 4) * 45, 18 + (index % 3) * 7, 44 + (index % 5) * 12]}
        >
          <sphereGeometry args={[1, quality === "performance" ? 12 : 20, 8]} />
          <meshBasicMaterial
            color={cloudColor}
            transparent
            opacity={map.id === "neon-pacific" ? 0.22 : 0.34}
            depthWrite={false}
          />
        </mesh>
      ))}
      {map.id === "emerald-frontier" && (
        <mesh position={[-360, 92, -760]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[30, 180, 16]} />
          <meshBasicMaterial color="#c6fff0" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

type Feature = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
};

function generateFeatures(mapId: string, count: number): Feature[] {
  const random = mulberry32(seedFor(mapId));

  return Array.from({ length: count }).map(() => {
    const radius = 420 + random() * 2800;
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius + (random() - 0.5) * 240;
    const z = Math.sin(angle) * radius + (random() - 0.5) * 240;

    if (mapId === "neon-pacific") {
      const height = 70 + random() * 360;
      return {
        x,
        y: height / 2,
        z,
        rx: 0,
        ry: random() * Math.PI,
        rz: 0,
        sx: 28 + random() * 54,
        sy: height,
        sz: 28 + random() * 54,
      };
    }

    if (mapId === "crimson-dunes") {
      return {
        x,
        y: 4,
        z,
        rx: 0,
        ry: random() * Math.PI,
        rz: 0,
        sx: 80 + random() * 180,
        sy: 10 + random() * 22,
        sz: 18 + random() * 56,
      };
    }

    if (mapId === "emerald-frontier") {
      const height = 30 + random() * 100;
      return {
        x,
        y: height / 2,
        z,
        rx: 0,
        ry: random() * Math.PI,
        rz: 0,
        sx: 22 + random() * 44,
        sy: height,
        sz: 22 + random() * 44,
      };
    }

    if (mapId === "azure-archipelago") {
      return {
        x,
        y: 0,
        z,
        rx: 0,
        ry: random() * Math.PI,
        rz: 0,
        sx: 4 + random() * 8,
        sy: 1,
        sz: 3 + random() * 7,
      };
    }

    const height = 120 + random() * 520;
    return {
      x,
      y: height / 2 - 8,
      z,
      rx: 0,
      ry: random() * Math.PI,
      rz: 0,
      sx: 80 + random() * 190,
      sy: height,
      sz: 80 + random() * 190,
    };
  });
}

function seedFor(value: string) {
  let seed = 0;
  for (let index = 0; index < value.length; index += 1) {
    seed = (seed << 5) - seed + value.charCodeAt(index);
    seed |= 0;
  }
  return Math.abs(seed) + 1;
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
