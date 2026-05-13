"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { Activity, Camera, Gauge, GraduationCap, Plane, Radar, RotateCcw, Settings2 } from "lucide-react";
import { FlightCanvas } from "./FlightCanvas";
import { Hud } from "./Hud";
import { CockpitOverlay } from "./CockpitOverlay";
import { AcademyOverlay } from "./AcademyOverlay";
import { MobileWarning } from "./MobileWarning";
import { aircraft, gameModes, getAircraft, getMap, maps } from "@/lib/flight/catalog";
import { useGameStore } from "@/lib/flight/store";
import { AircraftId, CameraMode, GameModeId, MapId, RealismPreset } from "@/lib/flight/types";

const cameraModes: { id: CameraMode; label: string }[] = [
  { id: "chase", label: "Chase" },
  { id: "external", label: "External" },
  { id: "cinematic", label: "Cine" },
  { id: "flyby", label: "Flyby" },
  { id: "cockpit", label: "Cockpit" },
  { id: "free-look", label: "Free" },
];

const realismPresets: { id: RealismPreset; label: string }[] = [
  { id: "game", label: "Game Mode" },
  { id: "pilot-familiarization", label: "Pilot Familiarization" },
  { id: "near-sim", label: "Near Sim" },
  { id: "custom", label: "Custom" },
];

export default function FlightBoiApp() {
  const {
    aircraftId,
    mapId,
    modeId,
    cameraMode,
    realismPreset,
    payload,
    screenshotMode,
    setAircraft,
    setMap,
    setMode,
    setCameraMode,
    setRealismPreset,
    setPayload,
    restartFlight,
  } = useGameStore();

  const activeAircraft = useMemo(() => getAircraft(aircraftId), [aircraftId]);
  const activeMap = useMemo(() => getMap(mapId), [mapId]);

  return (
    <main className="flight-shell">
      <FlightCanvas />

      <div className="atmosphere-vignette" aria-hidden="true" />
      <MobileWarning />

      {!screenshotMode && (
        <>
          <Hud />
          <CockpitOverlay />
          <AcademyOverlay />

          <section className="flight-topbar" data-flight-ui="true" aria-label="FlightBoi command deck">
            <div className="brand-lockup">
              <span className="brand-mark">
                <Plane size={18} strokeWidth={2.2} />
              </span>
              <div>
                <strong>FlightBoi</strong>
                <span>{activeAircraft.name} / {activeMap.name}</span>
              </div>
            </div>

            <div className="segmented mode-tabs" aria-label="Game modes">
              {gameModes.map((mode) => (
                <button
                  key={mode.id}
                  className={modeId === mode.id ? "active" : ""}
                  type="button"
                  onClick={() => setMode(mode.id as GameModeId)}
                  title={`${mode.name}: ${mode.description}`}
                >
                  {mode.shortName}
                </button>
              ))}
            </div>

            <button className="icon-button" type="button" onClick={restartFlight} title="Restart flight">
              <RotateCcw size={17} />
            </button>
          </section>

          <aside className="left-panel control-panel" data-flight-ui="true" aria-label="Aircraft and world setup">
            <PanelHeader icon={<Settings2 size={16} />} title="Hangar" detail="Aircraft, map, realism" />

            <div className="field-block">
              <span className="field-label">Aircraft</span>
              <div className="selection-grid aircraft-grid">
                {aircraft.map((item) => (
                  <button
                    key={item.id}
                    className={aircraftId === item.id ? "selection-card active" : "selection-card"}
                    type="button"
                    onClick={() => setAircraft(item.id as AircraftId)}
                    style={{ "--accent": item.accent } as CSSProperties}
                  >
                    <span>{item.name}</span>
                    <small>{item.role}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">Biome</span>
              <div className="map-list">
                {maps.map((item) => (
                  <button
                    key={item.id}
                    className={mapId === item.id ? "map-row active" : "map-row"}
                    type="button"
                    onClick={() => setMap(item.id as MapId)}
                    style={{ "--accent": item.accent } as CSSProperties}
                  >
                    <span>{item.name}</span>
                    <small>{item.inspiration}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">Realism slider</span>
              <div className="segmented stacked">
                {realismPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={realismPreset === preset.id ? "active" : ""}
                    type="button"
                    onClick={() => setRealismPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <aside className="right-panel control-panel" data-flight-ui="true" aria-label="Pilot systems">
            <PanelHeader icon={<Gauge size={16} />} title="Pilot Systems" detail="W&B, camera, nav" />

            <div className="instrument-strip">
              <SystemPill icon={<Radar size={14} />} label="Wind" value={`${activeMap.wind.speedKt}G${activeMap.wind.gustKt}`} />
              <SystemPill icon={<Activity size={14} />} label="CG" value={`${payload.cgPercent}%`} />
              <SystemPill icon={<GraduationCap size={14} />} label="W&B" value={`${payload.fuelPercent}% fuel`} />
            </div>

            <div className="field-block">
              <span className="field-label">Weight & balance</span>
              <SliderRow
                label="Passengers"
                value={payload.passengers}
                min={0}
                max={5}
                step={1}
                display={`${payload.passengers}`}
                onChange={(value) => setPayload({ passengers: value })}
              />
              <SliderRow
                label="Cargo"
                value={payload.cargoKg}
                min={0}
                max={900}
                step={10}
                display={`${payload.cargoKg} kg`}
                onChange={(value) => setPayload({ cargoKg: value })}
              />
              <SliderRow
                label="Fuel"
                value={payload.fuelPercent}
                min={12}
                max={100}
                step={1}
                display={`${payload.fuelPercent}%`}
                onChange={(value) => setPayload({ fuelPercent: value })}
              />
              <SliderRow
                label="CG"
                value={payload.cgPercent}
                min={32}
                max={68}
                step={1}
                display={`${payload.cgPercent}% MAC`}
                onChange={(value) => setPayload({ cgPercent: value })}
              />
              <div className="cg-chart" aria-label="Center of gravity chart">
                <span className="cg-safe-zone" />
                <span className="cg-marker" style={{ left: `${payload.cgPercent}%` }} />
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">Camera</span>
              <div className="segmented camera-tabs">
                {cameraModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={cameraMode === mode.id ? "active" : ""}
                    type="button"
                    onClick={() => setCameraMode(mode.id)}
                    title={`${mode.label} camera`}
                  >
                    {mode.id === "cockpit" ? <Camera size={14} /> : mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flight-note">
              <strong>{activeAircraft.soundProfile.idle}</strong>
              <span>{activeAircraft.description}</span>
            </div>
          </aside>

          <div className="controls-cheatsheet" data-flight-ui="true">
            <span>Mouse pitch/roll</span>
            <span>Wheel throttle</span>
            <span>Space boost</span>
            <span>Shift air brake</span>
            <span>F/R flaps</span>
            <span>I/K trim</span>
          </div>
        </>
      )}
    </main>
  );
}

function PanelHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="panel-header">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-row">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <b>{display}</b>
    </label>
  );
}

function SystemPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="system-pill">
      {icon}
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}
