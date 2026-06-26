import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: "#09090b",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 106px",
        gap: 52,
      }}
    >
      <div style={{ width: 300, height: 42, background: "rgba(255,255,255,0.28)", borderRadius: 21 }} />
      <div style={{ width: 214, height: 42, background: "rgba(255,255,255,0.6)", borderRadius: 21 }} />
      <div style={{ width: 300, height: 42, background: "white", borderRadius: 21 }} />
    </div>,
    { width: 512, height: 512 },
  );
}
