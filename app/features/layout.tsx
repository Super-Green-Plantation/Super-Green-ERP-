"use client";

import { useState } from "react";
import Sidebar from "../components/SideBar/Sidebar";
import Providers from "../providers";
import Toast from "../Toast";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main
        className={`
          min-h-screen bg-gray-100 p-6 pt-20 md:pt-6
          transition-all duration-300
          ${isCollapsed ? "md:ml-20" : "md:ml-64"}
        `}
      >
        <Providers>
          <Toast>{children}</Toast>
        </Providers>
      </main>
    </>
  );
}
