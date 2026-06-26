import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: 192,
        height: 192,
        background: "#09090b",
        borderRadius: 42,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 40px",
        gap: 20,
      }}
    >
      <div style={{ width: 112, height: 16, background: "rgba(255,255,255,0.28)", borderRadius: 8 }} />
      <div style={{ width: 80, height: 16, background: "rgba(255,255,255,0.6)", borderRadius: 8 }} />
      <div style={{ width: 112, height: 16, background: "white", borderRadius: 8 }} />
    </div>,
    { width: 192, height: 192 },
  );
}
