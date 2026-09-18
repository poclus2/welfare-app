"use client";

import { Printer } from "lucide-react";
import { useState } from "react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl backdrop-blur transition-colors print:hidden"
    >
      <Printer className="w-4 h-4" />
      <span>Exporter PDF</span>
    </button>
  );
}
