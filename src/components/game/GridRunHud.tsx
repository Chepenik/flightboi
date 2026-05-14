"use client";

import { LogOut, RotateCcw, Zap } from "lucide-react";
import { useGameStore } from "@/lib/flight/store";

export function GridRunHud() {
  const hud = useGameStore((state) => state.gridRunHud);
  const restartGridRun = useGameStore((state) => state.restartGridRun);
  const exitEasterEgg = useGameStore((state) => state.exitEasterEgg);

  return (
    <section className="grid-run-hud" data-flight-ui="true" aria-label="Grid Run HUD">
      <div className="grid-run-title">
        <span>
          <Zap size={17} />
        </span>
        <div>
          <strong>Grid Run</strong>
          <small>{hud.message}</small>
        </div>
      </div>

      <div className="grid-run-metrics">
        <GridMetric label="Score" value={hud.score.toLocaleString()} />
        <GridMetric label="Combo" value={`x${hud.combo.toFixed(1)}`} />
        <GridMetric label="Speed" value={`${hud.speed.toFixed(0)}`} />
        <div className="grid-boost-meter">
          <span>Overdrive</span>
          <i>
            <b style={{ width: `${Math.round(hud.boost * 100)}%` }} />
          </i>
        </div>
      </div>

      <div className="grid-run-hints">
        <span>Arrows steer</span>
        <span>Space overdrive</span>
        <span>Shift drift</span>
        <span>Esc exit</span>
      </div>

      {hud.crashed && (
        <div className="grid-run-crash" role="dialog" aria-label="Grid Run crash">
          <strong>Trace broken</strong>
          <span>Score {hud.score.toLocaleString()} / combo x{hud.combo.toFixed(1)}</span>
          <div>
            <button type="button" onClick={restartGridRun}>
              <RotateCcw size={16} />
              Restart
            </button>
            <button type="button" onClick={exitEasterEgg}>
              <LogOut size={16} />
              Exit
            </button>
          </div>
          <small>Press R, Enter, or Space to retry.</small>
        </div>
      )}
    </section>
  );
}

function GridMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="grid-run-metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}
