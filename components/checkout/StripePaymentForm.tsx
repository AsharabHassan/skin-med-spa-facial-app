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
  onSuccess: (confirmation: {
    confirmationNumber: string;
    appointmentId: string;
    cardLast4: string;
  }) => void;
  onError: (message: string) => void;
}

function PaymentForm({ totalInCents, facialId, selectedDate, selectedTime, leadData, onSuccess, onError }: Props) {
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

      const { clientSecret, ghlContactId } = await intentRes.json();

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
      <div className="space-y-3">
        <p className="label-xs">Payment Details</p>
        <div className="bg-gray-50 rounded-xl p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#323232",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  "::placeholder": { color: "#bbb" },
                },
                invalid: { color: "#e53e3e" },
              },
            }}
          />
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="font-mono text-[9px] text-gray">Secured by</span>
            <span className="bg-[#635BFF] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">stripe</span>
          </div>
        </div>
      </div>
      <button type="submit" disabled={!stripe || processing} className="btn-pink w-full">
        {processing ? "Processing..." : `Pay ${formatCents(totalInCents)} & Book →`}
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
