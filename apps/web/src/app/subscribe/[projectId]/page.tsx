"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as StellarSdk from "@stellar/stellar-sdk";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  Input,
  Separator,
} from "@subfy/ui";
import { Info, Loader2 } from "lucide-react";
import {
  getCheckoutContext,
  prepareCheckoutIncreaseAllowanceCycles,
  prepareCheckoutCancel,
  prepareCheckoutSubscribe,
  submitCheckoutSignedXdr,
  type CheckoutContext,
} from "@/lib/api/projects";
import { getKit, useWallet, WalletProvider } from "@/lib/wallet";
import { toDisplayError } from "@/lib/errors";
import { useToast } from "@/components/toast-provider";
import { WalletConnectPanel } from "@/components/wallet-connect-panel";
import {
  fetchLatestLedgerSequence,
  formatLedgerEstimate,
} from "@/lib/ledger-display";

const CIRCLE_ISSUERS = {
  testnet: {
    USDC: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    EURC: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
  },
  public: {
    USDC: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    EURC: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
  },
} as const;

type SubscriptionPrecheck = {
  loading: boolean;
  hasTrustline: boolean;
  balanceStroops: bigint;
  trustlineMessage: string | null;
  balanceMessage: string | null;
  message: string | null;
};
const ZERO_BIGINT = BigInt(0);
const STROOPS_FACTOR = BigInt(10_000_000);

function CheckoutContent() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const { showToast } = useToast();
  const { publicKey, connecting, wallets, loadingWallets, connect } = useWallet();
  const [data, setData] = useState<CheckoutContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [increaseCyclesOpen, setIncreaseCyclesOpen] = useState(false);
  const [postSubscribeInfoOpen, setPostSubscribeInfoOpen] = useState(false);
  const [cyclesInfoOpen, setCyclesInfoOpen] = useState(false);
  const [additionalCycles, setAdditionalCycles] = useState("12");
  const [error, setError] = useState<string | null>(null);
  const [latestLedger, setLatestLedger] = useState<number | null>(null);
  const [allowanceExpirationLedger, setAllowanceExpirationLedger] = useState<number | null>(
    null,
  );
  const [precheck, setPrecheck] = useState<SubscriptionPrecheck>({
    loading: false,
    hasTrustline: false,
    balanceStroops: ZERO_BIGINT,
    trustlineMessage: null,
    balanceMessage: null,
    message: null,
  });

  const activePlans = useMemo(
    () => (data?.plans ?? []).filter((plan) => plan.active),
    [data?.plans],
  );
  const hasActiveSubscription = Boolean(data?.subscription?.active);
  const activeSubscription = hasActiveSubscription ? data?.subscription ?? null : null;
  const allowanceExpirationStorageKey =
    projectId && publicKey
      ? `subfy_allowance_expiration_${projectId}_${publicKey}`
      : null;

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCheckoutContext(projectId, publicKey ?? undefined);
      setData(result);
    } catch (err) {
      setError(toDisplayError(err, "Unable to load subscription checkout"));
    } finally {
      setLoading(false);
    }
  }, [projectId, publicKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    async function loadLatestLedger() {
      if (!data?.project.network) {
        setLatestLedger(null);
        return;
      }
      const value = await fetchLatestLedgerSequence(data.project.network);
      setLatestLedger(value);
    }
    void loadLatestLedger();
  }, [data?.project.network]);

  useEffect(() => {
    if (!allowanceExpirationStorageKey) {
      setAllowanceExpirationLedger(null);
      return;
    }
    const raw = localStorage.getItem(allowanceExpirationStorageKey);
    if (!raw) {
      setAllowanceExpirationLedger(null);
      return;
    }
    const value = Number(raw);
    setAllowanceExpirationLedger(Number.isFinite(value) ? value : null);
  }, [allowanceExpirationStorageKey]);

  useEffect(() => {
    async function runPrecheck() {
      if (!publicKey || !data?.project) {
        setPrecheck({
          loading: false,
          hasTrustline: false,
          balanceStroops: ZERO_BIGINT,
          trustlineMessage: null,
          balanceMessage: null,
          message: null,
        });
        return;
      }

      const network = data.project.network === "public" ? "public" : "testnet";
      const currency = data.project.paymentCurrency;
      const issuer = CIRCLE_ISSUERS[network][currency];
      const horizon =
        network === "public"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org";

      setPrecheck((prev) => ({ ...prev, loading: true, message: null }));
      try {
        const res = await fetch(`${horizon}/accounts/${publicKey}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setPrecheck({
            loading: false,
            hasTrustline: false,
            balanceStroops: ZERO_BIGINT,
            trustlineMessage: "Account not found on this network. Fund your wallet with XLM first.",
            balanceMessage: null,
            message:
              "Account not found on this network. Fund your wallet with XLM first.",
          });
          return;
        }

        const account = (await res.json()) as {
          balances?: Array<{
            asset_type?: string;
            asset_code?: string;
            asset_issuer?: string;
            balance?: string;
          }>;
        };
        const trustline = (account.balances ?? []).find(
          (b) =>
            b.asset_type !== "native" &&
            b.asset_code === currency &&
            b.asset_issuer === issuer,
        );

        if (!trustline?.balance) {
          setPrecheck({
            loading: false,
            hasTrustline: false,
            balanceStroops: ZERO_BIGINT,
            trustlineMessage: `You do not have a ${currency} trustline on ${network}.`,
            balanceMessage: null,
            message: `You do not have a ${currency} trustline on ${network}.`,
          });
          return;
        }

        const [whole = "0", frac = ""] = trustline.balance.split(".");
        const stroops =
          BigInt(whole) * STROOPS_FACTOR +
          BigInt((frac + "0000000").slice(0, 7));
        setPrecheck({
          loading: false,
          hasTrustline: true,
          balanceStroops: stroops,
          trustlineMessage: null,
          balanceMessage: null,
          message: null,
        });
      } catch {
        setPrecheck({
          loading: false,
          hasTrustline: false,
          balanceStroops: ZERO_BIGINT,
          trustlineMessage: "Unable to verify trustline/balance right now.",
          balanceMessage: null,
          message: "Unable to verify trustline/balance right now.",
        });
      }
    }

    void runPrecheck();
  }, [publicKey, data?.project]);

  async function handleConnect(wallet: ISupportedWallet) {
    try {
      await connect(wallet.id);
    } catch (err) {
      showToast({
        title: "Wallet connection failed",
        description: toDisplayError(err, "Unable to connect wallet"),
        variant: "error",
      });
    }
  }

  async function subscribe(planId: number) {
    if (!projectId || !publicKey) return;
    const selectedPlan = activePlans.find((plan) => plan.id === planId);
    if (!selectedPlan) return;
    if (!precheck.hasTrustline) {
      showToast({
        title: "Missing trustline",
        description:
          precheck.message ??
          `Add the ${data?.project.paymentCurrency ?? "USDC"} trustline before subscribing.`,
        variant: "error",
      });
      return;
    }
    if (precheck.balanceStroops < BigInt(selectedPlan.priceStroops)) {
      showToast({
        title: "Insufficient balance",
        description: `Your ${data?.project.paymentCurrency ?? "USDC"} balance is too low for this plan.`,
        variant: "error",
      });
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareCheckoutSubscribe(projectId, {
        subscriber: publicKey,
        planId,
      });
      const { signedTxXdr } = await getKit().signTransaction(prepared.unsignedXdr, {
        address: publicKey,
        networkPassphrase: prepared.networkPassphrase,
      });
      await submitCheckoutSignedXdr(signedTxXdr);
      showToast({
        title: "Subscription created",
        description: "Your wallet successfully subscribed.",
        variant: "success",
      });
      try {
        await load();
        setPostSubscribeInfoOpen(true);
      } catch {
        showToast({
          title: "Subscription created",
          description: "Refresh failed, reload the page to update your state.",
          variant: "error",
        });
      }
    } catch (err) {
      showToast({
        title: "Subscription failed",
        description: toDisplayError(err, "Unable to create subscription"),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function addTrustline() {
    if (!publicKey || !data?.project) return;
    const network = data.project.network === "public" ? "public" : "testnet";
    const currency = data.project.paymentCurrency;
    const issuer = CIRCLE_ISSUERS[network][currency];
    const networkPassphrase =
      network === "public"
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET;
    const horizonUrl =
      network === "public"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org";

    setBusy(true);
    try {
      const server = new StellarSdk.Horizon.Server(horizonUrl);
      const account = await server.loadAccount(publicKey);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: new StellarSdk.Asset(currency, issuer),
          }),
        )
        .setTimeout(120)
        .build();

      const { signedTxXdr } = await getKit().signTransaction(tx.toXDR(), {
        address: publicKey,
        networkPassphrase,
      });
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        networkPassphrase,
      ) as StellarSdk.Transaction;
      await server.submitTransaction(signedTx);

      showToast({
        title: "Trustline added",
        description: `${currency} trustline was added successfully.`,
        variant: "success",
      });
      await load();
    } catch (err) {
      showToast({
        title: "Add trustline failed",
        description: toDisplayError(err, "Unable to add trustline"),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancelSubscription() {
    if (!projectId || !publicKey) return;
    setBusy(true);
    try {
      const prepared = await prepareCheckoutCancel(projectId, {
        subscriber: publicKey,
      });
      const { signedTxXdr } = await getKit().signTransaction(prepared.unsignedXdr, {
        address: publicKey,
        networkPassphrase: prepared.networkPassphrase,
      });
      await submitCheckoutSignedXdr(signedTxXdr);
      showToast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled.",
        variant: "success",
      });
      try {
        await load();
      } catch {
        showToast({
          title: "Subscription cancelled",
          description: "Refresh failed, reload the page to update your state.",
          variant: "error",
        });
      }
    } catch (err) {
      showToast({
        title: "Cancel failed",
        description: toDisplayError(err, "Unable to cancel subscription"),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onIncreaseCycles() {
    if (!projectId || !publicKey || !activeSubscription) return;
    const cycles = Number(additionalCycles);
    if (!Number.isFinite(cycles) || cycles <= 0) {
      showToast({
        title: "Invalid cycles",
        description: "Additional cycles must be greater than 0.",
        variant: "error",
      });
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareCheckoutIncreaseAllowanceCycles(projectId, {
        subscriber: publicKey,
        planId: activeSubscription.planId,
        additionalCycles: Math.floor(cycles),
      });
      const { signedTxXdr } = await getKit().signTransaction(prepared.unsignedXdr, {
        address: publicKey,
        networkPassphrase: prepared.networkPassphrase,
      });
      await submitCheckoutSignedXdr(signedTxXdr);
      showToast({
        title: "Cycles increased",
        description: `Added ${Math.floor(cycles)} cycles to your auto-renew allowance.`,
        variant: "success",
      });
      setAllowanceExpirationLedger(prepared.expirationLedger);
      if (allowanceExpirationStorageKey) {
        localStorage.setItem(
          allowanceExpirationStorageKey,
          String(prepared.expirationLedger),
        );
      }
      setIncreaseCyclesOpen(false);
      await load();
    } catch (err) {
      showToast({
        title: "Increase failed",
        description: toDisplayError(err, "Unable to increase allowance cycles"),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-sora text-3xl text-text-primary">Subscription checkout</h1>
        <p className="font-outfit text-text-secondary">
          Connect your wallet to manage your subscription.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 className="size-4 animate-spin" />
          Loading checkout...
        </div>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-300">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <Card>
          <CardHeader>
            <CardTitle>{data.project.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text-secondary">
            <p>
              Network: <span className="text-text-primary">{data.project.network}</span>
            </p>
            <p>
              Currency:{" "}
              <span className="text-text-primary">{data.project.paymentCurrency}</span>
            </p>
            <p>
              Remaining cycles:{" "}
              <span className="relative inline-flex items-center gap-1">
                <span className="text-text-primary">
                  {data.remainingCycles ?? "-"}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
                  aria-label="What is a cycle?"
                  onMouseEnter={() => setCyclesInfoOpen(true)}
                  onMouseLeave={() => setCyclesInfoOpen(false)}
                  onClick={() => setCyclesInfoOpen((prev) => !prev)}
                >
                  <Info className="size-3.5" />
                </button>
                {cyclesInfoOpen ? (
                  <span
                    className="absolute left-0 top-6 z-20 w-64 rounded-md border border-dark-500 bg-neutral-900 p-2 text-xs text-text-secondary shadow-xl"
                    onMouseEnter={() => setCyclesInfoOpen(true)}
                    onMouseLeave={() => setCyclesInfoOpen(false)}
                  >
                    A cycle equals one future automatic renewal payment for your current
                    plan.
                  </span>
                ) : null}
              </span>
            </p>
            <p>
              Allowance expiration:{" "}
              <span className="text-text-primary">
                {allowanceExpirationLedger
                  ? formatLedgerEstimate(allowanceExpirationLedger, latestLedger)
                  : "-"}
              </span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!publicKey ? (
        <div className="flex w-full justify-center">
          <WalletConnectPanel
            wallets={wallets}
            loadingWallets={loadingWallets}
            connecting={connecting}
            title="Connect your Wallet"
            description="Sign in with your Stellar wallet to subscribe or manage your subscription."
            onConnect={handleConnect}
          />
        </div>
      ) : null}

      {publicKey && data ? (
        <>
          <Separator />
          {!hasActiveSubscription ? (
            <Card>
              <CardHeader>
                <CardTitle>Select a plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.subscription && !data.subscription.active ? (
                  <p className="text-sm text-amber-300">
                    Your previous subscription is cancelled. You can subscribe again to
                    this plan or choose another one.
                  </p>
                ) : null}
                {precheck.loading ? (
                  <p className="text-sm text-text-secondary">
                    Checking trustline and balance...
                  </p>
                ) : null}
                {!precheck.loading && !precheck.hasTrustline ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-sm text-amber-300">
                      {precheck.trustlineMessage ??
                        `You do not have a ${data.project.paymentCurrency} trustline.`}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit"
                      disabled={busy}
                      onClick={addTrustline}
                    >
                      {busy ? "Processing..." : `Add ${data.project.paymentCurrency} trustline`}
                    </Button>
                  </div>
                ) : null}
                {activePlans.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No active plans available for this project.
                  </p>
                ) : (
                  activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-xl border border-dark-500 bg-neutral-900 p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-inter text-sm font-semibold text-text-primary">
                          {plan.name || `Plan #${plan.id}`}
                        </p>
                        <p className="font-outfit text-xs text-text-secondary">
                          Price: {(Number(plan.priceStroops) / 10_000_000).toFixed(2)}{" "}
                          {data.project.paymentCurrency}
                        </p>
                        {!precheck.loading &&
                        precheck.hasTrustline &&
                        precheck.balanceStroops < BigInt(plan.priceStroops) ? (
                          <p className="font-outfit text-xs text-amber-300">
                            Insufficient {data.project.paymentCurrency} balance for this plan.
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={
                          busy ||
                          precheck.loading ||
                          !precheck.hasTrustline ||
                          precheck.balanceStroops < BigInt(plan.priceStroops)
                        }
                        onClick={() => subscribe(plan.id)}
                      >
                        {busy ? "Processing..." : "Subscribe"}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Plan #{activeSubscription?.planId}
                  </p>
                  <Badge variant={activeSubscription?.active ? "active" : "expired"}>
                    {activeSubscription?.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  Started:{" "}
                  <span title={`Ledger #${activeSubscription?.startedLedger ?? "-"}`}>
                    {formatLedgerEstimate(activeSubscription?.startedLedger ?? 0, latestLedger)}
                  </span>
                </p>
                <p className="text-sm text-text-secondary">
                  Next renewal:{" "}
                  <span title={`Ledger #${activeSubscription?.nextRenewalLedger ?? "-"}`}>
                    {formatLedgerEstimate(
                      activeSubscription?.nextRenewalLedger ?? 0,
                      latestLedger,
                    )}
                  </span>
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !activeSubscription?.active}
                    onClick={cancelSubscription}
                  >
                    {busy ? "Processing..." : "Cancel subscription"}
                  </Button>
                  <Modal open={increaseCyclesOpen} onOpenChange={setIncreaseCyclesOpen}>
                    <ModalTrigger asChild>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={busy}
                      >
                        Increase cycles
                      </Button>
                    </ModalTrigger>
                    <ModalContent>
                      <ModalHeader>
                        <ModalTitle>Increase auto-renew cycles</ModalTitle>
                        <ModalDescription>
                          You are signing an on-chain token approval that increases how
                          many future renewals this project can charge automatically.
                          This action does not charge you immediately.
                        </ModalDescription>
                      </ModalHeader>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min={1}
                          value={additionalCycles}
                          onChange={(event) => setAdditionalCycles(event.target.value)}
                          disabled={busy}
                          placeholder="Additional cycles"
                        />
                        <p className="text-xs text-text-secondary">
                          Current remaining cycles: {data.remainingCycles ?? "-"}
                        </p>
                      </div>
                      <ModalFooter>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={onIncreaseCycles}
                          disabled={busy}
                        >
                          {busy ? "Processing..." : "Sign and increase"}
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <Modal open={postSubscribeInfoOpen} onOpenChange={setPostSubscribeInfoOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Enable automatic renewals</ModalTitle>
            <ModalDescription>
              Your subscription is active. To let this project charge future renewals
              automatically, increase your cycles allowance. This will ask for a token
              approval signature, and does not charge immediately.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPostSubscribeInfoOpen(false)}
            >
              Later
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setPostSubscribeInfoOpen(false);
                setIncreaseCyclesOpen(true);
              }}
            >
              Increase cycles now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}

export default function SubscribePage() {
  return (
    <WalletProvider>
      <CheckoutContent />
    </WalletProvider>
  );
}
