import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrCreateContact, getAvailableSlots } from "@/lib/ghl";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { facialId, date, time, amount, lead } = await req.json();

    if (!facialId || !date || !time || !amount || !lead) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slots = await getAvailableSlots(date, date);
    const daySlots = slots.find((d) => d.date === date);
    if (!daySlots || !daySlots.slots.includes(time)) {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }

    const ghlContactId = await findOrCreateContact({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        facialId,
        date,
        time,
        ghlContactId,
        customerEmail: lead.email,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ghlContactId,
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
