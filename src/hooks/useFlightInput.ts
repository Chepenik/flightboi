"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/flight/store";
import { InputFrame } from "@/lib/flight/types";

const emptyInput = (): InputFrame => ({
  pitch: 0,
  roll: 0,
  yaw: 0,
  throttleDelta: 0,
  boost: false,
  airBrake: false,
  brakeRelease: false,
  trimUp: false,
  trimDown: false,
  flapsUp: false,
  flapsDown: false,
  gearToggle: false,
  reset: false,
});

export function useFlightInput(): MutableRefObject<InputFrame> {
  const controls = useGameStore((state) => state.controls);
  const inputRef = useRef<InputFrame>(emptyInput());
  const keysRef = useRef(new Set<string>());
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const updateFromState = () => {
      const keys = keysRef.current;
      const mouse = mouseRef.current;
      const keyboardPitch =
        Number(keys.has("arrowdown")) -
        Number(keys.has("arrowup")) +
        (controls.wasdEnabled ? Number(keys.has("s")) - Number(keys.has("w")) : 0);
      const keyboardRoll =
        Number(keys.has("arrowleft")) -
        Number(keys.has("arrowright")) +
        (controls.wasdEnabled ? Number(keys.has("a")) - Number(keys.has("d")) : 0);
      const yaw = Number(keys.has("q")) - Number(keys.has("e"));
      const acceptsMouse = controls.mode === "mouse" || controls.mode === "hybrid";
      const acceptsKeyboard = controls.mode === "keyboard" || controls.mode === "hybrid";
      const invert = controls.invertPitch ? -1 : 1;
      const mousePitch = acceptsMouse && mouse.active ? mouse.y * controls.mouseSensitivity * invert : 0;
      const mouseRoll = acceptsMouse && mouse.active ? mouse.x * controls.mouseSensitivity : 0;
      const arrowPitch = acceptsKeyboard ? keyboardPitch * controls.pitchSensitivity * invert : 0;
      const arrowRoll = acceptsKeyboard ? keyboardRoll * controls.rollSensitivity : 0;

      inputRef.current.pitch = clamp(mousePitch + arrowPitch);
      inputRef.current.roll = clamp(mouseRoll + arrowRoll);
      inputRef.current.yaw = clamp(yaw * controls.yawSensitivity);
      inputRef.current.boost = keys.has(" ");
      inputRef.current.brakeRelease = keys.has(" ");
      inputRef.current.airBrake = keys.has("shift");
      inputRef.current.trimUp = keys.has("i");
      inputRef.current.trimDown = keys.has("k");
      inputRef.current.flapsDown = keys.has("f");
      inputRef.current.flapsUp = keys.has("r");
      inputRef.current.gearToggle = keys.has("g");
      inputRef.current.reset = keys.has("backspace");
    };

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-flight-ui='true']")) return;
      mouseRef.current.active = true;
      mouseRef.current.x = clamp((event.clientX / window.innerWidth - 0.5) * 2);
      mouseRef.current.y = clamp((event.clientY / window.innerHeight - 0.5) * 2);
      updateFromState();
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
      updateFromState();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }
      keysRef.current.add(key);
      if (key === "=" || key === "+") inputRef.current.throttleDelta += 90;
      if (key === "-" || key === "_") inputRef.current.throttleDelta -= 90;
      updateFromState();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
      updateFromState();
    };

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-flight-ui='true']")) return;
      event.preventDefault();
      inputRef.current.throttleDelta += -event.deltaY;
    };

    const gamepadPoll = window.setInterval(() => {
      const gamepads = navigator.getGamepads?.() ?? [];
      const pad = Array.from(gamepads).find(Boolean);
      if (!pad) return;
      inputRef.current.roll = clamp(pad.axes[0] ?? inputRef.current.roll);
      inputRef.current.pitch = clamp(pad.axes[1] ?? inputRef.current.pitch);
      inputRef.current.yaw = clamp(pad.axes[2] ?? 0);
      inputRef.current.throttleDelta += (-(pad.axes[3] ?? 0) + 0.02) * 4;
      inputRef.current.boost = Boolean(pad.buttons[0]?.pressed);
      inputRef.current.airBrake = Boolean(pad.buttons[1]?.pressed);
    }, 32);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.clearInterval(gamepadPoll);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [controls]);

  return inputRef;
}

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}
