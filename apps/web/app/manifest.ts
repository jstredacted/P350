import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "₱350",
    short_name: "₱350",
    description: "Coordinate-grid cashflow control interface",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f0ec",
    theme_color: "#f0f0ec",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  }
}
