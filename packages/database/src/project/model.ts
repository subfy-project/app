export type ProjectNetwork = "testnet" | "public";
export type PaymentCurrency = "USDC" | "EURC";

export type ProjectStatus = "DRAFT" | "DEPLOYING" | "ACTIVE" | "FAILED";

export interface ProjectDocument {
  id: string;
  ownerPublicKey: string;
  name: string;
  network: ProjectNetwork;
  status: ProjectStatus;
  subscriptionContractId: string | null;
  paymentTokenContractId: string | null;
  paymentCurrency?: PaymentCurrency;
  treasuryAddress: string;
  wasmArtifactPath: string | null;
  wasmReleaseId: string | null;
  deployedWasmHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  ownerPublicKey: string;
  name: string;
  network: ProjectNetwork;
  paymentCurrency: PaymentCurrency;
  treasuryAddress: string;
  paymentTokenContractId?: string | null;
  wasmArtifactPath?: string | null;
}

export interface UpdateProjectContractsInput {
  subscriptionContractId?: string | null;
  paymentTokenContractId?: string | null;
  wasmArtifactPath?: string | null;
  wasmReleaseId?: string | null;
  deployedWasmHash?: string | null;
}
