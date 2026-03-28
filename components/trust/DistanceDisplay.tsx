"use client";

import { useState, useEffect } from "react";

interface DistanceData {
  durationText: string;
  distanceText: string;
  staticMapUrl: string;
}

const CLINIC_ADDRESS = process.env.NEXT_PUBLIC_CLINIC_ADDRESS ?? "Skin Med Spa & Laser, McKinney, TX";

export default function DistanceDisplay() {
  const [data, setData] = useState<DistanceData | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/distance?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.durationText) {
              setData(json);
            } else {
              // Distance failed but we have user coords — still show map with user pin
              setData({
                durationText: "",
                distanceText: "",
                staticMapUrl: `/api/static-map?userLat=${position.coords.latitude}&userLng=${position.coords.longitude}`,
              });
              setLocationDenied(true);
            }
          } else {
            setLocationDenied(true);
          }
        } catch {
          setLocationDenied(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="label-xs">How Far Away Are We?</p>
        <div className="bg-teal/5 rounded-xl p-4 border border-teal/10 animate-pulse">
          <div className="h-4 bg-teal/10 rounded w-1/2 mb-3" />
          <div className="h-20 bg-teal/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="label-xs">How Far Away Are We?</p>
      <div className="bg-teal/5 rounded-xl p-4 border border-teal/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal rounded-[10px] flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📍</span>
          </div>
          <div>
            <p className="font-heading text-[13px] font-semibold text-dark">Skin Med Spa & Laser</p>
            <p className="font-mono text-[10px] text-gray mt-0.5">{CLINIC_ADDRESS}</p>
          </div>
        </div>

        {data && !locationDenied && (
          <div className="flex gap-4 mt-3">
            <div className="flex-1 bg-white rounded-lg p-3 text-center">
              <p className="font-heading text-xl font-bold text-teal">{data.durationText.replace(" mins", "").replace(" min", "")}</p>
              <p className="font-mono text-[9px] text-gray uppercase tracking-wider">Minutes</p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-3 text-center">
              <p className="font-heading text-xl font-bold text-teal">{data.distanceText.replace(" mi", "")}</p>
              <p className="font-mono text-[9px] text-gray uppercase tracking-wider">Mi Away</p>
            </div>
          </div>
        )}

        {/* Static map — show clinic pin always, user pin when available */}
        <div className="mt-3 rounded-lg overflow-hidden h-[120px] bg-gray-100">
          <img
            src={data?.staticMapUrl ?? "/api/static-map"}
            alt="Map to clinic"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>
    </div>
  );
}
