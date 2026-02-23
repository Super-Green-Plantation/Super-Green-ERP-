"use client";

import { useState } from "react";
import Sidebar from "./components/SideBar/Sidebar";
import "./globals.css";
import Providers from "./providers";
import Toast from "./Toast";
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <html lang="en">
      <body className="antialiased ml-20 bg-gray-100">
        <Analytics />
        <Toast>{children}</Toast>
      </body>
    </html>
  );
}
