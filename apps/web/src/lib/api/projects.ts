const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Project {
  id: string;
  ownerPublicKey: string;
  name: string;
  network: "testnet" | "public";
  status: "DRAFT" | "DEPLOYING" | "ACTIVE" | "FAILED";
  subscriptionContractId: string | null;
  paymentTokenContractId: string | null;
  paymentCurrency?: "USDC" | "EURC";
  wasmReleaseId?: string | null;
  deployedWasmHash?: string | null;
  treasuryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentStatus {
  id: string;
  projectId: string;
  status: "PENDING" | "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
  txHash: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface ContractPlan {
  id: number;
  name: string;
  periodLedgers: number;
  priceStroops: string;
  active: boolean;
}

export interface ContractSubscription {
  subscriber: string;
  planId: number;
  startedLedger: number;
  nextRenewalLedger: number;
  active: boolean;
}

export interface CheckoutProject {
  id: string;
  name: string;
  network: "testnet" | "public";
  paymentCurrency: "USDC" | "EURC";
  subscriptionContractId: string;
}

export interface CheckoutContext {
  project: CheckoutProject;
  remainingAllowanceStroops?: string | null;
  remainingCycles?: number | null;
  plans: ContractPlan[];
  subscription: ContractSubscription | null;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readErrorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  if (typeof body?.message === "string") return body.message;
  if (Array.isArray(body?.message)) return body.message.join(", ");
  return fallback;
}

export async function listProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function getProject(token: string, projectId: string): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${projectId}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to fetch project"));
  return res.json();
}

export async function createProject(
  token: string,
  input: {
    name: string;
    network: "testnet" | "public";
    paymentCurrency: "USDC" | "EURC";
    treasuryAddress: string;
  },
): Promise<Project> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to create project"));
  }
  return res.json();
}

export async function renameProject(
  token: string,
  projectId: string,
  name: string,
): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${projectId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to rename project"));
  return res.json();
}

export async function submitDeployment(
  token: string,
  projectId: string,
  input: {
    signedXdr: string;
    wasmReleaseId: string;
    wasmHash: string;
    saltHex: string;
    proposedPaymentTokenContractId?: string;
  },
): Promise<{ deploymentId: string; status: string }> {
  const res = await fetch(`${API_URL}/projects/${projectId}/deployments/submit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to submit deployment"));
  }
  return res.json();
}

export async function prepareDeployment(
  token: string,
  projectId: string,
): Promise<{
  projectId: string;
  network: "testnet" | "public";
  wasmArtifactPath: string;
  wasmReleaseId: string;
  wasmHash: string;
  unsignedXdr: string;
  saltHex: string;
  networkPassphrase: string;
  ownerPublicKey: string;
}> {
  const res = await fetch(`${API_URL}/projects/${projectId}/deployments/prepare`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to prepare deployment"));
  }
  return res.json();
}

export async function getDeploymentStatus(
  token: string,
  deploymentId: string,
): Promise<DeploymentStatus> {
  const res = await fetch(`${API_URL}/deployments/${deploymentId}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch deployment status");
  return res.json();
}

export async function listPlans(
  token: string,
  projectId: string,
  offset = 0,
  limit = 50,
): Promise<ContractPlan[]> {
  const safeOffset = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 50;
  const res = await fetch(
    `${API_URL}/projects/${projectId}/plans?offset=${safeOffset}&limit=${safeLimit}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to fetch plans"));
  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createPlan(
  token: string,
  projectId: string,
  input: {
    planId: number;
    name: string;
    periodLedgers: number;
    priceStroops: string;
  },
): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${projectId}/plans`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to create plan"));
}

export async function setPlanStatus(
  token: string,
  projectId: string,
  planId: number,
  active: boolean,
): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${projectId}/plans/${planId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to update plan status"));
  }
}

export async function listSubscriptions(
  token: string,
  projectId: string,
  offset = 0,
  limit = 100,
): Promise<ContractSubscription[]> {
  const safeOffset = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 50;
  const res = await fetch(
    `${API_URL}/projects/${projectId}/subscriptions?offset=${safeOffset}&limit=${safeLimit}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to fetch subscriptions"));
  }
  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : [];
}

export async function renewDueSubscriptions(
  token: string,
  projectId: string,
): Promise<{ renewed: number; scanned: number; skippedAllowance?: number; failed?: number }> {
  const res = await fetch(`${API_URL}/projects/${projectId}/renew-due`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to renew due subscriptions"));
  }
  return res.json();
}

export async function getCheckoutContext(
  projectId: string,
  subscriber?: string,
): Promise<CheckoutContext> {
  const query = subscriber
    ? `?subscriber=${encodeURIComponent(subscriber)}`
    : "";
  const res = await fetch(`${API_URL}/checkout/${projectId}${query}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load checkout"));
  }
  return res.json();
}

export async function prepareCheckoutSubscribe(
  projectId: string,
  input: { subscriber: string; planId: number },
): Promise<{ unsignedXdr: string; networkPassphrase: string }> {
  const res = await fetch(`${API_URL}/checkout/${projectId}/subscribe/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to prepare subscribe transaction"),
    );
  }
  return res.json();
}

export async function prepareCheckoutCancel(
  projectId: string,
  input: { subscriber: string },
): Promise<{ unsignedXdr: string; networkPassphrase: string }> {
  const res = await fetch(`${API_URL}/checkout/${projectId}/cancel/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to prepare cancel transaction"),
    );
  }
  return res.json();
}

export async function prepareCheckoutAllowance(
  projectId: string,
  input: {
    subscriber: string;
    amountStroops: string;
    expirationLedgers?: number;
  },
): Promise<{ unsignedXdr: string; networkPassphrase: string }> {
  const res = await fetch(`${API_URL}/checkout/${projectId}/allowance/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to prepare allowance transaction"),
    );
  }
  return res.json();
}

export async function prepareCheckoutIncreaseAllowanceCycles(
  projectId: string,
  input: {
    subscriber: string;
    planId: number;
    additionalCycles: number;
  },
): Promise<{
  unsignedXdr: string;
  networkPassphrase: string;
  expirationLedger: number;
}> {
  const res = await fetch(
    `${API_URL}/checkout/${projectId}/allowance/increase-cycles/prepare`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(
        res,
        "Failed to prepare increase allowance transaction",
      ),
    );
  }
  return res.json();
}

export async function submitCheckoutSignedXdr(
  signedXdr: string,
): Promise<{ txHash: string }> {
  const res = await fetch(`${API_URL}/checkout/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXdr }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to submit transaction"));
  }
  return res.json();
}
