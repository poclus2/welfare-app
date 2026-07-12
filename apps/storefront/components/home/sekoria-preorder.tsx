"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export function SekoriaPreorder() {
  return (
    <section className="w-full bg-[#F4EAEB] py-24 md:py-32 flex flex-col items-center overflow-hidden relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E5B6B9]/40 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#DCE4E5]/50 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Side: Product Imagery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full max-w-[600px] relative"
        >
          <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
            <img 
              src="https://images.pexels.com/photos/4465125/pexels-photo-4465125.jpeg?auto=compress&cs=tinysrgb&w=800" 
              alt="Sekoria Prototype" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 mix-blend-multiply" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-8 left-8 right-8 text-center text-white">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 mb-2 block">Project Code</span>
              <p className="font-serif text-3xl italic">S-01 Formula</p>
            </div>
          </div>
          
          {/* Floating Pre-order badge */}
          <div className="absolute top-8 -right-4 lg:-right-12 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#2A2424] flex items-center justify-center text-[#E5B6B9]">
               <Clock className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs font-bold text-[#2A2424]/50 uppercase tracking-wider">Drop 1</p>
               <p className="text-lg font-bold text-[#2A2424]">Q4 2026</p>
             </div>
          </div>
        </motion.div>

        {/* Right Side: Text & CTA */}
        <div className="flex-1 flex flex-col items-start max-w-xl">
          <span className="text-sm font-bold tracking-[0.2em] text-[#2A2424]/50 uppercase mb-4 block">The Future of Our Brand</span>
          
          <h2 className="text-[3rem] md:text-[4.5rem] leading-[1.0] font-serif tracking-tight text-[#2A2424] mb-8">
            SEKORIA
          </h2>
          
          <p className="text-[#2A2424]/70 text-lg md:text-xl mb-8 leading-relaxed">
            We've distilled everything we know about K-Beauty into our own proprietary line. Formulated in-house by expert dermatologists, Sekoria represents the pinnacle of clinical efficacy and organic purity.
          </p>
          
          <ul className="flex flex-col gap-4 mb-10 text-[#2A2424]/80">
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A2424]"></div>
              <span>Clinical-grade active ingredients</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A2424]"></div>
              <span>100% Vegan & Cruelty-Free</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A2424]"></div>
              <span>Sustainable, zero-waste packaging</span>
            </li>
          </ul>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/sekoria" 
              className="w-full sm:w-auto bg-[#2A2424] text-[#FDFDFC] px-8 py-4 rounded-full text-[15px] font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              Reserve Founder's Edition
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
