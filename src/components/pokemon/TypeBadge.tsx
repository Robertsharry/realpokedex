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
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wider text-white shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: colors.bg }}
    >
      {capitalize(type)}
    </span>
  );
}
