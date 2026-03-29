"use client";

import Image from "next/image";
import { useState } from "react";

interface BeforeAfterItem {
  /** Set to null to show placeholder until real images are available */
  beforeSrc: string | null;
  afterSrc: string | null;
}

// ─── HOW TO ADD YOUR PHOTOS ───────────────────────────────────────────────────
// 1. Put your images in:  skin-med-spa-app/public/before-after/
//    Name them anything, e.g. client1-before.jpg / client1-after.jpg
// 2. Replace null below with the path string:
//    beforeSrc: "/before-after/client1-before.jpg"
//    afterSrc:  "/before-after/client1-after.jpg"
const ITEMS: BeforeAfterItem[] = [
  { beforeSrc: "/before-after/Facial-Before 1.jpeg", afterSrc: "/before-after/Facial-After 1.jpeg" },
  { beforeSrc: "/before-after/before-facials 2.jpg", afterSrc: "/before-after/after-facials 2.jpg" },
];
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderHalf({ side }: { side: "before" | "after" }) {
  const isBefore = side === "before";
  return (
    <div
      className="flex-1 h-full flex items-end justify-center pb-2"
      style={{
        background: isBefore
          ? "linear-gradient(160deg, #c9c9c9 0%, #a8a8a8 100%)"
          : "linear-gradient(160deg, #F9C8D9 0%, #F48FB1 100%)",
      }}
    >
      <span
        className="font-mono text-[8px] tracking-widest uppercase"
        style={{ color: isBefore ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)" }}
      >
        {isBefore ? "Before" : "After"}
      </span>
    </div>
  );
}

function Card({ item }: { item: BeforeAfterItem }) {
  const [beforeErr, setBeforeErr] = useState(false);
  const [afterErr, setAfterErr] = useState(false);

  const showBeforePlaceholder = !item.beforeSrc || beforeErr;
  const showAfterPlaceholder  = !item.afterSrc  || afterErr;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Image halves */}
      <div className="flex h-[240px] relative">
        {/* Before */}
        <div className="flex-1 relative overflow-hidden">
          {showBeforePlaceholder ? (
            <PlaceholderHalf side="before" />
          ) : (
            <>
              <Image
                src={item.beforeSrc!}
                alt="Before"
                fill
                className="object-cover"
                sizes="50vw"
                onError={() => setBeforeErr(true)}
              />
              <span className="absolute bottom-2 left-0 right-0 text-center font-mono text-[8px] tracking-widest uppercase text-white/80">
                Before
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white z-10" />

        {/* After */}
        <div className="flex-1 relative overflow-hidden">
          {showAfterPlaceholder ? (
            <PlaceholderHalf side="after" />
          ) : (
            <>
              <Image
                src={item.afterSrc!}
                alt="After"
                fill
                className="object-cover"
                sizes="50vw"
                onError={() => setAfterErr(true)}
              />
              <span className="absolute bottom-2 left-0 right-0 text-center font-mono text-[8px] tracking-widest uppercase text-white/80">
                After
              </span>
            </>
          )}
        </div>

        {/* "RESULTS" badge */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-white/90 font-mono text-[7px] tracking-widest uppercase text-pink-400 px-2 py-0.5 rounded-full shadow-sm">
            Results
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <div className="space-y-3">
      <p className="label-xs">Before &amp; After</p>
      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <Card key={i} item={item} />
        ))}
      </div>
      <p className="font-mono text-[8px] text-gray-300 text-center tracking-wide">
        Real clients · Results may vary
      </p>
    </div>
  );
}
