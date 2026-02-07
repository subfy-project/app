"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Menu, User } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────── */

export interface NavbarLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  links?: NavbarLink[];
  username?: string;
  avatarUrl?: string;
  onMenuToggle?: () => void;
  onNavigate?: (href: string) => void;
}

export const defaultNavbarLinks: NavbarLink[] = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "API", href: "/api" },
];

/* ──────────────────────────────────────────────────────────
 * NavbarButton
 *
 * Figma: Dashboard/NavbarButton
 *
 * Fix: button uses h-full to fill the 60px navbar exactly.
 * The 6px bottom-border sits flush with the navbar's own
 * bottom border (clipped by overflow-hidden on the header).
 * ──────────────────────────────────────────────────────── */

interface NavbarButtonProps {
  link: NavbarLink;
  onNavigate?: (href: string) => void;
}

function NavbarButton({ link, onNavigate }: NavbarButtonProps) {
  return (
    <button
      onClick={() => onNavigate?.(link.href)}
      style={
        link.active
          ? {
              borderBottom: "6px solid #8B7CFF",
              background:
                "linear-gradient(to top, rgba(124,92,255,0.25), transparent)",
            }
          : undefined
      }
      className={cn(
        /* base — h-full fills the navbar, items are centred */
        "navbar-btn relative flex h-full items-center justify-center rounded-sm font-inter text-[14px] sm:text-[16px] leading-7 text-text-primary transition-all duration-200",
        /* state-dependent */
        link.active
          ? "px-4 sm:px-8"
          : "border-b-[6px] border-transparent px-3 sm:px-7"
      )}
    >
      {link.label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
 * Navbar
 *
 * overflow-hidden clips the button borders flush with
 * the navbar's own bottom edge.
 * ──────────────────────────────────────────────────────── */

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      links = defaultNavbarLinks,
      username = "Username",
      avatarUrl,
      onMenuToggle,
      onNavigate,
      ...props
    },
    ref
  ) => (
    <header
      ref={ref}
      className={cn(
        "flex h-[60px] shrink-0 items-center overflow-hidden border-b border-dark-500 bg-neutral-900 px-3 sm:px-8",
        className
      )}
      {...props}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="mr-4 rounded-sm p-2 text-text-secondary hover:bg-dark-500/50 hover:text-text-primary transition-colors duration-200 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav links + user */}
      <nav className="flex h-full items-center gap-2">
        {links.map((link) => (
          <NavbarButton
            key={link.href}
            link={link}
            onNavigate={onNavigate}
          />
        ))}

        {/* User section */}
        <div className="ml-1 flex items-center gap-2 px-2 py-1.5 sm:ml-2 sm:px-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-7 items-center justify-center rounded-full bg-dark-500">
              <User className="size-4 text-text-secondary" />
            </div>
          )}
          <span className="hidden font-inter text-[16px] leading-7 text-text-primary sm:block">
            {username}
          </span>
        </div>
      </nav>
    </header>
  )
);
Navbar.displayName = "Navbar";

export { Navbar };
