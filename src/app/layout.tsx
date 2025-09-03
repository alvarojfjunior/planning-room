import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AblyProvider } from "@/lib/ably-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Planning Poker",
  description: "Collaborative Planning Poker for Agile Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
