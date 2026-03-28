# Checkout, Trust Elements & Google Maps Integration — Design Spec

## Overview

Add in-app full payment checkout via Stripe (connected through GoHighLevel), trust-building elements (Instagram Reels/TikTok video testimonials, clinic photo grid), and Google Maps distance display to the Skin Med Spa Facial App. Targets first-time visitors who need confidence before purchasing.

## Architecture Decision

**Extended Results Page + Dedicated Checkout Screen** — trust elements (testimonials, clinic photos, map) are integrated into the existing Results screen below recommendations. A new full-screen Checkout replaces the current Booking screen. A new Confirmation screen follows successful payment.

## Updated App Flow

```
Landing → Capture → Analyzing → Gate → Results (extended) → Checkout → Confirmation
```

### Screen Changes

| Screen | Change |
|--------|--------|
| Results | Extended with trust sections below recommendations |
| Booking | Removed — replaced by Checkout |
| Checkout | NEW — order summary, date/time picker, Stripe payment |
| Confirmation | NEW — booking confirmation with details |

## Results Screen — New Sections

Added below the existing recommendations section, in this order:

### 1. Video Testimonials
- Horizontally scrollable row of Instagram Reels / TikTok embeds
- Each card: dark background, play button, client handle, pull quote
- Lazy-loaded to avoid blocking page render
- Fallback: if embed fails, show quote text + "Watch on Instagram/TikTok" link
- Section header: "Real Results from Real Clients"
- **Data source:** Hardcoded in `lib/testimonials.ts` config file. Each entry contains `{ platform: "instagram" | "tiktok", embedUrl: string, handle: string, quote: string }`. The clinic owner updates this file when adding new testimonials.

### 2. Clinic Photo Grid
- 2×2 CSS grid of real clinic photos
- Suggested slots: Reception Area, Treatment Room, Hydrafacial Suite, Team
- Images served from `/public/clinic/` directory
- Rounded corners (10px), gap 8px
- Section header: "Visit Our Clinic"

### 3. Google Maps Distance
- Uses browser Geolocation API to get user's lat/lng
- Calls `/api/distance` which hits Google Maps Distance Matrix API
- Displays: drive time (minutes) + distance (miles) + static map image
- Static map via Google Maps Static API (lightweight, no interactive map)
- Section header: "How Far Away Are We?"
- Clinic address: Skin Med Spa & Laser, McKinney, TX

**Location permission denied/unavailable fallback:** Hide distance numbers, show clinic address text + static map of McKinney location only.

### 4. Updated CTA
- Button text changes from "Book Free Consultation →" to "Proceed to Checkout →"
- Navigates to new Checkout screen

## Checkout Screen

Replaces the current BookingScreen component.

### Layout (top to bottom)
1. **Header** — back arrow + logo + "Checkout" label
2. **Headline** — "Complete Your Booking."
3. **Order Summary Card** — facial name, short description, duration, price, tax, total
4. **Date & Time Picker**
   - Horizontal scrollable date pills (fetched from GHL Calendar API)
   - Time slot grid (3 columns) showing available times for selected date
   - Unavailable dates are disabled, unavailable times are greyed out
5. **Stripe Card Form** — Stripe Elements (CardNumber, Expiry, CVC)
   - "Secured by Stripe" badge
6. **Trust Badges** — SSL Encrypted, PCI Compliant, Money-Back Guarantee
7. **"Pay $X.XX & Book →" CTA** — processes payment
8. **Cancellation Policy** — "Free cancellation up to 24 hours before your appointment"
9. **"Back to Results" link**

### Pricing
- Facial prices defined in `lib/pricing.ts`:
  | Facial | Price |
  |--------|-------|
  | Glow HydraFacial Face | $150 |
  | Celluma Light Therapy Facial | $75 |
  | Signature Express Facial | $85 |
  | Dr Obagi Custom Facial | $175 |
  | MicroFacial Express | $65 |
  | Obagi Light & Bright Medical Facial | $195 |
  | Pumpkin Enzyme Facial | $95 |
  | Skin Brightening Facial | $125 |
  | Teen Acne Facial | $75 |
  | ZO Stimulator Peel Facial | $150 |
  | Fire & Ice Facial | $175 |
  | Lift & Glow RF (Face) | $250 |
  | Ultimate Bacial | $125 |
- Tax rate: 8.25% (Texas 6.25% + McKinney 2%), stored as `TAX_RATE` constant in `lib/pricing.ts`
- Total = price + (price × TAX_RATE), shown before user taps Pay

## Confirmation Screen

Shown after successful payment + booking creation.

### Layout
1. **Success animation** — checkmark with brand pink color
2. **"You're Booked!" headline**
3. **Appointment details** — facial name, date, time, clinic address
4. **Payment receipt** — amount charged, last 4 digits of card
5. **"Add to Calendar" button** — generates .ics file download
6. **"Confirmation sent to your email & phone"** note
7. **"Start New Analysis" button** — resets app

## Backend — New API Routes

### GET /api/availability
- **Input:** `startDate`, `endDate` query params (frontend requests next 7 days by default)
- **Action:** Calls GHL Calendar API (v2, API key auth) to fetch open slots
- **Output:** `{ dates: [{ date: "2026-03-28", slots: ["9:00 AM", "10:30 AM", ...] }] }`
- **Error:** Returns empty slots array, frontend shows "Call us to book" fallback

### POST /api/checkout
- **Input:** `{ facialId, date, time, amount }` (no contactId needed — lead data from app state is sent)
- **Action:**
  1. Verify slot is still available (GHL Calendar API)
  2. Create or find GHL contact using lead data (firstName, lastName, email, phone from Gate screen)
  3. Create Stripe PaymentIntent with amount and GHL contactId in metadata
  4. Return `{ clientSecret, paymentIntentId, ghlContactId }`
- **Error:** If slot taken, return 409 with message. If Stripe fails, return 500.

### POST /api/checkout/confirm
- **Input:** `{ paymentIntentId, facialId, date, time, ghlContactId }`
- **Action:** (Called after Stripe.js confirms payment on client)
  1. Verify payment succeeded (Stripe API)
  2. Retrieve `cardLast4` from the PaymentIntent's payment method via Stripe API
  3. Create appointment in GHL Calendar API using `ghlContactId`
  4. Update GHL contact with payment metadata
  5. Trigger GHL "Payment Confirmed" workflow → sends email + SMS confirmation
  6. Return `{ appointmentId, confirmationNumber, cardLast4 }`
- **Error:** Payment confirmed but GHL fails → return partial success, show "Payment received — we'll contact you to schedule" + alert clinic

**GHL Contact Resolution:** The lead data (name, email, phone) is already captured on the Gate screen. During checkout, `/api/checkout` uses the GHL Contacts API to search for an existing contact by email, or creates a new one if not found. The returned `ghlContactId` is used for appointment creation.

### GET /api/distance
- **Input:** `lat`, `lng` query params (user's location)
- **Action:** Calls Google Maps Distance Matrix API with origin = user coords, destination = clinic address
- **Output:** `{ durationText: "12 min", distanceText: "4.8 mi", staticMapUrl: "..." }`
- **Error:** Returns null, frontend hides distance section

## Payment Flow (Stripe + GHL)

```
Client                    Server                  Stripe              GHL
  │                         │                       │                  │
  │ POST /api/checkout      │                       │                  │
  │────────────────────────►│                       │                  │
  │                         │ Create PaymentIntent  │                  │
  │                         │──────────────────────►│                  │
  │                         │◄──────────────────────│                  │
  │◄────────────────────────│ { clientSecret }      │                  │
  │                         │                       │                  │
  │ stripe.confirmPayment() │                       │                  │
  │────────────────────────────────────────────────►│                  │
  │◄────────────────────────────────────────────────│                  │
  │                         │                       │                  │
  │ POST /api/checkout/confirm                      │                  │
  │────────────────────────►│                       │                  │
  │                         │ Verify payment        │                  │
  │                         │──────────────────────►│                  │
  │                         │                       │                  │
  │                         │ Create appointment    │                  │
  │                         │─────────────────────────────────────────►│
  │                         │ Trigger workflow      │                  │
  │                         │─────────────────────────────────────────►│
  │                         │                       │          Email+SMS sent
  │◄────────────────────────│ { confirmationNumber }│                  │
  │                         │                       │                  │
  │ Show Confirmation Screen│                       │                  │
```

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# GoHighLevel
GHL_API_KEY=...
GHL_CALENDAR_ID=...
GHL_LOCATION_ID=...

# Google Maps
GOOGLE_MAPS_API_KEY=...

# Clinic
NEXT_PUBLIC_CLINIC_ADDRESS="Skin Med Spa & Laser, McKinney, TX"
NEXT_PUBLIC_CLINIC_LAT=33.1972
NEXT_PUBLIC_CLINIC_LNG=-96.6397
```

## New Dependencies

```
@stripe/stripe-js          — Stripe.js client SDK
@stripe/react-stripe-js    — React components for Stripe Elements
stripe                     — Stripe Node.js SDK (server-side)
```

## Types Changes

```typescript
// Add to Screen type
type Screen = "landing" | "capture" | "analyzing" | "gate" | "results" | "checkout" | "confirmation";

// New types
interface FacialPricing {
  facialId: string;
  facialName: string;
  price: number; // in cents
  duration: string;
}

interface CheckoutData {
  facial: FacialPricing;
  selectedDate: string;
  selectedTime: string;
  tax: number;
  total: number;
}

interface BookingConfirmation {
  confirmationNumber: string;
  appointmentId: string;
  facialName: string;
  date: string;
  time: string;
  amountCharged: number;
  cardLast4: string;
}
```

## State Changes

Add to AppState:
- `checkoutData: CheckoutData | null`
- `bookingConfirmation: BookingConfirmation | null`

Add reducer actions:
- `SET_CHECKOUT_DATA`
- `SET_BOOKING_CONFIRMATION`

## Error Handling Summary

| Scenario | Handling |
|----------|----------|
| Card declined | Inline Stripe error, retry with different card |
| Network timeout | "Card was NOT charged" message + retry button |
| Payment OK but GHL fails | "Payment received — we'll contact you to schedule" + clinic alert |
| No available slots | Disable date, show "No availability" |
| GHL Calendar API down | "Call us to book" + phone number fallback |
| Slot taken during checkout | Re-check before payment, prompt to pick new time |
| Location permission denied | Hide distance, show clinic address + static map |
| Geolocation unavailable | Same as permission denied |
| Maps API quota exceeded | Hide map section, show address text only |
| Video embed fails | Show quote text + "Watch on Instagram/TikTok" link |

## File Structure (new/modified)

```
components/
  screens/
    ResultsScreen.tsx          ← MODIFIED (add trust sections)
    BookingScreen.tsx           ← REMOVED
    CheckoutScreen.tsx          ← NEW
    ConfirmationScreen.tsx      ← NEW
  trust/
    VideoTestimonials.tsx       ← NEW
    ClinicPhotoGrid.tsx         ← NEW
    DistanceDisplay.tsx         ← NEW
  checkout/
    OrderSummary.tsx            ← NEW
    DateTimePicker.tsx          ← NEW
    StripePaymentForm.tsx       ← NEW
    TrustBadges.tsx             ← NEW

app/
  api/
    availability/route.ts      ← NEW
    checkout/route.ts           ← NEW
    checkout/confirm/route.ts   ← NEW
    distance/route.ts           ← NEW

lib/
  types.ts                     ← MODIFIED
  store.tsx                    ← MODIFIED
  stripe.ts                   ← NEW (Stripe client init)
  ghl.ts                      ← NEW (GHL API helpers, v2 API, API key auth)
  pricing.ts                  ← NEW (facial prices + tax calc)
  testimonials.ts             ← NEW (video testimonial config: platform, embedUrl, handle, quote)

public/
  clinic/                      ← NEW (clinic photos)
```
