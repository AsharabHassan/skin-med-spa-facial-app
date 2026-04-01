"use client";

import { useState } from "react";
import { TESTIMONIALS } from "@/lib/testimonials";

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** Convert an Instagram URL to its embed URL */
function toEmbedUrl(url: string): string {
  // Remove trailing slash, then append /embed/
  return url.replace(/\/+$/, "") + "/embed/";
}

export default function VideoTestimonials() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (TESTIMONIALS.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="label-xs">Real Results from Real Clients</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
        {TESTIMONIALS.map((t, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(i)}
            className="snap-start min-w-[160px] rounded-xl h-[240px] flex flex-col items-center justify-center relative flex-shrink-0 group overflow-hidden text-left"
            style={{ background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)" }}
          >
            {/* Play button */}
            <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white/40 transition-colors">
              <span className="text-white text-xl ml-1">▶</span>
            </div>

            {/* Top badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <InstagramIcon />
              <span className="text-white font-mono text-[9px] tracking-wide uppercase">
                {t.embedUrl.includes("/reel/") ? "Reel" : "Post"}
              </span>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-mono text-[10px] font-semibold">{t.handle}</p>
              <p className="text-white/80 font-mono text-[9px] mt-1 leading-relaxed line-clamp-2">"{t.quote}"</p>
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen embed popup */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="relative w-[90vw] max-w-[400px] bg-white rounded-2xl overflow-hidden shadow-2xl"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <span className="text-white text-lg leading-none">&times;</span>
            </button>

            {/* Instagram embed iframe */}
            <iframe
              src={toEmbedUrl(TESTIMONIALS[openIndex].embedUrl)}
              className="w-full border-0"
              style={{ height: "80vh", maxHeight: "85vh" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`Instagram ${TESTIMONIALS[openIndex].handle}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
