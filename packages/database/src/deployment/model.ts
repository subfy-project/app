export type DeploymentStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED";

export interface DeploymentDocument {
  id: string;
  projectId: string;
  ownerPublicKey: string;
  status: DeploymentStatus;
  signedXdr: string;
  txHash: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  taskName: string | null;
  attemptCount: number;
  proposedSubscriptionContractId: string | null;
  proposedPaymentTokenContractId: string | null;
  wasmReleaseId: string | null;
  wasmHash: string | null;
  salt: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface CreateDeploymentInput {
  projectId: string;
  ownerPublicKey: string;
  signedXdr: string;
  proposedSubscriptionContractId?: string | null;
  proposedPaymentTokenContractId?: string | null;
  wasmReleaseId?: string | null;
  wasmHash?: string | null;
  salt?: string | null;
}

export interface UpdateDeploymentStatusInput {
  status: DeploymentStatus;
  txHash?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  taskName?: string | null;
  incrementAttempt?: boolean;
  finished?: boolean;
}
