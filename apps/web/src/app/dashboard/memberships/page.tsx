"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  Separator,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@subfy/ui";
import { useProjects } from "@/lib/projects/context";
import { useWallet } from "@/lib/wallet";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import {
  listSubscriptions,
  renewDueSubscriptions,
  type ContractSubscription,
} from "@/lib/api/projects";
import { useToast } from "@/components/toast-provider";
import { toDisplayError } from "@/lib/errors";
import {
  fetchLatestLedgerSequence,
  formatLedgerEstimate,
} from "@/lib/ledger-display";

export default function MembershipsPage() {
  const { token } = useWallet();
  const { showToast } = useToast();
  const { selectedProject } = useProjects();
  const [items, setItems] = useState<ContractSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [latestLedger, setLatestLedger] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);

  function formatSubscriberAddress(address: string): string {
    if (!address || address.length <= 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  useEffect(() => {
    if (!selectedProject?.id) {
      setShareLink("");
      return;
    }
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/subscribe/${selectedProject.id}`;
    setShareLink(url);
  }, [selectedProject?.id]);

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast({
        title: "Subscription link copied",
        description: "Share it with your users.",
        variant: "success",
      });
    } catch {
      showToast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "error",
      });
    }
  }

  useEffect(() => {
    async function run() {
      if (!token || !selectedProject?.id || !selectedProject.subscriptionContractId) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await listSubscriptions(token, selectedProject.id, 0, 500);
        setItems(data);
      } catch (err) {
        const displayError = toDisplayError(err, "Failed to load memberships");
        setError(displayError);
        showToast({
          title: "Unable to load memberships",
          description: displayError,
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [token, selectedProject?.id, selectedProject?.subscriptionContractId, showToast]);

  useEffect(() => {
    async function loadLatestLedger() {
      if (!selectedProject) {
        setLatestLedger(null);
        return;
      }
      const value = await fetchLatestLedgerSequence(selectedProject.network);
      setLatestLedger(value);
    }
    void loadLatestLedger();
  }, [selectedProject?.id, selectedProject?.network]);

  async function onRenewAllDue() {
    if (!token || !selectedProject?.id) return;
    setRenewing(true);
    try {
      const result = await renewDueSubscriptions(token, selectedProject.id);
      showToast({
        title: "Renew run completed",
        description:
          `Renewed ${result.renewed} of ${result.scanned} subscriptions` +
          (result.skippedAllowance
            ? `, skipped allowance: ${result.skippedAllowance}`
            : "") +
          (result.failed ? `, failed: ${result.failed}` : "") +
          ".",
        variant: "success",
      });
      const data = await listSubscriptions(token, selectedProject.id, 0, 500);
      setItems(data);
      const value = await fetchLatestLedgerSequence(selectedProject.network);
      setLatestLedger(value);
    } catch (err) {
      showToast({
        title: "Renew run failed",
        description: toDisplayError(err, "Unable to renew due subscriptions"),
        variant: "error",
      });
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Memberships"
        subtitle="Subscriptions currently stored by the selected contract."
      />
      <Separator />

      {!selectedProject ? (
        <p className="text-sm text-text-secondary">Select a project first.</p>
      ) : !selectedProject.subscriptionContractId ? (
        <p className="text-sm text-text-secondary">
          This project has no deployed contract yet.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {selectedProject ? (
        <div className="rounded-2xl border border-dark-500 bg-neutral-900 p-4">
          <p className="mb-2 font-inter text-sm font-semibold text-text-primary">
            Public subscription link
          </p>
          <p className="mb-3 font-outfit text-xs text-text-secondary">
            Users can open this link, connect their wallet, subscribe or cancel.
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input value={shareLink} readOnly className="md:flex-1" />
            <Button
              type="button"
              variant="primary"
              onClick={onRenewAllDue}
              disabled={renewing || !selectedProject.subscriptionContractId}
            >
              {renewing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Renew all due
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="size-4" />
              Copy link
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-dark-500 bg-neutral-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscriber</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Next Renewal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading subscriptions...</TableCell>
              </TableRow>
            ) : null}
            {items.map((item) => (
              <TableRow key={`${item.subscriber}-${item.planId}`}>
                <TableCell title={item.subscriber}>
                  {formatSubscriberAddress(item.subscriber)}
                </TableCell>
                <TableCell>{item.planId}</TableCell>
                <TableCell title={`Ledger #${item.startedLedger}`}>
                  {formatLedgerEstimate(item.startedLedger, latestLedger)}
                </TableCell>
                <TableCell title={`Ledger #${item.nextRenewalLedger}`}>
                  {formatLedgerEstimate(item.nextRenewalLedger, latestLedger)}
                </TableCell>
                <TableCell>
                  <Badge variant={item.active ? "active" : "expired"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No subscriptions found.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
