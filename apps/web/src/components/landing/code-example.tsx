"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const tabs = [
  {
    label: "JavaScript",
    lang: "js",
    code: `import { Subfy } from '@subfy/sdk';

const subfy = new Subfy({
  merchantId: 'your-merchant-id',
  network: 'mainnet',
});

// Create a subscription plan
const plan = await subfy.plans.create({
  name: 'Pro Plan',
  amount: '9.99',
  currency: 'USDC',
  interval: 'monthly',
});

// Subscribe a user
const subscription = await subfy.subscribe({
  planId: plan.id,
  userWallet: 'G...USER_STELLAR_ADDRESS',
});`,
  },
  {
    label: "Rust",
    lang: "rust",
    code: `use subfy_sdk::SubfyClient;

let client = SubfyClient::new(
    "your-merchant-id",
    Network::Mainnet,
);

// Create a subscription plan
let plan = client.plans().create(
    PlanParams {
        name: "Pro Plan".into(),
        amount: "9.99".into(),
        currency: Currency::USDC,
        interval: Interval::Monthly,
    }
).await?;

// Subscribe a user
let subscription = client.subscribe(
    SubscribeParams {
        plan_id: plan.id,
        user_wallet: "G...USER_STELLAR_ADDRESS",
    }
).await?;`,
  },
  {
    label: "Python",
    lang: "python",
    code: `from subfy import SubfyClient

client = SubfyClient(
    merchant_id="your-merchant-id",
    network="mainnet",
)

# Create a subscription plan
plan = client.plans.create(
    name="Pro Plan",
    amount="9.99",
    currency="USDC",
    interval="monthly",
)

# Subscribe a user
subscription = client.subscribe(
    plan_id=plan.id,
    user_wallet="G...USER_STELLAR_ADDRESS",
)`,
  },
];

function highlightSyntax(code: string, lang: string): string {
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Strings (single and double quotes)
  highlighted = highlighted.replace(
    /(["'])(?:(?=(\\?))\2.)*?\1/g,
    '<span class="text-success">$&</span>'
  );

  // Comments
  highlighted = highlighted.replace(
    /(\/\/.*$|#.*$)/gm,
    '<span class="text-text-secondary">$&</span>'
  );

  // Keywords
  const jsKeywords =
    /\b(import|from|const|let|var|async|await|new|return|export|function)\b/g;
  const rustKeywords =
    /\b(use|let|fn|pub|async|await|struct|impl|mod|mut|into)\b/g;
  const pyKeywords =
    /\b(from|import|def|class|return|await|async|with|as)\b/g;

  const keywordRegex =
    lang === "rust" ? rustKeywords : lang === "python" ? pyKeywords : jsKeywords;

  highlighted = highlighted.replace(
    keywordRegex,
    '<span class="text-main-400">$&</span>'
  );

  return highlighted;
}

export function CodeExample() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing-glow overflow-hidden rounded-lg border border-dark-500 bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-500 px-4 py-3">
        <div className="flex items-center gap-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`rounded-sm px-3 py-1.5 font-inter text-body-xs transition-all duration-200 ${
                activeTab === i
                  ? "bg-main-500/15 text-main-400"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-text-secondary transition-colors duration-200 hover:text-text-primary"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>

      {/* Code Block */}
      <div className="overflow-x-auto p-5">
        <pre className="font-mono text-[13px] leading-6">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightSyntax(
                tabs[activeTab].code,
                tabs[activeTab].lang
              ),
            }}
          />
        </pre>
      </div>
    </div>
  );
}
