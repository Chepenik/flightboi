import { ImageResponse } from "next/og";
import { FlightBoiMetaArt } from "./meta-art";

export const alt =
  "FlightBoi cinematic arcade flight game with neon aircraft, grid, and aviation academy callouts";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<FlightBoiMetaArt variant="open-graph" />, {
    ...size,
  });
}
