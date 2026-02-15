import { Inject, Injectable } from '@nestjs/common';
import { FirebaseService } from '@subfy/firebase';
import type { CreateWasmReleaseInput, WasmReleaseDocument } from './model';
import { WasmReleaseStore } from './store';

@Injectable()
export class WasmReleaseService {
  private readonly store: WasmReleaseStore;

  constructor(
    @Inject(FirebaseService) private readonly firebase: FirebaseService,
  ) {
    this.store = new WasmReleaseStore(firebase);
  }

  async create(input: CreateWasmReleaseInput): Promise<WasmReleaseDocument> {
    return this.store.create(input);
  }

  async findLatest(
    contractName: string,
    network: 'testnet' | 'public',
  ): Promise<WasmReleaseDocument | null> {
    return this.store.findLatest(contractName, network);
  }

  async findById(id: string): Promise<WasmReleaseDocument | null> {
    return this.store.findById(id);
  }
}
