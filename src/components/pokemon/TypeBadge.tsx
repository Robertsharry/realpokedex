import { TYPE_COLORS, capitalize } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TypeBadge({ type, size = "sm", className }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.normal;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-extrabold uppercase tracking-wider text-white shadow-sm",
        "drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: colors.bg,
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {capitalize(type)}
    </span>
  );
}
