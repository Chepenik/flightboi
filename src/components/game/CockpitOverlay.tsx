"use client";

import type { CSSProperties } from "react";
import { useGameStore } from "@/lib/flight/store";
import { getAircraft } from "@/lib/flight/catalog";

export function CockpitOverlay() {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const telemetry = useGameStore((state) => state.telemetry);
  const aircraft = useGameStore((state) => getAircraft(state.aircraftId));

  if (cameraMode !== "cockpit") return null;

  return (
    <section className="cockpit-overlay" data-flight-ui="true" aria-label="Cockpit instruments">
      <div className="canopy-frame" />
      <div className="cockpit-panel" style={{ "--accent": aircraft.cockpit.instrumentColor } as CSSProperties}>
        <RoundInstrument label="ASI" value={telemetry.speedKt} min={0} max={aircraft.maxSpeed} unit="kt" />
        <AttitudeInstrument bankDeg={telemetry.bankDeg} pitchDeg={telemetry.pitchDeg} />
        <RoundInstrument label="ALT" value={telemetry.altitudeFt} min={0} max={8500} unit="ft" />
        <RoundInstrument label="VSI" value={telemetry.verticalSpeedFpm} min={-2000} max={2000} unit="fpm" />
        <RoundInstrument label="HDG" value={telemetry.headingDeg} min={0} max={360} unit="deg" />
        <RoundInstrument label="RPM" value={telemetry.rpm} min={700} max={3800} unit="rpm" />
        <div className="radio-stack">
          <span>COM 118.70</span>
          <span>NAV 113.20</span>
          <span>XPDR 1200</span>
          <b>{aircraft.cockpit.panel}</b>
        </div>
        <div className="switch-row">
          <span className={telemetry.gearDown ? "on" : ""}>GEAR</span>
          <span className={telemetry.flaps > 0.1 ? "on" : ""}>FLAPS</span>
          <span className={telemetry.stall ? "warn" : ""}>STALL</span>
          <span className={telemetry.engineTemp > 1 ? "warn" : ""}>TEMP</span>
        </div>
      </div>
    </section>
  );
}

function RoundInstrument({
  label,
  value,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}) {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -132 + normalized * 264;
  return (
    <div className="round-instrument">
      <span>{label}</span>
      <i style={{ transform: `rotate(${angle}deg)` }} />
      <strong>{Math.round(value).toString()}</strong>
      <small>{unit}</small>
    </div>
  );
}

function AttitudeInstrument({ bankDeg, pitchDeg }: { bankDeg: number; pitchDeg: number }) {
  const pitchOffset = Math.max(-24, Math.min(24, pitchDeg * 1.2));
  const bankAngle = Math.max(-60, Math.min(60, -bankDeg));

  return (
    <div className="attitude-instrument">
      <span>ATT</span>
      <div className="attitude-ball" style={{ transform: `translateY(${pitchOffset}px) rotate(${bankAngle}deg)` }}>
        <b />
      </div>
      <small>horizon</small>
    </div>
  );
}
