import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 10,
          background: "#0066CC",
          borderRadius: 36,
          padding: "36px 28px 28px",
        }}
      >
        <div
          style={{
            width: 22,
            height: 44,
            background: "rgba(255,255,255,0.85)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            width: 22,
            height: 70,
            background: "#ffffff",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            width: 22,
            height: 96,
            background: "#B8D4F0",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            width: 22,
            height: 112,
            background: "#ffffff",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
