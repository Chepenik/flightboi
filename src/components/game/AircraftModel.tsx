"use client";

import { Trail } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide } from "three";
import { AircraftProfile } from "@/lib/flight/types";

export function AircraftModel({
  aircraft,
  hidden = false,
}: {
  aircraft: AircraftProfile;
  hidden?: boolean;
}) {
  const colors = useMemo(
    () => ({
      body: aircraft.id === "wraith-interceptor" ? "#11151d" : aircraft.id === "atlas-cruiser" ? "#8b6a45" : "#eef8ff",
      wing: aircraft.id === "wraith-interceptor" ? "#05070d" : aircraft.id === "atlas-cruiser" ? "#4d3a2a" : "#dce9f4",
      canopy: aircraft.id === "wraith-interceptor" ? "#42121a" : aircraft.id === "atlas-cruiser" ? "#3b2214" : "#11354a",
    }),
    [aircraft.id],
  );

  if (hidden) return null;

  if (aircraft.id === "atlas-cruiser") {
    return (
      <group scale={[1.35, 1.35, 1.35]}>
        <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[4.2, 19, 10, 24]} />
          <meshStandardMaterial color={colors.body} metalness={0.45} roughness={0.36} />
        </mesh>
        <mesh castShadow position={[0, 2.4, -2.8]} scale={[1, 0.45, 1.2]}>
          <sphereGeometry args={[3.4, 24, 12]} />
          <meshStandardMaterial color={colors.canopy} metalness={0.25} roughness={0.18} emissive="#2a1608" emissiveIntensity={0.2} />
        </mesh>
        <Wing width={36} depth={6.8} y={0.2} z={-1.8} color={colors.wing} />
        <Wing width={13} depth={4.4} y={1.3} z={10.8} color={colors.wing} />
        <Engine x={-13.5} accent={aircraft.accent} scale={1.25} />
        <Engine x={13.5} accent={aircraft.accent} scale={1.25} />
        <Engine x={-6.4} accent={aircraft.accent} scale={1.05} />
        <Engine x={6.4} accent={aircraft.accent} scale={1.05} />
        <TrailSet accent={aircraft.accent} positions={[[-13.5, 0, 8], [13.5, 0, 8], [-6.4, 0, 8], [6.4, 0, 8]]} />
      </group>
    );
  }

  return (
    <group scale={aircraft.id === "wraith-interceptor" ? [1.08, 0.9, 1.18] : [1, 1, 1]}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[2.15, aircraft.id === "wraith-interceptor" ? 16 : 14, 12, 32]} />
        <meshStandardMaterial color={colors.body} metalness={0.4} roughness={0.24} />
      </mesh>
      <mesh castShadow position={[0, 1.55, -3.7]} scale={[0.8, 0.32, 1.7]}>
        <sphereGeometry args={[2.6, 32, 16]} />
        <meshStandardMaterial color={colors.canopy} metalness={0.35} roughness={0.1} emissive={aircraft.accent} emissiveIntensity={0.08} />
      </mesh>
      <Wing width={aircraft.id === "wraith-interceptor" ? 19 : 22} depth={aircraft.id === "wraith-interceptor" ? 5.2 : 6.4} y={0} z={-1.2} color={colors.wing} swept={aircraft.id === "wraith-interceptor"} />
      <Wing width={8.2} depth={3.2} y={0.8} z={7.1} color={colors.wing} swept />
      <mesh castShadow position={[0, 2.8, 7.6]} rotation={[0.4, 0, 0]} scale={[0.35, 2.1, 2.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={colors.wing} metalness={0.32} roughness={0.28} />
      </mesh>
      <Engine x={aircraft.id === "wraith-interceptor" ? -2.4 : -2} accent={aircraft.accent} scale={0.82} />
      <Engine x={aircraft.id === "wraith-interceptor" ? 2.4 : 2} accent={aircraft.accent} scale={0.82} />
      <AccentStripes accent={aircraft.accent} />
      <TrailSet accent={aircraft.accent} positions={[[aircraft.id === "wraith-interceptor" ? -2.4 : -2, 0, 8], [aircraft.id === "wraith-interceptor" ? 2.4 : 2, 0, 8]]} />
    </group>
  );
}

function Wing({
  width,
  depth,
  y,
  z,
  color,
  swept = false,
}: {
  width: number;
  depth: number;
  y: number;
  z: number;
  color: string;
  swept?: boolean;
}) {
  return (
    <mesh castShadow receiveShadow position={[0, y, z]} rotation={[0, swept ? 0.08 : 0, 0]}>
      <boxGeometry args={[width, 0.32, depth]} />
      <meshStandardMaterial color={color} metalness={0.36} roughness={0.3} side={DoubleSide} />
    </mesh>
  );
}

function Engine({ x, accent, scale = 1 }: { x: number; accent: string; scale?: number }) {
  return (
    <group position={[x, -0.42, 5.8]} scale={scale}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 2.8, 28]} />
        <meshStandardMaterial color="#141820" metalness={0.72} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 1.58]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.88, 0.18, 28]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AccentStripes({ accent }: { accent: string }) {
  return (
    <>
      <mesh position={[0, 2.18, -1.6]} scale={[0.34, 0.05, 8.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[-7.4, 0.24, -2.2]} scale={[3.2, 0.06, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <mesh position={[7.4, 0.24, -2.2]} scale={[3.2, 0.06, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
    </>
  );
}

function TrailSet({
  accent,
  positions,
}: {
  accent: string;
  positions: [number, number, number][];
}) {
  return (
    <>
      {positions.map((position, index) => (
        <Trail
          key={`${position.join("-")}-${index}`}
          width={3.4}
          length={18}
          color={accent}
          attenuation={(width) => width * width}
        >
          <mesh position={position}>
            <sphereGeometry args={[0.18, 12, 8]} />
            <meshBasicMaterial color={accent} transparent opacity={0.5} />
          </mesh>
        </Trail>
      ))}
    </>
  );
}
