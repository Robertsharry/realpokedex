"use client";

import { motion } from "framer-motion";
import { STAT_COLORS, STAT_LABELS, STAT_MAX } from "@/lib/constants";

interface StatBarProps {
  name: string;
  value: number;
  delay?: number;
}

export function StatBar({ name, value, delay = 0 }: StatBarProps) {
  const label = STAT_LABELS[name] ?? name.toUpperCase();
  const color = STAT_COLORS[name] ?? "#888";
  const percentage = Math.min((value / STAT_MAX) * 100, 100);
  const isHigh = value >= 100;
  const isLow = value < 50;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-10 text-right text-sm font-extrabold tracking-wide"
        style={{ color }}
      >
        {label}
      </span>
      <span
        className={`w-10 text-right font-mono text-base font-black tabular-nums ${
          isHigh ? "text-foreground" : isLow ? "text-muted-foreground" : "text-foreground/80"
        }`}
      >
        {value}
      </span>
      <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            delay: delay,
            ease: [0.25, 0.8, 0.25, 1],
          }}
        />
      </div>
    </div>
  );
}

interface StatBarGroupProps {
  stats: { name: string; baseStat: number }[];
}

export function StatBarGroup({ stats }: StatBarGroupProps) {
  const total = stats.reduce((sum, s) => sum + s.baseStat, 0);

  const tier =
    total >= 600
      ? { label: "Legendary tier", color: "text-yellow-400" }
      : total >= 500
        ? { label: "Very strong", color: "text-green-400" }
        : total >= 400
          ? { label: "Solid", color: "text-blue-400" }
          : total >= 300
            ? { label: "Average", color: "text-muted-foreground" }
            : { label: "Low stats", color: "text-red-400" };

  return (
    <div className="space-y-3">
      {stats.map((stat, i) => (
        <StatBar
          key={stat.name}
          name={stat.name}
          value={stat.baseStat}
          delay={i * 0.1}
        />
      ))}
      <div className="mt-4 flex items-center gap-3 border-t-2 border-border/50 pt-4">
        <span className="w-10 text-right text-sm font-extrabold text-foreground">
          TOT
        </span>
        <span className="w-10 text-right font-mono text-lg font-black tabular-nums">
          {total}
        </span>
        <span className={`text-sm font-bold ${tier.color}`}>
          {tier.label}
        </span>
      </div>
    </div>
  );
}
