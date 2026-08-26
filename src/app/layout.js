import { Questrial, Sarabun } from "next/font/google";

import "./globals.css";

const questrial = Questrial({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-questrial",
  display: "swap",
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
      className={`${questrial.variable} ${sarabun.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
