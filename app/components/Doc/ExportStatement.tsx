"use client";

import React, { useState } from "react";
import { FileBarChart, Loader2 } from "lucide-react";

interface ExportButtonProps {
  data: any;
  exportFn: (data: any, secondaryData?: any) => void;
  secondaryData?: any; // Useful for passing the 'commissions' array separately
  label?: string;
  variant?: "white" | "dark";
}

const ExportButton = ({ 
  data, 
  exportFn, 
  secondaryData, 
  label = "Export Report",
  variant = "white" 
}: ExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    if (!data) return;
    
    setIsGenerating(true);
    try {
      // Small timeout to allow the UI to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 800));
      exportFn(data, secondaryData);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const themes = {
    white: "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm",
    dark: "bg-slate-900 hover:bg-slate-800 text-white border-transparent shadow-lg shadow-slate-200"
  };

  return (
    <button
      disabled={isGenerating || !data}
      onClick={handleExport}
      className={`
        flex items-center justify-center gap-2 px-5 py-3 
        text-[10px] font-black uppercase tracking-widest rounded-xl border 
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${themes[variant]}
      `}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileBarChart className={`w-4 h-4 ${variant === "white" ? "text-slate-400" : "text-blue-400"}`} />
      )}
      <span>{isGenerating ? "Generating..." : label}</span>
    </button>
  );
};

export default ExportButton;