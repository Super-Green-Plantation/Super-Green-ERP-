import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "./components/SideBar/Sidebar";
import "./globals.css";
import Providers from "./providers";
import Toast from "./Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGP ERP",
  description: "SGP ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex">
          <Sidebar />

          <main className="ml-0 md:ml-60 p-6 bg-gray-100 min-h-screen w-full">
            <Providers>
              <Toast>{children}</Toast>

              <ReactQueryDevtools initialIsOpen={false} />
            </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
