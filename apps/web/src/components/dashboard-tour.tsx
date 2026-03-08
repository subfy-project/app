"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
} from "react";
import { useRouter } from "next/navigation";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { HelpCircle } from "lucide-react";
import { Button } from "@subfy/ui";

const TOUR_STORAGE_KEY = "subfy_dashboard_tour_done";

type StepWithId = Step & { id: string };

type TourContextValue = {
  advance: (nextStepId?: string) => void;
  router: ReturnType<typeof useRouter>;
};

const TourContext = createContext<TourContextValue | null>(null);

function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("NavigateStep must be used inside DashboardTourTrigger");
  return ctx;
}

function NavigateStep({ path, label, nextStepId }: { path: string; label: string; nextStepId: string }) {
  const { advance, router } = useTourContext();
  const handleGo = useCallback(() => {
    router.push(path);
    setTimeout(() => advance(nextStepId), 500);
  }, [path, nextStepId, advance, router]);

  return (
    <div className="flex flex-col gap-3">
      <p className="font-outfit text-[14px] leading-relaxed text-text-secondary">
        Click the button below to go to the <strong className="text-text-primary">{label}</strong> page and continue the tour.
      </p>
      <Button type="button" variant="primary" onClick={handleGo} className="w-fit">
        Go to {label}
      </Button>
    </div>
  );
}

/** Custom tooltip that disables the Next button for "Go to …" steps so the user must use the in-content button. */
function TooltipWithDisabledNext(props: {
  backProps: Record<string, unknown>;
  closeProps: Record<string, unknown>;
  primaryProps: Record<string, unknown>;
  skipProps: Record<string, unknown>;
  tooltipProps: Record<string, unknown>;
  continuous: boolean;
  index: number;
  isLastStep: boolean;
  size: number;
  step: StepWithId & { content?: React.ReactNode; title?: React.ReactNode; styles?: Record<string, React.CSSProperties>; hideBackButton?: boolean; hideCloseButton?: boolean; hideFooter?: boolean; showSkipButton?: boolean };
  setTooltipRef?: (el: HTMLElement | null) => void;
}) {
  const { backProps, closeProps, primaryProps, skipProps, tooltipProps, step, continuous, index, isLastStep, size } = props;
  const { content, title, hideBackButton, hideCloseButton, hideFooter, showSkipButton } = step;
  const styles = step.styles ?? joyrideStyles as Record<string, React.CSSProperties>;
  const isNavigateStep = step.id?.startsWith("go-");

  const disabledPrimaryProps = isNavigateStep
    ? {
        ...primaryProps,
        disabled: true as const,
        "aria-disabled": "true" as const,
        onClick: (e: React.MouseEvent) => e.preventDefault(),
        style: { ...(primaryProps.style as React.CSSProperties), opacity: 0.6, cursor: "not-allowed", pointerEvents: "none" as const },
      }
    : primaryProps;

  return (
    <div
      key="JoyrideTooltip"
      aria-label={typeof title === "string" ? title : "Tour step"}
      className="react-joyride__tooltip"
      style={styles.tooltip}
      {...(tooltipProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      <div style={styles.tooltipContainer}>
        {title && <h1 style={styles.tooltipTitle}>{title}</h1>}
        <div style={styles.tooltipContent}>{content}</div>
      </div>
      {!hideFooter && (
        <div style={styles.tooltipFooter}>
          <div style={styles.tooltipFooterSpacer}>
            {showSkipButton && !isLastStep && (
              <button type="button" data-test-id="button-skip" style={styles.buttonSkip} {...skipProps}>
                {props.step.locale?.skip ?? "Skip tour"}
              </button>
            )}
          </div>
          {!hideBackButton && index > 0 && (
            <button type="button" data-test-id="button-back" style={styles.buttonBack} {...backProps}>
              {props.step.locale?.back ?? "Back"}
            </button>
          )}
          <button type="button" data-test-id="button-primary" style={styles.buttonNext} {...disabledPrimaryProps}>
            {isLastStep ? (props.step.locale?.last ?? "Finish") : (props.step.locale?.next ?? "Next")}
          </button>
        </div>
      )}
      {!hideCloseButton && (
        <button
          type="button"
          data-test-id="button-close"
          aria-label="Close"
          style={styles.buttonClose}
          {...closeProps}
        >
          ×
        </button>
      )}
    </div>
  );
}

function buildSteps(): StepWithId[] {
  const navigateStepProps = {
    tooltipComponent: TooltipWithDisabledNext,
    hideCloseButton: true,
  };
  return [
    { id: "welcome", target: "body", content: "Welcome to the Subfy dashboard. This short tour will show you the main areas to manage your on-chain subscriptions.", title: "Welcome", disableBeacon: true },
    { id: "project", target: "[data-tour='tour-project-selector']", content: "Select your project here or create a new one. Each project has its own Soroban subscription contract and payment settings.", title: "Project" },
    { id: "nav", target: "body", content: "Use the sidebar to switch between Overview, Plans, Memberships, and Settings. On mobile, open the menu with the icon in the top bar.", title: "Navigation", placement: "center", disableBeacon: true },
    { id: "go-overview", target: "body", content: <NavigateStep path="/dashboard" label="Overview" nextStepId="stat-cards" />, title: "Go to Overview", placement: "center", disableBeacon: true, ...navigateStepProps },
    { id: "stat-cards", target: "[data-tour='tour-stat-cards']", content: "Key metrics at a glance: total subscribers, churn rate, monthly revenue. These help you track the health of your subscription business.", title: "Overview – Metrics" },
    { id: "plans-card", target: "[data-tour='tour-plans-card']", content: "Quick access to your plans and a shortcut to create new ones. Open the Plans page from the sidebar for full management.", title: "Overview – Plans" },
    { id: "memberships-card", target: "[data-tour='tour-memberships-card']", content: "View and manage active memberships. The Memberships page lets you copy your checkout link and trigger renewals.", title: "Overview – Memberships" },
    { id: "go-plans", target: "body", content: <NavigateStep path="/dashboard/plans" label="Plans" nextStepId="plans-create" />, title: "Go to Plans", placement: "center", disableBeacon: true, ...navigateStepProps },
    { id: "plans-create", target: "[data-tour='tour-plans-create']", content: "Create subscription plans with a name, billing period (in ledgers), and price. Each plan is stored on-chain in your contract.", title: "Plans – Create" },
    { id: "plans-table", target: "[data-tour='tour-plans-table']", content: "All plans for this project. Toggle a plan active/inactive with the settings icon. Subscribers can only join active plans.", title: "Plans – List" },
    { id: "go-memberships", target: "body", content: <NavigateStep path="/dashboard/memberships" label="Memberships" nextStepId="memberships-share" />, title: "Go to Memberships", placement: "center", disableBeacon: true, ...navigateStepProps },
    { id: "memberships-share", target: "[data-tour='tour-memberships-share']", content: "Your public subscription link: share it so users can connect their wallet and subscribe. Use \"Renew all due\" to process pending renewals on-chain.", title: "Memberships – Checkout link" },
    { id: "memberships-table", target: "[data-tour='tour-memberships-table']", content: "All subscriptions for this project. You see subscriber address, plan, start and next renewal ledger, and status.", title: "Memberships – Subscribers" },
    { id: "go-settings", target: "body", content: <NavigateStep path="/dashboard/settings" label="Settings" nextStepId="settings-project" />, title: "Go to Settings", placement: "center", disableBeacon: true, ...navigateStepProps },
    { id: "settings-project", target: "[data-tour='tour-settings-project']", content: "Rename your project and manage basic info. Changes here do not affect the on-chain contract.", title: "Settings – Project" },
    { id: "settings-contract", target: "[data-tour='tour-settings-contract']", content: "Contract details: network, subscription and payment token addresses, treasury. Use the links to open the contract on Stellar Expert.", title: "Settings – Contract" },
    { id: "wallet", target: "[data-tour='tour-navbar-wallet']", content: "Your connected Stellar wallet. Use it to sign transactions for deployment and plan management, and to disconnect when needed.", title: "Wallet" },
  ].map((step) => ({
    ...step,
    disableBeacon: true,
  }));
}

const joyrideStyles = {
  options: {
    arrowColor: "#151721",
    backgroundColor: "#151721",
    overlayColor: "rgba(0, 0, 0, 0.6)",
    primaryColor: "#8B7CFF",
    textColor: "#e4e4e7",
    width: 380,
    zIndex: 10000,
  },
  tooltip: { borderRadius: 12, padding: 20 },
  tooltipContainer: { textAlign: "left" },
  tooltipTitle: { fontFamily: "var(--font-inter), sans-serif", fontSize: 18, marginBottom: 8 },
  tooltipContent: { fontFamily: "var(--font-outfit), sans-serif", fontSize: 14, lineHeight: 1.5, padding: "0 0 16px 0" },
  tooltipFooter: { alignItems: "center", display: "flex", justifyContent: "flex-end", marginTop: 15 },
  tooltipFooterSpacer: { flex: 1 },
  buttonNext: { backgroundColor: "#8B7CFF", borderRadius: 8, color: "#fff", fontFamily: "var(--font-inter), sans-serif" },
  buttonBack: { color: "#a1a1aa", marginRight: 10 },
  buttonSkip: { color: "#71717a" },
  buttonClose: { background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 18, padding: 8, position: "absolute" as const, right: 0, top: 0 },
};

function getEffectiveSteps(steps: StepWithId[]): StepWithId[] {
  if (typeof document === "undefined") return [];
  return steps.filter((step) => {
    const target = step.target;
    if (typeof target !== "string") return true;
    try {
      return document.querySelector(target) != null;
    } catch {
      return false;
    }
  });
}

export function DashboardTourTrigger() {
  const router = useRouter();
  const [run, setRun] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string>("welcome");
  const [mounted, setMounted] = useState(false);
  const [joyrideKey, setJoyrideKey] = useState(0);
  const autoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = useMemo(() => buildSteps(), []);

  const advance = useCallback((nextStepId?: string) => {
    setCurrentStepId((prev) => {
      if (nextStepId) return nextStepId;
      const effective = getEffectiveSteps(steps);
      const idx = effective.findIndex((s) => s.id === prev);
      if (idx < 0 || idx >= effective.length - 1) return prev;
      return effective[idx + 1].id;
    });
  }, [steps]);

  const effectiveSteps = useMemo(() => {
    if (!mounted || typeof document === "undefined") return [];
    return getEffectiveSteps(steps);
  }, [mounted, run, currentStepId, steps]);

  const effectiveStepsRef = useRef(effectiveSteps);
  effectiveStepsRef.current = effectiveSteps;

  const stepIndex = useMemo(() => {
    const idx = effectiveSteps.findIndex((s) => s.id === currentStepId);
    if (idx >= 0) return idx;
    return 0;
  }, [effectiveSteps, currentStepId]);

  const currentStep = effectiveSteps[stepIndex];
  const targetExists = !currentStep || typeof currentStep.target !== "string"
    ? true
    : typeof document !== "undefined" && document.querySelector(currentStep.target as string) != null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== "undefined" && localStorage.getItem(TOUR_STORAGE_KEY) === "true") return;
    autoStartTimerRef.current = setTimeout(() => {
      setCurrentStepId("welcome");
      setJoyrideKey((key) => key + 1);
      setRun(true);
    }, 800);
    return () => {
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
  }, [mounted]);

  const handleStart = useCallback(() => {
    if (autoStartTimerRef.current) {
      clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }
    setCurrentStepId("welcome");
    setJoyrideKey((key) => key + 1);
    setRun(true);
  }, []);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    const stepsRef = effectiveStepsRef.current;

    const closeTour = () => {
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
      setRun(false);
      setCurrentStepId("welcome");
      setJoyrideKey((key) => key + 1);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(TOUR_STORAGE_KEY, "true");
        } catch {
          // ignore
        }
      }
    };

    // Normal end states from Joyride
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      closeTour();
      return;
    }

    // Failsafe: in controlled mode, some flows can emit step events on last step
    // without surfacing STATUS.FINISHED immediately.
    const isLastStep = index >= stepsRef.length - 1;
    const isExplicitEndEvent =
      type === "tour:end" || action === "close" || action === "stop";
    const isLastStepNext =
      type === "step:after" && action === "next" && isLastStep;

    if (isExplicitEndEvent || isLastStepNext) {
      closeTour();
      return;
    }

    if (type === "step:after" && action === "next") {
      const next = stepsRef[index + 1];
      if (next) setCurrentStepId(next.id);
    }
    if (type === "step:after" && action === "prev") {
      const prev = stepsRef[Math.max(0, index - 1)];
      if (prev) setCurrentStepId(prev.id);
    }
  }, []);

  const contextValue = useMemo<TourContextValue>(() => ({ advance, router }), [advance, router]);

  const safeStepIndex = Math.min(Math.max(0, stepIndex), Math.max(0, effectiveSteps.length - 1));
  const shouldRenderJoyride =
    mounted && run && effectiveSteps.length > 0 && targetExists;

  return (
    <TourContext.Provider value={contextValue}>
      <button
        type="button"
        onClick={handleStart}
        className="flex size-9 items-center justify-center rounded-lg border border-dark-500 bg-neutral-900 text-text-secondary transition-colors hover:border-main-500/50 hover:text-main-400 hover:bg-main-500/10"
        aria-label="Start dashboard tour"
        title="Start dashboard tour"
      >
        <HelpCircle className="size-5" />
      </button>
      {shouldRenderJoyride && (
        <Joyride
          key={joyrideKey}
          steps={effectiveSteps}
          run={run}
          stepIndex={safeStepIndex}
          continuous
          showProgress
          showSkipButton
          callback={handleCallback}
          scrollToFirstStep
          scrollOffset={80}
          spotlightPadding={8}
          styles={joyrideStyles}
          locale={{ back: "Back", close: "Close", last: "Finish", next: "Next", skip: "Skip tour" }}
        />
      )}
    </TourContext.Provider>
  );
}

export function useDashboardTourSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
