"use client";

import { useEffect, useState } from "react";
import { Button } from "@subfy/ui";
import { ArrowLeft, Users, Calendar, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface StatsData {
  total: number;
  entries: { id: string; createdAt: string }[];
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WhitelistStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/whitelist/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Unable to load whitelist stats. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-950">
      {/* Navbar */}
      <nav className="border-b border-dark-500/50 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="Subfy" className="h-7" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/whitelist">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back to</span> Whitelist
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12 lg:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4">
            <h1 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
              Whitelist <span className="text-gradient">Stats</span>
            </h1>
            <p className="font-outfit text-body-lg text-text-secondary">
              Real-time overview of the Subfy whitelist. See how many people are
              excited about the future of on-chain payments.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-main-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-danger-border bg-danger-bg px-5 py-4">
              <AlertCircle className="size-5 shrink-0 text-danger" />
              <p className="font-outfit text-body-sm text-danger">{error}</p>
            </div>
          )}

          {stats && (
            <div className="flex flex-col gap-8">
              {/* Total Count Card */}
              <div className="flex items-center gap-5 rounded-2xl border border-main-500/20 bg-gradient-to-br from-main-500/10 via-neutral-900 to-neutral-900 p-8">
                <div className="flex size-16 items-center justify-center rounded-xl border border-main-500/30 bg-main-500/10">
                  <Users className="size-8 text-main-400" />
                </div>
                <div>
                  <p className="font-sora text-display-2 font-bold text-text-primary lg:text-display-1">
                    {stats.total}
                  </p>
                  <p className="font-outfit text-body-base text-text-secondary">
                    {stats.total === 1 ? "person has" : "people have"} joined
                    the whitelist
                  </p>
                </div>
              </div>

              {/* Entries List */}
              {stats.entries.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-dark-500 bg-neutral-900">
                  {/* Table Header */}
                  <div className="grid grid-cols-[60px_1fr] gap-4 border-b border-dark-500 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-inter text-body-xs font-semibold uppercase tracking-wider text-text-secondary">
                        #
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-text-secondary" />
                      <span className="font-inter text-body-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Activity
                      </span>
                    </div>
                  </div>

                  {/* Entries */}
                  {stats.entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[60px_1fr] gap-4 border-b border-dark-500/50 px-6 py-4 transition-colors duration-150 last:border-b-0 hover:bg-dark-500/10"
                    >
                      <span className="font-inter text-body-sm font-medium text-text-secondary">
                        {index + 1}
                      </span>
                      <span className="font-outfit text-body-sm text-text-secondary">
                        A user joined on {formatDate(entry.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {stats.entries.length === 0 && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dark-500 bg-neutral-900 py-16">
                  <Users className="size-12 text-text-secondary/30" />
                  <p className="font-outfit text-body-base text-text-secondary">
                    No one has joined the whitelist yet. Be the first!
                  </p>
                  <Link href="/whitelist">
                    <Button variant="primary" size="sm">
                      Join Whitelist
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
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
