"use client";

import { AppProvider, useApp } from "@/lib/store";
import ScreenWrapper from "@/components/ScreenWrapper";
import LandingScreen from "@/components/screens/LandingScreen";
import CaptureScreen from "@/components/screens/CaptureScreen";
import AnalyzingScreen from "@/components/screens/AnalyzingScreen";
import GateScreen from "@/components/screens/GateScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";
import CheckoutScreen from "@/components/screens/CheckoutScreen";
import ConfirmationScreen from "@/components/screens/ConfirmationScreen";

function ScreenRouter() {
  const { state } = useApp();

  const screens = {
    landing:      <LandingScreen />,
    capture:      <CaptureScreen />,
    analyzing:    <AnalyzingScreen />,
    gate:         <GateScreen />,
    results:      <ResultsScreen />,
    checkout:     <CheckoutScreen />,
    confirmation: <ConfirmationScreen />,
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
