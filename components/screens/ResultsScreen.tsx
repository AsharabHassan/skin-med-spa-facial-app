"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import MembershipPopup from "@/components/MembershipPopup";
import VideoTestimonials from "@/components/trust/VideoTestimonials";
import BeforeAfter from "@/components/trust/BeforeAfter";
import ClinicPhotoGrid from "@/components/trust/ClinicPhotoGrid";
import AwardsStrip from "@/components/trust/AwardsStrip";
import DistanceDisplay from "@/components/trust/DistanceDisplay";
import { findPricing, formatCents } from "@/lib/pricing";

const SEVERITY_PILL: Record<string, string> = {
  healthy: "pill-healthy",
  mild: "pill-mild",
  moderate: "pill-moderate",
};

const RANK_LABELS = ["BEST MATCH", "ALSO GREAT", "CONSIDER"];

export default function ResultsScreen() {
  const { state, dispatch } = useApp();
  const { analysisResult, imageDataUrl, leadData, membershipPopupShown, selectedRecommendationIndex, membershipSelected } = state;
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

  useEffect(() => {
    if (!analysisResult || !imageDataUrl) {
      dispatch({ type: "SET_SCREEN", screen: "landing" });
    }
  }, [analysisResult, imageDataUrl, dispatch]);

  if (!analysisResult || !imageDataUrl) return null;

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
          <p className="label-xs mb-1">Recommended For You</p>
          <p className="font-mono text-[10px] text-gray mb-3">Tap a treatment to select it, then proceed to checkout.</p>
          {analysisResult.recommendations.map((rec, i) => {
            const isSelected = i === selectedRecommendationIndex;
            return (
              <button
                key={rec.rank}
                onClick={() => dispatch({ type: "SET_SELECTED_RECOMMENDATION", index: i })}
                className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                  isSelected
                    ? "bg-blush border-pink"
                    : "bg-gray-50 border-transparent hover:border-pink/30"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-mono text-[9px] tracking-wider ${isSelected ? "text-pink font-semibold" : "text-gray"}`}>
                        {RANK_LABELS[i]}
                      </p>
                      {isSelected && (
                        <span className="font-mono text-[8px] bg-pink text-white px-1.5 py-0.5 rounded-full tracking-wider">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p className="font-heading text-[1rem] font-semibold text-dark">{rec.facialName}</p>
                    <p className="font-mono text-[10px] text-gray mt-1">{rec.shortDescription}</p>
                    <p className="font-body text-[11px] text-dark/50 mt-1.5 leading-relaxed">{rec.matchReason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                    <span className="font-heading text-[0.85rem] font-semibold text-dark">
                      {(() => { const p = findPricing(rec.facialName); return p ? formatCents(p.price) : ""; })()}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-pink bg-pink" : "border-gray-300"
                    }`}>
                      {isSelected && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Membership card */}
        <button
          onClick={() => dispatch({ type: "SELECT_MEMBERSHIP" })}
          className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
            membershipSelected
              ? "bg-teal/10 border-teal"
              : "bg-gray-50 border-transparent hover:border-teal/30"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-mono text-[9px] tracking-wider ${membershipSelected ? "text-teal font-semibold" : "text-gray"}`}>
                  MEMBERSHIP
                </p>
                <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded-full tracking-wider ${
                  membershipSelected ? "bg-teal text-white" : "bg-teal/20 text-teal"
                }`}>
                  BEST VALUE
                </span>
                {membershipSelected && (
                  <span className="font-mono text-[8px] bg-teal text-white px-1.5 py-0.5 rounded-full tracking-wider">
                    SELECTED
                  </span>
                )}
              </div>
              <p className="font-heading text-[1rem] font-semibold text-dark">Facial Membership</p>
              <p className="font-mono text-[10px] text-gray mt-1">Monthly facial + exclusive member perks</p>
              <div className="mt-2 space-y-1">
                {[
                  "Monthly facial of your choice",
                  "Priority booking & scheduling",
                  "Exclusive member-only pricing",
                  "Skincare product discounts",
                  "Access to all facials incl. Ultimate Bacial",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-1.5">
                    <span className="text-teal text-[10px] flex-shrink-0">✓</span>
                    <span className="font-mono text-[9px] text-dark/60">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
              <div className="text-right">
                <span className="font-heading text-[0.85rem] font-semibold text-dark">$129</span>
                <span className="font-mono text-[9px] text-gray">/mo</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                membershipSelected ? "border-teal bg-teal" : "border-gray-300"
              }`}>
                {membershipSelected && <span className="text-white text-[10px]">✓</span>}
              </div>
            </div>
          </div>
        </button>

        {/* Trust elements */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-pink to-transparent my-2" />
        <VideoTestimonials />
        <BeforeAfter />
        <AwardsStrip />
        <ClinicPhotoGrid />
        <DistanceDisplay />

        {/* Disclaimer */}
        <p className="font-mono text-[8px] text-gray-300 text-center leading-relaxed tracking-wide">
          AI-GENERATED · FOR INFORMATIONAL PURPOSES ONLY<br />
          TREATMENT PLANS CONFIRMED AT CONSULTATION
        </p>

        {/* CTA */}
        <button
          className="btn-pink w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "checkout" })}
        >
          Proceed to Checkout →
        </button>
      </motion.div>

      {/* Membership popup */}
      {showPopup && (
        <MembershipPopup
          onDismiss={() => setShowPopup(false)}
          onAccept={() => {
            setShowPopup(false);
            dispatch({ type: "SET_SCREEN", screen: "checkout" });
          }}
        />
      )}
    </div>
  );
}
