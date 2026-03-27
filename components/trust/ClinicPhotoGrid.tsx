"use client";

import Image from "next/image";
import { useState } from "react";

const PHOTOS = [
  { src: "/clinic/reception.jpg", alt: "Reception Area", fallbackGradient: "from-teal to-teal-dark" },
  { src: "/clinic/treatment-room.jpg", alt: "Treatment Room", fallbackGradient: "from-coral to-pink" },
  { src: "/clinic/hydrafacial-suite.jpg", alt: "Hydrafacial Suite", fallbackGradient: "from-pink-dark to-pink" },
  { src: "/clinic/our-team.jpg", alt: "Our Team", fallbackGradient: "from-pink to-coral" },
];

function PhotoCell({ src, alt, fallbackGradient }: (typeof PHOTOS)[0]) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`rounded-[10px] h-[120px] bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
        <span className="text-white/70 font-mono text-[9px]">{alt}</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-[10px] h-[120px] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        sizes="(max-width: 448px) 50vw, 200px"
      />
    </div>
  );
}

export default function ClinicPhotoGrid() {
  return (
    <div className="space-y-3">
      <p className="label-xs">Visit Our Clinic</p>
      <div className="grid grid-cols-2 gap-2">
        {PHOTOS.map((photo) => (
          <PhotoCell key={photo.alt} {...photo} />
        ))}
      </div>
    </div>
  );
}
