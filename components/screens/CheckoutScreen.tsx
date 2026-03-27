"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { findPricing, calcTax, calcTotal } from "@/lib/pricing";
import OrderSummary from "@/components/checkout/OrderSummary";
import DateTimePicker from "@/components/checkout/DateTimePicker";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import TrustBadges from "@/components/checkout/TrustBadges";

export default function CheckoutScreen() {
  const { state, dispatch } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topRec = state.analysisResult?.recommendations?.[0];
  const facialMaybe = topRec ? findPricing(topRec.facialName) : undefined;

  if (!facialMaybe || !state.leadData) {
    dispatch({ type: "SET_SCREEN", screen: "results" });
    return null;
  }

  // Narrowed: facialMaybe is FacialPricing here
  const facial = facialMaybe;
  const total = calcTotal(facial.price);

  function handleDateTimeSelect(date: string, time: string) {
    setSelectedDate(date);
    if (time) setSelectedTime(time);
    setError(null);
  }

  function handlePaymentSuccess(confirmation: {
    confirmationNumber: string;
    appointmentId: string;
    cardLast4: string;
  }) {
    dispatch({
      type: "SET_CHECKOUT_DATA",
      data: {
        facial,
        selectedDate: selectedDate!,
        selectedTime: selectedTime!,
        tax: calcTax(facial.price),
        total,
      },
    });
    dispatch({
      type: "SET_BOOKING_CONFIRMATION",
      confirmation: {
        ...confirmation,
        facialName: facial.facialName,
        date: selectedDate!,
        time: selectedTime!,
        amountCharged: total,
      },
    });
    dispatch({ type: "SET_SCREEN", screen: "confirmation" });
  }

  return (
    <div className="screen pb-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "results" })}
              className="text-gray hover:text-dark transition-colors text-base"
            >
              ←
            </button>
            <Image src="/logo.png" alt="Skin Med Spa & Laser" width={80} height={32} />
          </div>
          <span className="label-xs">Checkout</span>
        </div>

        <div className="w-full h-px bg-gray-100" />

        <h2 className="font-heading text-[2.2rem] font-light text-dark leading-[1.05]">
          Complete<br />Your <span className="text-pink">Booking.</span>
        </h2>

        <OrderSummary facial={facial} />

        <DateTimePicker
          onSelect={handleDateTimeSelect}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="font-mono text-[11px] text-red-600">{error}</p>
          </div>
        )}

        {selectedDate && selectedTime ? (
          <StripePaymentForm
            totalInCents={total}
            facialId={facial.facialId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            leadData={state.leadData}
            onSuccess={handlePaymentSuccess}
            onError={setError}
          />
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="font-mono text-[11px] text-gray">Select a date and time above to continue</p>
          </div>
        )}

        <TrustBadges />

        <p className="font-mono text-[9px] text-gray-300 text-center leading-relaxed tracking-wide">
          Free cancellation up to 24 hours before your appointment.<br />
          Payment confirmation sent via email & SMS.
        </p>

        <button
          className="btn-outline w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "results" })}
        >
          ← Back to Results
        </button>
      </motion.div>
    </div>
  );
}
