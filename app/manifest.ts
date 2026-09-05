import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeKit",
    short_name: "LifeKit",
    description:
      "One app. Many useful things. A personal utility kit for budget, tasks, goals, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f7f4",
    theme_color: "#2a8a7a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
