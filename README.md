# FlightBoi

FlightBoi is a browser-native arcade flight game and aviation familiarization sandbox built with Next.js 16, TypeScript, Three.js, and React Three Fiber.

It is not FAA-certified training software. It is designed to make flying feel good quickly while teaching useful aviation intuition: airspeed awareness, pitch/throttle relationship, trim, flaps, stalls, crosswind awareness, energy management, terrain planning, and weight and balance effects.

## Features

- Playable 3D flight loop with mouse pitch/roll, keyboard support, scroll throttle, boost, air brake, flaps, trim, gear toggle, and gamepad polling.
- Dual-layer flight model with arcade forgiveness and optional familiarization/near-sim effects.
- Three aircraft: Falcon-X, Wraith Interceptor, and Atlas Cruiser.
- Five procedural biomes: Alpine Dominion, Neon Pacific, Emerald Frontier, Crimson Dunes, and Azure Archipelago.
- Game modes: Free Flight, Time Trial, Canyon Rush, Sky Delivery, Sky Academy, and Pilot Sandbox.
- Sky Academy lessons with checkpoint progression, mistake coaching, and grading.
- Cockpit camera with readable instrument overlay, radio stack visuals, switches, and aircraft-specific panel palette.
- Weight and balance panel with passengers, cargo, fuel, CG visualization, and live handling impact.
- VFR-style route lines, checkpoint rings, runway systems, windsock/tower/hangar details, weather atmosphere, clouds, particles, and adaptive quality.
- Local settings persistence through browser local storage.

## Controls

| Input | Action |
| --- | --- |
| Mouse / trackpad | Pitch and roll |
| Arrow keys or WASD | Pitch and roll |
| Scroll wheel | Throttle |
| `Space` | Boost / brake release intent |
| `Shift` | Air brake |
| `F` / `R` | Flaps down / up |
| `I` / `K` | Trim up / down |
| `G` | Toggle gear |
| `Q` / `E` | Yaw |
| `Backspace` | Reset flight |
| Gamepad axes/buttons | Polling-ready flight input |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run type-check
npm run build
```

## Vercel Deployment

The app is compatible with Vercel as a standard Next.js application.

```bash
npm run build
```

No environment variables are required for the current single-player browser build.

Future multiplayer, tournaments, wagers, and online leaderboards should introduce server-side routes, authenticated identities, anti-cheat validation, and wager compliance checks before deployment.

## Architecture

```text
src/app                 Next.js App Router shell
src/components/game     R3F scene, aircraft, world, HUD, cockpit, academy UI
src/hooks               Browser/gamepad input
src/lib/flight          Typed catalogs, persistent store, navigation, physics
```

The runtime is intentionally modular so the project can grow into multiplayer sessions, ghost runs, replay exports, procedural world expansion, authenticated leaderboards, and wagering workflows without rewriting the local flight loop.
