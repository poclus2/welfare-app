"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Leaf, Menu } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-3 w-[96%] max-w-[1300px] mx-auto mt-6 bg-[#FDFDFC] rounded-full shadow-sm relative z-50 border border-white"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-foreground font-semibold text-lg tracking-wide hover:opacity-80 transition-opacity pl-2">
        <Leaf className="w-5 h-5 text-[#2A2424]" />
        <span>THE WELFARE SHOP</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium absolute left-1/2 -translate-x-1/2">
        <Link href="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
        <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
        <Link href="/ingredients" className="text-muted-foreground hover:text-foreground transition-colors">Ingredients</Link>
        <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2.5 text-foreground hover:text-primary transition-colors bg-[#F1EFEA] rounded-full flex items-center justify-center">
          <ShoppingBag className="w-4 h-4" />
          <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background border border-background">
            0
          </span>
        </button>
        <Link 
          href="/shop" 
          className="hidden sm:flex items-center gap-1.5 bg-[#2A2424] text-[#FDFDFC] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          Shop Now
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button className="lg:hidden p-2 text-foreground hover:bg-black/5 rounded-full transition-colors ml-1">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </motion.nav>
  );
}
