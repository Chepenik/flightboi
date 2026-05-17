"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, BadgeCheck, Compass, Gauge, Map, Music, Pause, Radar, RotateCcw, Timer, Trophy, Zap } from "lucide-react";
import { gameModes, getAircraft, getMap, getMode, maps, pilotGoals } from "@/lib/flight/catalog";
import { headingToCompass } from "@/lib/flight/navigation";
import { useGameStore } from "@/lib/flight/store";
import { GameModeId, MapId } from "@/lib/flight/types";

type ScorePop = {
  id: number;
  text: string;
  kind: string;
};

export function Hud() {
  const telemetry = useGameStore((state) => state.telemetry);
  const modeId = useGameStore((state) => state.modeId);
  const mapId = useGameStore((state) => state.mapId);
  const aircraft = useGameStore((state) => getAircraft(state.aircraftId));
  const map = useGameStore((state) => getMap(state.mapId));
  const mode = useGameStore((state) => getMode(state.modeId));
  const music = useGameStore((state) => state.music);
  const fpsLimiter = useGameStore((state) => state.fpsLimiter);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const hudSettings = useGameStore((state) => state.hudSettings);
  const setMusic = useGameStore((state) => state.setMusic);
  const setFpsLimiter = useGameStore((state) => state.setFpsLimiter);
  const setScreenshotMode = useGameStore((state) => state.setScreenshotMode);
  const setMode = useGameStore((state) => state.setMode);
  const setMap = useGameStore((state) => state.setMap);
  const restartFlight = useGameStore((state) => state.restartFlight);
  const clearRunSummary = useGameStore((state) => state.clearRunSummary);
  const runSummary = useGameStore((state) => state.runSummary);
  const unlockedGoals = useGameStore((state) => state.unlockedGoals);
  const realism = useGameStore((state) => state.realism);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const previousScore = useRef(telemetry.score);
  const previousEvent = useRef(telemetry.eventLabel);
  const progressPercent = Math.round(telemetry.routeProgress * 100);
  const unlockedCount = useMemo(
    () => pilotGoals.filter((goal) => unlockedGoals[goal.id]).length,
    [unlockedGoals],
  );

  const pushScorePop = useCallback((text: string, kind: string) => {
    const id = Date.now() + Math.random();
    setScorePops((items) => [...items.slice(-3), { id, text, kind }]);
    window.setTimeout(() => {
      setScorePops((items) => items.filter((item) => item.id !== id));
    }, 1100);
  }, []);

  useEffect(() => {
    const delta = telemetry.score - previousScore.current;
    if (delta > 0) pushScorePop(`+${delta.toLocaleString()}`, "score");
    previousScore.current = telemetry.score;
  }, [pushScorePop, telemetry.score]);

  useEffect(() => {
    if (telemetry.eventLabel && telemetry.eventLabel !== previousEvent.current) {
      pushScorePop(telemetry.eventLabel, telemetry.event);
      previousEvent.current = telemetry.eventLabel;
    }
  }, [pushScorePop, telemetry.event, telemetry.eventLabel]);

  const retryRun = () => {
    clearRunSummary();
    restartFlight();
  };

  const nextChallenge = () => {
    const modeIndex = gameModes.findIndex((item) => item.id === modeId);
    const mapIndex = maps.findIndex((item) => item.id === mapId);
    const nextMode = gameModes[(modeIndex + 1) % gameModes.length];
    const nextMap = maps[(mapIndex + (nextMode.id === "free-flight" ? 1 : 0)) % maps.length];
    clearRunSummary();
    setMode(nextMode.id as GameModeId);
    setMap(nextMap.id as MapId);
    restartFlight();
  };

  return (
    <section
      className={[
        "hud",
        `hud-${hudSettings.layout}`,
        cameraMode === "cockpit" ? "cockpit-hud" : "",
      ].join(" ")}
      data-flight-ui="true"
      aria-label="Flight HUD"
      style={{ "--hud-opacity": hudSettings.opacity } as CSSProperties}
    >
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

      <div className="mission-card" style={{ "--accent": aircraft.accent } as CSSProperties}>
        <div>
          <span>{mode.shortName} objective</span>
          <strong>{mode.objective}</strong>
          <small>{mode.scoringHint}</small>
        </div>
        <div className="mission-score">
          <b>{telemetry.score.toLocaleString()}</b>
          <small>x{telemetry.combo.toFixed(1)} / streak {telemetry.streak}</small>
          <i>
            <em style={{ width: `${progressPercent}%` }} />
          </i>
        </div>
      </div>

      <div className="juice-row">
        <span className={telemetry.boostActive ? "juice-chip hot" : telemetry.boostReady ? "juice-chip ready" : "juice-chip"}>
          <Zap size={13} />
          {telemetry.boostActive ? "Boosting" : telemetry.boostReady ? "Boost ready" : "Boost charging"}
        </span>
        <span className={telemetry.thrill > 0.4 ? "juice-chip hot" : "juice-chip"}>
          <Activity size={13} />
          {telemetry.thrill > 0.4 ? "Low pass thrill" : `${telemetry.nearMissCount} skims`}
        </span>
        <span className="juice-chip">
          <Trophy size={13} />
          {telemetry.grade}
        </span>
      </div>

      <div className="score-pop-stack" aria-live="polite">
        {scorePops.map((pop) => (
          <span key={pop.id} className={`score-pop ${pop.kind}`}>
            {pop.text}
          </span>
        ))}
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
          <small>x{telemetry.combo.toFixed(1)} / {telemetry.grade} / gate {telemetry.checkpointIndex + 1}</small>
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
        <button
          type="button"
          onClick={() => setScreenshotMode(true)}
          title="Hide UI for screenshots. Press Esc to restore the interface."
        >
          <Map size={15} /> Shot
        </button>
      </div>

      {hudSettings.showAdvancedRibbon && (
        <div className="academy-ribbon">
          <span>VSI {telemetry.verticalSpeedFpm.toFixed(0)} fpm</span>
          <span>AoA {telemetry.aoaDeg.toFixed(1)} deg</span>
          <span>Trim {Math.round(telemetry.trim * 100)}%</span>
          <span>Flaps {Math.round(telemetry.flaps * 100)}%</span>
          <span>{telemetry.gearDown ? "Gear down" : "Gear up"}</span>
          {realism.densityAltitude && <span>DA {telemetry.densityAltitudeFt.toFixed(0)} ft</span>}
          {telemetry.stall && <b>STALL</b>}
        </div>
      )}

      {runSummary && (
        <div className="run-summary-card" role="dialog" aria-label="Run complete">
          <div className="run-summary-heading">
            <BadgeCheck size={20} />
            <div>
              <strong>{runSummary.grade} route clear</strong>
              <small>{runSummary.modeName} / {runSummary.mapName}</small>
            </div>
          </div>
          <div className="run-summary-score">
            <span>{runSummary.score.toLocaleString()}</span>
            <small>{runSummary.isBest ? "New best" : `Best ${runSummary.bestScore.toLocaleString()}`} / goals {unlockedCount}/{pilotGoals.length}</small>
          </div>
          <p>{runSummary.feedback}</p>
          <div className="run-summary-metrics">
            <span>x{runSummary.combo.toFixed(1)} combo</span>
            <span>{runSummary.streak} streak</span>
            <span>{runSummary.nearMisses} skims</span>
            <span>{formatTime(runSummary.elapsed)}</span>
          </div>
          <div className="run-summary-actions">
            <button type="button" onClick={retryRun}>
              <RotateCcw size={15} />
              Retry Run
            </button>
            <button type="button" onClick={nextChallenge}>
              <ArrowRight size={15} />
              Next Challenge
            </button>
          </div>
        </div>
      )}
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
