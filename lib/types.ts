export type Screen =
  | "landing"
  | "capture"
  | "analyzing"
  | "gate"
  | "results"
  | "checkout"
  | "confirmation";

export interface SkinDimension {
  id: number;
  name: string;
  concern: string;
  severity: "healthy" | "mild" | "moderate";
  highlightAreas: string[];
}

export interface FacialRecommendation {
  rank: number;
  facialName: string;
  matchReason: string;
  shortDescription: string;
}

export interface SkinAnalysisResult {
  skinType: string;
  estimatedAgeRange: string;
  overallSummary: string;
  dimensions: SkinDimension[];
  recommendations: FacialRecommendation[];
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
  analysisResult: SkinAnalysisResult | null;
  leadData: LeadData | null;
  membershipPopupShown: boolean;
  checkoutData: CheckoutData | null;
  bookingConfirmation: BookingConfirmation | null;
}

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
