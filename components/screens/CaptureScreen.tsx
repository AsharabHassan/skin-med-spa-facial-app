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
          <h2 className="font-heading text-[2.2rem] font-light text-dark leading-[1.0]">
            Position<br />Your Face.
          </h2>
        </div>
        <button
          className="font-mono text-[9px] text-gray tracking-widest uppercase hover:text-pink transition-colors mt-1 flex-shrink-0"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "landing" })}
        >
          ← Back
        </button>
      </div>

      {/* Instruction strip */}
      <div className="w-full flex items-center justify-between">
        {["Face forward", "Good lighting", "No glasses"].map((tip) => (
          <span key={tip} className="font-mono text-[9px] text-gray tracking-wide">{tip}</span>
        ))}
      </div>

      {/* Viewfinder */}
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {/* Corner marks */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-pink/50 z-10 rounded-tl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-pink/50 z-10 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-pink/50 z-10 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-pink/50 z-10 rounded-br" />
        <div className="absolute inset-0 border border-gray-200 z-10 pointer-events-none rounded-xl" />

        {/* Camera feed */}
        <div className="absolute inset-2 overflow-hidden bg-gray-50 rounded-lg">
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
              className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-pink/60 to-transparent pointer-events-none animate-scan"
              style={{ top: "20%" }}
            />
          )}

          {/* Oval face guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border border-pink/30 rounded-full" style={{ width: "60%", height: "76%" }} />
          </div>

          {/* Status overlay */}
          {isActive && (
            <span className="absolute bottom-2 right-3 font-mono text-[8px] text-pink/50">READY</span>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-white/90">
              <p className="font-mono text-[11px] text-gray text-center">{error}</p>
            </div>
          )}

          {/* Loading */}
          {!isActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.p
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="font-mono text-[11px] text-pink/40 tracking-widest"
              >
                INITIALIZING...
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
          className="btn-pink w-full"
          onClick={handleCapture}
        >
          Capture Photo →
        </motion.button>
      )}
    </div>
  );
}
