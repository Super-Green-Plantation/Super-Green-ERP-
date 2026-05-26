/**
 * generateProposalPDF.ts
 *
 * Captures every [data-pdf-page] element rendered by <ProposalTemplate>
 * and assembles them into a single multi-page A4 PDF using html2canvas
 * and jsPDF.
 *
 * Usage
 * ─────
 *   import { generateProposalPDF } from "@/lib/generateProposalPDF";
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   // Somewhere in your component:
 *   <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
 *     <ProposalTemplate ref={ref} data={clientData} />
 *   </div>
 *
 *   // On button click:
 *   await generateProposalPDF(ref, {
 *     filename: `Proposal_${clientData.applicant.nic}.pdf`,
 *   });
 *
 * Dependencies (add to package.json if not already present):
 *   npm install html2canvas jspdf
 *   npm install --save-dev @types/jspdf        // if needed
 *
 * Notes
 * ─────
 * • The template renders at 210mm wide. html2canvas captures at the element's
 *   rendered pixel size, then the image is scaled to fill A4 (595.28 × 841.89 pt).
 * • Google Fonts (Playfair Display, Source Sans 3) must be loaded in the
 *   document before capture. Use document.fonts.ready to wait for them.
 * • Images with crossOrigin="anonymous" (e.g. signatures from Cloudinary)
 *   must be served with CORS headers — the template already sets the attribute.
 * • Set useCORS: true and allowTaint: false in the html2canvas options below
 *   (already set). If a signature image fails CORS, it is silently omitted.
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// A4 dimensions in PDF points (72 pt/inch, 1 pt = 0.3528 mm)
const A4_WIDTH_PT  = 595.28;
const A4_HEIGHT_PT = 841.89;

export interface GeneratePDFOptions {
  /** Downloaded file name. Defaults to "Proposal.pdf" */
  filename?: string;

  /**
   * html2canvas scale factor.
   * 2 = retina quality (good for print); 1.5 is lighter but still sharp.
   * Higher values slow capture and increase file size.
   * Default: 2
   */
  scale?: number;

  /**
   * Called after each page is captured (0-indexed).
   * Use this to drive a progress indicator.
   */
  onPageCaptured?: (pageIndex: number, total: number) => void;

  /**
   * If true, the PDF is returned as a Blob instead of being downloaded.
   * Useful if you want to upload to Supabase Storage or show a preview.
   * Default: false
   */
  returnBlob?: boolean;
}

/**
 * Waits for all document fonts to finish loading so html2canvas
 * captures text with the correct typeface.
 */
async function waitForFonts(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

/**
 * Captures a single DOM element to a canvas using html2canvas.
 */
async function captureElement(
  el: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale,
    useCORS: true,       // allow cross-origin images (signatures, logo)
    allowTaint: false,   // don't taint canvas on CORS failure — skip silently
    backgroundColor: "#ffffff",
    logging: false,
    // Ensure the full element height is captured even if it overflows
    windowWidth:  el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
}

/**
 * Main export — captures all [data-pdf-page] elements inside the ref
 * and produces a downloadable (or Blob-returnable) A4 PDF.
 */
export async function generateProposalPDF(
  containerRef: React.RefObject<HTMLDivElement>,
  options: GeneratePDFOptions = {}
): Promise<Blob | void> {
  const {
    filename    = "Proposal.pdf",
    scale       = 2,
    onPageCaptured,
    returnBlob  = false,
  } = options;

  if (!containerRef.current) {
    console.error("[generateProposalPDF] containerRef.current is null.");
    return;
  }

  // 1. Wait for fonts so Playfair Display / Source Sans 3 render correctly
  await waitForFonts();

  // 2. Collect all page elements in DOM order
  const pageEls = Array.from(
    containerRef.current.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );

  if (pageEls.length === 0) {
    console.warn("[generateProposalPDF] No [data-pdf-page] elements found.");
    return;
  }

  // 3. Initialise jsPDF in A4 portrait
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  // 4. Capture each page element and add to PDF
  for (let i = 0; i < pageEls.length; i++) {
    const el = pageEls[i];

    // Add a new PDF page for every page after the first
    if (i > 0) {
      pdf.addPage("a4", "portrait");
    }

    // Capture to canvas
    const canvas = await captureElement(el, scale);

    // Scale the canvas image to fill A4 width while preserving aspect ratio.
    // If content is taller than A4, jsPDF clips — the template is designed
    // to fit within 297 mm so this should not occur in practice.
    const imgData   = canvas.toDataURL("image/jpeg", 0.92);
    const imgW      = A4_WIDTH_PT;
    const imgH      = (canvas.height / canvas.width) * imgW;

    pdf.addImage(
      imgData,
      "JPEG",
      0,           // x offset (pt)
      0,           // y offset (pt)
      imgW,        // width (pt)
      Math.min(imgH, A4_HEIGHT_PT), // never exceed page height
      undefined,   // alias (auto)
      "FAST"       // compression: "NONE" | "FAST" | "MEDIUM" | "SLOW"
    );

    onPageCaptured?.(i, pageEls.length);
  }

  // 5. Output
  if (returnBlob) {
    return pdf.output("blob");
  }

  pdf.save(filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT HOOK WRAPPER  (optional convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useProposalPDF
 *
 * A thin React hook that wraps generateProposalPDF with loading + error state.
 *
 * Usage:
 *   const { generate, loading, progress } = useProposalPDF(ref);
 *
 *   <button onClick={() => generate({ filename: "MyProposal.pdf" })} disabled={loading}>
 *     {loading ? `Generating… ${progress}%` : "Download PDF"}
 *   </button>
 */
import { useState, useCallback } from "react";

export function useProposalPDF(containerRef: React.RefObject<HTMLDivElement>) {
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState<string | null>(null);

  const generate = useCallback(
    async (options: GeneratePDFOptions = {}): Promise<Blob | void> => {
      setLoading(true);
      setProgress(0);
      setError(null);

      try {
        const result = await generateProposalPDF(containerRef, {
          ...options,
          onPageCaptured: (idx, total) => {
            setProgress(Math.round(((idx + 1) / total) * 100));
            options.onPageCaptured?.(idx, total);
          },
        });
        return result;
      } catch (err: any) {
        const msg = err?.message ?? "PDF generation failed.";
        setError(msg);
        console.error("[useProposalPDF]", err);
      } finally {
        setLoading(false);
      }
    },
    [containerRef]
  );

  return { generate, loading, progress, error };
}

