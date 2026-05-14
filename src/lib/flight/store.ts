"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultTelemetry } from "./physics";
import {
  AcademyLessonId,
  AircraftId,
  CameraMode,
  ControlSettings,
  EasterEggMode,
  FlightTelemetry,
  GameModeId,
  GridRunHudState,
  HudSettings,
  MapId,
  PayloadState,
  RealismPreset,
  RealismSettings,
} from "./types";
import { realismFromPreset } from "./catalog";

type QualityPreset = "adaptive" | "performance" | "balanced" | "ultra";

type GameStore = {
  aircraftId: AircraftId;
  mapId: MapId;
  modeId: GameModeId;
  cameraMode: CameraMode;
  realismPreset: RealismPreset;
  realism: RealismSettings;
  academyLessonId: AcademyLessonId;
  payload: PayloadState;
  telemetry: FlightTelemetry;
  controls: ControlSettings;
  hudSettings: HudSettings;
  easterEggMode: EasterEggMode;
  gridRunHud: GridRunHudState;
  gridRunRevision: number;
  quality: QualityPreset;
  music: boolean;
  fpsLimiter: boolean;
  autopilot: boolean;
  headingBug: number;
  altitudeHoldFt: number;
  screenshotMode: boolean;
  revision: number;
  setAircraft: (aircraftId: AircraftId) => void;
  setMap: (mapId: MapId) => void;
  setMode: (modeId: GameModeId) => void;
  setCameraMode: (cameraMode: CameraMode) => void;
  setRealismPreset: (preset: RealismPreset) => void;
  setRealismToggle: (key: keyof Omit<RealismSettings, "preset">, value: boolean) => void;
  setAcademyLesson: (lessonId: AcademyLessonId) => void;
  setPayload: (payload: Partial<PayloadState>) => void;
  setTelemetry: (telemetry: FlightTelemetry) => void;
  setControlSettings: (settings: Partial<ControlSettings>) => void;
  setHudSettings: (settings: Partial<HudSettings>) => void;
  enterGridRun: () => void;
  exitEasterEgg: () => void;
  restartGridRun: () => void;
  setGridRunHud: (hud: GridRunHudState) => void;
  setQuality: (quality: QualityPreset) => void;
  setMusic: (music: boolean) => void;
  setFpsLimiter: (fpsLimiter: boolean) => void;
  setAutopilot: (autopilot: boolean) => void;
  setHeadingBug: (headingBug: number) => void;
  setAltitudeHoldFt: (altitudeHoldFt: number) => void;
  setScreenshotMode: (screenshotMode: boolean) => void;
  restartFlight: () => void;
};

const initialPayload: PayloadState = {
  passengers: 1,
  cargoKg: 60,
  fuelPercent: 72,
  cgPercent: 49,
};

const initialControls: ControlSettings = {
  mode: "keyboard",
  pitchSensitivity: 1,
  rollSensitivity: 1,
  yawSensitivity: 0.72,
  mouseSensitivity: 0.48,
  invertPitch: false,
  wasdEnabled: true,
};

const initialHudSettings: HudSettings = {
  layout: "clean",
  opacity: 0.86,
  showAdvancedRibbon: false,
};

const initialGridRunHud: GridRunHudState = {
  score: 0,
  combo: 1,
  speed: 0,
  boost: 1,
  crashed: false,
  message: "Arrow keys steer. Type tron to enter the grid.",
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      aircraftId: "falcon-x",
      mapId: "alpine-dominion",
      modeId: "free-flight",
      cameraMode: "chase",
      realismPreset: "pilot-familiarization",
      realism: realismFromPreset("pilot-familiarization"),
      academyLessonId: "basic-flight",
      payload: initialPayload,
      telemetry: defaultTelemetry(),
      controls: initialControls,
      hudSettings: initialHudSettings,
      easterEggMode: "none",
      gridRunHud: initialGridRunHud,
      gridRunRevision: 0,
      quality: "adaptive",
      music: true,
      fpsLimiter: false,
      autopilot: false,
      headingBug: 90,
      altitudeHoldFt: 1500,
      screenshotMode: false,
      revision: 0,
      setAircraft: (aircraftId) => set((state) => ({ aircraftId, revision: state.revision + 1 })),
      setMap: (mapId) => set((state) => ({ mapId, revision: state.revision + 1 })),
      setMode: (modeId) => set({ modeId }),
      setCameraMode: (cameraMode) => set({ cameraMode }),
      setRealismPreset: (preset) =>
        set({ realismPreset: preset, realism: realismFromPreset(preset) }),
      setRealismToggle: (key, value) =>
        set((state) => ({
          realismPreset: "custom",
          realism: { ...state.realism, preset: "custom", [key]: value },
        })),
      setAcademyLesson: (academyLessonId) => set({ academyLessonId }),
      setPayload: (payload) =>
        set((state) => ({
          payload: { ...state.payload, ...payload },
        })),
      setTelemetry: (telemetry) => set({ telemetry }),
      setControlSettings: (settings) =>
        set((state) => ({ controls: { ...state.controls, ...settings } })),
      setHudSettings: (settings) =>
        set((state) => ({ hudSettings: { ...state.hudSettings, ...settings } })),
      enterGridRun: () =>
        set((state) => ({
          easterEggMode: "grid-run",
          gridRunHud: initialGridRunHud,
          gridRunRevision: state.gridRunRevision + 1,
          screenshotMode: false,
        })),
      exitEasterEgg: () =>
        set({
          easterEggMode: "none",
          gridRunHud: initialGridRunHud,
        }),
      restartGridRun: () =>
        set((state) => ({
          gridRunHud: initialGridRunHud,
          gridRunRevision: state.gridRunRevision + 1,
        })),
      setGridRunHud: (hud) => set({ gridRunHud: hud }),
      setQuality: (quality) => set({ quality }),
      setMusic: (music) => set({ music }),
      setFpsLimiter: (fpsLimiter) => set({ fpsLimiter }),
      setAutopilot: (autopilot) => set({ autopilot }),
      setHeadingBug: (headingBug) => set({ headingBug }),
      setAltitudeHoldFt: (altitudeHoldFt) => set({ altitudeHoldFt }),
      setScreenshotMode: (screenshotMode) => set({ screenshotMode }),
      restartFlight: () => set((state) => ({ revision: state.revision + 1 })),
    }),
    {
      name: "flightboi-save-v1",
      partialize: (state) => ({
        aircraftId: state.aircraftId,
        mapId: state.mapId,
        modeId: state.modeId,
        cameraMode: state.cameraMode,
        realismPreset: state.realismPreset,
        realism: state.realism,
        academyLessonId: state.academyLessonId,
        payload: state.payload,
        controls: state.controls,
        hudSettings: state.hudSettings,
        quality: state.quality,
        music: state.music,
        fpsLimiter: state.fpsLimiter,
        autopilot: state.autopilot,
        headingBug: state.headingBug,
        altitudeHoldFt: state.altitudeHoldFt,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(isPersistedGameState(persistedState) ? persistedState : {}),
        screenshotMode: false,
        easterEggMode: "none",
        gridRunHud: currentState.gridRunHud,
        gridRunRevision: currentState.gridRunRevision,
        telemetry: currentState.telemetry,
        revision: currentState.revision,
      }),
    },
  ),
);

function isPersistedGameState(value: unknown): value is Partial<GameStore> {
  return typeof value === "object" && value !== null;
}
