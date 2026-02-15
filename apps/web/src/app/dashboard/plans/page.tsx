"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Separator,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Input,
} from "@subfy/ui";
import { Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { useProjects } from "@/lib/projects/context";
import {
  createPlan,
  listPlans,
  setPlanStatus,
  type ContractPlan,
} from "@/lib/api/projects";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/components/toast-provider";
import { toDisplayError } from "@/lib/errors";

const PAGE_SIZE = 9;
const LEDGERS_PER_DAY = 17_280;
const LEDGERS_PER_MINUTE = 12;
const DAYS_PER_MONTH = 30;

function formatPeriodFromLedgers(ledgers: number): string {
  if (!Number.isFinite(ledgers) || ledgers <= 0) return "-";
  const totalMinutes = Math.floor(ledgers / LEDGERS_PER_MINUTE);
  const remainingLedgers = ledgers % LEDGERS_PER_MINUTE;
  const totalDays = Math.floor(totalMinutes / (24 * 60));
  const minutes = totalMinutes % (24 * 60);
  const remainingMinutes = minutes % (24 * 60);
  const months = Math.floor(totalDays / DAYS_PER_MONTH);
  const days = totalDays % DAYS_PER_MONTH;
  const parts: string[] = [];

  if (months > 0) {
    parts.push(`${months} month${months > 1 ? "s" : ""}`);
  }
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`);
  }
  if (parts.length === 0) {
    parts.push(`${remainingLedgers} ledger${remainingLedgers > 1 ? "s" : ""}`);
  }

  return parts.join(" ");
}

/* ──────────────────────────────────────────────────────────
 * PlanSettingsModal
 * ──────────────────────────────────────────────────────── */

function PlanSettingsModal({
  plan,
  projectId,
  onUpdated,
}: {
  plan: ContractPlan;
  projectId: string;
  onUpdated: () => Promise<void>;
}) {
  const { token } = useWallet();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onToggleStatus() {
    if (!token) return;
    setLoading(true);
    try {
      await setPlanStatus(token, projectId, plan.id, !plan.active);
      await onUpdated();
      showToast({
        title: "Plan updated",
        description: `Plan #${plan.id} is now ${plan.active ? "inactive" : "active"}.`,
        variant: "success",
      });
    } catch (err) {
      showToast({
        title: "Plan update failed",
        description: toDisplayError(err, "Unable to update plan status."),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          className="flex items-center justify-center rounded-sm p-2 text-text-secondary transition-colors duration-150 hover:bg-dark-500/50 hover:text-text-primary"
          aria-label={`Settings for plan ${plan.id}`}
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Plan #{plan.id}</ModalTitle>
          <ModalDescription>
            Manage the on-chain status of this plan.
          </ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Plan ID
            </label>
            <Input value={String(plan.id)} disabled />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dark-500 bg-neutral-950 px-4 py-3">
            <div>
              <p className="font-inter text-[14px] font-semibold text-text-primary">
                Status
              </p>
              <p className="font-outfit text-[12px] text-text-secondary">
                {plan.active
                  ? "This plan is currently active."
                  : "This plan is currently inactive."}
              </p>
            </div>
            <Badge variant={plan.active ? "active" : "expired"}>
              {plan.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <ModalFooter>
          <Button variant="primary" size="sm" onClick={onToggleStatus} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </>
            ) : plan.active ? (
              "Disable plan"
            ) : (
              "Enable plan"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────
 * Plans Page
 * ──────────────────────────────────────────────────────── */

export default function PlansPage() {
  const { token } = useWallet();
  const { showToast } = useToast();
  const { selectedProject } = useProjects();
  const [currentPage, setCurrentPage] = useState(1);
  const [plans, setPlans] = useState<ContractPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [planId, setPlanId] = useState("");
  const [planName, setPlanName] = useState("");
  const [periodMonths, setPeriodMonths] = useState("0");
  const [periodDays, setPeriodDays] = useState("0");
  const [periodMinutes, setPeriodMinutes] = useState("0");
  const [priceStroops, setPriceStroops] = useState("");

  const loadPlans = useCallback(async () => {
    if (!token || !selectedProject?.id || !selectedProject.subscriptionContractId) {
      setPlans([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await listPlans(token, selectedProject.id, 0, 50);
      setPlans(items);
    } catch (err) {
      const displayError = toDisplayError(err, "Failed to load plans");
      setError(displayError);
      showToast({
        title: "Unable to load plans",
        description: displayError,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id, selectedProject?.subscriptionContractId, showToast, token]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const totalPages = Math.max(1, Math.ceil(plans.length / PAGE_SIZE));
  const paginated = useMemo(
    () =>
      plans.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
      ),
    [currentPage, plans],
  );

  async function onCreatePlan(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedProject?.id) return;
    const months = Number(periodMonths || "0");
    const days = Number(periodDays || "0");
    const minutes = Number(periodMinutes || "0");
    if (!planName.trim()) {
      const displayError = "Plan name is required";
      setError(displayError);
      showToast({
        title: "Invalid plan",
        description: displayError,
        variant: "error",
      });
      return;
    }
    if (
      !Number.isFinite(months) ||
      !Number.isFinite(days) ||
      !Number.isFinite(minutes) ||
      months < 0 ||
      days < 0 ||
      minutes < 0
    ) {
      const displayError = "Period must use positive values";
      setError(displayError);
      showToast({
        title: "Invalid period",
        description: displayError,
        variant: "error",
      });
      return;
    }
    const totalDays = months * DAYS_PER_MONTH + days;
    const computedPeriodLedgers =
      totalDays * LEDGERS_PER_DAY + minutes * LEDGERS_PER_MINUTE;
    if (computedPeriodLedgers <= 0) {
      const displayError = "Period must be greater than 0 minute";
      setError(displayError);
      showToast({
        title: "Invalid period",
        description: displayError,
        variant: "error",
      });
      return;
    }

    setCreateLoading(true);
    setError(null);
    try {
      await createPlan(token, selectedProject.id, {
        planId: Number(planId),
        name: planName.trim(),
        periodLedgers: computedPeriodLedgers,
        priceStroops,
      });
      setCreateOpen(false);
      setPlanId("");
      setPlanName("");
      setPeriodMonths("0");
      setPeriodDays("0");
      setPeriodMinutes("0");
      setPriceStroops("");
      await loadPlans();
      showToast({
        title: "Plan created",
        description: "The plan was added to the contract.",
        variant: "success",
      });
    } catch (err) {
      const displayError = toDisplayError(err, "Failed to create plan");
      setError(displayError);
      showToast({
        title: "Plan creation failed",
        description: displayError,
        variant: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Page title */}
      <PageHeader
        title="Plans"
        subtitle="Manage the plans available in the selected contract."
      />

      <Separator />

      {!selectedProject ? (
        <p className="text-sm text-text-secondary">Select a project first.</p>
      ) : !selectedProject.subscriptionContractId ? (
        <p className="text-sm text-text-secondary">
          This project has no deployed contract yet.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-text-secondary">
          {selectedProject ? `Project: ${selectedProject.name}` : "No project selected"}
        </div>
        <Modal open={createOpen} onOpenChange={setCreateOpen}>
          <ModalTrigger asChild>
            <Button
              variant="primary"
              disabled={!selectedProject?.subscriptionContractId}
            >
              <Plus className="size-5" />
              Create Plan
            </Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create plan</ModalTitle>
              <ModalDescription>
                Add a new on-chain plan to this project contract.
              </ModalDescription>
            </ModalHeader>
            <form className="flex flex-col gap-4" onSubmit={onCreatePlan}>
              <Input
                placeholder="Plan ID (e.g. 1)"
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                disabled={createLoading}
              />
              <Input
                placeholder="Plan name (e.g. Starter)"
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                disabled={createLoading}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  min={0}
                  placeholder="Months"
                  value={periodMonths}
                  onChange={(event) => setPeriodMonths(event.target.value)}
                  disabled={createLoading}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Days"
                  value={periodDays}
                  onChange={(event) => setPeriodDays(event.target.value)}
                  disabled={createLoading}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Minutes"
                  value={periodMinutes}
                  onChange={(event) => setPeriodMinutes(event.target.value)}
                  disabled={createLoading}
                />
              </div>
              <p className="text-xs text-text-secondary">
                Renewal every{" "}
                {Math.max(
                  0,
                  Number(periodMonths || "0") * DAYS_PER_MONTH + Number(periodDays || "0"),
                )}{" "}
                day(s) and {Math.max(0, Number(periodMinutes || "0"))} minute(s) (
                {Math.max(
                  0,
                  Number(periodMonths || "0") * DAYS_PER_MONTH + Number(periodDays || "0"),
                ) *
                  LEDGERS_PER_DAY +
                  Math.max(0, Number(periodMinutes || "0")) * LEDGERS_PER_MINUTE}{" "}
                ledgers)
              </p>
              <Input
                placeholder="Price in stroops (e.g. 10000000)"
                value={priceStroops}
                onChange={(event) => setPriceStroops(event.target.value)}
                disabled={createLoading}
              />
              <ModalFooter>
                <Button type="submit" variant="primary" disabled={createLoading}>
                  {createLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-500 bg-neutral-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price (stroops)</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading plans...</TableCell>
              </TableRow>
            ) : null}
            {paginated.map((plan) => (
              <TableRow key={`${plan.id}`}>
                <TableCell>{plan.id}</TableCell>
                <TableCell>{plan.name || "-"}</TableCell>
                <TableCell>{plan.priceStroops}</TableCell>
                <TableCell className="opacity-75">
                  {formatPeriodFromLedgers(plan.periodLedgers)}
                </TableCell>
                <TableCell>
                  <Badge variant={plan.active ? "active" : "expired"}>
                    {plan.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {selectedProject?.id ? (
                    <PlanSettingsModal
                      plan={plan}
                      projectId={selectedProject.id}
                      onUpdated={loadPlans}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!loading && paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No plans found.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t border-dark-500 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
