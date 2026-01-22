"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon & Error Code */}
        <div className="relative inline-block">
          <div className="bg-blue-50 p-6 rounded-3xl inline-block ring-1 ring-blue-100">
            <FileQuestion className="w-16 h-16 text-blue-600 animate-pulse" />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-white px-3 py-1 rounded-full text-xs font-black text-gray-400 border border-gray-100 shadow-sm">
            ERROR 404
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            The page you are looking for doesn't exist or has been moved to another location.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}