"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Sidebar, type SidebarItem, type SidebarProps } from "./sidebar";
import { Navbar, type NavbarLink, type NavbarProps } from "./navbar";

/* ──────────────────────────────────────────────────────────
 * DashboardLayout
 *
 * Figma specs:
 *  - Background: #151721 (neutral-950)
 *  - Content padding: px-28, pt-16, pb-28
 *  - Content gap: 28px
 *  - Sidebar: 340px
 * ──────────────────────────────────────────────────────── */

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems?: SidebarItem[];
  navbarLinks?: NavbarLink[];
  activeHref?: string;
  username?: string;
  avatarUrl?: string;
  logo?: React.ReactNode;
  onNavigate?: (href: string) => void;
  sidebarProps?: Partial<SidebarProps>;
  navbarProps?: Partial<NavbarProps>;
  className?: string;
}

function DashboardLayout({
  children,
  sidebarItems,
  navbarLinks,
  activeHref,
  username,
  avatarUrl,
  logo,
  onNavigate,
  sidebarProps,
  navbarProps,
  className,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeHref={activeHref}
        logo={logo}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        {...sidebarProps}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-sidebar">
        {/* Navbar */}
        <Navbar
          links={navbarLinks}
          username={username}
          avatarUrl={avatarUrl}
          onMenuToggle={() => setMobileOpen(true)}
          onNavigate={onNavigate}
          {...navbarProps}
        />

        {/* Content — Figma: px-28 pt-16 pb-28 gap-28 */}
        <main
          className={cn(
            "flex-1 overflow-y-auto px-5 pb-7 pt-4 sm:px-7",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
