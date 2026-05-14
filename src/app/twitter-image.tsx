import { ImageResponse } from "next/og";
import { FlightBoiMetaArt } from "./meta-art";

export const alt =
  "FlightBoi browser flight game social preview with a neon light-jet over a cinematic grid";
export const size = {
  width: 1200,
  height: 675,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<FlightBoiMetaArt variant="twitter" />, {
    ...size,
  });
}
