"use client";

import { Printer } from "lucide-react";
import { useState } from "react";

export function PrintButton() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById("pdf-report-content");
      if (!element) {
        alert("Élément introuvable");
        return;
      }
      
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF;

      // Ensure full height is captured
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;
      element.style.height = 'max-content';
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollY: 0
      });
      
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF("p", "mm", [pdfWidth, Math.max(pdfHeight, 297)]);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("rapport-admin-thewelfare.pdf");
      
    } catch (e: any) {
      console.error("PDF generation error", e);
      alert("Erreur lors de la génération: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPDF}
      disabled={isExporting}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl backdrop-blur transition-colors print:hidden disabled:opacity-50"
    >
      {isExporting ? <span className="animate-spin">⏳</span> : <Printer className="w-4 h-4" />}
      <span>{isExporting ? "Génération..." : "Exporter PDF"}</span>
    </button>
  );
}
