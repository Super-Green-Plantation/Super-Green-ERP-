import jsPDF from "jspdf";

export const COLORS: Record<string, [number, number, number]> = {
  primary: [15, 23, 42],   // Slate 900
  accent: [37, 99, 235],    // Blue 600
  success: [22, 163, 74],   // Green 600
  light: [248, 250, 252],   // Slate 50
  text: [51, 65, 85],       // Slate 700
  textLight: [100, 116, 139] // Slate 500
};

export const drawHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${subtitle ? `| ${subtitle}` : ""}`, 15, 28);
};

export const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text("Super Green Plantation ERP - Confidential Report", pageWidth / 2, pageHeight - 10, { align: "center" });
};