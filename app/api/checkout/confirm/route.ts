import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAppointment, confirmReservedBooking } from "@/lib/zenoti";
import { FACIAL_PRICING } from "@/lib/pricing";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  try {
    const { paymentIntentId, facialId, date, time, ghlContactId, lead, bookingId } = await req.json();

    if (!paymentIntentId || !facialId || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
    }

    let cardLast4 = "****";
    const pm = paymentIntent.payment_method;
    if (pm && typeof pm !== "string" && pm.card) {
      cardLast4 = pm.card.last4;
    }

    const facial = FACIAL_PRICING.find((f) => f.facialId === facialId);
    const facialName = facial?.facialName ?? facialId;

    const confirmationNumber = `SMS-${Date.now().toString(36).toUpperCase()}`;

    let appointmentId = "";

    // Step 1: Confirm Zenoti booking (critical — must succeed)
    try {
      if (bookingId) {
        await confirmReservedBooking(bookingId);
        appointmentId = bookingId;
      } else {
        if (!lead) throw new Error("Lead data required for Zenoti booking");
        const appointment = await createAppointment({
          date,
          time,
          serviceName: facialName,
          guest: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
          },
        });
        appointmentId = appointment.id;
      }
    } catch (zenotiError) {
      console.error("Zenoti confirm error (payment already succeeded):", zenotiError);
      // Payment went through but booking confirmation failed — flag for manual follow-up
      return NextResponse.json({
        confirmationNumber: "PENDING",
        appointmentId: "",
        cardLast4,
        warning: "Payment received but booking needs manual confirmation. We will contact you.",
      }, { status: 207 });
    }

    // Step 2: GHL payment webhook — non-blocking, never fails the response
    try {
      const webhookUrl = process.env.GHL_PAYMENT_WORKFLOW_ID;
      if (webhookUrl) {
        const webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: lead?.firstName ?? "",
            lastName: lead?.lastName ?? "",
            email: lead?.email ?? "",
            phone: lead?.phone ?? "",
            facialName,
            facialId,
            appointmentDate: date,
            appointmentTime: time,
            paymentAmount: (paymentIntent.amount / 100).toFixed(2),
            paymentId: paymentIntentId,
            bookingId: appointmentId,
            confirmationNumber,
            source: "Skin Med Spa Facial Analysis App",
            event: "payment_completed",
            completedAt: new Date().toISOString(),
          }),
        });
        if (!webhookRes.ok) {
          console.error("GHL payment webhook failed:", webhookRes.status);
        }
      }
    } catch (ghlError) {
      console.error("GHL webhook (non-fatal, booking confirmed):", ghlError);
    }

    return NextResponse.json({
      confirmationNumber,
      appointmentId,
      cardLast4,
    });
  } catch (error) {
    console.error("Checkout confirm error:", error);
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}

