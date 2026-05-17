"use client";

import type { CSSProperties, ReactNode } from "react";
import { Activity, Gauge, Keyboard, Map as MapIcon, MousePointer2, Plane, Play, Radar, Trophy, Zap } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { aircraft, gameModes, getAircraft, getMap, getMode, maps, pilotGoals } from "@/lib/flight/catalog";
import { useGameStore } from "@/lib/flight/store";
import {
  AircraftId,
  ControlMode,
  GameModeId,
  MapId,
  RealismPreset,
} from "@/lib/flight/types";

const realismPresets: { id: RealismPreset; label: string; detail: string }[] = [
  { id: "game", label: "Game", detail: "Arcade forgiveness" },
  { id: "pilot-familiarization", label: "Familiarization", detail: "Wind, trim, stalls" },
  { id: "near-sim", label: "Near Sim", detail: "More systems load" },
];

const controlModes: { id: ControlMode; label: string; detail: string }[] = [
  { id: "keyboard", label: "Keyboard", detail: "Arrow keys primary" },
  { id: "hybrid", label: "Hybrid", detail: "Keyboard + mouse" },
  { id: "mouse", label: "Mouse", detail: "Pointer assist" },
];

type LaunchScreenProps = {
  onLaunch: () => void;
};

export function LaunchScreen({ onLaunch }: LaunchScreenProps) {
  const {
    aircraftId,
    mapId,
    modeId,
    realismPreset,
    controls,
    bestRuns,
    unlockedGoals,
    setAircraft,
    setMap,
    setMode,
    setCameraMode,
    setRealismPreset,
    setControlSettings,
    setHudSettings,
    restartFlight,
  } = useGameStore(
    useShallow((state) => ({
      aircraftId: state.aircraftId,
      mapId: state.mapId,
      modeId: state.modeId,
      realismPreset: state.realismPreset,
      controls: state.controls,
      bestRuns: state.bestRuns,
      unlockedGoals: state.unlockedGoals,
      setAircraft: state.setAircraft,
      setMap: state.setMap,
      setMode: state.setMode,
      setCameraMode: state.setCameraMode,
      setRealismPreset: state.setRealismPreset,
      setControlSettings: state.setControlSettings,
      setHudSettings: state.setHudSettings,
      restartFlight: state.restartFlight,
    })),
  );

  const activeAircraft = getAircraft(aircraftId);
  const activeMap = getMap(mapId);
  const activeMode = getMode(modeId);
  const activeBest = bestRuns[modeId];

  const launchSelected = () => {
    restartFlight();
    onLaunch();
  };

  const quickStart = () => {
    setAircraft("falcon-x");
    setMap("alpine-dominion");
    setMode("time-trial");
    setCameraMode("chase");
    setRealismPreset("game");
    setControlSettings({
      mode: "hybrid",
      pitchSensitivity: 1,
      rollSensitivity: 1,
      yawSensitivity: 0.72,
      mouseSensitivity: 0.48,
      invertPitch: false,
      wasdEnabled: true,
    });
    setHudSettings({ layout: "clean", opacity: 0.86, showAdvancedRibbon: false });
    restartFlight();
    onLaunch();
  };

  return (
    <section
      className="launch-screen"
      data-flight-ui="true"
      aria-labelledby="launch-title"
    >
      <div className="launch-sky" aria-hidden="true">
        <div className="launch-hangar-frame" />
        <div className="launch-runway">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="launch-plane-silhouette">
          <Plane size={92} strokeWidth={1.4} />
        </div>
      </div>

      <div className="launch-shell">
        <header className="launch-hero">
          <div className="launch-brand">
            <span className="launch-brand-mark">
              <Plane size={28} strokeWidth={2.1} />
            </span>
            <div>
              <p>Browser flight game</p>
              <h1 id="launch-title">FlightBoi</h1>
              <span>Hangar launch, arcade flight, cockpit systems, and a hidden neon run.</span>
            </div>
          </div>

          <div className="launch-actions" aria-label="Launch actions">
            <button className="launch-button primary" type="button" onClick={launchSelected} autoFocus>
              <Play size={18} fill="currentColor" aria-hidden="true" />
              Play
            </button>
            <button className="launch-button secondary" type="button" onClick={quickStart}>
              <Zap size={17} aria-hidden="true" />
              Quick Start
            </button>
          </div>
        </header>

        <div className="launch-grid">
          <section className="launch-panel launch-summary" aria-label="Selected flight">
            <PanelHeading icon={<Activity size={17} />} title="Ready Slot" detail={activeMode.name} />
            <strong>{activeAircraft.name}</strong>
            <p>{activeMap.tagline}</p>
            <div className="launch-objective">
              <Trophy size={16} />
              <span>{activeMode.objective}</span>
            </div>
            <div className="launch-metrics">
              <Metric label="Biome" value={activeMap.name} />
              <Metric label="Mode" value={activeMode.shortName} />
              <Metric label="Wind" value={`${activeMap.wind.speedKt}G${activeMap.wind.gustKt} kt`} />
              <Metric label="Best" value={activeBest ? `${activeBest.score.toLocaleString()} ${activeBest.grade}` : "No clear"} />
            </div>
            <div className="launch-goals" aria-label="Pilot goals">
              {pilotGoals.map((goal) => (
                <span key={goal.id} className={unlockedGoals[goal.id] ? "unlocked" : ""} title={goal.description}>
                  {goal.label}
                </span>
              ))}
            </div>
            <div className="launch-desktop-note">
              <Keyboard size={15} aria-hidden="true" />
              <span>{activeMode.nextStep}</span>
            </div>
          </section>

          <section className="launch-panel launch-loadout" aria-label="Aircraft selection">
            <PanelHeading icon={<Plane size={17} />} title="Aircraft" detail={activeAircraft.role} />
            <div className="launch-option-grid aircraft-launch-grid">
              {aircraft.map((item) => (
                <SelectionButton
                  key={item.id}
                  active={aircraftId === item.id}
                  accent={item.accent}
                  title={item.name}
                  detail={item.role}
                  onClick={() => setAircraft(item.id as AircraftId)}
                />
              ))}
            </div>
          </section>

          <section className="launch-panel launch-biomes" aria-label="Biome selection">
            <PanelHeading icon={<MapIcon size={17} />} title="Biome" detail={activeMap.inspiration} />
            <div className="launch-option-grid map-launch-grid">
              {maps.map((item) => (
                <SelectionButton
                  key={item.id}
                  active={mapId === item.id}
                  accent={item.accent}
                  title={item.name}
                  detail={item.inspiration}
                  onClick={() => setMap(item.id as MapId)}
                />
              ))}
            </div>
          </section>

          <section className="launch-panel launch-modes" aria-label="Game mode selection">
            <PanelHeading icon={<Radar size={17} />} title="Game Mode" detail={activeMode.learningFocus} />
            <div className="launch-option-grid mode-launch-grid">
              {gameModes.map((mode) => (
                <button
                  key={mode.id}
                  className={modeId === mode.id ? "launch-mode active" : "launch-mode"}
                  type="button"
                  aria-pressed={modeId === mode.id}
                  onClick={() => setMode(mode.id as GameModeId)}
                >
                  <span>{mode.name}</span>
                  <small>{mode.description}</small>
                  <em>{mode.scoringHint}</em>
                </button>
              ))}
            </div>
          </section>

          <section className="launch-panel launch-systems" aria-label="Realism and controls">
            <PanelHeading icon={<Gauge size={17} />} title="Realism" detail="Preset handling" />
            <div className="launch-pill-row">
              {realismPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={realismPreset === preset.id ? "launch-pill active" : "launch-pill"}
                  type="button"
                  aria-pressed={realismPreset === preset.id}
                  onClick={() => setRealismPreset(preset.id)}
                >
                  <span>{preset.label}</span>
                  <small>{preset.detail}</small>
                </button>
              ))}
            </div>

            <PanelHeading icon={<MousePointer2 size={17} />} title="Control Preset" detail="Input feel" />
            <div className="launch-pill-row">
              {controlModes.map((mode) => (
                <button
                  key={mode.id}
                  className={controls.mode === mode.id ? "launch-pill active" : "launch-pill"}
                  type="button"
                  aria-pressed={controls.mode === mode.id}
                  onClick={() => setControlSettings({ mode: mode.id })}
                >
                  <span>{mode.label}</span>
                  <small>{mode.detail}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function PanelHeading({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="launch-panel-heading">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function SelectionButton({
  active,
  accent,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  accent: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "launch-selection active" : "launch-selection"}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{ "--accent": accent } as CSSProperties}
    >
      <span>{title}</span>
      <small>{detail}</small>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="launch-metric">
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}
