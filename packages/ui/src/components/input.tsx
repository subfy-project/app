import * as React from "react";
import { cn } from "../lib/utils";
import { Search } from "lucide-react";

/**
 * Input — Figma specs:
 *  - bg: neutral-900, border: dark-500, rounded: 16px
 *  - Font: Outfit Regular 16px
 *  - Height: ~51px
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-[51px] w-full rounded-lg border border-dark-500 bg-neutral-900 px-4 py-2 font-outfit text-[16px] leading-7 text-text-primary placeholder:text-dark-500 focus:border-main-500 focus:outline-none focus:ring-1 focus:ring-main-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

/**
 * SearchInput — Figma Dashboard/Searchbar:
 *  - bg: neutral-900, border: dark-500, rounded: 16px
 *  - Icon: 24px, search, text-secondary
 *  - Font: Outfit Regular 16px, placeholder: dark-500
 *  - Gap: 12px, px-16 py-8
 */
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dark-500 bg-neutral-900 px-4 py-2 transition-colors duration-200 focus-within:border-main-500 focus-within:ring-1 focus-within:ring-main-500",
        containerClassName
      )}
    >
      <Search className="size-6 shrink-0 text-text-secondary" />
      <input
        type="search"
        className={cn(
          "flex h-8 w-full bg-transparent font-outfit text-[16px] leading-7 text-text-primary placeholder:text-dark-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput };
