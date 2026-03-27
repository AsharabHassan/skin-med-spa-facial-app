"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { formatCents } from "@/lib/pricing";

function generateICS(facialName: string, date: string, time: string): string {
  const startDate = new Date(`${date}T${convertTo24h(time)}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${facialName} - Skin Med Spa`,
    "LOCATION:Skin Med Spa & Laser, McKinney, TX",
    "DESCRIPTION:Your facial appointment at Skin Med Spa & Laser",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function convertTo24h(timeStr: string): string {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "09:00:00";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

export default function ConfirmationScreen() {
  const { state, dispatch } = useApp();
  const { bookingConfirmation } = state;

  if (!bookingConfirmation) {
    dispatch({ type: "SET_SCREEN", screen: "landing" });
    return null;
  }

  const isPending = bookingConfirmation.confirmationNumber === "PENDING";

  function handleAddToCalendar() {
    if (!bookingConfirmation) return;
    const ics = generateICS(
      bookingConfirmation.facialName,
      bookingConfirmation.date,
      bookingConfirmation.time
    );
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skin-med-spa-appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="screen justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full space-y-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
          className="w-20 h-20 mx-auto rounded-full bg-pink/10 flex items-center justify-center"
        >
          <span className="text-pink text-3xl">✓</span>
        </motion.div>

        <div>
          <h2 className="font-heading text-[2.4rem] font-light text-dark leading-[1.05]">
            You&apos;re<br /><span className="text-pink">Booked!</span>
          </h2>
          {isPending && (
            <p className="font-mono text-[11px] text-coral mt-2">
              Payment received — we&apos;ll contact you to confirm your time slot.
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">
          <p className="label-xs">Appointment Details</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Treatment</span>
              <span className="font-mono text-[11px] text-dark font-semibold">{bookingConfirmation.facialName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Date</span>
              <span className="font-mono text-[11px] text-dark">{bookingConfirmation.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Time</span>
              <span className="font-mono text-[11px] text-dark">{bookingConfirmation.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Location</span>
              <span className="font-mono text-[11px] text-dark">McKinney, TX</span>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Amount Charged</span>
              <span className="font-mono text-[13px] text-dark font-semibold">{formatCents(bookingConfirmation.amountCharged)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-gray">Card</span>
              <span className="font-mono text-[11px] text-dark">•••• {bookingConfirmation.cardLast4}</span>
            </div>
            {!isPending && (
              <div className="flex justify-between">
                <span className="font-mono text-[11px] text-gray">Confirmation #</span>
                <span className="font-mono text-[11px] text-pink font-semibold">{bookingConfirmation.confirmationNumber}</span>
              </div>
            )}
          </div>
        </div>

        <p className="font-mono text-[10px] text-gray">Confirmation sent to your email & phone via SMS.</p>

        <div className="space-y-2.5">
          {!isPending && (
            <button className="btn-teal w-full" onClick={handleAddToCalendar}>Add to Calendar</button>
          )}
          <button className="btn-outline w-full" onClick={() => dispatch({ type: "RESET" })}>Start New Analysis</button>
        </div>
      </motion.div>
    </div>
  );
}
