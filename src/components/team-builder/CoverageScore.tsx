"use client";

import { motion } from "framer-motion";
import { calculateCoverageScore } from "@/lib/team-analysis";
import type { TeamSlot } from "@/lib/types";

interface CoverageScoreProps {
  slots: TeamSlot[];
}

export function CoverageScore({ slots }: CoverageScoreProps) {
  const score = calculateCoverageScore(slots);
  const filledSlots = slots.filter((s) => s.pokemon).length;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? "text-green-500"
      : score >= 40
        ? "text-yellow-500"
        : "text-red-500";

  const strokeColor =
    score >= 70
      ? "#22c55e"
      : score >= 40
        ? "#eab308"
        : "#ef4444";

  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
        ? "Good"
        : score >= 40
          ? "Fair"
          : score >= 20
            ? "Weak"
            : filledSlots === 0
              ? "Empty"
              : "Poor";

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        {/* Background circle */}
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-extrabold ${color}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className={`mt-2 text-sm font-bold ${color}`}>{label}</p>
      <p className="text-xs text-muted-foreground">Team Coverage Score</p>
    </div>
  );
}
