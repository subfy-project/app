import * as React from "react";
import { cn } from "../lib/utils";

/**
 * PageHeader — Dashboard page title component.
 *
 * Figma specs:
 *  - Title: Sora Bold 72px, line-height 100%, text-primary
 *  - Subtitle: Outfit Medium 20px, line-height 100%, text-secondary
 */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-start justify-center", className)}
      {...props}
    >
      <h1 className="font-sora text-4xl font-bold leading-none tracking-tight text-text-primary sm:text-5xl lg:text-[72px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 font-outfit text-[20px] font-medium leading-none text-text-secondary">
          {subtitle}
        </p>
      )}
    </div>
  )
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
