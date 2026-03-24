"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "@/lib/store";
import { leadSchema, LeadFormData } from "@/lib/validation";

export default function GateScreen() {
  const { state, dispatch } = useApp();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({ resolver: zodResolver(leadSchema) });

  function onSubmit(data: LeadFormData) {
    // Generate unique event ID for Meta CAPI deduplication
    const metaEventId = crypto.randomUUID();

    // Collect Meta cookies for CAPI
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");

    // Fire Meta Pixel Lead event client-side (for deduplication with CAPI)
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead", {}, { eventID: metaEventId });
    }

    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        marketingConsent: data.marketingConsent,
        analysisResult: state.analysisResult,
        // Meta CAPI fields
        metaEventId,
        metaEventSourceUrl: window.location.href,
        metaUserAgent: navigator.userAgent,
        metaFbp: fbp,
        metaFbc: fbc,
      }),
    }).catch((err) => console.error("Lead submission error:", err));

    dispatch({
      type: "SET_LEAD",
      lead: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        marketingConsent: data.marketingConsent,
      },
    });
    dispatch({ type: "SET_SCREEN", screen: "results" });
  }

  return (
    <div className="screen justify-center relative overflow-hidden">
      {/* Blurred photo background */}
      {state.imageDataUrl && (
        <div className="absolute inset-0">
          <img
            src={state.imageDataUrl}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-110"
            style={{ opacity: 0.08, filter: "grayscale(100%) blur(24px)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #060509 0%, rgba(6,5,9,0.88) 100%)" }} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full space-y-8"
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-gold font-bold">✓</span>
            </div>
            <div className="h-px flex-1 bg-gold/20" />
          </div>
          <h2 className="font-serif text-[3.2rem] font-normal italic text-cream leading-[1.0]">
            Your Analysis<br />Is Ready.
          </h2>
          <p className="font-mono text-[8px] text-white/30 tracking-[0.3em] uppercase">
            Enter details to unlock your report
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label-xs">First Name</label>
              <input {...register("firstName")} placeholder="Sarah" className="input-field" />
              {errors.firstName && <p className="font-mono text-[9px] text-red-400/60 mt-1">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="label-xs">Last Name</label>
              <input {...register("lastName")} placeholder="Johnson" className="input-field" />
              {errors.lastName && <p className="font-mono text-[9px] text-red-400/60 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Email</label>
            <input {...register("email")} type="email" placeholder="sarah@example.com" className="input-field" />
            {errors.email && <p className="font-mono text-[9px] text-red-400/60 mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Phone</label>
            <input {...register("phone")} type="tel" placeholder="+44 7700 000000" className="input-field" />
            {errors.phone && <p className="font-mono text-[9px] text-red-400/60 mt-1">{errors.phone.message}</p>}
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input {...register("marketingConsent")} type="checkbox" className="sr-only peer" />
              <div className="w-4 h-4 border border-white/20 peer-checked:border-gold peer-checked:bg-gold/15 transition-all duration-200" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100">
                <span className="font-mono text-[9px] text-gold font-bold">✓</span>
              </div>
            </div>
            <span className="font-mono text-[9px] text-white/25 leading-relaxed group-hover:text-white/40 transition-colors">
              I consent to receive my analysis results and aesthetic communications from Harley Street Aesthetics in accordance with UK data protection law.
            </span>
          </label>
          {errors.marketingConsent && <p className="font-mono text-[9px] text-red-400/60">{errors.marketingConsent.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Unlock My Report →"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
