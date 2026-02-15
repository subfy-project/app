import { Injectable, Logger } from '@nestjs/common';
import { CloudTasksClient } from '@google-cloud/tasks';
import {
  DeploymentService,
  ProjectService,
  WasmReleaseService,
} from '@subfy/database';
import { SorobanService } from '../soroban/soroban.service';

export interface DeploymentTaskPayload {
  deploymentId: string;
  projectId: string;
}

@Injectable()
export class DeploymentsExecutionService {
  private readonly logger = new Logger(DeploymentsExecutionService.name);
  private readonly tasksClient = new CloudTasksClient();

  constructor(
    private readonly deployments: DeploymentService,
    private readonly projects: ProjectService,
    private readonly wasmReleases: WasmReleaseService,
    private readonly soroban: SorobanService,
  ) {}

  private resolvePaymentTokenFromProject(
    network: 'testnet' | 'public',
    paymentCurrency?: 'USDC' | 'EURC',
  ): string | null {
    const currency = (paymentCurrency ?? 'USDC').toUpperCase();
    const networkKey = network === 'public' ? 'PUBLIC' : 'TESTNET';
    const env = process.env;
    const byNetwork =
      currency === 'EURC'
        ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID_PUBLIC
        : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID_PUBLIC;
    const byTestnet =
      currency === 'EURC'
        ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID_TESTNET
        : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID_TESTNET;
    const generic =
      currency === 'EURC'
        ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID
        : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID;
    const scoped = networkKey === 'PUBLIC' ? byNetwork : byTestnet;
    return scoped ?? generic ?? null;
  }

  async enqueue(payload: DeploymentTaskPayload): Promise<{ taskName: string | null }> {
    const projectId =
      process.env.CLOUD_TASKS_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.CLOUD_TASKS_LOCATION;
    const queue = process.env.CLOUD_TASKS_QUEUE;
    const targetUrl = process.env.CLOUD_TASKS_TARGET_URL;
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      this.logger.log('Development mode: execute deployment task directly');
      await this.executeTask(payload);
      return { taskName: null };
    }

    if (!projectId || !location || !queue || !targetUrl) {
      this.logger.warn(
        'Cloud Tasks env missing; fallback to direct execution',
      );
      await this.executeTask(payload);
      return { taskName: null };
    }

    const parent = this.tasksClient.queuePath(projectId, location, queue);
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');

    const request: Parameters<CloudTasksClient['createTask']>[0] = {
      parent,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: targetUrl,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        },
      },
    };

    const serviceAccountEmail =
      process.env.CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL;
    if (serviceAccountEmail) {
      request.task!.httpRequest!.oidcToken = {
        serviceAccountEmail,
      };
    } else if (process.env.INTERNAL_TASKS_TOKEN) {
      request.task!.httpRequest!.headers = {
        ...request.task!.httpRequest!.headers,
        Authorization: `Bearer ${process.env.INTERNAL_TASKS_TOKEN}`,
      };
    }

    const [created] = await this.tasksClient.createTask(request);
    return { taskName: created.name ?? null };
  }

  async executeTask(payload: DeploymentTaskPayload): Promise<void> {
    const deployment = await this.deployments.findById(payload.deploymentId);
    if (!deployment) {
      this.logger.warn(
        `Deployment ${payload.deploymentId} not found, skipping worker`,
      );
      return;
    }

    await this.deployments.updateStatus(payload.deploymentId, {
      status: 'RUNNING',
      incrementAttempt: true,
      errorCode: null,
      errorMessage: null,
    });

    try {
      const { txHash, contractId } = await this.soroban.submitSignedXdr(
        deployment.signedXdr,
      );
      const project = await this.projects.findById(payload.projectId);
      if (!project) {
        throw new Error(`Project ${payload.projectId} not found`);
      }
      if (!contractId) {
        throw new Error('Unable to determine deployed contract ID');
      }
      const releasePaymentTokenContractId = deployment.wasmReleaseId
        ? (await this.wasmReleases.findById(deployment.wasmReleaseId))
            ?.paymentTokenContractId
        : null;
      const paymentTokenContractId =
        deployment.proposedPaymentTokenContractId ??
        project.paymentTokenContractId ??
        this.resolvePaymentTokenFromProject(
          project.network,
          project.paymentCurrency,
        ) ??
        releasePaymentTokenContractId ??
        process.env.SB_PAYMENT_TOKEN_CONTRACT_ID ??
        null;
      if (!paymentTokenContractId) {
        throw new Error(
          'Missing payment token contract ID for init (project/payment/env)',
        );
      }
      const backendPublicKey = this.soroban.getBackendKeypair().publicKey();
      await this.soroban.invokeSigned(contractId, 'init', [
        { type: 'address', value: backendPublicKey },
        { type: 'address', value: paymentTokenContractId },
        { type: 'address', value: project.treasuryAddress },
      ]);

      await this.deployments.updateStatus(payload.deploymentId, {
        status: 'SUCCESS',
        txHash,
        finished: true,
      });

      await this.projects.updateContracts(payload.projectId, {
        subscriptionContractId:
          contractId ?? deployment.proposedSubscriptionContractId,
        paymentTokenContractId,
        wasmReleaseId: deployment.wasmReleaseId,
        deployedWasmHash: deployment.wasmHash,
      });
      await this.projects.updateStatus(payload.projectId, 'ACTIVE');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'unknown deployment error';
      await this.deployments.updateStatus(payload.deploymentId, {
        status: 'FAILED',
        errorCode: 'DEPLOY_EXECUTION_ERROR',
        errorMessage: message,
        finished: true,
      });
      await this.projects.updateStatus(payload.projectId, 'FAILED');
    }
  }

}
