import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: "#09090b",
        borderRadius: 7,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 7px",
        gap: 4,
      }}
    >
      <div style={{ width: 18, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
      <div style={{ width: 13, height: 3, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
      <div style={{ width: 18, height: 3, background: "white", borderRadius: 2 }} />
    </div>,
    { ...size },
  );
}
