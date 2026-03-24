"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function LandingScreen() {
  const { dispatch } = useApp();

  return (
    <div className="screen justify-between relative overflow-hidden">

      {/* Top — logo */}
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 w-full pt-2">
        <motion.div variants={item} className="flex items-center justify-between w-full">
          <Image src="/logo.svg" alt="HSA" width={52} height={52} priority />
          <span className="label-xs">Est. Harley Street</span>
        </motion.div>

        {/* Thin rule */}
        <motion.div variants={item} className="w-full h-px bg-gold/20" />

        {/* Hero headline */}
        <motion.div variants={item} className="space-y-0">
          <p className="label-xs mb-3">AI Facial Analysis</p>
          <h1 className="font-serif text-[3.8rem] font-normal leading-[0.95] text-cream italic tracking-tight">
            Reveal<br />Your<br />Aesthetic<br />Potential.
          </h1>
        </motion.div>

        {/* Feature rows — Space Mono data table */}
        <motion.div variants={item} className="w-full mt-2">
          {[
            { code: "001", label: "Facial Structure Analysis" },
            { code: "002", label: "6-Zone Deep Assessment" },
            { code: "003", label: "Free Online Consultation" },
          ].map(({ code, label }) => (
            <div key={code} className="flex items-center gap-4 py-3 border-b border-gold/10 first:border-t">
              <span className="font-mono text-[9px] text-gold/40 w-7 flex-shrink-0">{code}</span>
              <div className="w-px h-3 bg-gold/15 flex-shrink-0" />
              <span className="font-mono text-[10px] text-cream/50 tracking-wide">{label}</span>
              <span className="ml-auto font-mono text-[8px] text-gold/25">●</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom — CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full space-y-3 pb-4"
      >
        <button
          className="btn-gold w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "capture" })}
        >
          Begin Analysis →
        </button>
        <p className="font-mono text-[8px] text-center text-white/20 tracking-widest">
          PRIVATE · SECURE · IMAGE NOT STORED
        </p>
      </motion.div>
    </div>
  );
}
