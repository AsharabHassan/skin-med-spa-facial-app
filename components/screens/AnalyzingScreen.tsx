"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";

const ZONES = [
  { id: "01", name: "FOREHEAD" },
  { id: "02", name: "TEMPLES" },
  { id: "03", name: "UNDER-EYES" },
  { id: "04", name: "CHEEKS" },
  { id: "05", name: "LIPS" },
  { id: "06", name: "JAWLINE" },
];

export default function AnalyzingScreen() {
  const { state, dispatch } = useApp();
  const [activeZone, setActiveZone] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!state.imageDataUrl) {
      dispatch({ type: "SET_SCREEN", screen: "capture" });
      return;
    }

    let unmounted = false;
    let controller = new AbortController();
    let timeout = setTimeout(() => controller.abort(), 150000); // 150s timeout

    async function attemptAnalyze(): Promise<boolean> {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: state.imageDataUrl }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (unmounted) return true;
        const data = await res.json();
        if (data.result) {
          dispatch({ type: "SET_ANALYSIS", result: data.result });
          dispatch({ type: "SET_SCREEN", screen: "gate" });
          return true;
        }
        return false;
      } catch {
        clearTimeout(timeout);
        return false;
      }
    }

    async function analyze() {
      const success = await attemptAnalyze();
      if (unmounted) return;
      if (!success) {
        // Retry once with a fresh controller and 150s timeout
        controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 150000);
        const retrySuccess = await attemptAnalyze();
        if (unmounted) return;
        if (!retrySuccess) {
          dispatch({ type: "SET_SCREEN", screen: "capture" });
        }
      }
    }

    analyze();
    return () => { unmounted = true; clearTimeout(timeout); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const zoneInterval = setInterval(() => {
      setActiveZone((p) => (p + 1) % ZONES.length);
    }, 700);
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => { clearInterval(zoneInterval); clearInterval(dotInterval); };
  }, []);

  return (
    <div className="screen items-stretch justify-between relative overflow-hidden py-10">

      {/* Faded photo background */}
      {state.imageDataUrl && (
        <div className="absolute inset-0">
          <img
            src={state.imageDataUrl}
            alt=""
            className="w-full h-full object-cover opacity-10"
            style={{ filter: "grayscale(100%) contrast(1.2)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #060509 0%, rgba(6,5,9,0.7) 50%, #060509 100%)" }} />
          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-[2px] pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(196,152,64,0.6), transparent)" }}
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
          <span className="label-xs">HSA · Analysis Engine</span>
          <span className="font-mono text-[8px] text-gold/40 tracking-widest">
            SYS.ACTIVE <span className="animate-blink">▮</span>
          </span>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-1">
            <h2 className="font-serif text-[3.5rem] italic text-cream leading-none tracking-tight">
              Analysing
            </h2>
            <p className="font-mono text-[9px] text-gold/50 tracking-widest">
              PROCESSING FACIAL DATA{dots}
            </p>
          </div>
        </div>

        {/* Terminal zone readout */}
        <div className="font-mono text-[10px] space-y-1.5">
          <div className="text-gold/30 text-[8px] tracking-widest mb-3">ZONE SCAN STATUS</div>
          {ZONES.map((zone, i) => {
            const isDone = i < activeZone;
            const isActive = i === activeZone;
            return (
              <motion.div
                key={zone.id}
                className="flex items-center gap-3"
                animate={{ opacity: isDone ? 0.4 : isActive ? 1 : 0.15 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-gold/50 w-5">{zone.id}</span>
                <span className="text-[8px] tracking-widest" style={{ color: isActive ? "#C49840" : isDone ? "rgba(237,230,214,0.5)" : "rgba(237,230,214,0.2)" }}>
                  {zone.name}
                </span>
                <span className="flex-1 text-[8px]" style={{ color: "rgba(196,152,64,0.2)" }}>
                  {"·".repeat(14)}
                </span>
                <span className="text-[9px] w-12 text-right" style={{ color: isDone ? "rgba(196,152,64,0.6)" : isActive ? "#C49840" : "rgba(255,255,255,0.1)" }}>
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
