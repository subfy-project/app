import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@subfy/firebase';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const COLLECTION = 'whitelist';

export interface WhitelistEntry {
  email: string;
  createdAt: string;
}

export interface WhitelistStats {
  total: number;
  entries: { id: string; createdAt: string }[];
}

@Injectable()
export class WhitelistService {
  constructor(private readonly firebase: FirebaseService) {}

  async addEmail(email: string): Promise<{ success: boolean; message: string }> {
    const db = this.firebase.getFirestore();
    const col = db.collection(COLLECTION);

    // Check if email already exists
    const existing = await col.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return { success: false, message: 'This email is already on the whitelist.' };
    }

    await col.add({
      email,
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: 'You have been added to the whitelist!' };
  }

  async getStats(): Promise<WhitelistStats> {
    const db = this.firebase.getFirestore();
    const col = db.collection(COLLECTION);

    const snapshot = await col.orderBy('createdAt', 'desc').get();

    const entries = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      createdAt: doc.data().createdAt as string,
    }));

    return {
      total: entries.length,
      entries,
    };
  }
}
