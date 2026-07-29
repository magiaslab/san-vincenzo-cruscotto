import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon generata: grafico a barre + andamento (cruscotto dati). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 4,
          background: "#0066CC",
          borderRadius: 12,
          padding: "12px 10px 10px",
        }}
      >
        <div
          style={{
            width: 8,
            height: 16,
            background: "rgba(255,255,255,0.85)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 26,
            background: "#ffffff",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 36,
            background: "#B8D4F0",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 42,
            background: "#ffffff",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
