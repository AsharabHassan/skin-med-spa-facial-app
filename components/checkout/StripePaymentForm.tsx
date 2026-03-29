"use client";

import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { formatCents } from "@/lib/pricing";

interface Props {
  totalInCents: number;
  facialId: string;
  selectedDate: string;
  selectedTime: string;
  leadData: { firstName: string; lastName: string; email: string; phone: string };
  bookingId?: string;
  onSuccess: (confirmation: {
    confirmationNumber: string;
    appointmentId: string;
    cardLast4: string;
  }) => void;
  onError: (message: string) => void;
}

function PaymentForm({ totalInCents, facialId, selectedDate, selectedTime, leadData, bookingId, onSuccess, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const intentRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facialId,
          date: selectedDate,
          time: selectedTime,
          amount: totalInCents,
          lead: leadData,
          bookingId: bookingId || undefined,
        }),
      });

      if (!intentRes.ok) {
        const errData = await intentRes.json().catch(() => ({}));
        if (intentRes.status === 409) {
          onError("This time slot was just taken. Please select another time.");
        } else {
          onError(errData.error ?? "Something went wrong. Your card was NOT charged.");
        }
        setProcessing(false);
        return;
      }

      const { clientSecret, ghlContactId, bookingId: reservedBookingId } = await intentRes.json();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError("Card form not ready. Please try again.");
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        onError(stripeError.message ?? "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status !== "succeeded") {
        onError("Payment was not completed. Your card was NOT charged.");
        setProcessing(false);
        return;
      }

      const confirmRes = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          facialId,
          date: selectedDate,
          time: selectedTime,
          ghlContactId,
          lead: leadData,
          bookingId: reservedBookingId,
        }),
      });

      const confirmData = await confirmRes.json();

      if (confirmRes.ok) {
        onSuccess({
          confirmationNumber: confirmData.confirmationNumber,
          appointmentId: confirmData.appointmentId,
          cardLast4: confirmData.cardLast4 ?? "****",
        });
      } else {
        onSuccess({
          confirmationNumber: "PENDING",
          appointmentId: "",
          cardLast4: confirmData.cardLast4 ?? "****",
        });
      }
    } catch {
      onError("Network error. Your card was NOT charged. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-mono text-[10px] text-dark font-semibold tracking-wider uppercase">Payment Details</span>
          </div>
          {/* Card brand icons */}
          <div className="flex items-center gap-1.5">
            {/* Visa */}
            <div className="bg-white border border-gray-200 rounded px-1.5 py-0.5">
              <span className="font-mono text-[9px] font-bold text-[#1A1F71]">VISA</span>
            </div>
            {/* Mastercard */}
            <div className="bg-white border border-gray-200 rounded px-1 py-0.5 flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-90" />
              <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-90 -ml-1.5" />
            </div>
            {/* Amex */}
            <div className="bg-[#2E77BC] border border-[#2E77BC] rounded px-1.5 py-0.5">
              <span className="font-mono text-[8px] font-bold text-white">AMEX</span>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white px-4 py-4">
          <div className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50/50 focus-within:border-pink focus-within:ring-2 focus-within:ring-pink/10 transition-all">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "15px",
                    color: "#1a1a1a",
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    letterSpacing: "0.02em",
                    "::placeholder": { color: "#c0c0c0" },
                  },
                  invalid: { color: "#e53e3e" },
                },
              }}
            />
          </div>

          {/* Security row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.5C16.6 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              <span className="font-mono text-[9px] text-gray-400">256-bit SSL · card never stored</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-gray-400">Secured by</span>
              <span className="bg-[#635BFF] text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded">stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-pink w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span>Processing payment…</span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.5C16.6 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span>Pay {formatCents(totalInCents)} & Book</span>
            <span className="opacity-70">→</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function StripePaymentForm(props: Props) {
  return (
    <Elements stripe={getStripe()}>
      <PaymentForm {...props} />
    </Elements>
  );
}
