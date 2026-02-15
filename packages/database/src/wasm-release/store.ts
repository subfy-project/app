import { FirebaseService } from '@subfy/firebase';
import type { CreateWasmReleaseInput, WasmReleaseDocument } from './model';

const COLLECTION = 'wasmReleases';

export class WasmReleaseStore {
  constructor(private readonly firebase: FirebaseService) {}

  async create(input: CreateWasmReleaseInput): Promise<WasmReleaseDocument> {
    const db = this.firebase.getFirestore();
    const now = new Date().toISOString();
    const ref = db.collection(COLLECTION).doc();
    const doc: WasmReleaseDocument = {
      id: ref.id,
      contractName: input.contractName,
      network: input.network,
      bucketPath: input.bucketPath,
      gcsUri: input.gcsUri,
      wasmHash: input.wasmHash,
      sha256: input.sha256,
      gitSha: input.gitSha,
      uploadedAtUtc: input.uploadedAtUtc,
      paymentTokenContractId: input.paymentTokenContractId ?? null,
      createdAt: now,
    };
    await ref.set(doc);
    return doc;
  }

  async findLatest(
    contractName: string,
    network: 'testnet' | 'public',
  ): Promise<WasmReleaseDocument | null> {
    const db = this.firebase.getFirestore();
    const snap = await db
      .collection(COLLECTION)
      .where('contractName', '==', contractName)
      .where('network', '==', network)
      .orderBy('uploadedAtUtc', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as WasmReleaseDocument;
  }

  async findById(id: string): Promise<WasmReleaseDocument | null> {
    const db = this.firebase.getFirestore();
    const snap = await db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as WasmReleaseDocument;
  }
}
