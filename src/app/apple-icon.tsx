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
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <svg width="110" height="90" viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* coin bottom */}
        <ellipse cx="55" cy="82" rx="44" ry="14" stroke="white" strokeWidth="7" fill="none"/>
        <rect x="11" y="68" width="88" height="14" fill="#09090b"/>
        <line x1="11" y1="68" x2="11" y2="82" stroke="white" strokeWidth="7" strokeLinecap="square"/>
        <line x1="99" y1="68" x2="99" y2="82" stroke="white" strokeWidth="7" strokeLinecap="square"/>
        {/* coin mid */}
        <ellipse cx="55" cy="56" rx="44" ry="14" stroke="white" strokeWidth="7" fill="none"/>
        <rect x="11" y="42" width="88" height="14" fill="#09090b"/>
        <line x1="11" y1="42" x2="11" y2="56" stroke="white" strokeWidth="7" strokeLinecap="square"/>
        <line x1="99" y1="42" x2="99" y2="56" stroke="white" strokeWidth="7" strokeLinecap="square"/>
        {/* coin top */}
        <ellipse cx="55" cy="28" rx="44" ry="14" fill="#09090b" stroke="white" strokeWidth="7"/>
      </svg>
    </div>,
    { ...size },
  );
}
