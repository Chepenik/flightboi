"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Preload } from "@react-three/drei";
import { useState } from "react";
import { PCFShadowMap, setConsoleFunction } from "three";
import { FlightScene } from "./FlightScene";
import { useGameStore } from "@/lib/flight/store";

let threeWarningFilterInstalled = false;

export function FlightCanvas() {
  installThreeWarningFilter();
  const quality = useGameStore((state) => state.quality);
  const setQuality = useGameStore((state) => state.setQuality);
  const [dpr, setDpr] = useState(quality === "ultra" ? 1.5 : quality === "performance" ? 0.9 : 1.15);

  return (
    <Canvas
      className="flight-canvas"
      shadows={quality !== "performance" ? { enabled: true, type: PCFShadowMap } : false}
      camera={{ position: [0, 95, 260], fov: 64, near: 0.1, far: 7000 }}
      dpr={dpr}
      gl={{
        antialias: quality !== "performance",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
    >
      <PerformanceMonitor
        bounds={(refreshRate) => (refreshRate > 90 ? [50, 90] : [45, 60])}
        onDecline={() => {
          setDpr((value) => Math.max(0.82, value - 0.15));
          setQuality("performance");
        }}
        onIncline={() => {
          if (quality === "adaptive") setDpr((value) => Math.min(1.35, value + 0.08));
        }}
      />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <FlightScene />
      <Preload all />
    </Canvas>
  );
}

function installThreeWarningFilter() {
  if (threeWarningFilterInstalled || typeof window === "undefined") return;
  threeWarningFilterInstalled = true;
  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  setConsoleFunction((type, message, ...params) => {
    if (
      type === "warn" &&
      (message.includes("THREE.Clock: This module has been deprecated") ||
        message.includes("THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated"))
    ) {
      return;
    }

    if (type === "error") originalError(message, ...params);
    else if (type === "warn") originalWarn(message, ...params);
    else originalLog(message, ...params);
  });
}
