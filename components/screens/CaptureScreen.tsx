"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useCamera } from "@/hooks/useCamera";

export default function CaptureScreen() {
  const { dispatch } = useApp();
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, capturePhoto } = useCamera();

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  function handleCapture() {
    const dataUrl = capturePhoto();
    if (dataUrl) {
      dispatch({ type: "SET_IMAGE", imageDataUrl: dataUrl });
      dispatch({ type: "SET_SCREEN", screen: "analyzing" });
    }
  }

  return (
    <div className="screen items-center gap-5 py-8">

      {/* Header */}
      <div className="flex items-start justify-between w-full">
        <div>
          <p className="label-xs mb-1.5">Step 01 / 03</p>
          <h2 className="font-serif text-[2.4rem] font-normal italic text-cream leading-[1.0]">
            Position<br />Your Face.
          </h2>
        </div>
        <button
          className="font-mono text-[8px] text-white/20 tracking-widest uppercase hover:text-white/40 transition-colors mt-1 flex-shrink-0"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "landing" })}
        >
          ← Back
        </button>
      </div>

      {/* Instruction strip */}
      <div className="w-full flex items-center justify-between">
        {["Face forward", "Good lighting", "No glasses"].map((tip) => (
          <span key={tip} className="font-mono text-[8px] text-white/25 tracking-wide">{tip}</span>
        ))}
      </div>

      {/* Viewfinder — fixed aspect ratio so it always has height */}
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {/* Corner marks */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold/50 z-10" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold/50 z-10" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold/50 z-10" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold/50 z-10" />
        <div className="absolute inset-0 border border-gold/10 z-10 pointer-events-none" />

        {/* Camera feed */}
        <div className="absolute inset-2 overflow-hidden bg-parchment">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
          />

          {/* Scan line */}
          {isActive && (
            <div
              className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/60 to-transparent pointer-events-none animate-scan"
              style={{ top: "20%" }}
            />
          )}

          {/* Oval face guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border border-gold/30 rounded-full" style={{ width: "60%", height: "76%" }} />
          </div>

          {/* Coord overlay */}
          {isActive && (
            <>
              <span className="absolute top-2 left-3 font-mono text-[7px] text-gold/25">X:000 Y:000</span>
              <span className="absolute bottom-2 right-3 font-mono text-[7px] text-gold/25">READY</span>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-obsidian/90">
              <p className="font-mono text-[10px] text-white/40 text-center">{error}</p>
            </div>
          )}

          {/* Loading */}
          {!isActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.p
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="font-mono text-[10px] text-gold/40 tracking-widest"
              >
                INITIALISING...
              </motion.p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      {isActive && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="btn-gold w-full"
          onClick={handleCapture}
        >
          Capture Photo →
        </motion.button>
      )}
    </div>
  );
}
