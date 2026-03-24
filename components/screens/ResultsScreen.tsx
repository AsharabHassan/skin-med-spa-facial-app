"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import MembershipPopup from "@/components/MembershipPopup";

const SEVERITY_PILL: Record<string, string> = {
  healthy: "pill-healthy",
  mild: "pill-mild",
  moderate: "pill-moderate",
};

const RANK_LABELS = ["BEST MATCH", "ALSO GREAT", "CONSIDER"];

export default function ResultsScreen() {
  const { state, dispatch } = useApp();
  const { analysisResult, imageDataUrl, leadData, membershipPopupShown } = state;
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (membershipPopupShown) return;
    const timer = setTimeout(() => {
      setShowPopup(true);
      dispatch({ type: "SHOW_MEMBERSHIP_POPUP" });
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="label-xs">Skin Analysis Report</span>
            <span className="font-mono text-[9px] text-gray/40 tracking-wider uppercase">
              {analysisResult.skinType} skin
            </span>
          </div>
          <div className="w-full h-px bg-gray-100" />
          <h2 className="font-heading text-[2.6rem] font-light text-dark leading-[1.0]">
            {leadData?.firstName ? `${leadData.firstName}'s` : "Your"}<br />
            <span className="text-pink">Assessment.</span>
          </h2>
        </div>

        {/* Photo */}
        <div className="relative">
          <img
            src={imageDataUrl}
            alt="Your selfie"
            className="w-full rounded-2xl"
          />
        </div>

        {/* AI summary */}
        <div className="border-l-2 border-pink/30 pl-4 py-1 space-y-1.5">
          <p className="label-xs">Specialist Assessment</p>
          <p className="font-body text-[0.95rem] text-dark/70 leading-relaxed">
            {analysisResult.overallSummary}
          </p>
        </div>

        {/* Skin Profile — dimensions */}
        <div className="space-y-2">
          <p className="label-xs mb-3">Skin Profile</p>
          {analysisResult.dimensions.map((dim) => (
            <div key={dim.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="font-mono text-[11px] text-dark/70">{dim.name}</span>
              <span className={SEVERITY_PILL[dim.severity]}>{dim.severity}</span>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <p className="label-xs mb-3">Recommended For You</p>
          {analysisResult.recommendations.map((rec, i) => (
            <div
              key={rec.rank}
              className={`rounded-xl p-4 ${i === 0 ? "bg-blush border-l-[3px] border-pink" : "bg-gray-50"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`font-mono text-[9px] tracking-wider mb-1 ${i === 0 ? "text-pink font-semibold" : "text-gray"}`}>
                    {RANK_LABELS[i]}
                  </p>
                  <p className="font-heading text-[1rem] font-semibold text-dark">{rec.facialName}</p>
                  <p className="font-mono text-[10px] text-gray mt-1">{rec.shortDescription}</p>
                  <p className="font-body text-[11px] text-dark/50 mt-1.5 leading-relaxed">{rec.matchReason}</p>
                </div>
                <span className="font-heading text-[0.85rem] font-semibold text-dark flex-shrink-0 ml-3">from $99</span>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="font-mono text-[8px] text-gray-300 text-center leading-relaxed tracking-wide">
          AI-GENERATED · FOR INFORMATIONAL PURPOSES ONLY<br />
          TREATMENT PLANS CONFIRMED AT CONSULTATION
        </p>

        {/* CTA */}
        <button
          className="btn-pink w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "booking" })}
        >
          Book Free Consultation →
        </button>
      </motion.div>

      {/* Membership popup */}
      {showPopup && (
        <MembershipPopup
          onDismiss={() => setShowPopup(false)}
          onAccept={() => {
            setShowPopup(false);
            dispatch({ type: "SET_SCREEN", screen: "booking" });
          }}
        />
      )}
    </div>
  );
}
