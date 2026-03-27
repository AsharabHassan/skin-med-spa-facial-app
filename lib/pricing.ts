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

/** Convert "10:30 AM" → "10:30:00" (24h format) */
export function convertTo24h(timeStr: string): string {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "09:00:00";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}
