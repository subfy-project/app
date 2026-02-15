import { FirebaseService } from "@subfy/firebase";
import type {
  CreateDeploymentInput,
  DeploymentDocument,
  UpdateDeploymentStatusInput,
} from "./model";

const COLLECTION = "deployments";

export class DeploymentStore {
  constructor(private readonly firebase: FirebaseService) {}

  async create(input: CreateDeploymentInput): Promise<DeploymentDocument> {
    const db = this.firebase.getFirestore();
    const now = new Date().toISOString();
    const ref = db.collection(COLLECTION).doc();
    const deployment: DeploymentDocument = {
      id: ref.id,
      projectId: input.projectId,
      ownerPublicKey: input.ownerPublicKey,
      status: "PENDING",
      signedXdr: input.signedXdr,
      txHash: null,
      errorCode: null,
      errorMessage: null,
      taskName: null,
      attemptCount: 0,
      proposedSubscriptionContractId:
        input.proposedSubscriptionContractId ?? null,
      proposedPaymentTokenContractId: input.proposedPaymentTokenContractId ?? null,
      wasmReleaseId: input.wasmReleaseId ?? null,
      wasmHash: input.wasmHash ?? null,
      salt: input.salt ?? null,
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
    };
    await ref.set(deployment);
    return deployment;
  }

  async findById(deploymentId: string): Promise<DeploymentDocument | null> {
    const db = this.firebase.getFirestore();
    const snap = await db.collection(COLLECTION).doc(deploymentId).get();
    if (!snap.exists) return null;
    return snap.data() as DeploymentDocument;
  }

  async updateStatus(
    deploymentId: string,
    input: UpdateDeploymentStatusInput,
  ): Promise<void> {
    const db = this.firebase.getFirestore();
    const patch: Record<string, unknown> = {
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    if (input.txHash !== undefined) patch.txHash = input.txHash;
    if (input.errorCode !== undefined) patch.errorCode = input.errorCode;
    if (input.errorMessage !== undefined) patch.errorMessage = input.errorMessage;
    if (input.taskName !== undefined) patch.taskName = input.taskName;
    if (input.finished) patch.finishedAt = new Date().toISOString();
    if (input.incrementAttempt) {
      const current = await this.findById(deploymentId);
      patch.attemptCount = (current?.attemptCount ?? 0) + 1;
    }
    await db.collection(COLLECTION).doc(deploymentId).update(patch);
  }
}
