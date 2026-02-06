"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Modal — generic overlay dialog
 *
 * Design tokens (from Figma):
 *  - Overlay: black/60, backdrop-blur-sm
 *  - Container: bg-neutral-900, border dark-500, rounded-2xl
 *  - Title: Sora Bold 24px, text-primary
 *  - Body: Outfit Regular 16px, text-secondary
 *  - Close button: top-right, text-secondary → text-primary
 *
 * Animations use the same CSS keyframes as mobile sidebar.
 * ──────────────────────────────────────────────────────── */

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;

/* ── Overlay ─────────────────────────────────────────── */

const ModalOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = "ModalOverlay";

/* ── Content ─────────────────────────────────────────── */

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "modal-content fixed left-1/2 top-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dark-500 bg-neutral-900 p-6 shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-2 text-text-secondary transition-colors duration-200 hover:text-text-primary">
        <X className="size-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = "ModalContent";

/* ── Header ──────────────────────────────────────────── */

function ModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 pb-4",
        className
      )}
      {...props}
    />
  );
}
ModalHeader.displayName = "ModalHeader";

/* ── Title ───────────────────────────────────────────── */

const ModalTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-sora text-[24px] font-bold leading-none text-text-primary",
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

/* ── Description ─────────────────────────────────────── */

const ModalDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "font-outfit text-[16px] leading-7 text-text-secondary",
      className
    )}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

/* ── Footer ──────────────────────────────────────────── */

function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-4",
        className
      )}
      {...props}
    />
  );
}
ModalFooter.displayName = "ModalFooter";

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
};
