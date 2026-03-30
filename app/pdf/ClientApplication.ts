import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const cleanClonedDoc = (clonedDoc: Document) => {
  // Strip oklch/lab color functions (Tailwind v3.3+ issue)
  Array.from(clonedDoc.querySelectorAll("style")).forEach((el: any) => {
    if (/oklch|oklab|\blab\(|\blch\(/.test(el.innerHTML)) {
      el.innerHTML = el.innerHTML
        .replace(/oklch\([^)]+\)/g, "inherit")
        .replace(/oklab\([^)]+\)/g, "inherit")
        .replace(/\blab\([^)]+\)/g, "inherit")
        .replace(/\blch\([^)]+\)/g, "inherit");
    }
  });
  // Disable external stylesheets
  Array.from(clonedDoc.querySelectorAll("link[rel='stylesheet']")).forEach((el: any) => {
    el.disabled = true;
  });
  // Safe overrides
  const override = clonedDoc.createElement("style");
  override.innerHTML = `
    *, *::before, *::after {
      --background: #ffffff !important;
      --foreground: #000000 !important;
      --primary: #166534 !important;
      --border: #e5e7eb !important;
    }
  `;
  clonedDoc.head.appendChild(override);
};

export const generateClientApplicationPDF = async (
  element: HTMLElement | null,
  fileName: string = "Proposal_Form"
) => {
  if (!element) return;

  // Select all direct children marked as pages
  const pages = Array.from(
    element.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );

  // Fallback: use direct children if no data-pdf-page markers found
  const pageEls: HTMLElement[] =
    pages.length > 0
      ? pages
      : (Array.from(element.children) as HTMLElement[]);

  if (pageEls.length === 0) {
    console.error("No pages found");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();  // 210mm
  const pdfH = pdf.internal.pageSize.getHeight(); // 297mm

  try {
    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i];

      // ── Mount page into an isolated offscreen container ──────────────────
      // This ensures html2canvas sees ONLY this page, not the sibling pages.
      const wrapper = document.createElement("div");
      wrapper.style.cssText = [
        "position: fixed",
        "top: 0",
        "left: -9999px",
        "width: 210mm",
        "background: white",
        "overflow: visible",
        "z-index: -1",
      ].join(";");

      // Deep-clone so we don't disturb the live DOM
      const clone = pageEl.cloneNode(true) as HTMLElement;
      clone.style.pageBreakAfter = "unset";
      clone.style.overflow = "visible";
      clone.style.height = "auto";
      clone.style.minHeight = "297mm";

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Small delay to let images render inside the clone
      await new Promise((r) => setTimeout(r, 80));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        onclone: (clonedDoc) => {
          cleanClonedDoc(clonedDoc);
          // Make all cloned elements overflow visible
          clonedDoc.querySelectorAll("*").forEach((el: any) => {
            const s = el.style;
            if (s && s.overflow === "hidden") s.overflow = "visible";
          });
        },
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/png");

      // Always fill full A4 width; scale height proportionally
      const ratio = canvas.height / canvas.width;
      const imgH = pdfW * ratio;

      if (i > 0) pdf.addPage();

      // If the rendered height fits within A4 — center it, otherwise scale to fit
      if (imgH <= pdfH) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgH);
      } else {
        const scale = pdfH / imgH;
        const finalW = pdfW * scale;
        const finalH = pdfH;
        const xOff = (pdfW - finalW) / 2;
        pdf.addImage(imgData, "PNG", xOff, 0, finalW, finalH);
      }
    }

    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw err;
  }
};