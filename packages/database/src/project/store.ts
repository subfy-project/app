import { FirebaseService } from "@subfy/firebase";
import type {
  CreateProjectInput,
  ProjectDocument,
  ProjectStatus,
  UpdateProjectContractsInput,
} from "./model";

const COLLECTION = "projects";

export class ProjectStore {
  constructor(private readonly firebase: FirebaseService) {}

  async create(input: CreateProjectInput): Promise<ProjectDocument> {
    const db = this.firebase.getFirestore();
    const now = new Date().toISOString();
    const ref = db.collection(COLLECTION).doc();
    const project: ProjectDocument = {
      id: ref.id,
      ownerPublicKey: input.ownerPublicKey,
      name: input.name,
      network: input.network,
      status: "DRAFT",
      subscriptionContractId: null,
      paymentTokenContractId: input.paymentTokenContractId ?? null,
      paymentCurrency: input.paymentCurrency,
      treasuryAddress: input.treasuryAddress,
      wasmArtifactPath: input.wasmArtifactPath ?? null,
      wasmReleaseId: null,
      deployedWasmHash: null,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(project);
    return project;
  }

  async findById(projectId: string): Promise<ProjectDocument | null> {
    const db = this.firebase.getFirestore();
    const snap = await db.collection(COLLECTION).doc(projectId).get();
    if (!snap.exists) return null;
    return snap.data() as ProjectDocument;
  }

  async listByOwner(ownerPublicKey: string): Promise<ProjectDocument[]> {
    const db = this.firebase.getFirestore();
    const snap = await db
      .collection(COLLECTION)
      .where("ownerPublicKey", "==", ownerPublicKey)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) => doc.data() as ProjectDocument);
  }

  async updateStatus(projectId: string, status: ProjectStatus): Promise<void> {
    const db = this.firebase.getFirestore();
    await db.collection(COLLECTION).doc(projectId).update({
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateContracts(
    projectId: string,
    input: UpdateProjectContractsInput,
  ): Promise<void> {
    const db = this.firebase.getFirestore();
    await db.collection(COLLECTION).doc(projectId).update({
      ...input,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateName(projectId: string, name: string): Promise<void> {
    const db = this.firebase.getFirestore();
    await db.collection(COLLECTION).doc(projectId).update({
      name,
      updatedAt: new Date().toISOString(),
    });
  }
}
