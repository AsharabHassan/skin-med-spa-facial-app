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
  const topRecommendation = state.analysisResult?.recommendations?.[0];

  return (
    <div className="screen justify-between relative overflow-hidden">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 flex-1">
        {/* Top bar */}
        <motion.div variants={item} className="flex items-center justify-between">
          <Image src="/logo.png" alt="Skin Med Spa & Laser" width={120} height={50} />
          <span className="label-xs">Step 03 / 03</span>
        </motion.div>

        <motion.div variants={item} className="w-full h-px bg-gray-100" />

        {/* Hero headline */}
        <motion.div variants={item} className="space-y-2">
          <p className="label-xs">Your Next Step</p>
          <h2 className="font-heading text-[2.6rem] font-light text-dark leading-[1.05]">
            {firstName ? `${firstName},` : ""}<br />
            Your Free<br />Consultation<br /><span className="text-pink">Awaits.</span>
          </h2>
        </motion.div>

        {/* Top recommendation recap */}
        {topRecommendation && (
          <motion.div variants={item} className="bg-blush rounded-xl p-4 border border-pink/10">
            <p className="font-mono text-[9px] text-pink tracking-wider font-semibold mb-1">★ YOUR TOP RECOMMENDATION</p>
            <p className="font-heading text-[1.05rem] font-semibold text-dark">{topRecommendation.facialName}</p>
            <p className="font-mono text-[10px] text-gray mt-1">{topRecommendation.shortDescription}</p>
            <div className="flex gap-3 mt-2">
              <span className="font-mono text-[11px] text-dark font-medium">From $99</span>
              <span className="font-mono text-[11px] text-teal font-medium">• Membership: $129/mo</span>
            </div>
          </motion.div>
        )}

        {/* What to expect */}
        <motion.div variants={item} className="w-full space-y-0">
          <p className="label-xs mb-3">What to Expect</p>
          {[
            { code: "01", text: "Free 10-minute online consultation" },
            { code: "02", text: "Review your AI skin analysis with a specialist" },
            { code: "03", text: "Custom treatment plan & pricing" },
            { code: "04", text: "No obligation — completely free" },
          ].map(({ code, text }) => (
            <div key={code} className="flex items-start gap-3 py-3 border-b border-gray-50 first:border-t">
              <span className="font-mono text-[9px] text-pink font-medium flex-shrink-0 pt-0.5">{code}</span>
              <span className="font-mono text-[11px] text-dark/60 leading-relaxed">{text}</span>
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
          className="btn-pink w-full"
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
          className="w-full font-mono text-[9px] text-gray-300 tracking-widest uppercase hover:text-gray transition-colors py-2"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Start New Analysis
        </button>
      </motion.div>
    </div>
  );
}
