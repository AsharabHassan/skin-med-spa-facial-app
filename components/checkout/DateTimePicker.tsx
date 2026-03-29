"use client";

import { useState, useEffect } from "react";

interface Props {
  onSelect: (date: string, time: string, bookingId: string) => void;
  selectedDate: string | null;
  selectedTime: string | null;
  leadData: { firstName: string; lastName: string; email: string; phone: string };
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

/** Build next 8 available dates (Wed + Fri only) */
function buildOpenDates(): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 60 && dates.length < 8; i++) {
    const day = cursor.getDay();
    if (day === 3 || day === 5) { // Wed + Fri only
      dates.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export default function DateTimePicker({ onSelect, selectedDate, selectedTime, leadData }: Props) {
  const openDates = buildOpenDates();

  // slots and bookingId keyed by date string
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [bookingIdsByDate, setBookingIdsByDate] = useState<Record<string, string>>({});
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [errorDate, setErrorDate] = useState<string | null>(null);

  async function loadSlotsForDate(dateStr: string) {
    if (slotsByDate[dateStr] !== undefined) return; // already loaded
    setLoadingDate(dateStr);
    setErrorDate(null);
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, lead: leadData }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlotsByDate((prev) => ({ ...prev, [dateStr]: data.slots ?? [] }));
        if (data.bookingId) {
          setBookingIdsByDate((prev) => ({ ...prev, [dateStr]: data.bookingId }));
        }
      } else {
        setSlotsByDate((prev) => ({ ...prev, [dateStr]: [] }));
        setErrorDate(dateStr);
      }
    } catch {
      setSlotsByDate((prev) => ({ ...prev, [dateStr]: [] }));
      setErrorDate(dateStr);
    } finally {
      setLoadingDate(null);
    }
  }

  // Load the first open date eagerly so the user sees slots immediately
  useEffect(() => {
    if (openDates[0]) loadSlotsForDate(openDates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateTap(dateStr: string) {
    onSelect(dateStr, "", bookingIdsByDate[dateStr] ?? "");
    loadSlotsForDate(dateStr);
  }

  const activeDate = selectedDate ?? openDates[0];
  const currentSlots = slotsByDate[activeDate] ?? null; // null = not yet loaded
  const isLoadingSlots = loadingDate === activeDate;
  const hasError = errorDate === activeDate;

  return (
    <div className="space-y-3">
      <p className="label-xs">Choose Your Time</p>

      {/* Date pill row */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-6 px-6 snap-x">
        {openDates.map((d) => {
          const { day, date } = formatDatePill(d);
          const isSelected = d === activeDate;
          return (
            <button
              key={d}
              onClick={() => handleDateTap(d)}
              className={`snap-start min-w-[56px] text-center py-2.5 px-2 rounded-[10px] border transition-all flex-shrink-0 ${
                isSelected
                  ? "bg-pink/10 border-pink"
                  : "bg-gray-50 border-gray-100 hover:border-pink/30"
              }`}
            >
              <p className={`font-mono text-[9px] ${isSelected ? "text-pink font-semibold" : "text-gray"}`}>{day}</p>
              <p className="font-heading text-base font-semibold text-dark mt-0.5">{date}</p>
            </button>
          );
        })}
      </div>

      {/* Selected date label */}
      {activeDate && (
        <p className="font-mono text-[10px] text-gray uppercase tracking-wider">
          {formatDateLabel(activeDate)}
        </p>
      )}

      {/* Slots grid */}
      {isLoadingSlots ? (
        <div className="animate-pulse grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : hasError ? (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="font-mono text-[11px] text-gray">
            Could not load availability. Please try another day or{" "}
            <a href="tel:+14694913546" className="text-pink font-semibold">call us</a>.
          </p>
        </div>
      ) : currentSlots === null ? (
        <div className="animate-pulse grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : currentSlots.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="font-mono text-[11px] text-gray">No availability on this day. Please try another date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {currentSlots.map((slot) => {
            const isSelected = slot === selectedTime && activeDate === selectedDate;
            return (
              <button
                key={slot}
                onClick={() => onSelect(activeDate, slot, bookingIdsByDate[activeDate] ?? "")}
                className={`text-center py-2.5 rounded-lg border transition-all ${
                  isSelected ? "bg-pink/10 border-pink" : "bg-gray-50 border-gray-100 hover:border-pink/30"
                }`}
              >
                <span className={`font-mono text-[11px] ${isSelected ? "text-dark font-semibold" : "text-dark"}`}>
                  {slot}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
