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

const AWARDS = [
  { src: "/awards/readers-choice-2025.jpg",   alt: "Readers' Choice 2025 – Best of McKinney" },
  { src: "/awards/best-of-mckinney-2021.png",  alt: "Winner Best of McKINNEY 2021" },
  { src: "/awards/expertise-laser-2022.jpg",   alt: "Expertise.com Best Laser 2022" },
];

export default function LandingScreen() {
  const { dispatch } = useApp();

  return (
    <div className="screen justify-between relative" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4 w-full pt-1">

        {/* Clinic hero image */}
        <motion.div variants={item} className="relative w-full h-[165px] rounded-2xl overflow-hidden">
          <Image
            src="/clinic/exterior.jpg"
            alt="Skin Med Spa & Laser clinic"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/20 to-transparent" />
          {/* Clinic name over image */}
          <div className="absolute bottom-4 left-4">
            <Image src="/logo.png" alt="Skin Med Spa & Laser" width={100} height={44} className="brightness-0 invert" />
            <p className="font-body text-white/70 text-[10px] mt-1 tracking-wide">McKinney, TX</p>
          </div>
          {/* Star rating badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="9" height="9" viewBox="0 0 10 10" fill="#F48FB1">
                  <path d="M5 1l1.2 2.5L9 3.8 7 5.7l.5 2.8L5 7.2 2.5 8.5 3 5.7 1 3.8l2.8-.3z"/>
                </svg>
              ))}
            </div>
            <span className="font-body text-[10px] font-700 text-dark">4.9</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div variants={item} className="space-y-1.5">
          <p className="label-xs">AI Skin Analysis</p>
          <h1 className="font-heading text-[2.6rem] font-light leading-[1.0] text-dark tracking-tight">
            Discover Your<br /><span className="text-pink">Perfect Facial.</span>
          </h1>
        </motion.div>

        {/* Feature rows */}
        <motion.div variants={item} className="w-full">
          {[
            { code: "01", label: "AI Skin Condition Analysis" },
            { code: "02", label: "Personalized Facial Match" },
            { code: "03", label: "Free Online Consultation" },
          ].map(({ code, label }) => (
            <div key={code} className="flex items-center gap-4 py-2 border-b border-gray-100 first:border-t">
              <span className="font-mono text-[9px] text-pink w-5 flex-shrink-0">{code}</span>
              <div className="w-px h-3 bg-gray-200 flex-shrink-0" />
              <span className="font-body text-[11px] text-gray tracking-wide">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Awards */}
        <motion.div variants={item} className="w-full space-y-3">
          <p className="label-xs text-center">Awards &amp; Recognition</p>
          <div className="flex items-center justify-between gap-3">
            {AWARDS.map((award) => (
              <div
                key={award.alt}
                className="flex-1 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center p-2"
                style={{ minHeight: 58 }}
              >
                <Image
                  src={award.src}
                  alt={award.alt}
                  width={60}
                  height={56}
                  className="object-contain w-full h-full"
                  style={{ maxHeight: 54 }}
                />
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full space-y-3 pb-2 pt-3"
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
