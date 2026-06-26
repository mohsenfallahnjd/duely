import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#09090b",
        borderRadius: 40,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 38px",
        gap: 20,
      }}
    >
      <div style={{ width: 104, height: 16, background: "rgba(255,255,255,0.28)", borderRadius: 8 }} />
      <div style={{ width: 74, height: 16, background: "rgba(255,255,255,0.6)", borderRadius: 8 }} />
      <div style={{ width: 104, height: 16, background: "white", borderRadius: 8 }} />
    </div>,
    { ...size },
  );
}
