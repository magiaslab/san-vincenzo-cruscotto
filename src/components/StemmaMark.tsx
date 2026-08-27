import type { ReactNode } from "react";
import Image from "next/image";
import { STEMMA } from "@/lib/constants";

type StemmaMarkProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

/** Stemma o marchio: SVG locale via `<img>`, raster via next/image. */
export function StemmaMark({
  width = 36,
  height = 45,
  className = "h-9 w-auto shrink-0",
  priority = false,
}: StemmaMarkProps) {
  const svg = STEMMA.src.endsWith(".svg");
  if (svg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={STEMMA.src}
        alt={STEMMA.alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }
  return (
    <Image
      src={STEMMA.src}
      alt={STEMMA.alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}

export function StemmaMarkSlot({ children }: { children?: ReactNode }) {
  return children ?? <StemmaMark />;
}
