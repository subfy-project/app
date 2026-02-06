import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Button — Figma component
 *
 * States (fill="Default" | "Hover" | "Outline"):
 *
 *  ● Default  — bg: main-600 (#4F4781), border-2: main-500 (#8B7CFF), text: text-primary
 *  ● Hover    — bg: main-500 (#8B7CFF), border-2: main-500 (#8B7CFF), text: text-primary
 *  ● Outline  — bg: transparent,        border-2: main-600 (#4F4781), text: main-600
 *
 * Shared: px-28 py-16 gap-8 rounded-16px
 * Font:   Inter Semi Bold 16px / line-height 100%
 * Icon:   24px
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-inter font-semibold text-[16px] leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /**
         * Primary (Default → Hover)
         * Default: bg-main-600 border-main-500
         * Hover:   bg-main-500 border-main-500 (brighter purple fill)
         */
        primary:
          "bg-main-600 border-2 border-main-500 text-text-primary hover:bg-main-500 active:scale-[0.98]",
        /**
         * Outline
         * bg-transparent, border-main-600, text-main-600
         * Hover: subtle fill
         */
        outline:
          "border-2 border-main-600 bg-transparent text-main-600 hover:bg-main-600/15 hover:text-main-500 hover:border-main-500 active:scale-[0.98]",
        /**
         * Ghost — no border, no bg
         */
        ghost:
          "bg-transparent text-text-primary hover:bg-dark-500/50 active:scale-[0.98]",
        /**
         * Secondary — dark bg + dark border
         */
        secondary:
          "bg-neutral-900 border border-dark-500 text-text-primary hover:bg-dark-500 active:scale-[0.98]",
        /**
         * Danger
         */
        danger:
          "bg-danger-bg border border-danger-border text-danger hover:bg-danger/20 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 rounded-sm px-4 py-2 text-[14px]",
        md: "h-[51px] rounded-lg px-7 py-4",
        lg: "h-14 rounded-lg px-8 py-4 text-[18px]",
        icon: "size-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
