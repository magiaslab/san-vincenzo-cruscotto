import type { MetadataRoute } from "next";
import { COMUNE_NOME, COMUNE_PROVINCIA } from "@/lib/constants";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} (${COMUNE_PROVINCIA})`,
    short_name: `Cruscotto ${COMUNE_NOME}`,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f2f7fb",
    theme_color: "#0066cc",
    lang: "it",
    icons: [
      {
        src: "/stemma-san-vincenzo.png",
        sizes: "399x500",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
