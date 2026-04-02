import { Analytics } from "@vercel/analytics/next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Toast from "./Toast";


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
