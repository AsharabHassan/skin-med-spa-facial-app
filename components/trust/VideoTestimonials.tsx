"use client";

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
            className="snap-start min-w-[160px] rounded-xl h-[240px] flex flex-col items-center justify-center relative flex-shrink-0 group overflow-hidden"
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
          </a>
        ))}
      </div>
    </div>
  );
}
