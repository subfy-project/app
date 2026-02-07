"use client";

import { useState } from "react";
import { Button, Input } from "@subfy/ui";
import {
  ArrowRight,
  BarChart3,
  Construction,
  Mail,
  Rocket,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function WhitelistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/whitelist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "You have been added to the whitelist!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Unable to connect to the server. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-950">
      {/* Navbar */}
      <nav className="border-b border-dark-500/50 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="Subfy" className="h-7" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/whitelist/stats">
              <Button variant="ghost" size="sm">
                <BarChart3 className="size-4" />
                Stats
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="relative w-full max-w-2xl">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-main-500/8 blur-[120px]" />
          </div>

          <div className="relative flex flex-col items-center gap-8 text-center">
            {/* Icon */}
            <div className="flex size-20 items-center justify-center rounded-2xl border border-main-500/20 bg-main-500/10">
              <Construction className="size-10 text-main-400" />
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-4">
              <h1 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
                Something{" "}
                <span className="text-gradient">Amazing</span> is Coming
              </h1>
              <p className="mx-auto max-w-lg font-outfit text-body-lg leading-relaxed text-text-secondary">
                We&apos;re building the future of on-chain recurring payments.
                Subfy is currently under construction and will be launching soon.
              </p>
            </div>

            {/* Email Form */}
            <div className="w-full max-w-md">
              <div className="flex flex-col gap-4 rounded-2xl border border-dark-500 bg-neutral-900 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-main-500/10">
                    <Rocket className="size-5 text-main-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-inter text-body-sm font-semibold text-text-primary">
                      Interested in Subfy?
                    </p>
                    <p className="font-outfit text-body-xs text-text-secondary">
                      Join the whitelist to follow our progress and get early
                      access.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status !== "idle") setStatus("idle");
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join the Whitelist
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Status Message */}
                {status === "success" && (
                  <div className="flex items-center gap-2 rounded-lg border border-success-border bg-success-bg px-4 py-3">
                    <CheckCircle className="size-4 shrink-0 text-success" />
                    <p className="font-outfit text-body-xs text-success">
                      {message}
                    </p>
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg px-4 py-3">
                    <AlertCircle className="size-4 shrink-0 text-danger" />
                    <p className="font-outfit text-body-xs text-danger">
                      {message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="lg">
                  <Rocket className="size-4" />
                  Try the Demo
                </Button>
              </Link>
              <Link href="/whitelist/stats">
                <Button variant="ghost" size="lg">
                  <BarChart3 className="size-4" />
                  View Whitelist Stats
                </Button>
              </Link>
            </div>

            {/* Trust Indicator */}
            <p className="font-outfit text-body-xs text-text-secondary">
              Your email stays private — we&apos;ll only use it to keep you
              updated on our progress.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-500/50 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="Subfy" className="h-5" />
          </Link>
          <p className="font-outfit text-body-xs text-text-secondary">
            &copy; {new Date().getFullYear()} Subfy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
