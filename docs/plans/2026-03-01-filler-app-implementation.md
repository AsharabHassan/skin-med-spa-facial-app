# Harley Street Aesthetics Filler Analysis Lead Magnet App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first Next.js PWA that analyzes a user's selfie with Claude Vision, gates the results behind a lead capture form, pushes contacts to GoHighLevel, and drives consultation bookings.

**Architecture:** Next.js 14 (App Router) single-codebase PWA deployed on Vercel. Photo is base64-encoded client-side and sent to a `/api/analyze` route which calls Claude Vision and returns structured JSON. Lead form data is sent to `/api/leads` which creates a contact in GoHighLevel. Results + face zone overlay rendered client-side using HTML Canvas. No database — session state only.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, @anthropic-ai/sdk, next-pwa, React Hook Form, Zod

---

## Environment Variables Needed

Create a `.env.local` file at project root:
```
ANTHROPIC_API_KEY=your_claude_api_key
GHL_API_KEY=your_gohighlevel_private_api_key
GHL_LOCATION_ID=your_ghl_location_id
NEXT_PUBLIC_BOOKING_URL=https://your-booking-link.com
```

---

## Task 1: Scaffold the Next.js Project

**Files:**
- Create: `package.json` (auto-generated)
- Create: `tailwind.config.ts`
- Create: `next.config.ts`
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Initialize the Next.js app**

Run in `D:\Dermal Filler App HSA`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*"
```
Select: Yes to App Router, No to ESLint (we'll add it later if needed).

**Step 2: Install dependencies**
```bash
npm install @anthropic-ai/sdk framer-motion react-hook-form zod @hookform/resolvers next-pwa
npm install -D @types/node
```

**Step 3: Create `.env.example`**
```
ANTHROPIC_API_KEY=
GHL_API_KEY=
GHL_LOCATION_ID=
NEXT_PUBLIC_BOOKING_URL=
```

**Step 4: Verify dev server starts**
```bash
npm run dev
```
Expected: Server running at http://localhost:3000 with default Next.js page.

**Step 5: Commit**
```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 app with TypeScript and Tailwind"
```

---

## Task 2: Brand Design Tokens & Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `app/layout.tsx` (replace default)

**Step 1: Update `tailwind.config.ts`** with HSW brand tokens:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#CEA336",
          light: "#E8C25A",
          dark: "#A67E20",
        },
        hsw: {
          black: "#000000",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update `app/globals.css`**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-hsw-black text-hsw-white overflow-x-hidden;
    font-family: Inter, system-ui, sans-serif;
  }
}

@layer components {
  .btn-gold {
    @apply bg-gold text-hsw-black font-semibold px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-200 active:scale-95 hover:bg-gold-light;
  }
  .btn-outline-gold {
    @apply border border-gold text-gold font-semibold px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-200 active:scale-95 hover:bg-gold hover:text-hsw-black;
  }
  .screen {
    @apply min-h-screen max-w-md mx-auto flex flex-col px-6 py-8;
  }
}
```

**Step 3: Replace `app/layout.tsx`**:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harley Street Aesthetics | Your Personalized Filler Analysis",
  description: "AI-powered facial analysis for personalized aesthetic treatment recommendations by Harley Street Aesthetics",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 4: Verify styles apply**
```bash
npm run dev
```
Expected: Black background on localhost:3000.

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add HSW brand tokens to Tailwind and global styles"
```

---

## Task 3: App State Management & Types

**Files:**
- Create: `lib/types.ts`
- Create: `lib/store.ts`
- Create: `app/page.tsx` (replace default — main screen controller)

**Step 1: Create `lib/types.ts`**:
```typescript
export type Screen =
  | "landing"
  | "capture"
  | "analyzing"
  | "gate"
  | "results"
  | "booking";

export interface FaceZone {
  id: number;
  name: string;
  concern: string;
  recommendation: string;
  severity: "none" | "mild" | "moderate";
  overlayRegion:
    | "forehead"
    | "temples"
    | "undereyes"
    | "cheeks"
    | "lips"
    | "jawline";
}

export interface AnalysisResult {
  faceShape: string;
  overallSummary: string;
  zones: FaceZone[];
}

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export interface AppState {
  screen: Screen;
  imageDataUrl: string | null;
  analysisResult: AnalysisResult | null;
  leadData: LeadData | null;
}
```

**Step 2: Create `lib/store.ts`** (simple React context + useReducer):
```typescript
"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, Screen, AnalysisResult, LeadData } from "./types";

type Action =
  | { type: "SET_SCREEN"; screen: Screen }
  | { type: "SET_IMAGE"; imageDataUrl: string }
  | { type: "SET_ANALYSIS"; result: AnalysisResult }
  | { type: "SET_LEAD"; lead: LeadData }
  | { type: "RESET" };

const initialState: AppState = {
  screen: "landing",
  imageDataUrl: null,
  analysisResult: null,
  leadData: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };
    case "SET_IMAGE":
      return { ...state, imageDataUrl: action.imageDataUrl };
    case "SET_ANALYSIS":
      return { ...state, analysisResult: action.result };
    case "SET_LEAD":
      return { ...state, leadData: action.lead };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
```

**Step 3: Replace `app/page.tsx`** with screen router:
```tsx
"use client";

import { AppProvider, useApp } from "@/lib/store";
import LandingScreen from "@/components/screens/LandingScreen";
import CaptureScreen from "@/components/screens/CaptureScreen";
import AnalyzingScreen from "@/components/screens/AnalyzingScreen";
import GateScreen from "@/components/screens/GateScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";
import BookingScreen from "@/components/screens/BookingScreen";

function ScreenRouter() {
  const { state } = useApp();

  switch (state.screen) {
    case "landing":   return <LandingScreen />;
    case "capture":   return <CaptureScreen />;
    case "analyzing": return <AnalyzingScreen />;
    case "gate":      return <GateScreen />;
    case "results":   return <ResultsScreen />;
    case "booking":   return <BookingScreen />;
    default:          return <LandingScreen />;
  }
}

export default function Home() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
```

**Step 4: Create placeholder screen components so app compiles**

Create each of these with minimal placeholder content:

`components/screens/LandingScreen.tsx`:
```tsx
export default function LandingScreen() {
  return <div className="screen"><p className="text-white">Landing</p></div>;
}
```

Repeat the same pattern for: `CaptureScreen.tsx`, `AnalyzingScreen.tsx`, `GateScreen.tsx`, `ResultsScreen.tsx`, `BookingScreen.tsx`.

**Step 5: Verify app compiles and routes work**
```bash
npm run dev
```
Expected: "Landing" text on black background.

**Step 6: Commit**
```bash
git add .
git commit -m "feat: add app state management, types, and screen routing"
```

---

## Task 4: Landing Screen

**Files:**
- Modify: `components/screens/LandingScreen.tsx`
- Create: `public/logo.svg` (HSW monogram placeholder)

**Step 1: Create a simple HSW logo SVG** at `public/logo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" fill="none">
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
    font-family="Georgia, serif" font-size="36" fill="#CEA336" letter-spacing="4">HSW</text>
</svg>
```

**Step 2: Replace `components/screens/LandingScreen.tsx`**:
```tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";

export default function LandingScreen() {
  const { dispatch } = useApp();

  return (
    <div className="screen items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Logo */}
        <Image src="/logo.svg" alt="HSW" width={120} height={60} priority />

        {/* Divider */}
        <div className="w-16 h-px bg-gold" />

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-normal leading-tight text-white">
            Discover Your Personalized<br />Aesthetic Treatment Plan
          </h1>
          <p className="text-sm text-white/60 tracking-wider">
            AI-POWERED FACIAL ANALYSIS IN UNDER 60 SECONDS
          </p>
        </div>

        {/* Feature list */}
        <ul className="text-sm text-white/70 space-y-2 text-left">
          {[
            "Facial structure analysis",
            "Personalized zone recommendations",
            "Complimentary consultation offer",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className="btn-gold w-full mt-4"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "capture" })}
        >
          Start My Free Analysis
        </button>

        <p className="text-xs text-white/30 mt-2">
          Private & secure — your photo is never stored
        </p>
      </motion.div>
    </div>
  );
}
```

**Step 3: Verify visually in browser on mobile viewport**
- Open Chrome DevTools → Toggle mobile view (iPhone 12 Pro)
- Expected: Black background, gold logo, serif headline, gold CTA button

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add landing screen with HSW branding"
```

---

## Task 5: Photo Capture Screen

**Files:**
- Modify: `components/screens/CaptureScreen.tsx`
- Create: `hooks/useCamera.ts`

**Step 1: Create `hooks/useCamera.ts`**:
```typescript
"use client";

import { useRef, useState, useCallback } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      setStream(s);
      setIsActive(true);
      setError(null);
    } catch {
      setError("Camera access denied. Please upload a photo instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    stopCamera();
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [stopCamera]);

  return { videoRef, canvasRef, isActive, error, startCamera, stopCamera, capturePhoto };
}
```

**Step 2: Replace `components/screens/CaptureScreen.tsx`**:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useCamera } from "@/hooks/useCamera";

export default function CaptureScreen() {
  const { dispatch } = useApp();
  const { videoRef, canvasRef, isActive, error, startCamera, capturePhoto } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  function handleCapture() {
    const dataUrl = capturePhoto();
    if (dataUrl) {
      dispatch({ type: "SET_IMAGE", imageDataUrl: dataUrl });
      dispatch({ type: "SET_SCREEN", screen: "analyzing" });
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      dispatch({ type: "SET_IMAGE", imageDataUrl: dataUrl });
      dispatch({ type: "SET_SCREEN", screen: "analyzing" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="screen items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col items-center gap-6"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="font-serif text-2xl text-white">Position Your Face</h2>
          <p className="text-xs text-white/50 tracking-widest">
            FACE FORWARD · GOOD LIGHTING · REMOVE GLASSES
          </p>
        </div>

        {/* Viewfinder */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900">
          {isActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
          )}
          {/* Oval face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-2 border-gold/60 rounded-full"
              style={{ width: "65%", height: "80%" }}
            />
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-white/60 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Actions */}
        <div className="w-full space-y-3">
          {isActive && (
            <button className="btn-gold w-full" onClick={handleCapture}>
              Take Photo
            </button>
          )}
          <button
            className="btn-outline-gold w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload from Gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <button
          className="text-white/30 text-xs"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "landing" })}
        >
          ← Back
        </button>
      </motion.div>
    </div>
  );
}
```

**Step 3: Verify camera access in browser**
- Open on mobile or DevTools mobile emulation
- Expected: Camera viewfinder with oval guide, gold shutter button
- Test upload fallback: click "Upload from Gallery"

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add photo capture screen with camera and upload support"
```

---

## Task 6: Claude Vision API Route

**Files:**
- Create: `app/api/analyze/route.ts`
- Create: `lib/prompts.ts`

**Step 1: Create `lib/prompts.ts`** with the analysis system prompt:
```typescript
export const FILLER_ANALYSIS_PROMPT = `You are a highly skilled aesthetic medicine consultant. Analyze the facial photograph provided and return a structured JSON facial assessment.

Analyze these 6 facial zones:
1. Forehead — volume loss, lines, bossing
2. Temples — hollowing, volume deficit
3. Under-eyes — tear troughs, hollowing, dark circles from volume loss
4. Cheeks — mid-face volume, projection, malar fat pad position
5. Lips — volume, definition, vermilion border, philtrum
6. Jawline/Chin — definition, sagging, jowling, projection

For each zone return:
- A brief, clinical concern description (or "No concerns detected" if none)
- A treatment area recommendation (e.g. "Lip augmentation", "Cheek enhancement", "Tear trough filler") or "No treatment indicated"
- Severity: "none", "mild", or "moderate"

IMPORTANT: Do NOT recommend specific filler products or brand names. Do NOT suggest injectables for minors. Return results as valid JSON only — no markdown, no prose outside JSON.

Return this exact JSON structure:
{
  "faceShape": "oval|round|square|heart|diamond",
  "overallSummary": "2-3 sentence personalized aesthetic summary written warmly and professionally",
  "zones": [
    {
      "id": 1,
      "name": "Forehead",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "forehead"
    },
    {
      "id": 2,
      "name": "Temples",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "temples"
    },
    {
      "id": 3,
      "name": "Under-eyes",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "undereyes"
    },
    {
      "id": 4,
      "name": "Cheeks",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "cheeks"
    },
    {
      "id": 5,
      "name": "Lips",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "lips"
    },
    {
      "id": 6,
      "name": "Jawline",
      "concern": "string",
      "recommendation": "string",
      "severity": "none|mild|moderate",
      "overlayRegion": "jawline"
    }
  ]
}`;
```

**Step 2: Create `app/api/analyze/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { FILLER_ANALYSIS_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Extract base64 from data URL
    const base64 = imageDataUrl.split(",")[1];
    const mediaType = imageDataUrl.split(";")[0].split(":")[1] as
      | "image/jpeg"
      | "image/png"
      | "image/webp";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: FILLER_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const result = JSON.parse(responseText);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify the route works with a test call**

Start the dev server and test with curl (use a real base64 image):
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageDataUrl":"data:image/jpeg;base64,/9j/4AAQ..."}'
```
Expected: JSON with `result` containing `faceShape`, `overallSummary`, `zones`.

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add Claude Vision API route for facial analysis"
```

---

## Task 7: Analyzing Screen (Loading State)

**Files:**
- Modify: `components/screens/AnalyzingScreen.tsx`

**Step 1: Replace `components/screens/AnalyzingScreen.tsx`**:
```tsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";

export default function AnalyzingScreen() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (!state.imageDataUrl) {
      dispatch({ type: "SET_SCREEN", screen: "capture" });
      return;
    }

    async function analyze() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: state.imageDataUrl }),
        });
        const data = await res.json();
        if (data.result) {
          dispatch({ type: "SET_ANALYSIS", result: data.result });
          dispatch({ type: "SET_SCREEN", screen: "gate" });
        } else {
          alert("Analysis failed. Please try again.");
          dispatch({ type: "SET_SCREEN", screen: "capture" });
        }
      } catch {
        alert("Analysis failed. Please try again.");
        dispatch({ type: "SET_SCREEN", screen: "capture" });
      }
    }

    analyze();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Pulsing gold ring */}
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border-2 border-gold/50"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gold text-2xl font-serif">HSW</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-white">Analyzing Your Facial Structure</h2>
          <p className="text-sm text-white/50">
            Our AI is assessing 6 facial zones...
          </p>
        </div>

        {/* Zone progress indicators */}
        <div className="flex gap-2">
          {["Forehead", "Temples", "Eyes", "Cheeks", "Lips", "Jaw"].map(
            (zone, i) => (
              <motion.div
                key={zone}
                className="w-1.5 h-1.5 rounded-full bg-gold"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify the analyzing screen**
- Navigate through landing → capture → upload photo → analyzing
- Expected: Pulsing animation, then automatic navigation to gate screen after API call

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add analyzing loading screen with Claude Vision API call"
```

---

## Task 8: Lead Gate Screen

**Files:**
- Modify: `components/screens/GateScreen.tsx`
- Create: `lib/validation.ts`

**Step 1: Create `lib/validation.ts`**:
```typescript
import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  marketingConsent: z.boolean().refine((v) => v === true, {
    message: "You must agree to continue",
  }),
});

export type LeadFormData = z.infer<typeof leadSchema>;
```

**Step 2: Replace `components/screens/GateScreen.tsx`**:
```tsx
"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "@/lib/store";
import { leadSchema, LeadFormData } from "@/lib/validation";

export default function GateScreen() {
  const { state, dispatch } = useApp();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  async function onSubmit(data: LeadFormData) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          analysisResult: state.analysisResult,
        }),
      });
      if (res.ok) {
        dispatch({
          type: "SET_LEAD",
          lead: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            marketingConsent: data.marketingConsent,
          },
        });
        dispatch({ type: "SET_SCREEN", screen: "results" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="screen justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6"
      >
        {/* Blurred result preview */}
        {state.imageDataUrl && (
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
            <img
              src={state.imageDataUrl}
              alt="Your photo"
              className="w-full h-full object-cover blur-md scale-105"
            />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-3">
                  <span className="text-gold text-xl">✓</span>
                </div>
                <p className="font-serif text-xl text-white">
                  Your Analysis Is Ready
                </p>
                <p className="text-sm text-white/60 mt-1">
                  Enter your details to unlock your personalized plan
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                {...register("firstName")}
                placeholder="First Name *"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:border-gold focus:outline-none"
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <input
                {...register("lastName")}
                placeholder="Last Name *"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:border-gold focus:outline-none"
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email Address *"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:border-gold focus:outline-none"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("phone")}
              type="tel"
              placeholder="Phone Number *"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:border-gold focus:outline-none"
            />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register("marketingConsent")}
              type="checkbox"
              className="mt-1 accent-gold"
            />
            <span className="text-xs text-white/50 leading-relaxed">
              I agree to receive my analysis results and marketing communications
              from Harley Street Aesthetics. Your data is handled in accordance with our privacy policy.
            </span>
          </label>
          {errors.marketingConsent && (
            <p className="text-red-400 text-xs">{errors.marketingConsent.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Unlocking..." : "Unlock My Results"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
```

**Step 3: Verify form validation works**
- Submit empty form → Expected: All error messages appear
- Submit with invalid email → Expected: Email error
- Fill all fields correctly → Should attempt API call

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add lead gate screen with form validation"
```

---

## Task 9: GoHighLevel API Route

**Files:**
- Create: `app/api/leads/route.ts`

**Step 1: Create `app/api/leads/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone } = await req.json();

    const response = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        locationId: process.env.GHL_LOCATION_ID,
        tags: ["filler-analysis-lead"],
        source: "Harley Street Aesthetics Filler Analysis App",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("GHL API error:", errorData);
      // Still return success to user — don't block results on CRM failure
      return NextResponse.json({ success: true, warning: "CRM sync failed" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead submission error:", error);
    // Don't block user from seeing results if CRM is down
    return NextResponse.json({ success: true, warning: "CRM sync failed" });
  }
}
```

> **Note on error handling:** The lead route returns `success: true` even on CRM failure intentionally — we never want to block a user from seeing their results due to a CRM API issue. Log errors server-side and investigate separately.

**Step 2: Test the route (requires real GHL credentials in .env.local)**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","phone":"+44123456789"}'
```
Expected: `{ "success": true }`

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add GoHighLevel lead capture API route"
```

---

## Task 10: Face Zone Overlay Canvas Component

**Files:**
- Create: `components/FaceOverlay.tsx`

**Step 1: Create `components/FaceOverlay.tsx`**:

This component draws numbered gold circle markers at predefined face zone positions over the user's photo using HTML Canvas.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { FaceZone } from "@/lib/types";

// Relative positions (x%, y%) for each zone marker on a portrait face photo
const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  forehead:  { x: 50, y: 18 },
  temples:   { x: 22, y: 28 },
  undereyes: { x: 62, y: 42 },
  cheeks:    { x: 25, y: 54 },
  lips:      { x: 50, y: 66 },
  jawline:   { x: 68, y: 78 },
};

interface Props {
  imageDataUrl: string;
  zones: FaceZone[];
  activeZoneId?: number | null;
  onZoneClick?: (id: number) => void;
}

export default function FaceOverlay({ imageDataUrl, zones, activeZoneId, onZoneClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      zones.forEach((zone) => {
        const pos = ZONE_POSITIONS[zone.overlayRegion];
        if (!pos) return;

        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;
        const r = canvas.width * 0.04;
        const isActive = activeZoneId === zone.id;
        const hasConcern = zone.severity !== "none";

        // Outer ring
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? "#CEA336" : hasConcern ? "rgba(206,163,54,0.6)" : "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Filled circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#CEA336" : hasConcern ? "rgba(206,163,54,0.85)" : "rgba(255,255,255,0.2)";
        ctx.fill();

        // Number label
        ctx.font = `bold ${r * 1.1}px Inter, sans-serif`;
        ctx.fillStyle = isActive || hasConcern ? "#000000" : "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(zone.id), x, y + 1);
      });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, zones, activeZoneId]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!onZoneClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const zone of zones) {
      const pos = ZONE_POSITIONS[zone.overlayRegion];
      if (!pos) continue;
      const x = (pos.x / 100) * canvas.width;
      const y = (pos.y / 100) * canvas.height;
      const r = canvas.width * 0.06;
      const dist = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      if (dist <= r) {
        onZoneClick(zone.id);
        return;
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full rounded-2xl cursor-pointer"
    />
  );
}
```

**Step 2: Verify component renders without errors**
- Import it in Results screen (next task) and check visually

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add face zone overlay canvas component with clickable markers"
```

---

## Task 11: Results Screen

**Files:**
- Modify: `components/screens/ResultsScreen.tsx`
- Create: `components/ZoneCard.tsx`

**Step 1: Create `components/ZoneCard.tsx`**:
```tsx
"use client";

import { useState } from "react";
import { FaceZone } from "@/lib/types";

const SEVERITY_COLORS = {
  none: "border-white/10 bg-white/5",
  mild: "border-gold/30 bg-gold/5",
  moderate: "border-gold/60 bg-gold/10",
};

interface Props {
  zone: FaceZone;
  isActive: boolean;
  onClick: () => void;
}

export default function ZoneCard({ zone, isActive, onClick }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
        isActive
          ? "border-gold bg-gold/10"
          : SEVERITY_COLORS[zone.severity]
      }`}
      onClick={() => { onClick(); setExpanded(!expanded); }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
            {zone.id}
          </span>
          <div>
            <p className="text-white font-medium text-sm">{zone.name}</p>
            <p className="text-white/50 text-xs">{zone.recommendation}</p>
          </div>
        </div>
        <span className="text-white/30 text-xs">{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <p className="text-white/60 text-xs mt-3 pl-10 leading-relaxed">
          {zone.concern}
        </p>
      )}
    </div>
  );
}
```

**Step 2: Replace `components/screens/ResultsScreen.tsx`**:
```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import FaceOverlay from "@/components/FaceOverlay";
import ZoneCard from "@/components/ZoneCard";

export default function ResultsScreen() {
  const { state, dispatch } = useApp();
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const { analysisResult, imageDataUrl, leadData } = state;

  if (!analysisResult || !imageDataUrl) {
    dispatch({ type: "SET_SCREEN", screen: "landing" });
    return null;
  }

  return (
    <div className="screen pb-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-6"
      >
        {/* Header */}
        <div>
          <p className="text-gold text-xs tracking-widest">YOUR ANALYSIS</p>
          <h2 className="font-serif text-2xl text-white mt-1">
            {leadData?.firstName ? `${leadData.firstName}'s ` : ""}Facial Assessment
          </h2>
          {analysisResult.faceShape && (
            <p className="text-white/50 text-sm mt-1">
              Face shape: <span className="capitalize text-white/70">{analysisResult.faceShape}</span>
            </p>
          )}
        </div>

        {/* Photo with overlay */}
        <FaceOverlay
          imageDataUrl={imageDataUrl}
          zones={analysisResult.zones}
          activeZoneId={activeZoneId}
          onZoneClick={setActiveZoneId}
        />

        {/* AI Summary */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-gold text-xs tracking-widest mb-2">AI ASSESSMENT</p>
          <p className="text-white/80 text-sm leading-relaxed">
            {analysisResult.overallSummary}
          </p>
        </div>

        {/* Zone cards */}
        <div className="space-y-3">
          <p className="text-white/50 text-xs tracking-widest">TAP A ZONE TO EXPAND</p>
          {analysisResult.zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              isActive={activeZoneId === zone.id}
              onClick={() =>
                setActiveZoneId(activeZoneId === zone.id ? null : zone.id)
              }
            />
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-white/25 text-xs text-center leading-relaxed">
          Results are AI-generated suggestions for informational purposes only.
          Final treatment plans are determined at in-person consultation.
        </p>

        {/* CTA */}
        <button
          className="btn-gold w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "booking" })}
        >
          Book My Free Consultation
        </button>
      </motion.div>
    </div>
  );
}
```

**Step 3: Verify results screen**
- Complete the full flow: landing → capture → analyze → gate → results
- Expected: Photo with gold numbered overlays, zone cards, AI summary, booking CTA

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add results screen with face overlay, zone cards, and AI summary"
```

---

## Task 12: Booking CTA Screen

**Files:**
- Modify: `components/screens/BookingScreen.tsx`

**Step 1: Replace `components/screens/BookingScreen.tsx`**:
```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useApp } from "@/lib/store";

export default function BookingScreen() {
  const { state, dispatch } = useApp();
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || "#";
  const firstName = state.leadData?.firstName;

  return (
    <div className="screen items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center gap-8"
      >
        <Image src="/logo.svg" alt="HSW" width={100} height={50} />

        <div className="w-16 h-px bg-gold" />

        <div className="space-y-3">
          <h2 className="font-serif text-3xl text-white leading-tight">
            {firstName ? `${firstName}, your` : "Your"} complimentary
            consultation is one step away
          </h2>
          <p className="text-white/50 text-sm">
            Discuss your personalized treatment plan with one of our expert practitioners.
          </p>
        </div>

        {/* What to expect */}
        <div className="w-full bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-left space-y-3">
          <p className="text-gold text-xs tracking-widest">WHAT TO EXPECT</p>
          {[
            "30-minute in-person or virtual consultation",
            "Review your AI analysis with a qualified practitioner",
            "Personalized treatment plan and pricing",
            "No obligation — completely free",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              <span className="text-white/70 text-sm">{item}</span>
            </div>
          ))}
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold w-full text-center"
        >
          Book My Free Consultation
        </a>

        <button
          className="btn-outline-gold w-full"
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "results" })}
        >
          ← Review My Results
        </button>

        <button
          className="text-white/25 text-xs"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Start a new analysis
        </button>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify booking screen**
- Navigate to booking screen from results
- Expected: HSW logo, personalized headline, consultation details, gold booking CTA

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add booking CTA screen with consultation details"
```

---

## Task 13: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts`
- Create: `public/icons/` (icon placeholders)

**Step 1: Create `public/manifest.json`**:
```json
{
  "name": "Harley Street Aesthetics",
  "short_name": "HSW",
  "description": "AI-powered facial analysis for personalized aesthetic treatment recommendations by Harley Street Aesthetics",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Step 2: Create placeholder icons**

Create 192×192 and 512×512 black PNG files with the gold HSW monogram. For now, use any square PNG image renamed to `icon-192.png` and `icon-512.png` in `public/icons/`.

> **Note:** Replace with proper branded icons before launch. Use a tool like https://realfavicongenerator.net to generate a full icon set from your SVG logo.

**Step 3: Update `next.config.ts`** for PWA:
```typescript
import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
```

**Step 4: Verify manifest is served**
```bash
curl http://localhost:3000/manifest.json
```
Expected: JSON manifest content returned.

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add PWA manifest and service worker configuration"
```

---

## Task 14: Screen Transitions & Polish

**Files:**
- Create: `components/ScreenWrapper.tsx`
- Modify: `app/page.tsx`

**Step 1: Create `components/ScreenWrapper.tsx`** for animated transitions:
```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Screen } from "@/lib/types";

interface Props {
  screenKey: Screen;
  children: React.ReactNode;
}

export default function ScreenWrapper({ screenKey, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Update `app/page.tsx`** to wrap screens:
```tsx
"use client";

import { AppProvider, useApp } from "@/lib/store";
import ScreenWrapper from "@/components/ScreenWrapper";
import LandingScreen from "@/components/screens/LandingScreen";
import CaptureScreen from "@/components/screens/CaptureScreen";
import AnalyzingScreen from "@/components/screens/AnalyzingScreen";
import GateScreen from "@/components/screens/GateScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";
import BookingScreen from "@/components/screens/BookingScreen";

function ScreenRouter() {
  const { state } = useApp();

  const screens = {
    landing:   <LandingScreen />,
    capture:   <CaptureScreen />,
    analyzing: <AnalyzingScreen />,
    gate:      <GateScreen />,
    results:   <ResultsScreen />,
    booking:   <BookingScreen />,
  };

  return (
    <ScreenWrapper screenKey={state.screen}>
      {screens[state.screen] ?? <LandingScreen />}
    </ScreenWrapper>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
```

**Step 3: Full end-to-end test on mobile viewport**
- Open Chrome DevTools → iPhone 14 Pro viewport
- Walk through entire flow: landing → capture (upload test photo) → analyzing → gate (fill form) → results (check overlay) → booking
- Verify smooth transitions between every screen

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add animated screen transitions and complete E2E flow"
```

---

## Task 15: Save Memory & Prep for Deployment

**Files:**
- Create: `C:\Users\faisa\.claude\projects\D--Dermal-Filler-App-HSA\memory\MEMORY.md`

**Step 1: Write memory file for future sessions**:
```markdown
# HSW Filler Analysis App — Project Memory

## What This Project Is
Lead magnet PWA: AI facial analysis → email/phone lead capture → GoHighLevel CRM → booking CTA.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Framer Motion for transitions
- @anthropic-ai/sdk — model: claude-sonnet-4-6
- react-hook-form + zod for validation
- next-pwa for PWA

## Brand Colors
- Gold: #CEA336
- Black: #000000
- White: #FFFFFF

## Key Files
- `lib/types.ts` — all TypeScript types
- `lib/store.ts` — AppProvider + useApp hook (context + useReducer)
- `lib/prompts.ts` — Claude Vision system prompt
- `lib/validation.ts` — Zod lead form schema
- `app/api/analyze/route.ts` — Claude Vision API route
- `app/api/leads/route.ts` — GoHighLevel contact creation
- `components/FaceOverlay.tsx` — Canvas overlay with zone markers
- `components/ZoneCard.tsx` — Expandable zone card
- `components/screens/` — All 6 screen components

## Environment Variables
ANTHROPIC_API_KEY, GHL_API_KEY, GHL_LOCATION_ID, NEXT_PUBLIC_BOOKING_URL

## GoHighLevel API
- Base: https://services.leadconnectorhq.com
- Endpoint: POST /contacts/
- Headers: Authorization: Bearer {GHL_API_KEY}, Version: 2021-07-28
- Tags applied: filler-analysis-lead

## Important Decisions
- No database — results in sessionStorage/React state only
- Lead API always returns success=true to never block user from seeing results
- Face zone overlay uses predefined relative positions (not AI coordinates)
- Phone number is a required field (not optional)
```

**Step 2: Final pre-deploy checklist**
- [ ] Add real icon files to `public/icons/`
- [ ] Set all 4 environment variables in Vercel dashboard
- [ ] Replace booking URL with real GHL/Calendly link
- [ ] Test GoHighLevel integration with real API key
- [ ] Test on real iPhone (Safari) — camera permissions, PWA install prompt
- [ ] Add medical disclaimer review by a qualified practitioner

**Step 3: Deploy to Vercel**
```bash
npx vercel
```
Follow prompts. Then add environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## Summary of All Files Created

```
D:\Dermal Filler App HSA\
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      ← Claude Vision API
│   │   └── leads/route.ts        ← GoHighLevel API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  ← Screen router
├── components/
│   ├── screens/
│   │   ├── LandingScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── AnalyzingScreen.tsx
│   │   ├── GateScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   └── BookingScreen.tsx
│   ├── FaceOverlay.tsx           ← Canvas zone markers
│   ├── ScreenWrapper.tsx         ← Animated transitions
│   └── ZoneCard.tsx
├── hooks/
│   └── useCamera.ts
├── lib/
│   ├── prompts.ts                ← Claude system prompt
│   ├── store.ts                  ← React context + reducer
│   ├── types.ts                  ← All TypeScript types
│   └── validation.ts             ← Zod schemas
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── logo.svg
│   └── manifest.json
├── docs/plans/
│   ├── 2026-03-01-filler-app-design.md
│   └── 2026-03-01-filler-app-implementation.md
├── .env.example
├── .env.local
├── next.config.ts
└── tailwind.config.ts
```
