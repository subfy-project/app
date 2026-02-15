import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "@subfy/firebase";
import { DeploymentStore } from "./store";
import type {
  CreateDeploymentInput,
  DeploymentDocument,
  UpdateDeploymentStatusInput,
} from "./model";

@Injectable()
export class DeploymentService {
  private readonly store: DeploymentStore;

  constructor(
    @Inject(FirebaseService) private readonly firebase: FirebaseService,
  ) {
    this.store = new DeploymentStore(firebase);
  }

  async create(input: CreateDeploymentInput): Promise<DeploymentDocument> {
    return this.store.create(input);
  }

  async findById(deploymentId: string): Promise<DeploymentDocument | null> {
    return this.store.findById(deploymentId);
  }

  async updateStatus(
    deploymentId: string,
    input: UpdateDeploymentStatusInput,
  ): Promise<void> {
    return this.store.updateStatus(deploymentId, input);
  }
}
