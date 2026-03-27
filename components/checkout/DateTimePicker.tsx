"use client";

import { useState, useEffect, useMemo } from "react";

interface AvailableDate {
  date: string;
  slots: string[];
}

interface RecommendedSlot {
  date: string;
  time: string;
  label: string;
}

interface Props {
  onSelect: (date: string, time: string) => void;
  selectedDate: string | null;
  selectedTime: string | null;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDatePill(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    date: d.getDate(),
  };
}

/** Pick 3 recommended slots spread across the available dates */
function pickRecommendedSlots(availability: AvailableDate[]): RecommendedSlot[] {
  const labels = ["Earliest Available", "Best for Afternoon", "Next Best Option"];
  const picks: RecommendedSlot[] = [];

  // 1. Earliest available slot across all days
  for (const day of availability) {
    if (day.slots.length > 0) {
      picks.push({ date: day.date, time: day.slots[0], label: labels[0] });
      break;
    }
  }

  // 2. First afternoon slot (12 PM or later) on any day
  for (const day of availability) {
    for (const slot of day.slots) {
      const match = slot.match(/(\d+):.*?(AM|PM)/i);
      if (!match) continue;
      const hour = parseInt(match[1]);
      const period = match[2].toUpperCase();
      const isAfternoon = period === "PM" && hour !== 12 ? true : period === "PM" && hour === 12;
      if (isAfternoon) {
        const key = `${day.date}-${slot}`;
        const alreadyPicked = picks.some((p) => `${p.date}-${p.time}` === key);
        if (!alreadyPicked) {
          picks.push({ date: day.date, time: slot, label: labels[1] });
          break;
        }
      }
    }
    if (picks.length >= 2) break;
  }

  // 3. A slot on a different day than pick #1 if possible
  if (picks.length < 3) {
    const usedKeys = new Set(picks.map((p) => `${p.date}-${p.time}`));
    for (const day of availability) {
      if (picks.length > 0 && day.date === picks[0].date) continue;
      for (const slot of day.slots) {
        if (!usedKeys.has(`${day.date}-${slot}`)) {
          picks.push({ date: day.date, time: slot, label: labels[2] });
          break;
        }
      }
      if (picks.length >= 3) break;
    }
  }

  // Fallback: fill remaining from any available slot
  if (picks.length < 3) {
    const usedKeys = new Set(picks.map((p) => `${p.date}-${p.time}`));
    for (const day of availability) {
      for (const slot of day.slots) {
        if (!usedKeys.has(`${day.date}-${slot}`)) {
          picks.push({ date: day.date, time: slot, label: labels[picks.length] ?? "Available" });
          usedKeys.add(`${day.date}-${slot}`);
          if (picks.length >= 3) break;
        }
      }
      if (picks.length >= 3) break;
    }
  }

  return picks;
}

export default function DateTimePicker({ onSelect, selectedDate, selectedTime }: Props) {
  const [availability, setAvailability] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const end = new Date(today);
        end.setDate(end.getDate() + 7);
        const endDate = end.toISOString().split("T")[0];

        const res = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`);
        if (res.ok) {
          const data = await res.json();
          setAvailability(data.dates ?? []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  const recommended = useMemo(() => pickRecommendedSlots(availability), [availability]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Choose Your Time</p>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || availability.length === 0) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Choose Your Time</p>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="font-mono text-[11px] text-gray">
            Unable to load availability. Please call us to book.
          </p>
          <a href="tel:+14694913546" className="font-mono text-[11px] text-pink font-semibold mt-1 block">
            Call Skin Med Spa →
          </a>
        </div>
      </div>
    );
  }

  // Recommended view — show 3 cards
  if (!showAllSlots) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Choose Your Time</p>
        <div className="space-y-2">
          {recommended.map((slot, i) => {
            const isSelected = slot.date === selectedDate && slot.time === selectedTime;
            return (
              <button
                key={`${slot.date}-${slot.time}`}
                onClick={() => onSelect(slot.date, slot.time)}
                className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                  isSelected
                    ? "bg-pink/10 border-pink"
                    : "bg-gray-50 border-transparent hover:border-pink/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-mono text-[9px] tracking-wider mb-1 ${isSelected ? "text-pink font-semibold" : "text-gray"}`}>
                      {slot.label.toUpperCase()}
                    </p>
                    <p className="font-heading text-[15px] font-semibold text-dark">
                      {formatDateLabel(slot.date)}
                    </p>
                    <p className="font-mono text-[12px] text-dark/60 mt-0.5">{slot.time}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-pink bg-pink" : "border-gray-200"
                  }`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowAllSlots(true)}
          className="w-full text-center font-mono text-[11px] text-pink py-2 hover:underline"
        >
          See all available times →
        </button>
      </div>
    );
  }

  // Full calendar view — date pills + time grid
  const currentSlots = availability.find((d) => d.date === selectedDate)?.slots ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">Select Date & Time</p>
        <button
          onClick={() => setShowAllSlots(false)}
          className="font-mono text-[10px] text-pink hover:underline"
        >
          ← Recommended
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-6 px-6 snap-x">
        {availability.map((d) => {
          const { day, date } = formatDatePill(d.date);
          const isSelected = d.date === selectedDate;
          const hasSlots = d.slots.length > 0;
          return (
            <button
              key={d.date}
              disabled={!hasSlots}
              onClick={() => onSelect(d.date, "")}
              className={`snap-start min-w-[56px] text-center py-2.5 px-2 rounded-[10px] border transition-all flex-shrink-0 ${
                isSelected
                  ? "bg-pink/10 border-pink"
                  : hasSlots
                  ? "bg-gray-50 border-gray-100 hover:border-pink/30"
                  : "bg-gray-50 border-gray-50 opacity-40 cursor-not-allowed"
              }`}
            >
              <p className={`font-mono text-[9px] ${isSelected ? "text-pink font-semibold" : "text-gray"}`}>{day}</p>
              <p className="font-heading text-base font-semibold text-dark mt-0.5">{date}</p>
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="grid grid-cols-3 gap-1.5">
          {currentSlots.length > 0 ? (
            currentSlots.map((slot) => {
              const isSelected = slot === selectedTime;
              return (
                <button
                  key={slot}
                  onClick={() => onSelect(selectedDate, slot)}
                  className={`text-center py-2 rounded-lg border transition-all ${
                    isSelected ? "bg-pink/10 border-pink" : "bg-gray-50 border-gray-100 hover:border-pink/30"
                  }`}
                >
                  <span className={`font-mono text-[11px] ${isSelected ? "text-dark font-semibold" : "text-dark"}`}>{slot}</span>
                </button>
              );
            })
          ) : (
            <p className="col-span-3 font-mono text-[11px] text-gray text-center py-4">No available times for this date</p>
          )}
        </div>
      )}
    </div>
  );
}
