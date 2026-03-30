import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Toast from "./Toast";
import { Inter, Manrope } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="antialiased font-sans">
        <NextTopLoader color="#16a34a" showSpinner={false} />
        <Analytics />
        <Toast>{children}</Toast>
      </body>
    </html>
  );
}
