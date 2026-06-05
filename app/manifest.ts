import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verta — utleieforvaltning",
    short_name: "Verta",
    description:
      "Full kontroll over dine utleieeiendommer — kalender, bookinger, smartlås og skatt.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#081b33",
    theme_color: "#081b33",
    lang: "nb",
    icons: [
      { src: "/api/icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/api/icon?size=512", sizes: "512x512", type: "image/png" },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
