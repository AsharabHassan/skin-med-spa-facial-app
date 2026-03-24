"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useApp } from "@/lib/store";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function BookingScreen() {
  const { state, dispatch } = useApp();
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || "#";
  const firstName = state.leadData?.firstName;

  return (
    <div className="screen justify-between relative overflow-hidden">

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 flex-1">

        {/* Top bar */}
        <motion.div variants={item} className="flex items-center justify-between">
          <Image src="/logo.svg" alt="Harley Street Aesthetics" width={48} height={48} />
          <span className="label-xs">Step 03 / 03</span>
        </motion.div>

        <motion.div variants={item} className="w-full h-px bg-gold/15" />

        {/* Hero headline */}
        <motion.div variants={item} className="space-y-2">
          <p className="label-xs">Your Next Step</p>
          <h2 className="font-serif text-[3.2rem] font-normal italic text-cream leading-[1.0]">
            {firstName ? `${firstName},` : ""}<br />
            Your Free<br />Consultation<br />Awaits.
          </h2>
        </motion.div>

        {/* What to expect — data table style */}
        <motion.div variants={item} className="w-full space-y-0">
          <p className="label-xs mb-3">Session Overview</p>
          {[
            { code: "01", text: "10-minute free online consultation" },
            { code: "02", text: "Review AI analysis with a specialist" },
            { code: "03", text: "Bespoke treatment plan & pricing" },
            { code: "04", text: "No obligation — completely free" },
          ].map(({ code, text }) => (
            <div key={code} className="flex items-start gap-3 py-3 border-b border-white/5 first:border-t">
              <span className="font-mono text-[8px] text-gold/35 flex-shrink-0 pt-0.5">{code}</span>
              <span className="font-mono text-[10px] text-cream/45 leading-relaxed">{text}</span>
            </div>
          ))}
        </motion.div>

      </motion.div>

      {/* Bottom CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="w-full space-y-2.5 pt-6"
      >
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold w-full text-center"
        >
          Reserve My Consultation →
        </a>
        <button
          className="btn-outline w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "results" })}
        >
          ← Review My Analysis
        </button>
        <button
          className="w-full font-mono text-[8px] text-white/15 tracking-widest uppercase hover:text-white/30 transition-colors py-2"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Start New Analysis
        </button>
      </motion.div>
    </div>
  );
}
