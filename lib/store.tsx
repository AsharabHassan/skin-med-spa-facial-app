"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, Screen, SkinAnalysisResult, LeadData } from "./types";

type Action =
  | { type: "SET_SCREEN"; screen: Screen }
  | { type: "SET_IMAGE"; imageDataUrl: string }
  | { type: "SET_ANALYSIS"; result: SkinAnalysisResult }
  | { type: "SET_LEAD"; lead: LeadData }
  | { type: "SHOW_MEMBERSHIP_POPUP" }
  | { type: "SET_SELECTED_RECOMMENDATION"; index: number }
  | { type: "SELECT_MEMBERSHIP" }
  | { type: "RESET" };

const initialState: AppState = {
  screen: "landing",
  imageDataUrl: null,
  analysisResult: null,
  leadData: null,
  membershipPopupShown: false,
  selectedRecommendationIndex: 0,
  membershipSelected: false,
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
    case "SHOW_MEMBERSHIP_POPUP":
      return { ...state, membershipPopupShown: true };
    case "SET_SELECTED_RECOMMENDATION":
      return { ...state, selectedRecommendationIndex: action.index, membershipSelected: false };
    case "SELECT_MEMBERSHIP":
      return { ...state, membershipSelected: true, selectedRecommendationIndex: -1 };
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
