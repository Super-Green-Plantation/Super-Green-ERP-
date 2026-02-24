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
    min-h-screen bg-gray-100 sm:pt-10 pt-8 p-4
    transition-all duration-300
    ml-20 ${isCollapsed ? "md:ml-20" : "md:ml-72"}
  `}
      >
        <Providers>
          <Toast>{children}</Toast>
        </Providers>
      </main>
    </>
  );
}
