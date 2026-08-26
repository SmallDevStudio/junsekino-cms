import "./globals.css";

export const metadata = {
  title: {
    default: "Junsekino",
    template: "%s | Junsekino",
  },

  description: "Junsekino architecture and design.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
