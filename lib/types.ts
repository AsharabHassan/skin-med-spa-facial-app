export type Screen =
  | "landing"
  | "capture"
  | "analyzing"
  | "gate"
  | "results"
  | "booking";

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
}
