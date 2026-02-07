import { FirebaseService } from "@subfy/firebase";
import type { UserDocument } from "./model";

const COLLECTION = "users";

export class UserStore {
  constructor(private readonly firebase: FirebaseService) {}

  async findByPublicKey(publicKey: string): Promise<UserDocument | null> {
    const db = this.firebase.getFirestore();
    const doc = await db.collection(COLLECTION).doc(publicKey).get();
    if (!doc.exists) return null;
    return doc.data() as UserDocument;
  }

  async upsertUser(publicKey: string): Promise<UserDocument> {
    const db = this.firebase.getFirestore();
    const ref = db.collection(COLLECTION).doc(publicKey);
    const doc = await ref.get();

    const now = new Date().toISOString();

    if (doc.exists) {
      await ref.update({ lastLoginAt: now });
      return { ...(doc.data() as UserDocument), lastLoginAt: now };
    }

    const user: UserDocument = {
      publicKey,
      createdAt: now,
      lastLoginAt: now,
    };

    await ref.set(user);
    return user;
  }
}
