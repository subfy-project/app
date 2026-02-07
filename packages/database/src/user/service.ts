import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "@subfy/firebase";
import { UserStore } from "./store";
import type { UserDocument } from "./model";

@Injectable()
export class UserService {
  private readonly store: UserStore;

  constructor(
    @Inject(FirebaseService) private readonly firebase: FirebaseService,
  ) {
    this.store = new UserStore(firebase);
  }

  async findByPublicKey(publicKey: string): Promise<UserDocument | null> {
    return this.store.findByPublicKey(publicKey);
  }

  async upsertUser(publicKey: string): Promise<UserDocument> {
    return this.store.upsertUser(publicKey);
  }
}
