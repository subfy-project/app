import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Badge / Status — Figma specs:
 *  - Font: Outfit Regular 16px / line-height 28px
 *  - Active: green bg, green border
 *  - Expired: red bg, red border
 *  - Padding: px-12, rounded-16px
 */
const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-lg px-3 font-outfit text-[16px] font-normal leading-7 transition-colors duration-150",
  {
    variants: {
      variant: {
        active:
          "border border-success-border bg-success-bg text-success",
        expired:
          "border border-danger-border bg-danger-bg text-danger",
        default:
          "border border-dark-500 bg-dark-500/50 text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, dot = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "size-2 rounded-full",
            variant === "active" && "bg-success",
            variant === "expired" && "bg-danger",
            variant === "default" && "bg-text-secondary"
          )}
        />
      )}
      {children}
    </div>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
