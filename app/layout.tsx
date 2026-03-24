import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Toast from "./Toast";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="antialiased">
        <Analytics />
        <Toast>{children}</Toast>
      </body>
    </html>
  );
}