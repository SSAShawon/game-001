import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIFE LEAD — Personal Life Simulation & Business Empire",
  description:
    "A 2D personal life simulation game. Build your virtual life, manage a bank, take loans, run businesses, and grow a collection — all saved locally on your PC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
