"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  DashboardLayout,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@subfy/ui";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { ProjectProvider, useProjects } from "@/lib/projects/context";
import { useToast } from "@/components/toast-provider";
import { toDisplayError } from "@/lib/errors";

function CreateProjectModal({
  open,
  forceOpen,
  onOpenChange,
}: {
  open: boolean;
  forceOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publicKey } = useWallet();
  const { creatingProject, createError, createAndDeployProject } = useProjects();
  const [name, setName] = useState("");
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState<"USDC" | "EURC">("USDC");
  const [network, setNetwork] = useState<"testnet" | "public">("testnet");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!publicKey) return;
    if (treasuryAddress.trim().length > 0) return;
    setTreasuryAddress(publicKey);
  }, [open, publicKey, treasuryAddress]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setLocalError("Project name is required");
      return;
    }
    if (!treasuryAddress.trim()) {
      setLocalError("Treasury address is required");
      return;
    }
    setLocalError(null);
    try {
      await createAndDeployProject({
        name: name.trim(),
        treasuryAddress: treasuryAddress.trim(),
        paymentCurrency,
        network,
      });
      setName("");
      setTreasuryAddress("");
      if (!forceOpen) onOpenChange(false);
    } catch {
      // Error already exposed by context
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (forceOpen && !next) return;
        onOpenChange(next);
      }}
    >
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create your project</ModalTitle>
          <ModalDescription>
            We will create the project, request your wallet signature, then deploy the
            contract automatically.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Project name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My SaaS project"
              disabled={creatingProject}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Treasury address
            </label>
            <Input
              value={treasuryAddress}
              onChange={(event) => setTreasuryAddress(event.target.value)}
              placeholder="G..."
              disabled={creatingProject}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Payment currency
            </label>
            <div className="relative">
              <select
                value={paymentCurrency}
                onChange={(event) =>
                  setPaymentCurrency(event.target.value as "USDC" | "EURC")
                }
                disabled={creatingProject}
                className="h-12 w-full appearance-none rounded-lg border border-dark-500 bg-neutral-900 pl-4 pr-10 font-outfit text-[16px] text-text-primary outline-none transition-colors focus:border-main-500"
              >
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[14px] font-semibold text-text-primary">
              Network
            </label>
            <div className="relative">
              <select
                value={network}
                onChange={(event) =>
                  setNetwork(event.target.value as "testnet" | "public")
                }
                disabled={creatingProject}
                className="h-12 w-full appearance-none rounded-lg border border-dark-500 bg-neutral-900 pl-4 pr-10 font-outfit text-[16px] text-text-primary outline-none transition-colors focus:border-main-500"
              >
                <option value="testnet">Testnet</option>
                <option value="public">Public</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          {publicKey && treasuryAddress.trim() !== publicKey ? (
            <p className="text-xs text-text-secondary">
              Default treasury: {publicKey}.{" "}
              <button
                type="button"
                className="text-main-400 hover:text-main-500"
                onClick={() => setTreasuryAddress(publicKey)}
                disabled={creatingProject}
              >
                Use my wallet address
              </button>
            </p>
          ) : null}

          {(localError || createError) && (
            <p className="text-sm text-red-300">{localError ?? createError}</p>
          )}

          <ModalFooter>
            {!forceOpen && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={creatingProject}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={creatingProject}>
              {creatingProject ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing & deploying...
                </>
              ) : (
                "Create and deploy"
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

function SidebarProjectSelector({
  onCreate,
}: {
  onCreate: () => void;
}) {
  const { projects, selectedProjectId, setSelectedProjectId, loadingProjects } =
    useProjects();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <select
          value={selectedProjectId ?? ""}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-dark-500 bg-neutral-900 pl-3 pr-10 font-outfit text-[14px] text-text-primary outline-none transition-colors focus:border-main-500"
          disabled={loadingProjects || projects.length === 0}
        >
          {projects.length === 0 ? (
            <option value="">
              {loadingProjects ? "Loading projects..." : "No project yet"}
            </option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
      </div>

      <Button variant="outline" size="sm" onClick={onCreate}>
        <Plus className="size-4" />
        Create project
      </Button>
    </div>
  );
}

/* ── Inner layout that consumes the wallet context ── */

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, token } = useWallet();
  const { mustCreateProject, createError } = useProjects();
  const { showToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  /* Redirect to /login if not authenticated */
  useEffect(() => {
    // Wait a tick so the provider has time to restore from localStorage
    const timer = setTimeout(() => {
      const storedToken = localStorage.getItem("subfy_token");
      if (!storedToken) {
        router.replace("/login");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [token, router]);

  useEffect(() => {
    if (!createError) return;
    showToast({
      title: "Project creation failed",
      description: toDisplayError(createError, "Unable to create project."),
      variant: "error",
    });
  }, [createError, showToast]);

  /* Show a loader while checking auth */
  if (!publicKey && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="size-8 animate-spin text-main-400" />
      </div>
    );
  }

  const modalOpen = mustCreateProject || createModalOpen;
  const shouldBlurContent = modalOpen;

  return (
    <>
      <DashboardLayout
        activeHref={pathname}
        onNavigate={(href) => router.push(href)}
        userSlot={<ConnectWalletButton />}
        sidebarProps={{
          projectSlot: <SidebarProjectSelector onCreate={() => setCreateModalOpen(true)} />,
        }}
      >
        <div className={shouldBlurContent ? "pointer-events-none blur-sm" : undefined}>
          {children}
        </div>
      </DashboardLayout>

      <CreateProjectModal
        open={modalOpen}
        forceOpen={mustCreateProject}
        onOpenChange={setCreateModalOpen}
      />
    </>
  );
}

/* ── Root dashboard layout with provider ──────────── */

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <ProjectProvider>
        <DashboardInner>{children}</DashboardInner>
      </ProjectProvider>
    </WalletProvider>
  );
}
