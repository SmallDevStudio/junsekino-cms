import localFont from "next/font/local";
import { Sarabun } from "next/font/google";

import "./globals.css";

const centuryGothic = localFont({
  src: "./fonts/CenturyGothic.otf",
  variable: "--font-century-gothic",
  display: "swap",
  weight: "400",
  style: "normal",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

import { getSiteUrl } from "@/lib/seo/site-url";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),

  title: {
    default: "Junsekino",
    template: "%s | Junsekino",
  },

  description: "Junsekino architecture and design.",

  manifest: "/site.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${centuryGothic.variable} ${sarabun.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
