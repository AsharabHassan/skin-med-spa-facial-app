import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAppointment, updateContact, triggerWorkflow } from "@/lib/ghl";
import { FACIAL_PRICING, convertTo24h } from "@/lib/pricing";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  try {
    const { paymentIntentId, facialId, date, time, ghlContactId } = await req.json();

    if (!paymentIntentId || !facialId || !date || !time || !ghlContactId) {
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

    try {
      const startTime = new Date(`${date}T${convertTo24h(time)}`).toISOString();

      const appointment = await createAppointment({
        contactId: ghlContactId,
        startTime,
        title: `${facialName} - Paid`,
      });
      appointmentId = appointment.id;

      await updateContact(ghlContactId, {
        last_payment_amount: (paymentIntent.amount / 100).toFixed(2),
        last_payment_date: new Date().toISOString(),
        last_facial_booked: facialName,
        stripe_payment_id: paymentIntentId,
      });

      const workflowId = process.env.GHL_PAYMENT_WORKFLOW_ID;
      if (workflowId) {
        await triggerWorkflow(workflowId, ghlContactId);
      }
    } catch (ghlError) {
      console.error("GHL error (payment already succeeded):", ghlError);
      return NextResponse.json({
        confirmationNumber: "PENDING",
        appointmentId: "",
        cardLast4,
        warning: "Payment received but booking needs manual confirmation. We will contact you.",
      }, { status: 207 });
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

