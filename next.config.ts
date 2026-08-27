import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // stemma locale in /public — nessun remote necessario
  },
  // Leaflet richiede accessori lato client
  transpilePackages: ["react-leaflet", "leaflet"],
  async redirects() {
    return [
      {
        source: "/supporter",
        destination: "/sostieni",
        permanent: false,
      },
      {
        source: "/riuso",
        destination: "/riusa",
        permanent: false,
      },
      {
        source: "/cruscotto",
        destination: "/",
        permanent: false,
      },
      {
        source: "/progetto",
        destination: "https://www.cruscottocomune.it/progetto",
        permanent: false,
      },
      {
        source: "/fonti",
        destination: "https://www.cruscottocomune.it/fonti",
        permanent: false,
      },
      {
        source: "/menzioni",
        destination: "https://www.cruscottocomune.it/menzioni",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
