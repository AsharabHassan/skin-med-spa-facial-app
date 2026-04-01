import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrCreateContact } from "@/lib/ghl";
import { reserveSlotForPayment, reserveSlotOnBooking } from "@/lib/zenoti";
import { FACIAL_PRICING } from "@/lib/pricing";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  try {
    const { facialId, date, time, lead, bookingId: incomingBookingId } = await req.json();

    if (!facialId || !date || !time || !lead) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const facial = FACIAL_PRICING.find((f) => f.facialId === facialId);
    if (!facial) {
      return NextResponse.json({ error: "Unknown facial" }, { status: 400 });
    }
    const amount = facial.price;

    // Reserve the Zenoti slot BEFORE charging the card.
    // If a bookingId from the availability check is provided, reuse that booking.
    // Otherwise create a fresh booking. Returns 409 if slot is unavailable.
    let bookingId: string;
    try {
      if (incomingBookingId) {
        await reserveSlotOnBooking(incomingBookingId, date, time);
        bookingId = incomingBookingId;
      } else {
        bookingId = await reserveSlotForPayment({
          date,
          time,
          guest: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
          },
        });
      }
    } catch (zenotiErr) {
      const err = zenotiErr as Error & { slotUnavailable?: boolean };
      if (err.slotUnavailable) {
        return NextResponse.json(
          { error: "This time is not available with your therapist. Please pick another slot." },
          { status: 409 }
        );
      }
      throw zenotiErr; // unexpected error — fall through to 500
    }

    // GHL contact creation is non-blocking — a bad token won't kill the payment
    let ghlContactId = "";
    try {
      ghlContactId = await findOrCreateContact({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      });
    } catch (ghlErr) {
      console.error("GHL contact (non-fatal):", ghlErr);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        facialId,
        date,
        time,
        bookingId,
        ghlContactId,
        customerEmail: lead.email,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ghlContactId,
      bookingId,
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
