"use client";

import { useState } from "react";
import {
  PageHeader,
  Separator,
  SearchInput,
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
import { Plus, SlidersHorizontal } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Mock data
 * ──────────────────────────────────────────────────────── */

interface Plan {
  id: string;
  name: string;
  price: string;
  billing: string;
  subscribers: number;
  status: "active" | "expired";
  created: string;
}

const mockPlans: Plan[] = Array.from({ length: 36 }, (_, i) => ({
  id: `plan-${i + 1}`,
  name: "Plan",
  price: "$9.99",
  billing: "Monthly",
  subscribers: 43,
  status: i % 3 === 2 ? "expired" : "active",
  created: "02.04.25",
}));

const PAGE_SIZE = 9;

/* ──────────────────────────────────────────────────────────
 * PlanSettingsModal
 * ──────────────────────────────────────────────────────── */

function PlanSettingsModal({ plan }: { plan: Plan }) {
  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          className="flex items-center justify-center rounded-sm p-2 text-text-secondary transition-colors duration-150 hover:bg-dark-500/50 hover:text-text-primary"
          aria-label={`Settings for ${plan.name}`}
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Plan Settings</ModalTitle>
          <ModalDescription>
            Edit the details of your plan or manage its status.
          </ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Plan Name
            </label>
            <Input defaultValue={plan.name} placeholder="Plan name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[14px] font-semibold text-text-primary">
                Price
              </label>
              <Input defaultValue={plan.price} placeholder="$0.00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[14px] font-semibold text-text-primary">
                Billing Cycle
              </label>
              <Input defaultValue={plan.billing} placeholder="Monthly" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dark-500 bg-neutral-950 px-4 py-3">
            <div>
              <p className="font-inter text-[14px] font-semibold text-text-primary">
                Status
              </p>
              <p className="font-outfit text-[12px] text-text-secondary">
                {plan.status === "active"
                  ? "This plan is currently active."
                  : "This plan has expired."}
              </p>
            </div>
            <Badge variant={plan.status === "active" ? "active" : "expired"}>
              {plan.status === "active" ? "Active" : "Expired"}
            </Badge>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" size="sm">
            Delete Plan
          </Button>
          <Button variant="primary" size="sm">
            Save Changes
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
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const filtered = mockPlans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-7">
      {/* Page title */}
      <PageHeader
        title="Plans"
        subtitle="Manage the subscriptions you offer."
      />

      <Separator />

      {/* Toolbar: search + create */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          placeholder="Search"
          containerClassName="w-full max-w-[361px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
        <Button variant="primary">
          <Plus className="size-5" />
          Create Plan
        </Button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-500 bg-neutral-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.price}</TableCell>
                <TableCell className="opacity-75">{plan.billing}</TableCell>
                <TableCell>{plan.subscribers}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "active" : "expired"}
                  >
                    {plan.status === "active" ? "Active" : "Expired"}
                  </Badge>
                </TableCell>
                <TableCell className="opacity-75">{plan.created}</TableCell>
                <TableCell>
                  <PlanSettingsModal plan={plan} />
                </TableCell>
              </TableRow>
            ))}
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
