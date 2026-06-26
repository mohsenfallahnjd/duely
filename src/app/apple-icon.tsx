import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#6366f1",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: -4,
          fontFamily: "sans-serif",
        }}
      >
        D
      </div>
    </div>,
    { ...size },
  );
}
