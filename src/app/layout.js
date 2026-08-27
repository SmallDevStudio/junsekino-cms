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

export const metadata = {
  title: {
    default: "Junsekino",
    template: "%s | Junsekino",
  },

  description: "Junsekino architecture and design.",
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
