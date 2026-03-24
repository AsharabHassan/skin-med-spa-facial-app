"use client";

import { motion } from "framer-motion";

interface Props {
  onDismiss: () => void;
  onAccept: () => void;
}

const BENEFITS = [
  "Monthly facial of your choice",
  "Priority booking & scheduling",
  "Exclusive member-only pricing",
  "Skincare product discounts",
  "Access to all facials including Ultimate Bacial",
];

export default function MembershipPopup({ onDismiss, onAccept }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl p-7 max-w-sm w-full relative shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-4 text-gray-300 hover:text-gray text-xl transition-colors"
        >
          ✕
        </button>

        {/* Exclusive badge */}
        <div className="text-center mb-5">
          <span className="inline-block bg-gradient-to-r from-teal to-teal-dark text-white font-mono text-[9px] font-semibold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full">
            Exclusive Offer
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-5">
          <h3 className="font-heading text-[1.4rem] font-light text-dark">Facial Membership</h3>
          <div className="mt-2">
            <span className="font-heading text-[2.2rem] font-semibold text-pink">$129</span>
            <span className="text-gray text-sm">/month</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-teal text-sm flex-shrink-0">✓</span>
              <span className="font-mono text-[11px] text-dark/70">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button className="btn-teal w-full mb-3" onClick={onAccept}>
          Learn More at Consultation →
        </button>
        <button
          className="w-full text-center font-mono text-[11px] text-gray hover:text-dark transition-colors py-2"
          onClick={onDismiss}
        >
          No thanks, continue to booking
        </button>
      </motion.div>
    </motion.div>
  );
}
