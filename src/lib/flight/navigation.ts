import { Vector3 } from "three";
import { GameModeId, MapProfile } from "./types";

export type FlightRoute = {
  name: string;
  waypoints: Vector3[];
};

export function getRouteForMap(map: MapProfile, modeId: GameModeId | string): FlightRoute {
  const routeScale =
    modeId === "canyon-rush"
      ? 0.62
      : modeId === "time-trial"
        ? 0.9
        : modeId === "pilot-sandbox"
          ? 1.22
          : modeId === "free-flight"
            ? 1.12
            : 1;
  const altitude =
    modeId === "canyon-rush"
      ? 150
      : modeId === "sky-delivery"
        ? 180
        : modeId === "pilot-sandbox"
          ? 330
          : modeId === "free-flight"
            ? 310
            : 260;
  const base = [
    new Vector3(-620 * routeScale, altitude + 60, -740),
    new Vector3(-260 * routeScale, altitude + 20, -1080),
    new Vector3(180 * routeScale, altitude + 110, -920),
    new Vector3(540 * routeScale, altitude + 50, -520),
    new Vector3(710 * routeScale, altitude + 170, 20),
    new Vector3(310 * routeScale, altitude + 35, 520),
    new Vector3(-140 * routeScale, altitude + 20, 780),
    new Vector3(-520 * routeScale, altitude + 100, 370),
  ];

  const modeShape = base.map((point, index) => {
    if (modeId === "canyon-rush") {
      return point.clone().add(new Vector3(Math.sin(index * 1.7) * 84, index % 2 === 0 ? -34 : 10, Math.cos(index) * 42));
    }

    if (modeId === "sky-delivery") {
      return point.clone().multiply(new Vector3(1.12, 0.72, 1.04)).add(new Vector3(index % 2 === 0 ? 32 : -32, -18, 0));
    }

    if (modeId === "sky-academy") {
      return point.clone().multiply(new Vector3(0.82, 0.92, 0.82)).add(new Vector3(0, 34 + index * 4, 0));
    }

    if (modeId === "pilot-sandbox") {
      return point.clone().add(new Vector3(Math.sin(index * 0.8) * 170, 70, Math.cos(index * 1.1) * 120));
    }

    return point;
  });

  if (map.id === "neon-pacific") {
    return {
      name: "Neon Slot",
      waypoints: modeShape.map((point, index) =>
        point.clone().add(new Vector3(index % 2 === 0 ? 80 : -90, 55, 0)),
      ),
    };
  }

  if (map.id === "azure-archipelago") {
    return {
      name: "Island Thread",
      waypoints: modeShape.map((point, index) =>
        point.clone().multiply(new Vector3(1.08, 0.74, 1.04)).add(new Vector3(0, index * 8, 0)),
      ),
    };
  }

  if (map.id === "crimson-dunes") {
    return {
      name: "Dust Meridian",
      waypoints: modeShape.map((point, index) =>
        point.clone().add(new Vector3(index * 48 - 160, 80 * Math.sin(index), 80)),
      ),
    };
  }

  if (map.id === "emerald-frontier") {
    return {
      name: "River Bend",
      waypoints: modeShape.map((point, index) =>
        point.clone().add(new Vector3(120 * Math.sin(index * 1.3), -20, 70 * Math.cos(index))),
      ),
    };
  }

  return {
    name: "Ridge Line",
    waypoints: modeShape,
  };
}

export function headingToCompass(heading: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((heading % 360) + 360) % 360) / 45) % directions.length;
  return directions[index];
}

export function normalizeHeading(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}
