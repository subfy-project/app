import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DeploymentService,
  ProjectService,
  WasmReleaseService,
} from '@subfy/database';
import { DeploymentsExecutionService } from './deployments.execution.service';
import { SorobanService } from '../soroban/soroban.service';

@Injectable()
export class DeploymentsService {
  constructor(
    private readonly deployments: DeploymentService,
    private readonly projects: ProjectService,
    private readonly wasmReleases: WasmReleaseService,
    private readonly execution: DeploymentsExecutionService,
    private readonly soroban: SorobanService,
  ) {}

  async prepare(ownerPublicKey: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerPublicKey !== ownerPublicKey) {
      throw new UnauthorizedException('You do not own this project');
    }

    const release = await this.wasmReleases.findLatest(
      'sb_subscription',
      project.network,
    );
    if (!release) {
      throw new BadRequestException(
        'No deployed wasm release available. Run contracts CD first.',
      );
    }
    const prepared = await this.soroban.prepareDeployContractXdr(
      ownerPublicKey,
      release.wasmHash,
    );

    return {
      projectId: project.id,
      network: project.network,
      wasmArtifactPath: release.gcsUri,
      wasmReleaseId: release.id,
      wasmHash: release.wasmHash,
      unsignedXdr: prepared.unsignedXdr,
      saltHex: prepared.saltHex,
      networkPassphrase: this.soroban.getNetworkPassphrase(),
      ownerPublicKey: project.ownerPublicKey,
    };
  }

  async submit(
    ownerPublicKey: string,
    projectId: string,
    input: {
      signedXdr: string;
      wasmReleaseId: string;
      wasmHash: string;
      saltHex: string;
      proposedPaymentTokenContractId?: string | null;
    },
  ) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerPublicKey !== ownerPublicKey) {
      throw new UnauthorizedException('You do not own this project');
    }

    const deployment = await this.deployments.create({
      projectId,
      ownerPublicKey,
      signedXdr: input.signedXdr,
      proposedSubscriptionContractId: null,
      proposedPaymentTokenContractId:
        input.proposedPaymentTokenContractId ?? null,
      wasmReleaseId: input.wasmReleaseId,
      wasmHash: input.wasmHash,
      salt: input.saltHex,
    });

    await this.projects.updateStatus(projectId, 'DEPLOYING');
    const { taskName } = await this.execution.enqueue({
      deploymentId: deployment.id,
      projectId,
    });

    if (taskName) {
      await this.deployments.updateStatus(deployment.id, {
        status: 'QUEUED',
        taskName,
      });
    }

    return {
      deploymentId: deployment.id,
      status: taskName ? 'QUEUED' : 'PROCESSING',
    };
  }

  async getStatus(ownerPublicKey: string, deploymentId: string) {
    const deployment = await this.deployments.findById(deploymentId);
    if (!deployment) throw new NotFoundException('Deployment not found');
    if (deployment.ownerPublicKey !== ownerPublicKey) {
      throw new UnauthorizedException('You do not own this deployment');
    }
    return deployment;
  }
}
