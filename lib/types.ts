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
