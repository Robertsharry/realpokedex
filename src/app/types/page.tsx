"use client";

import { useState } from "react";
import { Grid3X3 } from "lucide-react";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { ALL_TYPES, capitalize, TYPE_COLORS } from "@/lib/constants";
import { getAttackEffectiveness, getTypeWeaknesses, getTypeResistances, getTypeImmunities, getSuperEffectiveAgainst, getNotVeryEffectiveAgainst, getNoEffectAgainst, getDualTypeEffectiveness } from "@/lib/type-effectiveness";

export default function TypesPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dualType1, setDualType1] = useState<string>("");
  const [dualType2, setDualType2] = useState<string>("");

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-extrabold">Type Matchups</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore type effectiveness and calculate dual-type weaknesses.
        </p>
      </div>

      {/* Type Chart Grid */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-[10px] sm:text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background p-1 text-left">
                <span className="text-[8px] text-muted-foreground">ATK / DEF</span>
              </th>
              {ALL_TYPES.map((type) => (
                <th key={type} className="p-1">
                  <button
                    onClick={() => setSelectedType(selectedType === type ? null : type)}
                    className="mx-auto block"
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white sm:h-7 sm:w-7"
                      style={{ backgroundColor: TYPE_COLORS[type].bg }}
                      title={capitalize(type)}
                    >
                      {type.slice(0, 3).toUpperCase()}
                    </div>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_TYPES.map((atkType) => (
              <tr key={atkType} className={selectedType === atkType ? "bg-primary/5" : ""}>
                <td className="sticky left-0 z-10 bg-background p-1">
                  <button
                    onClick={() => setSelectedType(selectedType === atkType ? null : atkType)}
                  >
                    <div
                      className="flex h-6 items-center justify-center rounded-full px-2 text-[8px] font-bold text-white sm:h-7"
                      style={{ backgroundColor: TYPE_COLORS[atkType].bg }}
                    >
                      {capitalize(atkType).slice(0, 5)}
                    </div>
                  </button>
                </td>
                {ALL_TYPES.map((defType) => {
                  const eff = getAttackEffectiveness(atkType, defType);
                  const bg =
                    eff === 0
                      ? "bg-gray-900 text-gray-400"
                      : eff < 1
                        ? "bg-red-500/15 text-red-400"
                        : eff > 1
                          ? "bg-green-500/15 text-green-400"
                          : "text-muted-foreground/30";

                  return (
                    <td
                      key={defType}
                      className={`p-1 text-center ${bg} ${
                        selectedType === defType ? "ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <span className="font-bold">
                        {eff === 0 ? "0" : eff === 0.5 ? "\u00BD" : eff === 1 ? "" : "2"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Type Detail */}
      {selectedType && (
        <div className="mb-8 rounded-xl border border-border/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <TypeBadge type={selectedType} size="lg" />
            <h2 className="text-lg font-bold">{capitalize(selectedType)} Type</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-bold text-green-400">Super Effective Against</p>
              <div className="flex flex-wrap gap-1">
                {getSuperEffectiveAgainst(selectedType).map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
                {getSuperEffectiveAgainst(selectedType).length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-red-400">Not Very Effective Against</p>
              <div className="flex flex-wrap gap-1">
                {getNotVeryEffectiveAgainst(selectedType).map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-gray-400">No Effect On</p>
              <div className="flex flex-wrap gap-1">
                {getNoEffectAgainst(selectedType).map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
                {getNoEffectAgainst(selectedType).length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Type Calculator */}
      <div className="rounded-xl border border-border/50 p-6">
        <h2 className="mb-4 text-lg font-bold">Dual-Type Calculator</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Select two types to see the combined defensive profile.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={dualType1}
            onChange={(e) => setDualType1(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Type 1</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{capitalize(t)}</option>
            ))}
          </select>
          <span className="flex items-center text-muted-foreground">/</span>
          <select
            value={dualType2}
            onChange={(e) => setDualType2(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Type 2 (optional)</option>
            {ALL_TYPES.filter((t) => t !== dualType1).map((t) => (
              <option key={t} value={t}>{capitalize(t)}</option>
            ))}
          </select>
        </div>

        {dualType1 && (
          <div>
            <div className="mb-3 flex gap-2">
              <TypeBadge type={dualType1} size="md" />
              {dualType2 && <TypeBadge type={dualType2} size="md" />}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ALL_TYPES.map((atkType) => {
                const types = dualType2 ? [dualType1, dualType2] : [dualType1];
                const eff = getDualTypeEffectiveness(atkType, types);
                const bg =
                  eff === 0
                    ? "bg-gray-800 ring-gray-700"
                    : eff >= 4
                      ? "bg-red-500/20 ring-red-500/30"
                      : eff >= 2
                        ? "bg-red-500/10 ring-red-500/20"
                        : eff < 1
                          ? "bg-green-500/10 ring-green-500/20"
                          : "ring-border/30";

                return (
                  <div
                    key={atkType}
                    className={`flex flex-col items-center rounded-lg p-2 ring-1 ${bg}`}
                  >
                    <TypeBadge type={atkType} size="sm" />
                    <span className={`mt-1 text-xs font-bold ${
                      eff === 0
                        ? "text-gray-400"
                        : eff >= 4
                          ? "text-red-400"
                          : eff >= 2
                            ? "text-red-400"
                            : eff < 1
                              ? "text-green-400"
                              : "text-muted-foreground"
                    }`}>
                      {eff}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
