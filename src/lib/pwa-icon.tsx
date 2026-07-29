import { ImageResponse } from "next/og";

/** Icona PWA a barre (stesso linguaggio della favicon). */
export function pwaIconResponse(size: number) {
  const gap = Math.max(4, Math.round(size * 0.06));
  const barW = Math.max(8, Math.round(size * 0.12));
  const pad = Math.max(10, Math.round(size * 0.16));
  const radius = Math.max(12, Math.round(size * 0.18));
  const heights = [0.28, 0.45, 0.62, 0.72].map((h) =>
    Math.round((size - pad * 2) * h),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap,
          background: "#0066CC",
          borderRadius: radius,
          padding: `${pad}px`,
        }}
      >
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              width: barW,
              height: h,
              background: i === 2 ? "#B8D4F0" : "#ffffff",
              opacity: i === 0 ? 0.85 : 1,
              borderRadius: Math.max(2, Math.round(barW * 0.25)),
            }}
          />
        ))}
      </div>
    ),
    { width: size, height: size },
  );
}
