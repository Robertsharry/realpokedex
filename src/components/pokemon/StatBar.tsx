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

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right text-xs font-bold text-muted-foreground">
        {label}
      </span>
      <span className="w-8 text-right text-sm font-bold tabular-nums">
        {value}
      </span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted/50">
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

  return (
    <div className="space-y-2.5">
      {stats.map((stat, i) => (
        <StatBar
          key={stat.name}
          name={stat.name}
          value={stat.baseStat}
          delay={i * 0.1}
        />
      ))}
      <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
        <span className="w-10 text-right text-xs font-bold text-muted-foreground">
          TOT
        </span>
        <span className="w-8 text-right text-sm font-extrabold tabular-nums">
          {total}
        </span>
        <div className="flex-1 text-xs text-muted-foreground">
          {total >= 600
            ? "Legendary tier"
            : total >= 500
              ? "Very strong"
              : total >= 400
                ? "Solid"
                : total >= 300
                  ? "Average"
                  : "Low stats"}
        </div>
      </div>
    </div>
  );
}
