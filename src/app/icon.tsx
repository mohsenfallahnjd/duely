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
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="10" cy="14.5" rx="8" ry="2.5" stroke="white" strokeWidth="1.4" fill="none"/>
        <rect x="2" y="12" width="16" height="2.5" fill="#09090b"/>
        <line x1="2" y1="12" x2="2" y2="14.5" stroke="white" strokeWidth="1.4" strokeLinecap="square"/>
        <line x1="18" y1="12" x2="18" y2="14.5" stroke="white" strokeWidth="1.4" strokeLinecap="square"/>
        <ellipse cx="10" cy="9.5" rx="8" ry="2.5" stroke="white" strokeWidth="1.4" fill="none"/>
        <rect x="2" y="7" width="16" height="2.5" fill="#09090b"/>
        <line x1="2" y1="7" x2="2" y2="9.5" stroke="white" strokeWidth="1.4" strokeLinecap="square"/>
        <line x1="18" y1="7" x2="18" y2="9.5" stroke="white" strokeWidth="1.4" strokeLinecap="square"/>
        <ellipse cx="10" cy="4.5" rx="8" ry="2.5" fill="#09090b" stroke="white" strokeWidth="1.4"/>
      </svg>
    </div>,
    { ...size },
  );
}
