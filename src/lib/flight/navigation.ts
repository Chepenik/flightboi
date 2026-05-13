import { Vector3 } from "three";
import { MapProfile } from "./types";

export type FlightRoute = {
  name: string;
  waypoints: Vector3[];
};

export function getRouteForMap(map: MapProfile, modeId: string): FlightRoute {
  const routeScale = modeId === "canyon-rush" ? 0.72 : 1;
  const altitude = modeId === "sky-delivery" ? 180 : 260;
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

  if (map.id === "neon-pacific") {
    return {
      name: "Neon Slot",
      waypoints: base.map((point, index) =>
        point.clone().add(new Vector3(index % 2 === 0 ? 80 : -90, 55, 0)),
      ),
    };
  }

  if (map.id === "azure-archipelago") {
    return {
      name: "Island Thread",
      waypoints: base.map((point, index) =>
        point.clone().multiply(new Vector3(1.08, 0.74, 1.04)).add(new Vector3(0, index * 8, 0)),
      ),
    };
  }

  if (map.id === "crimson-dunes") {
    return {
      name: "Dust Meridian",
      waypoints: base.map((point, index) =>
        point.clone().add(new Vector3(index * 48 - 160, 80 * Math.sin(index), 80)),
      ),
    };
  }

  if (map.id === "emerald-frontier") {
    return {
      name: "River Bend",
      waypoints: base.map((point, index) =>
        point.clone().add(new Vector3(120 * Math.sin(index * 1.3), -20, 70 * Math.cos(index))),
      ),
    };
  }

  return {
    name: "Ridge Line",
    waypoints: base,
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
