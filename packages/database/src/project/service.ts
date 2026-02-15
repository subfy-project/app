import { Inject, Injectable } from "@nestjs/common";
import { FirebaseService } from "@subfy/firebase";
import { ProjectStore } from "./store";
import type {
  CreateProjectInput,
  ProjectDocument,
  ProjectStatus,
  UpdateProjectContractsInput,
} from "./model";

@Injectable()
export class ProjectService {
  private readonly store: ProjectStore;

  constructor(
    @Inject(FirebaseService) private readonly firebase: FirebaseService,
  ) {
    this.store = new ProjectStore(firebase);
  }

  async create(input: CreateProjectInput): Promise<ProjectDocument> {
    return this.store.create(input);
  }

  async findById(projectId: string): Promise<ProjectDocument | null> {
    return this.store.findById(projectId);
  }

  async listByOwner(ownerPublicKey: string): Promise<ProjectDocument[]> {
    return this.store.listByOwner(ownerPublicKey);
  }

  async updateStatus(projectId: string, status: ProjectStatus): Promise<void> {
    return this.store.updateStatus(projectId, status);
  }

  async updateContracts(
    projectId: string,
    input: UpdateProjectContractsInput,
  ): Promise<void> {
    return this.store.updateContracts(projectId, input);
  }

  async updateName(projectId: string, name: string): Promise<void> {
    return this.store.updateName(projectId, name);
  }
}
