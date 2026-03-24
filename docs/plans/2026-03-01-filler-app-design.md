# Harley Street Aesthetics Filler Analysis Lead Magnet App — Design Document

**Date:** 2026-03-01
**Project:** Dermal Filler AI Analysis PWA
**Brand:** Harley Street Aesthetics — monogram: HSW (Luxury clinical — Gold #CEA336 / Black #000000 / White #FFFFFF)

---

## Overview

A mobile-first progressive web app (PWA) that uses AI-powered facial analysis to suggest personalized dermal filler treatment areas. The app functions as a lead magnet: users get a free facial analysis in exchange for their contact details, which are automatically sent to GoHighLevel CRM. Results include a visual overlay on the user's selfie with annotated facial zones and a booking CTA.

---

## Goals

1. **Lead capture** — Collect name, email, and phone (all required) before showing results
2. **Consultation bookings** — Drive users from results to book a free consultation
3. **Brand authority** — Position Harley Street Aesthetics as a premium, tech-forward aesthetic clinic

---

## User Flow

```
Landing Screen
  ↓ "Start My Free Analysis" CTA
Photo Capture Screen
  ↓ Take selfie or upload photo
  ↓ "Analyze My Face" button
[API call to Claude Vision → JSON result stored in session]
Lead Gate Screen (results locked)
  ↓ Enter: First Name, Last Name, Email*, Phone*, Marketing Consent
  ↓ Submit → GoHighLevel API (lead created + workflow triggered)
Results Screen
  ↓ User's photo with annotated face zone overlay (canvas)
  ↓ Scrollable zone cards (6 zones) matching overlay markers
  ↓ AI-generated aesthetic summary paragraph
Booking CTA Screen
  ↓ "Book My Free Consultation" → GHL/Calendly booking link
  ↓ "Email me my results" → send report to user's email
```

---

## Architecture

### Platform
- **Next.js 14** (App Router) deployed on **Vercel**
- Mobile-first **PWA** with `manifest.json` and service worker
- No standalone database — GHL is the system of record for leads; results stored in `sessionStorage`

### Frontend
- **Next.js** pages / components
- **Tailwind CSS** with Harley Street Aesthetics brand tokens
- **Framer Motion** for screen transitions
- **HTML Canvas API** for face zone overlay rendering on the selfie
- Camera access via browser `getUserMedia` API; fallback to `<input type="file" accept="image/*" capture="user">`

### Backend (Next.js API Routes)
| Route | Purpose |
|---|---|
| `POST /api/analyze` | Receives base64 image, calls Claude Vision API, returns structured JSON |
| `POST /api/leads` | Receives lead form data, pushes contact to GoHighLevel via REST API |

### AI Analysis
- **Model:** `claude-sonnet-4-6` (Claude Vision)
- **Input:** Base64-encoded selfie + system prompt
- **Prompt instructs the model to:**
  - Identify overall face shape
  - Analyze 6 facial zones: Forehead, Temples, Under-eyes, Cheeks, Lips, Jawline/Chin
  - For each zone: describe what is detected and recommend a treatment area (or confirm no concern)
  - Return response as structured JSON (see schema below)
  - Include an overall aesthetic summary paragraph

### AI Response Schema
```json
{
  "faceShape": "oval | round | square | heart | diamond",
  "overallSummary": "string — 2-3 sentence personalized aesthetic summary",
  "zones": [
    {
      "id": 1,
      "name": "Lips",
      "concern": "string — what was detected",
      "recommendation": "string — treatment area suggestion or 'No concerns detected'",
      "severity": "none | mild | moderate",
      "overlayRegion": "lips | cheeks | undereyes | jawline | temples | forehead"
    }
  ]
}
```

### GoHighLevel Integration
- Use GHL REST API v2 to create/update a contact with: `firstName`, `lastName`, `email`, `phone`
- Tag the contact with `filler-analysis-lead`
- Optionally trigger a GHL workflow (e.g., send results email, add to pipeline)

---

## UI Screens

### Screen 1 — Landing
- Full black background, gold HSW monogram
- Headline (serif): *"Discover Your Personalized Aesthetic Treatment Plan"*
- Subheadline: *"AI-powered facial analysis in under 60 seconds"*
- Gold CTA button: "Start My Free Analysis"

### Screen 2 — Photo Capture
- Portrait oval camera viewfinder with face-framing guide overlay
- Instruction strip: "Face forward · Good lighting · Remove glasses"
- [Take Photo] and [Upload from Gallery] options
- Gold shutter button

### Screen 3 — Lead Gate
- Blurred/frosted preview of results in background
- Card: *"Your analysis is ready — enter your details to unlock your personalized plan"*
- Required fields: First Name, Last Name, Email, Phone
- Marketing consent checkbox
- Gold submit button: "Unlock My Results"

### Screen 4 — Results
- User's selfie displayed with canvas overlay:
  - Gold numbered callout markers (①–⑥) on each facial zone
  - Tap a marker to highlight its zone card below
- Scrollable zone cards below the photo, numbered to match markers:
  - Each card: Zone name + concern detected + treatment recommendation
  - Cards expand on tap for a brief explanation
- AI aesthetic summary paragraph
- Medical disclaimer: *"Results are AI-generated suggestions. Final treatment plans are determined at in-person consultation."*

### Screen 5 — Booking CTA
- Banner: *"Your complimentary consultation is one step away"*
- Primary CTA (gold): "Book My Free Consultation" → GHL/Calendly booking link
- Secondary: "Email me my results" → triggers email via GHL

---

## Brand Tokens

| Token | Value |
|---|---|
| Primary Accent (Gold) | `#CEA336` |
| Primary Text (Black) | `#000000` |
| Background (White) | `#FFFFFF` |
| Typography | Serif for headlines, sans-serif for body |

---

## Security & Compliance

- Images are processed server-side and **never stored** — base64 sent to Claude, result JSON returned, image discarded
- GDPR/marketing consent checkbox required before lead submission
- Medical disclaimer on results screen
- HTTPS enforced via Vercel

---

## Out of Scope (v1)

- Native iOS/Android app
- Product-level filler recommendations (e.g. specific brand names)
- Server-side result storage / user accounts
- Before/after comparison photos
- Multi-language support
