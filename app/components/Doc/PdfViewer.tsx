// app/components/PdfViewer.tsx
"use client";

interface PdfViewerProps {
  url: string | null | undefined;
}

export const PdfViewer = ({ url }: PdfViewerProps) => {
  if (!url) return <p className="text-sm text-gray-500">No PDF uploaded</p>;

  return (
    <iframe
      src={url}
      width="100%"
      height="600"
      className="border rounded-lg"
      title="PDF Viewer"
    />
  );
};
