"use client";

import type { CSSProperties, ReactNode } from "react";
import { Activity, Compass, Gauge, Map, Music, Pause, Radar, Timer } from "lucide-react";
import { getAircraft, getMap, getMode } from "@/lib/flight/catalog";
import { headingToCompass } from "@/lib/flight/navigation";
import { useGameStore } from "@/lib/flight/store";

export function Hud() {
  const telemetry = useGameStore((state) => state.telemetry);
  const aircraft = useGameStore((state) => getAircraft(state.aircraftId));
  const map = useGameStore((state) => getMap(state.mapId));
  const mode = useGameStore((state) => getMode(state.modeId));
  const music = useGameStore((state) => state.music);
  const fpsLimiter = useGameStore((state) => state.fpsLimiter);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const setMusic = useGameStore((state) => state.setMusic);
  const setFpsLimiter = useGameStore((state) => state.setFpsLimiter);
  const setScreenshotMode = useGameStore((state) => state.setScreenshotMode);
  const realism = useGameStore((state) => state.realism);

  return (
    <section className={cameraMode === "cockpit" ? "hud cockpit-hud" : "hud"} data-flight-ui="true" aria-label="Flight HUD">
      <div className="hud-primary">
        <HudMetric icon={<Gauge size={18} />} label="KTAS" value={telemetry.speedKt.toFixed(0)} alert={telemetry.stall} />
        <HudMetric icon={<Activity size={18} />} label="ALT FT" value={telemetry.altitudeFt.toFixed(0)} />
        <HudMetric icon={<Compass size={18} />} label={headingToCompass(telemetry.headingDeg)} value={telemetry.headingDeg.toFixed(0).padStart(3, "0")} />
        <HudMetric icon={<Timer size={18} />} label="TIME" value={formatTime(telemetry.elapsed)} />
      </div>

      <div className="flight-director" style={{ "--accent": aircraft.accent } as CSSProperties}>
        <span className="horizon-line" />
        <span className="director-cue" style={{ transform: `translateY(${Math.max(-32, Math.min(32, -telemetry.verticalSpeedFpm / 55))}px)` }} />
        <strong>{mode.name}</strong>
        <small>{telemetry.message}</small>
      </div>

      <div className="hud-bottom">
        <div className="bars">
          <Bar label="THR" value={telemetry.throttle} color={aircraft.accent} />
          <Bar label="BST" value={telemetry.boost} color={aircraft.accent} />
          <Bar label="FUEL" value={telemetry.fuelPercent / 100} color="#9df3c4" />
          <Bar label="TEMP" value={telemetry.engineTemp} color={telemetry.engineTemp > 1 ? "#ff5266" : "#ffd166"} />
        </div>
        <div className="score-box">
          <span>SCORE</span>
          <strong>{telemetry.score.toLocaleString()}</strong>
          <small>x{telemetry.combo.toFixed(1)} / gate {telemetry.checkpointIndex + 1}</small>
        </div>
        <div className="radar-box">
          <Radar size={15} />
          <span>{map.name}</span>
          <small>{map.wind.speedKt} kt wind / {telemetry.crosswindKt.toFixed(0)} kt cross</small>
        </div>
      </div>

      <div className="hud-actions">
        <button type="button" onClick={() => setMusic(!music)} title="Toggle music architecture placeholder">
          <Music size={15} /> {music ? "Music" : "Muted"}
        </button>
        <button type="button" onClick={() => setFpsLimiter(!fpsLimiter)} title="Toggle FPS limiter flag">
          <Pause size={15} /> {fpsLimiter ? "60 FPS" : "Unlocked"}
        </button>
        <button type="button" onClick={() => setScreenshotMode(true)} title="Hide UI for screenshots">
          <Map size={15} /> Shot
        </button>
      </div>

      <div className="academy-ribbon">
        <span>VSI {telemetry.verticalSpeedFpm.toFixed(0)} fpm</span>
        <span>AoA {telemetry.aoaDeg.toFixed(1)} deg</span>
        <span>Trim {Math.round(telemetry.trim * 100)}%</span>
        <span>Flaps {Math.round(telemetry.flaps * 100)}%</span>
        <span>{telemetry.gearDown ? "Gear down" : "Gear up"}</span>
        {realism.densityAltitude && <span>DA {telemetry.densityAltitudeFt.toFixed(0)} ft</span>}
        {telemetry.stall && <b>STALL</b>}
      </div>
    </section>
  );
}

function HudMetric({
  icon,
  label,
  value,
  alert = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={alert ? "hud-metric alert" : "hud-metric"}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
      </i>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
