import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PayMay",
    short_name: "PayMay",
    description:
      "Personal payment ledger — payments, debts, and pending balances with contacts and tags.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fafafa",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/paymay-icon.svg",
        type: "image/svg+xml",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/paymay-icon.svg",
        type: "image/svg+xml",
        sizes: "512x512",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
