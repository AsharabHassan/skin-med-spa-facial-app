"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
// import FaceOverlay from "@/components/FaceOverlay"; // removed in Task 1 fork
// import ZoneCard from "@/components/ZoneCard"; // removed in Task 1 fork

export default function ResultsScreen() {
  const { state, dispatch } = useApp();
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const { analysisResult, imageDataUrl, leadData } = state;

  if (!analysisResult || !imageDataUrl) {
    dispatch({ type: "SET_SCREEN", screen: "landing" });
    return null;
  }

  return (
    <div className="screen pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-6"
      >
        {/* Report header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-xs">Facial Analysis Report</span>
            <span className="font-mono text-[8px] text-gold/30 tracking-wider">
              {analysisResult.faceShape?.toUpperCase()} FACE
            </span>
          </div>
          <div className="w-full h-px bg-gold/15" />
          <h2 className="font-serif text-[2.8rem] font-normal italic text-cream leading-[1.0]">
            {leadData?.firstName ? `${leadData.firstName}'s` : "Your"}<br />
            Assessment.
          </h2>
        </div>

        {/* Photo with overlay — FaceOverlay removed in Task 1 fork, replaced in Task 15 */}
        <div className="relative">
          {/* FaceOverlay placeholder */}
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[8px] text-white/20 tracking-widest">TAP ZONE TO INSPECT</span>
            <span className="font-mono text-[8px] text-gold/30">{analysisResult.zones.length} ZONES</span>
          </div>
        </div>

        {/* AI summary */}
        <div className="border-l-2 border-gold/30 pl-4 py-1 space-y-1.5">
          <p className="label-xs">Specialist Assessment</p>
          <p className="font-serif text-[1.05rem] italic text-cream/70 leading-relaxed">
            {analysisResult.overallSummary}
          </p>
        </div>

        {/* Zone cards — ZoneCard removed in Task 1 fork, replaced in Task 15 */}
        <div className="space-y-1">
          <p className="label-xs mb-3">Zone Breakdown</p>
          {/* ZoneCard placeholder */}
        </div>

        {/* Disclaimer */}
        <p className="font-mono text-[8px] text-white/15 text-center leading-relaxed tracking-wide">
          AI-GENERATED · FOR INFORMATIONAL PURPOSES ONLY<br />
          TREATMENT PLANS CONFIRMED AT CONSULTATION
        </p>

        {/* CTA */}
        <button
          className="btn-gold w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "booking" })}
        >
          Book Free Online Consultation →
        </button>
      </motion.div>
    </div>
  );
}
