"use client";

import { useState, useEffect } from "react";

interface AvailableDate {
  date: string;
  slots: string[];
}

interface Props {
  onSelect: (date: string, time: string) => void;
  selectedDate: string | null;
  selectedTime: string | null;
}

function formatDatePill(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    date: d.getDate(),
  };
}

export default function DateTimePicker({ onSelect, selectedDate, selectedTime }: Props) {
  const [availability, setAvailability] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Select Date & Time</p>
        <div className="animate-pulse space-y-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-14 h-16 bg-gray-100 rounded-[10px]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || availability.length === 0) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Select Date & Time</p>
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

  const currentSlots = availability.find((d) => d.date === selectedDate)?.slots ?? [];

  return (
    <div className="space-y-3">
      <p className="label-xs">Select Date & Time</p>
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
