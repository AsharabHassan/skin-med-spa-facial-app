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
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 w-full pt-2">
        {/* Logo */}
        <motion.div variants={item} className="flex items-center justify-center w-full">
          <Image src="/logo.png" alt="Skin Med Spa & Laser" width={180} height={80} priority />
        </motion.div>

        {/* Thin rule */}
        <motion.div variants={item} className="w-10 h-px bg-pink mx-auto opacity-40" />

        {/* Hero headline */}
        <motion.div variants={item} className="space-y-2 text-center">
          <p className="label-xs">AI Skin Analysis</p>
          <h1 className="font-heading text-[2.8rem] font-light leading-[0.95] text-dark tracking-tight">
            Discover Your<br /><span className="text-pink">Perfect Facial.</span>
          </h1>
        </motion.div>

        {/* Feature rows */}
        <motion.div variants={item} className="w-full mt-2">
          {[
            { code: "01", label: "Skin Condition Analysis" },
            { code: "02", label: "Personalized Facial Match" },
            { code: "03", label: "Free Online Consultation" },
          ].map(({ code, label }) => (
            <div key={code} className="flex items-center gap-4 py-3 border-b border-gray-100 first:border-t">
              <span className="font-mono text-[9px] text-pink w-5 flex-shrink-0">{code}</span>
              <div className="w-px h-3 bg-gray-200 flex-shrink-0" />
              <span className="font-mono text-[11px] text-gray tracking-wide">{label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full space-y-3 pb-4"
      >
        <button
          className="btn-pink w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "capture" })}
        >
          Begin Analysis →
        </button>
        <p className="font-mono text-[8px] text-center text-gray-300 tracking-widest">
          PRIVATE · SECURE · IMAGE NOT STORED
        </p>
      </motion.div>
    </div>
  );
}
