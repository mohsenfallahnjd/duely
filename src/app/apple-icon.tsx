import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple splash / home-screen icon — matches PayMay gradient + ledger mark */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #4f46e5 0%, #7c3aed 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 116,
            height: 116,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 34,
              height: 34,
              borderRadius: 17,
              background: "#c4b5fd",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 4,
              left: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 11,
                height: 66,
                borderRadius: 6,
                background: "#f8fafc",
              }}
            />
            <div
              style={{
                width: 11,
                height: 48,
                borderRadius: 6,
                background: "#f8fafc",
              }}
            />
            <div
              style={{
                width: 11,
                height: 34,
                borderRadius: 6,
                background: "#f8fafc",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
