import * as React from "react";
import { cn } from "../lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

/**
 * StatCard — Dashboard stat card from Figma.
 *
 * Figma specs:
 *  - Size: 300×112 in the design (flexible width)
 *  - Padding: px-24 py-16
 *  - Border: 1px solid dark-500
 *  - Border-radius: 16px (rounded-lg)
 *  - Label: Outfit Regular 18px, text-secondary
 *  - Value: Sora Bold 32px, text-primary
 *  - Trend: Outfit Regular 16px/28 line-height, text-success
 *  - Icon: 24px, main-500
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    { className, label, value, icon: Icon, trend, trendUp = true, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex h-[112px] flex-col items-center justify-between rounded-lg border border-dark-500 bg-neutral-900 px-6 py-4",
        className
      )}
      {...props}
    >
      {/* Header with icon + label */}
      <div className="flex w-full items-center gap-3">
        {Icon && <Icon className="size-6 text-main-500" />}
        <span className="font-outfit text-body-md text-text-secondary">
          {label}
        </span>
      </div>

      {/* Value + Trend */}
      <div className="flex w-full items-end justify-between">
        <span className="font-sora text-display-3 font-bold text-text-primary">
          {value}
        </span>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-2 font-outfit text-body-base",
              trendUp ? "text-success" : "text-danger"
            )}
          >
            {trendUp ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
);
StatCard.displayName = "StatCard";

export { StatCard };
