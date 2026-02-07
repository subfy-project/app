"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "../lib/utils";
import {
  Home,
  LayoutGrid,
  Users,
  BarChart3,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────── */

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items?: SidebarItem[];
  activeHref?: string;
  logo?: React.ReactNode;
  onNavigate?: (href: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ── Default nav items ────────────────────────────────── */

export const defaultSidebarItems: SidebarItem[] = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Plans", href: "/dashboard/plans", icon: LayoutGrid },
  { label: "Memberships", href: "/dashboard/memberships", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/* ── Default Logo ─────────────────────────────────────── */

function DefaultLogo() {
  return (
    <img
      src="/Logo.svg"
      alt="Subfy"
      className="h-[50px] w-auto"
    />
  );
}

/* ──────────────────────────────────────────────────────────
 * SidebarButton
 *
 * Figma component: Dashboard/SidebarButton
 *
 * States:
 *  ● Default  — no bg, no border
 *  ● Hover    — border-l-8 dark-500, gradient from dark-500/25 → transparent
 *  ● Selected — border-l-8 main-500, gradient from main-400/25 → transparent
 *
 * Shared: px-32 py-16 gap-12 rounded-8 w-full
 * Font:   Outfit Regular 16px / 28px line-height
 * ──────────────────────────────────────────────────────── */

interface SidebarButtonProps {
  item: SidebarItem;
  isActive: boolean;
  onNavigate?: (href: string) => void;
}

function SidebarButton({ item, isActive, onNavigate }: SidebarButtonProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onNavigate?.(item.href)}
      style={
        isActive
          ? {
              borderLeft: "6px solid #8B7CFF",
              background:
                "linear-gradient(to right, rgba(124,92,255,0.25), transparent)",
            }
          : undefined
      }
      className={cn(
        /* base */
        "group sidebar-btn relative flex w-full items-center gap-3 rounded-sm px-8 py-4 font-outfit text-[16px] leading-7 text-text-primary transition-all duration-200",
        /* state-dependent */
        isActive
          ? ""
          : "border-l-[6px] border-transparent"
      )}
    >
      <Icon
        className={cn(
          "size-6 shrink-0 transition-colors duration-200",
          isActive ? "text-main-500" : "text-text-primary"
        )}
      />
      <span>{item.label}</span>
    </button>
  );
}

/* ── Shared nav content ───────────────────────────────── */

interface SidebarNavContentProps {
  items: SidebarItem[];
  activeHref?: string;
  logo?: React.ReactNode;
  onNavigate?: (href: string) => void;
}

function SidebarNavContent({
  items,
  activeHref,
  logo,
  onNavigate,
}: SidebarNavContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo — 155px height, 32px padding */}
      <div className="flex h-[155px] shrink-0 items-center px-8">
        {logo ?? <DefaultLogo />}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col">
        {items.map((item) => (
          <SidebarButton
            key={item.href}
            item={item}
            isActive={activeHref === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Sidebar — responsive
 * ──────────────────────────────────────────────────────── */

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      className,
      items = defaultSidebarItems,
      activeHref,
      logo,
      onNavigate,
      mobileOpen = false,
      onMobileClose,
      ...props
    },
    ref
  ) => (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={ref}
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 w-sidebar flex-col border-r border-dark-500 bg-neutral-900",
          className
        )}
        {...props}
      >
        <SidebarNavContent
          items={items}
          activeHref={activeHref}
          logo={logo}
          onNavigate={onNavigate}
        />
      </aside>

      {/* Mobile sidebar (sheet) */}
      <DialogPrimitive.Root
        open={mobileOpen}
        onOpenChange={(open) => !open && onMobileClose?.()}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="mobile-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
          <DialogPrimitive.Content className="mobile-sheet fixed inset-y-0 left-0 z-50 w-[min(var(--sidebar-width),85vw)] border-r border-dark-500 bg-neutral-900 shadow-2xl lg:hidden">
            <VisuallyHidden.Root>
              <DialogPrimitive.Title>Navigation menu</DialogPrimitive.Title>
            </VisuallyHidden.Root>
            <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm p-2 text-text-secondary hover:text-text-primary transition-colors duration-200">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <SidebarNavContent
              items={items}
              activeHref={activeHref}
              logo={logo}
              onNavigate={(href) => {
                onNavigate?.(href);
                onMobileClose?.();
              }}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
