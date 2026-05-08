import { Analytics } from "@vercel/analytics/next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Toast from "./Toast";
import SupportButton from "./components/Buttons/SupportButton";
import { Metadata, Viewport } from "next";


export const metadata: Metadata = {
  title: "SGP ERP",
  description: "Super Green Plantation ERP System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SGP ERP",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "SGP ERP",
    title: "SGP ERP",
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head >
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
