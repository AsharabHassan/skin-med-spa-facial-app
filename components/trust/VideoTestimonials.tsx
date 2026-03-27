"use client";

import { TESTIMONIALS } from "@/lib/testimonials";

export default function VideoTestimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="label-xs">Real Results from Real Clients</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
        {TESTIMONIALS.map((t, i) => (
          <a
            key={i}
            href={t.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start min-w-[160px] bg-dark rounded-xl h-[240px] flex flex-col items-center justify-center relative flex-shrink-0 group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <span className="text-white text-lg ml-0.5">▶</span>
            </div>
            <span className="text-white/60 font-mono text-[9px] mt-2 capitalize">
              {t.platform === "instagram" ? "Instagram Reel" : "TikTok"}
            </span>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-mono text-[10px] font-semibold">{t.handle}</p>
              <p className="text-white/60 font-mono text-[9px] mt-0.5 line-clamp-2">"{t.quote}"</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
