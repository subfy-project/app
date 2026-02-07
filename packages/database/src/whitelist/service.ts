import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "@subfy/firebase";
import { WhitelistStore } from "./store";
import type { WhitelistStats } from "./model";

@Injectable()
export class WhitelistService {
  private readonly store: WhitelistStore;

  constructor(
    @Inject(FirebaseService) private readonly firebase: FirebaseService,
  ) {
    this.store = new WhitelistStore(firebase);
  }

  async addEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.store.addEmail(email);
  }

  async getStats(): Promise<WhitelistStats> {
    return this.store.getStats();
  }
}
