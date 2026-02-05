import { ExternalLink, Eye, FileCheck, FileText, ImageIcon } from "lucide-react";

export const DocPreview = ({ label, url }: { label: string; url: string }) => {
  if (!url) return null;

  const isPDF = url.toLowerCase().endsWith(".pdf") || url.includes("/raw/upload/");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
        {isPDF ? <FileCheck className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
        {label}
      </p>
      <div className="relative group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden h-48 flex items-center justify-center">
        {isPDF ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FileText className="w-8 h-8" />
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ExternalLink className="w-3 h-3" /> View PDF Document
            </a>
          </div>
        ) : (
          <>
            <img 
              src={url} 
              alt={label} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <a href={url} target="_blank" className="p-2 bg-white rounded-full text-gray-900 shadow-xl">
                  <Eye className="w-4 h-4" />
               </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};