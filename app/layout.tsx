import { Analytics } from "@vercel/analytics/next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Toast from "./Toast";
import SupportButton from "./components/Buttons/SupportButton";


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
        <SupportButton />
      </body>
    </html>
  );
}
