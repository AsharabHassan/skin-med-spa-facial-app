"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";

const DIMENSIONS = [
  { id: "01", name: "TEXTURE & PORES" },
  { id: "02", name: "TONE & PIGMENTATION" },
  { id: "03", name: "ACNE & CONGESTION" },
  { id: "04", name: "AGING & FIRMNESS" },
  { id: "05", name: "HYDRATION & SENSITIVITY" },
];

export default function AnalyzingScreen() {
  const { state, dispatch } = useApp();
  const [activeDim, setActiveDim] = useState(0);
  const [dots, setDots] = useState(".");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!state.imageDataUrl) {
      dispatch({ type: "SET_SCREEN", screen: "capture" });
      return;
    }

    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: state.imageDataUrl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();

      if (data.result) {
        dispatch({ type: "SET_ANALYSIS", result: data.result });
        dispatch({ type: "SET_SCREEN", screen: "gate" });
      } else if (data.error?.includes("face")) {
        setError("We couldn't detect a face. Please try again with a clear, well-lit selfie.");
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch {
      clearTimeout(timeout);
      setError("Analysis failed. Please try again.");
    }
  }, [state.imageDataUrl, dispatch]);

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dimInterval = setInterval(() => {
      setActiveDim((p) => (p + 1) % DIMENSIONS.length);
    }, 700);
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => { clearInterval(dimInterval); clearInterval(dotInterval); };
  }, []);

  return (
    <div className="screen items-stretch justify-between relative overflow-hidden py-10">
      {/* Faded photo background */}
      {state.imageDataUrl && (
        <div className="absolute inset-0">
          <img
            src={state.imageDataUrl}
            alt=""
            className="w-full h-full object-cover opacity-5"
            style={{ filter: "grayscale(100%) contrast(1.2)" }}
          />
          <div className="absolute inset-0 bg-white/80" />
          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-[2px] pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(244,143,177,0.6), transparent)" }}
            animate={{ top: ["10%", "90%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col justify-between h-full flex-1 gap-8"
      >
        {/* Top status bar */}
        <div className="flex items-center justify-between">
          <span className="label-xs">Skin Analysis Engine</span>
          <span className="font-mono text-[9px] text-pink/60 tracking-widest">
            ANALYZING
          </span>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center gap-6 text-center">
          {error ? (
            <div className="space-y-4">
              <h2 className="font-heading text-[1.6rem] font-light text-dark leading-tight">
                {error}
              </h2>
              <div className="flex gap-3 justify-center">
                <button className="btn-pink px-6 py-3" onClick={runAnalysis}>
                  Try Again →
                </button>
                <button
                  className="btn-outline px-6 py-3"
                  onClick={() => dispatch({ type: "SET_SCREEN", screen: "capture" })}
                >
                  Retake Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="font-heading text-[3rem] font-light text-dark leading-none tracking-tight">
                Analyzing
              </h2>
              <p className="font-mono text-[10px] text-gray tracking-widest">
                ASSESSING YOUR SKIN{dots}
              </p>
            </div>
          )}
        </div>

        {/* Dimension readout */}
        <div className="font-mono text-[11px] space-y-1.5">
          <div className="text-gray/50 text-[9px] tracking-widest mb-3">SKIN DIMENSION SCAN</div>
          {DIMENSIONS.map((dim, i) => {
            const isDone = i < activeDim;
            const isActive = i === activeDim;
            return (
              <motion.div
                key={dim.id}
                className="flex items-center gap-3"
                animate={{ opacity: isDone ? 0.4 : isActive ? 1 : 0.15 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-pink w-5 text-[9px]">{dim.id}</span>
                <span className="text-[9px] tracking-widest" style={{ color: isActive ? "#F48FB1" : isDone ? "#323232" : "#ccc" }}>
                  {dim.name}
                </span>
                <span className="flex-1 text-[9px] text-gray-200">
                  {"·".repeat(10)}
                </span>
                <span className="text-[9px] w-12 text-right" style={{ color: isDone ? "#8ED4CC" : isActive ? "#F48FB1" : "#e0e0e0" }}>
                  {isDone ? "DONE" : isActive ? "SCAN" : "WAIT"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
