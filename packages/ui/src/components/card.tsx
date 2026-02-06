import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Card — Figma specs:
 *  - bg: neutral-900 (#191C27)
 *  - border: 1px solid dark-500 (#25293A)
 *  - border-radius: 16px (rounded-lg)
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-dark-500 bg-neutral-900 text-text-primary",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeader — Figma: px-24 py-16
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 px-6 py-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle — Figma: Outfit Regular 18px, text-secondary, gap-12, icon 24px
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 font-outfit text-body-md text-text-secondary",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter — Figma: border-top, px-24 py-16, gap-12
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 border-t border-dark-500 bg-neutral-900 px-6 py-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
