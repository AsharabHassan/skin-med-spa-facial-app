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
