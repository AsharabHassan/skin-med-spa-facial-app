# Checkout, Trust Elements & Google Maps Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app Stripe checkout, trust-building elements (video testimonials, clinic photos, Google Maps distance), and GoHighLevel payment confirmation to the Skin Med Spa Facial App.

**Architecture:** Extend the existing Results screen with trust sections (testimonials, clinic grid, distance map) below recommendations. Replace the current Booking screen with a dedicated Checkout screen (Stripe Elements + GHL calendar availability). Add a Confirmation screen after successful payment. Four new API routes handle availability, checkout, payment confirmation, and distance calculation.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Framer Motion, Stripe (JS + Node SDK), GoHighLevel v2 API, Google Maps Distance Matrix + Static API

**Spec:** `docs/superpowers/specs/2026-03-27-checkout-trust-maps-design.md`

---

## File Structure

```
lib/
  types.ts                     ← MODIFY: add Screen variants + new interfaces
  store.tsx                    ← MODIFY: add checkout/confirmation state + actions
  pricing.ts                  ← CREATE: facial prices (cents), tax rate, calc helpers
  testimonials.ts             ← CREATE: testimonial config data
  stripe.ts                   ← CREATE: Stripe client-side init (loadStripe)
  ghl.ts                      ← CREATE: GHL API helper (contacts, calendar, workflows)

components/
  trust/
    VideoTestimonials.tsx       ← CREATE: horizontally scrollable IG/TikTok embed cards
    ClinicPhotoGrid.tsx         ← CREATE: 2×2 clinic photo grid
    DistanceDisplay.tsx         ← CREATE: geolocation + distance + static map
  checkout/
    OrderSummary.tsx            ← CREATE: facial recap, price, tax, total
    DateTimePicker.tsx          ← CREATE: date pills + time slot grid
    StripePaymentForm.tsx       ← CREATE: Stripe Elements card form
    TrustBadges.tsx             ← CREATE: SSL, PCI, guarantee badges
  screens/
    ResultsScreen.tsx          ← MODIFY: add trust sections below recommendations
    BookingScreen.tsx           ← DELETE
    CheckoutScreen.tsx          ← CREATE: full checkout screen
    ConfirmationScreen.tsx      ← CREATE: booking confirmation screen

app/
  page.tsx                     ← MODIFY: swap BookingScreen for Checkout + add Confirmation
  api/
    distance/route.ts           ← CREATE: Google Maps Distance Matrix proxy
    availability/route.ts      ← CREATE: GHL calendar availability proxy
    checkout/route.ts           ← CREATE: Stripe PaymentIntent + GHL contact resolution
    checkout/confirm/route.ts   ← CREATE: verify payment, create GHL appointment, trigger workflow

public/
  clinic/                      ← CREATE: placeholder clinic photos directory
```

---

## Chunk 1: Foundation — Types, Pricing, Config, and Dependencies

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Stripe packages and verify**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

Expected: packages added to `dependencies` in package.json

- [ ] **Step 2: Verify installation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
node -e "require('@stripe/stripe-js'); require('stripe'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add package.json package-lock.json
git commit -m "feat: add Stripe SDK dependencies for checkout"
```

---

### Task 2: Update types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add new Screen variants and interfaces to `lib/types.ts`**

**Three changes to make in `lib/types.ts`:**

1. Add `| "checkout" | "confirmation"` to the existing `Screen` union type (after `| "booking"`)
2. Add these new interfaces after the existing `AppState` interface:

```typescript
export interface FacialPricing {
  facialId: string;
  facialName: string;
  price: number; // in cents (e.g., 15000 = $150.00)
  duration: string;
}

export interface CheckoutData {
  facial: FacialPricing;
  selectedDate: string;
  selectedTime: string;
  tax: number;    // in cents
  total: number;  // in cents
  ghlContactId?: string;
}

export interface BookingConfirmation {
  confirmationNumber: string;
  appointmentId: string;
  facialName: string;
  date: string;
  time: string;
  amountCharged: number; // in cents
  cardLast4: string;
}
```

3. Append two new fields to the existing `AppState` interface (after `membershipPopupShown`):

```typescript
  checkoutData: CheckoutData | null;
  bookingConfirmation: BookingConfirmation | null;
```

**Important:** Do NOT replace the entire `AppState` interface — only append the two new fields.

- [ ] **Step 2: Verify the app still compiles**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -20
```

Expected: Type errors in `store.tsx` (missing new fields in initialState) — this is expected and will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/types.ts
git commit -m "feat: add checkout and confirmation types to Screen union and AppState"
```

---

### Task 3: Update store with new actions

**Files:**
- Modify: `lib/store.tsx`

- [ ] **Step 1: Add new actions and update reducer**

Add `SET_CHECKOUT_DATA` and `SET_BOOKING_CONFIRMATION` actions. Update `initialState` with new fields. Update the reducer to handle them.

```typescript
// Add to the Action union type:
| { type: "SET_CHECKOUT_DATA"; data: CheckoutData }
| { type: "SET_BOOKING_CONFIRMATION"; confirmation: BookingConfirmation }

// Update initialState to include:
checkoutData: null,
bookingConfirmation: null,

// Add to reducer switch:
case "SET_CHECKOUT_DATA":
  return { ...state, checkoutData: action.data };
case "SET_BOOKING_CONFIRMATION":
  return { ...state, bookingConfirmation: action.confirmation };
```

Also add the new type imports: `CheckoutData`, `BookingConfirmation`.

- [ ] **Step 2: Verify compilation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -20
```

Expected: May show errors from `page.tsx` referencing `"booking"` screen — expected, fixed later.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/store.tsx
git commit -m "feat: add checkout and confirmation state/actions to store"
```

---

### Task 4: Create pricing config

**Files:**
- Create: `lib/pricing.ts`

- [ ] **Step 1: Create `lib/pricing.ts` with all 13 facial prices and tax calc**

```typescript
import { FacialPricing } from "./types";

// Texas 6.25% + McKinney 2% = 8.25%
export const TAX_RATE = 0.0825;

export const FACIAL_PRICING: FacialPricing[] = [
  { facialId: "glow-hydrafacial",           facialName: "Glow HydraFacial Face",              price: 15000, duration: "45 min" },
  { facialId: "celluma-light-therapy",       facialName: "Celluma Light Therapy Facial",        price: 7500,  duration: "30 min" },
  { facialId: "signature-express",           facialName: "Signature Express Facial",            price: 8500,  duration: "30 min" },
  { facialId: "dr-obagi-custom",             facialName: "Dr Obagi Custom Facial",              price: 17500, duration: "60 min" },
  { facialId: "microfacial-express",         facialName: "MicroFacial Express",                 price: 6500,  duration: "20-30 min" },
  { facialId: "obagi-light-bright",          facialName: "Obagi Light & Bright Medical Facial", price: 19500, duration: "60 min" },
  { facialId: "pumpkin-enzyme",              facialName: "Pumpkin Enzyme Facial",               price: 9500,  duration: "45 min" },
  { facialId: "skin-brightening",            facialName: "Skin Brightening Facial",             price: 12500, duration: "45 min" },
  { facialId: "teen-acne",                   facialName: "Teen Acne Facial",                    price: 7500,  duration: "30 min" },
  { facialId: "zo-stimulator-peel",          facialName: "ZO Stimulator Peel Facial",           price: 15000, duration: "30 min" },
  { facialId: "fire-and-ice",               facialName: "Fire & Ice Facial",                   price: 17500, duration: "45 min" },
  { facialId: "lift-glow-rf",               facialName: "Lift & Glow RF (Face)",               price: 25000, duration: "45 min" },
  { facialId: "ultimate-bacial",             facialName: "Ultimate Bacial",                     price: 12500, duration: "45 min" },
];

/** Look up pricing by exact facial name (case-insensitive) */
export function findPricing(facialName: string): FacialPricing | undefined {
  const lower = facialName.toLowerCase();
  return FACIAL_PRICING.find((f) => f.facialName.toLowerCase() === lower);
}

/** Calculate tax in cents */
export function calcTax(priceInCents: number): number {
  return Math.round(priceInCents * TAX_RATE);
}

/** Calculate total (price + tax) in cents */
export function calcTotal(priceInCents: number): number {
  return priceInCents + calcTax(priceInCents);
}

/** Format cents to dollar string: 15000 → "$150.00" */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -5
```

Expected: No new errors from this file.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/pricing.ts
git commit -m "feat: add facial pricing config with tax calculation helpers"
```

---

### Task 5: Create testimonials config

**Files:**
- Create: `lib/testimonials.ts`

- [ ] **Step 1: Create `lib/testimonials.ts` with placeholder entries**

```typescript
export interface Testimonial {
  platform: "instagram" | "tiktok";
  embedUrl: string;
  handle: string;
  quote: string;
}

// Replace these with real URLs from the clinic's social media
export const TESTIMONIALS: Testimonial[] = [
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/REPLACE_WITH_REAL_ID/",
    handle: "@skinmedspa_client1",
    quote: "My skin has never looked better after the HydraFacial!",
  },
  {
    platform: "tiktok",
    embedUrl: "https://www.tiktok.com/@REPLACE_WITH_REAL_HANDLE/video/REPLACE_WITH_REAL_ID",
    handle: "@skinmedspa_client2",
    quote: "Best facial experience in McKinney, hands down.",
  },
  {
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/REPLACE_WITH_REAL_ID/",
    handle: "@skinmedspa_client3",
    quote: "Total transformation in just one session!",
  },
];
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/testimonials.ts
git commit -m "feat: add testimonials config with placeholder entries"
```

---

### Task 6: Create Stripe client init

**Files:**
- Create: `lib/stripe.ts`

- [ ] **Step 1: Create `lib/stripe.ts`**

```typescript
import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/stripe.ts
git commit -m "feat: add Stripe client-side initialization helper"
```

---

### Task 7: Create GHL API helper

**Files:**
- Create: `lib/ghl.ts`

- [ ] **Step 1: Create `lib/ghl.ts` with contact, calendar, and workflow helpers**

This file provides server-side helpers for GoHighLevel v2 API calls. Only used in API routes (not client-side).

```typescript
const GHL_BASE = "https://services.leadconnectorhq.com";

function headers() {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error("Missing GHL_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: "2021-07-28",
  };
}

/** Search for a contact by email, or create one if not found */
export async function findOrCreateContact(lead: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) throw new Error("Missing GHL_LOCATION_ID");

  // Search by email
  const searchRes = await fetch(
    `${GHL_BASE}/contacts/?locationId=${locationId}&query=${encodeURIComponent(lead.email)}`,
    { headers: headers() }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.contacts?.length > 0) {
      return data.contacts[0].id;
    }
  }

  // Create new contact
  const createRes = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      locationId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      source: "Skin Med Spa Facial Analysis App",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`GHL create contact failed: ${createRes.status} ${err}`);
  }

  const created = await createRes.json();
  return created.contact.id;
}

/** Fetch available time slots from GHL calendar */
export async function getAvailableSlots(
  startDate: string,
  endDate: string
): Promise<{ date: string; slots: string[] }[]> {
  const calendarId = process.env.GHL_CALENDAR_ID;
  if (!calendarId) throw new Error("Missing GHL_CALENDAR_ID");

  const res = await fetch(
    `${GHL_BASE}/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}`,
    { headers: headers() }
  );

  if (!res.ok) {
    console.error("GHL calendar error:", res.status);
    return [];
  }

  const data = await res.json();

  // GHL returns slots grouped by date. Transform to our format.
  const result: { date: string; slots: string[] }[] = [];
  if (data?.slots) {
    for (const [date, slots] of Object.entries(data.slots)) {
      result.push({
        date,
        slots: (slots as string[]).map((s) =>
          new Date(s).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        ),
      });
    }
  }
  return result;
}

/** Create an appointment in GHL calendar */
export async function createAppointment(params: {
  contactId: string;
  startTime: string; // ISO string
  title: string;
}): Promise<{ id: string }> {
  const calendarId = process.env.GHL_CALENDAR_ID;
  if (!calendarId) throw new Error("Missing GHL_CALENDAR_ID");

  const res = await fetch(`${GHL_BASE}/calendars/events/appointments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      calendarId,
      contactId: params.contactId,
      startTime: params.startTime,
      title: params.title,
      appointmentStatus: "confirmed",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GHL create appointment failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { id: data.id ?? data.event?.id ?? "unknown" };
}

/** Update contact custom fields (e.g., payment metadata) */
export async function updateContact(
  contactId: string,
  fields: Record<string, string>
): Promise<void> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ customFields: Object.entries(fields).map(([k, v]) => ({ key: k, value: v })) }),
  });

  if (!res.ok) {
    console.error("GHL update contact failed:", res.status);
  }
}

/** Trigger a GHL workflow by ID */
export async function triggerWorkflow(
  workflowId: string,
  contactId: string
): Promise<void> {
  const res = await fetch(
    `${GHL_BASE}/contacts/${contactId}/workflow/${workflowId}`,
    {
      method: "POST",
      headers: headers(),
    }
  );

  if (!res.ok) {
    console.error("GHL trigger workflow failed:", res.status);
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -5
```

Expected: No new errors from this file.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add lib/ghl.ts
git commit -m "feat: add GoHighLevel v2 API helper (contacts, calendar, workflows)"
```

---

### Task 8: Create `.env.local` template and clinic photos directory

**Files:**
- Create: `.env.local.example`
- Create: `public/clinic/.gitkeep`

- [ ] **Step 1: Create `.env.local.example` with all required variables**

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# GoHighLevel
GHL_API_KEY=
GHL_CALENDAR_ID=
GHL_LOCATION_ID=
GHL_PAYMENT_WORKFLOW_ID=

# Google Maps
GOOGLE_MAPS_API_KEY=

# Clinic location
NEXT_PUBLIC_CLINIC_ADDRESS="Skin Med Spa & Laser, McKinney, TX"
NEXT_PUBLIC_CLINIC_LAT=33.1972
NEXT_PUBLIC_CLINIC_LNG=-96.6397

# Existing
GHL_WEBHOOK_URL=
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_META_PIXEL_ID=
ANTHROPIC_API_KEY=
```

- [ ] **Step 2: Create clinic photos directory**

```bash
mkdir -p "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app/public/clinic"
touch "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app/public/clinic/.gitkeep"
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add .env.local.example public/clinic/.gitkeep
git commit -m "feat: add env template and clinic photos directory"
```

---

## Chunk 2: Trust Components — Testimonials, Clinic Photos, Distance Display

### Task 9: Create VideoTestimonials component

**Files:**
- Create: `components/trust/VideoTestimonials.tsx`

- [ ] **Step 1: Create `components/trust/VideoTestimonials.tsx`**

Horizontally scrollable row of testimonial cards. Each card shows a dark background with a play icon, the client's handle, and their quote. Tapping opens the embed URL in a new tab. Falls back to text-only if no JavaScript embed is available.

```typescript
"use client";

import { TESTIMONIALS } from "@/lib/testimonials";

export default function VideoTestimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="label-xs">Real Results from Real Clients</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
        {TESTIMONIALS.map((t, i) => (
          <a
            key={i}
            href={t.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start min-w-[160px] bg-dark rounded-xl h-[240px] flex flex-col items-center justify-center relative flex-shrink-0 group"
          >
            {/* Play button */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <span className="text-white text-lg ml-0.5">▶</span>
            </div>
            <span className="text-white/60 font-mono text-[9px] mt-2 capitalize">
              {t.platform === "instagram" ? "Instagram Reel" : "TikTok"}
            </span>

            {/* Bottom overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-mono text-[10px] font-semibold">{t.handle}</p>
              <p className="text-white/60 font-mono text-[9px] mt-0.5 line-clamp-2">"{t.quote}"</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/trust/VideoTestimonials.tsx
git commit -m "feat: add VideoTestimonials component with scrollable cards"
```

---

### Task 10: Create ClinicPhotoGrid component

**Files:**
- Create: `components/trust/ClinicPhotoGrid.tsx`

- [ ] **Step 1: Create `components/trust/ClinicPhotoGrid.tsx`**

2×2 grid of clinic photos. Uses Next.js `Image` with fallback placeholder backgrounds if images aren't yet in `/public/clinic/`.

```typescript
"use client";

import Image from "next/image";
import { useState } from "react";

const PHOTOS = [
  { src: "/clinic/reception.jpg", alt: "Reception Area", fallbackGradient: "from-teal to-teal-dark" },
  { src: "/clinic/treatment-room.jpg", alt: "Treatment Room", fallbackGradient: "from-coral to-pink" },
  { src: "/clinic/hydrafacial-suite.jpg", alt: "Hydrafacial Suite", fallbackGradient: "from-pink-dark to-pink" },
  { src: "/clinic/our-team.jpg", alt: "Our Team", fallbackGradient: "from-pink to-coral" },
];

function PhotoCell({ src, alt, fallbackGradient }: (typeof PHOTOS)[0]) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`rounded-[10px] h-[120px] bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
        <span className="text-white/70 font-mono text-[9px]">{alt}</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-[10px] h-[120px] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        sizes="(max-width: 448px) 50vw, 200px"
      />
    </div>
  );
}

export default function ClinicPhotoGrid() {
  return (
    <div className="space-y-3">
      <p className="label-xs">Visit Our Clinic</p>
      <div className="grid grid-cols-2 gap-2">
        {PHOTOS.map((photo) => (
          <PhotoCell key={photo.alt} {...photo} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/trust/ClinicPhotoGrid.tsx
git commit -m "feat: add ClinicPhotoGrid component with fallback gradients"
```

---

### Task 11: Create DistanceDisplay component

**Files:**
- Create: `components/trust/DistanceDisplay.tsx`

- [ ] **Step 1: Create `components/trust/DistanceDisplay.tsx`**

Uses browser Geolocation API on mount, calls `/api/distance`, shows drive time + miles + static map.

```typescript
"use client";

import { useState, useEffect } from "react";

interface DistanceData {
  durationText: string;
  distanceText: string;
  staticMapUrl: string;
}

const CLINIC_LAT = process.env.NEXT_PUBLIC_CLINIC_LAT ?? "33.1972";
const CLINIC_LNG = process.env.NEXT_PUBLIC_CLINIC_LNG ?? "-96.6397";
const CLINIC_ADDRESS = process.env.NEXT_PUBLIC_CLINIC_ADDRESS ?? "Skin Med Spa & Laser, McKinney, TX";

export default function DistanceDisplay() {
  const [data, setData] = useState<DistanceData | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/distance?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json.durationText) {
              setData(json);
            } else {
              setLocationDenied(true);
            }
          } else {
            setLocationDenied(true);
          }
        } catch {
          setLocationDenied(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="label-xs">How Far Away Are We?</p>
        <div className="bg-teal/5 rounded-xl p-4 border border-teal/10 animate-pulse">
          <div className="h-4 bg-teal/10 rounded w-1/2 mb-3" />
          <div className="h-20 bg-teal/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="label-xs">How Far Away Are We?</p>
      <div className="bg-teal/5 rounded-xl p-4 border border-teal/10">
        {/* Clinic info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal rounded-[10px] flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📍</span>
          </div>
          <div>
            <p className="font-heading text-[13px] font-semibold text-dark">Skin Med Spa & Laser</p>
            <p className="font-mono text-[10px] text-gray mt-0.5">{CLINIC_ADDRESS}</p>
          </div>
        </div>

        {/* Distance stats (only if location was granted) */}
        {data && !locationDenied && (
          <div className="flex gap-4 mt-3">
            <div className="flex-1 bg-white rounded-lg p-3 text-center">
              <p className="font-heading text-xl font-bold text-teal">{data.durationText.replace(" mins", "").replace(" min", "")}</p>
              <p className="font-mono text-[9px] text-gray uppercase tracking-wider">Minutes</p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-3 text-center">
              <p className="font-heading text-xl font-bold text-teal">{data.distanceText.replace(" mi", "")}</p>
              <p className="font-mono text-[9px] text-gray uppercase tracking-wider">Mi Away</p>
            </div>
          </div>
        )}

        {/* Static map (URL always from server to protect API key) */}
        <div className="mt-3 rounded-lg overflow-hidden h-[120px] bg-gray-100">
          {data?.staticMapUrl ? (
            <img src={data.staticMapUrl} alt="Map to clinic" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-[10px] text-gray">{CLINIC_ADDRESS}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/trust/DistanceDisplay.tsx
git commit -m "feat: add DistanceDisplay component with geolocation and static map"
```

---

### Task 12: Create distance API route

**Files:**
- Create: `app/api/distance/route.ts`

- [ ] **Step 1: Create `app/api/distance/route.ts`**

Proxies the Google Maps Distance Matrix API call. Returns drive time, distance, and a static map URL.

```typescript
import { NextRequest, NextResponse } from "next/server";

const CLINIC_LAT = process.env.NEXT_PUBLIC_CLINIC_LAT ?? "33.1972";
const CLINIC_LNG = process.env.NEXT_PUBLIC_CLINIC_LNG ?? "-96.6397";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(null, { status: 500 });
    }

    const origin = `${lat},${lng}`;
    const destination = `${CLINIC_LAT},${CLINIC_LNG}`;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json(null, { status: 500 });
    }

    const data = await res.json();
    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(null, { status: 200 });
    }

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x120&scale=2&markers=color:red%7C${CLINIC_LAT},${CLINIC_LNG}&markers=color:blue%7C${lat},${lng}&path=enc:&key=${apiKey}`;

    return NextResponse.json({
      durationText: element.duration.text,
      distanceText: element.distance.text,
      staticMapUrl,
    });
  } catch (error) {
    console.error("Distance API error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add app/api/distance/route.ts
git commit -m "feat: add distance API route for Google Maps Distance Matrix"
```

---

### Task 13: Integrate trust sections into ResultsScreen

**Files:**
- Modify: `components/screens/ResultsScreen.tsx`

- [ ] **Step 1: Add imports and trust components to ResultsScreen**

Add the three trust components below the existing recommendations section, above the disclaimer. Change the CTA button text from "Book Free Consultation →" to "Proceed to Checkout →" and navigate to `"checkout"` instead of `"booking"`.

At the top, add imports:

```typescript
import VideoTestimonials from "@/components/trust/VideoTestimonials";
import ClinicPhotoGrid from "@/components/trust/ClinicPhotoGrid";
import DistanceDisplay from "@/components/trust/DistanceDisplay";
```

After the recommendations `</div>` (the "Recommended For You" section, around line 108), add:

```tsx
{/* Trust elements */}
<div className="w-full h-px bg-gradient-to-r from-transparent via-pink to-transparent my-2" />
<VideoTestimonials />
<ClinicPhotoGrid />
<DistanceDisplay />
```

Change the CTA button text and screen:

```tsx
{/* Old: */}
<button
  className="btn-pink w-full"
  onClick={() => dispatch({ type: "SET_SCREEN", screen: "booking" })}
>
  Book Free Consultation →
</button>

{/* New: */}
<button
  className="btn-pink w-full"
  onClick={() => dispatch({ type: "SET_SCREEN", screen: "checkout" })}
>
  Proceed to Checkout →
</button>
```

- [ ] **Step 2: Verify it renders**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -10
```

Expected: No errors from `ResultsScreen.tsx`, `VideoTestimonials.tsx`, `ClinicPhotoGrid.tsx`, `DistanceDisplay.tsx`, or `distance/route.ts`. The only expected errors should be from `page.tsx` still referencing the `"booking"` screen — this is fixed in Chunk 3.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/screens/ResultsScreen.tsx
git commit -m "feat: integrate trust sections (testimonials, clinic grid, distance) into ResultsScreen"
```

---

## Chunk 3: Checkout Components and Screen

### Task 14: Create OrderSummary component

**Files:**
- Create: `components/checkout/OrderSummary.tsx`

- [ ] **Step 1: Create `components/checkout/OrderSummary.tsx`**

Displays the selected facial, price, tax, and total.

```typescript
"use client";

import { FacialPricing } from "@/lib/types";
import { calcTax, calcTotal, formatCents } from "@/lib/pricing";

interface Props {
  facial: FacialPricing;
}

export default function OrderSummary({ facial }: Props) {
  const tax = calcTax(facial.price);
  const total = calcTotal(facial.price);

  return (
    <div className="space-y-3">
      <p className="label-xs">Order Summary</p>
      <div className="bg-blush/50 rounded-xl p-4 border border-pink/10">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-[9px] tracking-wider text-pink font-semibold">★ YOUR BEST MATCH</p>
            <p className="font-heading text-[15px] font-semibold text-dark mt-1">{facial.facialName}</p>
            <p className="font-mono text-[10px] text-gray mt-0.5">~{facial.duration}</p>
          </div>
        </div>
        <div className="h-px bg-pink/10 my-3" />
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-dark/60">Facial Treatment</span>
            <span className="font-mono text-[13px] font-semibold text-dark">{formatCents(facial.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-dark/60">Tax (8.25%)</span>
            <span className="font-mono text-[13px] text-dark">{formatCents(tax)}</span>
          </div>
          <div className="h-px bg-pink/10 my-1" />
          <div className="flex justify-between">
            <span className="font-mono text-[13px] font-bold text-dark">Total</span>
            <span className="font-heading text-[18px] font-bold text-pink">{formatCents(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/checkout/OrderSummary.tsx
git commit -m "feat: add OrderSummary component with price and tax display"
```

---

### Task 15: Create DateTimePicker component

**Files:**
- Create: `components/checkout/DateTimePicker.tsx`

- [ ] **Step 1: Create `components/checkout/DateTimePicker.tsx`**

Fetches availability from `/api/availability`, shows horizontal scrollable date pills and a time slot grid.

```typescript
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

      {/* Date pills */}
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
              <p className={`font-mono text-[9px] ${isSelected ? "text-pink font-semibold" : "text-gray"}`}>
                {day}
              </p>
              <p className="font-heading text-base font-semibold text-dark mt-0.5">{date}</p>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
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
                    isSelected
                      ? "bg-pink/10 border-pink"
                      : "bg-gray-50 border-gray-100 hover:border-pink/30"
                  }`}
                >
                  <span className={`font-mono text-[11px] ${isSelected ? "text-dark font-semibold" : "text-dark"}`}>
                    {slot}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="col-span-3 font-mono text-[11px] text-gray text-center py-4">
              No available times for this date
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/checkout/DateTimePicker.tsx
git commit -m "feat: add DateTimePicker component with GHL availability"
```

---

### Task 16: Create StripePaymentForm component

**Files:**
- Create: `components/checkout/StripePaymentForm.tsx`

- [ ] **Step 1: Create `components/checkout/StripePaymentForm.tsx`**

Wraps Stripe Elements with CardElement. Handles payment flow: create PaymentIntent → confirm → call /api/checkout/confirm.

```typescript
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
      // Step 1: Create PaymentIntent on server
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

      // Step 2: Confirm payment with Stripe.js
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

      // Step 3: Confirm on server (create GHL appointment, trigger workflow)
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
        // Payment succeeded but booking failed — partial success
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
            <span className="bg-[#635BFF] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
              stripe
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-pink w-full"
      >
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
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/checkout/StripePaymentForm.tsx
git commit -m "feat: add StripePaymentForm with Stripe Elements and checkout flow"
```

---

### Task 17: Create TrustBadges component

**Files:**
- Create: `components/checkout/TrustBadges.tsx`

- [ ] **Step 1: Create `components/checkout/TrustBadges.tsx`**

```typescript
export default function TrustBadges() {
  return (
    <div className="flex justify-center gap-6 py-2">
      <div className="text-center">
        <span className="text-lg">🔒</span>
        <p className="font-mono text-[8px] text-gray mt-1">SSL Encrypted</p>
      </div>
      <div className="text-center">
        <span className="text-lg">💳</span>
        <p className="font-mono text-[8px] text-gray mt-1">PCI Compliant</p>
      </div>
      <div className="text-center">
        <span className="text-lg leading-none text-teal text-lg">✓</span>
        <p className="font-mono text-[8px] text-gray mt-1">Money-Back{"\n"}Guarantee</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/checkout/TrustBadges.tsx
git commit -m "feat: add TrustBadges component for checkout security signals"
```

---

### Task 18: Create CheckoutScreen

**Files:**
- Create: `components/screens/CheckoutScreen.tsx`

- [ ] **Step 1: Create `components/screens/CheckoutScreen.tsx`**

Full checkout screen: order summary, date/time picker, Stripe form, trust badges, cancel policy.

```typescript
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
  const facial = topRec ? findPricing(topRec.facialName) : undefined;

  if (!facial || !state.leadData) {
    dispatch({ type: "SET_SCREEN", screen: "results" });
    return null;
  }

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
        {/* Header */}
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

        {/* Headline */}
        <h2 className="font-heading text-[2.2rem] font-light text-dark leading-[1.05]">
          Complete<br />Your <span className="text-pink">Booking.</span>
        </h2>

        {/* Order Summary */}
        <OrderSummary facial={facial} />

        {/* Date & Time */}
        <DateTimePicker
          onSelect={handleDateTimeSelect}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="font-mono text-[11px] text-red-600">{error}</p>
          </div>
        )}

        {/* Payment form (only show after date + time selected) */}
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
            <p className="font-mono text-[11px] text-gray">
              Select a date and time above to continue
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges />

        {/* Cancellation Policy */}
        <p className="font-mono text-[9px] text-gray-300 text-center leading-relaxed tracking-wide">
          Free cancellation up to 24 hours before your appointment.<br />
          Payment confirmation sent via email & SMS.
        </p>

        {/* Back link */}
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
```

- [ ] **Step 2: Verify compilation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/screens/CheckoutScreen.tsx
git commit -m "feat: add CheckoutScreen with order summary, date picker, and Stripe payment"
```

---

### Task 19: Create ConfirmationScreen

**Files:**
- Create: `components/screens/ConfirmationScreen.tsx`

- [ ] **Step 1: Create `components/screens/ConfirmationScreen.tsx`**

Shows booking confirmation with appointment details, receipt, and "Add to Calendar" button.

```typescript
"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { formatCents } from "@/lib/pricing";

function generateICS(facialName: string, date: string, time: string): string {
  // Build a simple .ics file
  const startDate = new Date(`${date}T${convertTo24h(time)}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

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
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
          className="w-20 h-20 mx-auto rounded-full bg-pink/10 flex items-center justify-center"
        >
          <span className="text-pink text-3xl">✓</span>
        </motion.div>

        {/* Headline */}
        <div>
          <h2 className="font-heading text-[2.4rem] font-light text-dark leading-[1.05]">
            You're<br /><span className="text-pink">Booked!</span>
          </h2>
          {isPending && (
            <p className="font-mono text-[11px] text-coral mt-2">
              Payment received — we'll contact you to confirm your time slot.
            </p>
          )}
        </div>

        {/* Appointment details */}
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
              <span className="font-mono text-[13px] text-dark font-semibold">
                {formatCents(bookingConfirmation.amountCharged)}
              </span>
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

        {/* Confirmation sent note */}
        <p className="font-mono text-[10px] text-gray">
          Confirmation sent to your email & phone via SMS.
        </p>

        {/* Actions */}
        <div className="space-y-2.5">
          {!isPending && (
            <button className="btn-teal w-full" onClick={handleAddToCalendar}>
              Add to Calendar
            </button>
          )}
          <button
            className="btn-outline w-full"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Start New Analysis
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add components/screens/ConfirmationScreen.tsx
git commit -m "feat: add ConfirmationScreen with appointment details and calendar download"
```

---

### Task 20: Update page.tsx screen router

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace BookingScreen with CheckoutScreen and add ConfirmationScreen**

Replace the `BookingScreen` import with `CheckoutScreen` and `ConfirmationScreen`. Update the screens map to remove `booking` and add `checkout` and `confirmation`.

```typescript
// Remove:
import BookingScreen from "@/components/screens/BookingScreen";

// Add:
import CheckoutScreen from "@/components/screens/CheckoutScreen";
import ConfirmationScreen from "@/components/screens/ConfirmationScreen";

// Update screens map:
const screens = {
  landing:      <LandingScreen />,
  capture:      <CaptureScreen />,
  analyzing:    <AnalyzingScreen />,
  gate:         <GateScreen />,
  results:      <ResultsScreen />,
  checkout:     <CheckoutScreen />,
  confirmation: <ConfirmationScreen />,
};
```

- [ ] **Step 2: Delete BookingScreen**

```bash
rm "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app/components/screens/BookingScreen.tsx"
```

- [ ] **Step 3: Verify compilation**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit 2>&1 | head -10
```

Expected: Clean compile (no errors).

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add app/page.tsx
git rm components/screens/BookingScreen.tsx
git commit -m "feat: replace BookingScreen with CheckoutScreen and ConfirmationScreen in router"
```

---

## Chunk 4: Backend API Routes

### Task 21: Create availability API route

**Files:**
- Create: `app/api/availability/route.ts`

- [ ] **Step 1: Create `app/api/availability/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/ghl";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate required" },
        { status: 400 }
      );
    }

    const dates = await getAvailableSlots(startDate, endDate);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ dates: [] });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add app/api/availability/route.ts
git commit -m "feat: add availability API route for GHL calendar slots"
```

---

### Task 22: Create checkout API route

**Files:**
- Create: `app/api/checkout/route.ts`

- [ ] **Step 1: Create `app/api/checkout/route.ts`**

Creates a Stripe PaymentIntent and resolves/creates the GHL contact.

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrCreateContact, getAvailableSlots } from "@/lib/ghl";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { facialId, date, time, amount, lead } = await req.json();

    if (!facialId || !date || !time || !amount || !lead) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify slot is still available
    const slots = await getAvailableSlots(date, date);
    const daySlots = slots.find((d) => d.date === date);
    if (!daySlots || !daySlots.slots.includes(time)) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Find or create GHL contact
    const ghlContactId = await findOrCreateContact({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // already in cents
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
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add app/api/checkout/route.ts
git commit -m "feat: add checkout API route for Stripe PaymentIntent + GHL contact"
```

---

### Task 23: Create checkout confirm API route

**Files:**
- Create: `app/api/checkout/confirm/route.ts`

- [ ] **Step 1: Create `app/api/checkout/confirm/route.ts`**

Verifies Stripe payment, creates GHL appointment, triggers confirmation workflow.

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAppointment, updateContact, triggerWorkflow } from "@/lib/ghl";
import { FACIAL_PRICING } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, facialId, date, time, ghlContactId } = await req.json();

    if (!paymentIntentId || !facialId || !date || !time || !ghlContactId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not confirmed" },
        { status: 400 }
      );
    }

    // Get card last 4
    let cardLast4 = "****";
    const pm = paymentIntent.payment_method;
    if (pm && typeof pm !== "string" && pm.card) {
      cardLast4 = pm.card.last4;
    }

    // Find facial name
    const facial = FACIAL_PRICING.find((f) => f.facialId === facialId);
    const facialName = facial?.facialName ?? facialId;

    // Generate confirmation number
    const confirmationNumber = `SMS-${Date.now().toString(36).toUpperCase()}`;

    let appointmentId = "";

    try {
      // Create GHL appointment
      // Construct ISO start time from date + time
      const startTime = new Date(`${date}T${convertTo24h(time)}`).toISOString();

      const appointment = await createAppointment({
        contactId: ghlContactId,
        startTime,
        title: `${facialName} - Paid`,
      });
      appointmentId = appointment.id;

      // Update contact with payment info
      await updateContact(ghlContactId, {
        last_payment_amount: (paymentIntent.amount / 100).toFixed(2),
        last_payment_date: new Date().toISOString(),
        last_facial_booked: facialName,
        stripe_payment_id: paymentIntentId,
      });

      // Trigger confirmation workflow
      const workflowId = process.env.GHL_PAYMENT_WORKFLOW_ID;
      if (workflowId) {
        await triggerWorkflow(workflowId, ghlContactId);
      }
    } catch (ghlError) {
      console.error("GHL error (payment already succeeded):", ghlError);
      // Return partial success — payment went through, booking needs manual attention
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
    return NextResponse.json(
      { error: "Confirmation failed" },
      { status: 500 }
    );
  }
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
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add app/api/checkout/confirm/route.ts
git commit -m "feat: add checkout confirm route — verifies payment, creates GHL appointment, triggers workflow"
```

---

### Task 24: Verify full build

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npx tsc --noEmit
```

Expected: Clean compile, no errors.

- [ ] **Step 2: Run Next.js build**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
npm run build 2>&1 | tail -20
```

Expected: Build succeeds. Some pages may show warnings about missing env vars — that's fine for now.

- [ ] **Step 3: Fix any build errors found in Steps 1-2**

Address any TypeScript or build errors. Common issues:
- Import path typos
- Missing type exports
- Stripe API version mismatch (update `apiVersion` if needed)

- [ ] **Step 4: Final commit if fixes were needed**

```bash
cd "C:/Users/TRONYX/Desktop/Skin Med Spa Facial App/skin-med-spa-app"
git add -A
git commit -m "fix: resolve build errors from checkout integration"
```
