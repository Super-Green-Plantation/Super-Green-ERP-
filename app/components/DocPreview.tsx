import {
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  ImageIcon,
  Trash,
  Trash2,
} from "lucide-react";
import { deleteClientDocument } from "../services/documents.service";
import { useDeleteDoc } from "../hooks/useDoc";
import { useQueries, useQueryClient } from "@tanstack/react-query";

export const DocPreview = ({
  label,
  url,
  id,
  docKey,
}: {
  label: string;
  url: string;
  id: any;
  docKey: string;
}) => {
  if (!url) return null;

  const queryClient = useQueryClient();

  const isPDF =
    url.toLowerCase().endsWith(".pdf") || url.includes("/raw/upload/");

  const { mutateAsync: deleteDoc } = useDeleteDoc();

  const handleDelete = async (id: any, docKey: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?",
    );
    if (!confirmed) return; // Exit if user clicks "Cancel"

    try {
      await deleteDoc({ nic: id, docKey });
      queryClient.invalidateQueries({
        queryKey: ["client"],
      });
      alert("Document deleted successfully.");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
        {isPDF ? (
          <FileCheck className="w-3 h-3" />
        ) : (
          <ImageIcon className="w-3 h-3" />
        )}
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
            <div className="absolute gap-3 inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a
                href={url}
                target="_blank"
                className="p-2 bg-white rounded-full text-gray-900 shadow-xl"
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                className="text-red-400 bg-white rounded-full p-2 text-2xl cursor-pointer"
                onClick={() => handleDelete(id, docKey)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
