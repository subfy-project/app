import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectService, type ProjectDocument } from '@subfy/database';
import { SorobanService } from '../soroban/soroban.service';

@Injectable()
export class BillingService {
  private static readonly MAX_CONTRACT_PAGE_SIZE = 50;
  private static readonly MAX_TOKEN_ALLOWANCE_WINDOW = 3_110_400;
  private static readonly ALLOWANCE_EXPIRATION_SAFETY_MARGIN = 1_000;
  private static readonly CONTRACT_ERR_ALREADY_INITIALIZED = 1;
  private static readonly CONTRACT_ERR_NOT_INITIALIZED = 2;
  private static readonly CONTRACT_ERR_UNAUTHORIZED = 3;

  constructor(
    private readonly projects: ProjectService,
    private readonly soroban: SorobanService,
  ) {}

  private async assertProjectOwnership(projectId: string, ownerPublicKey: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerPublicKey !== ownerPublicKey) {
      throw new UnauthorizedException('You do not own this project');
    }
    return project;
  }

  private async assertProjectForCheckout(projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    return project;
  }

  private normalizePagination(offset: number, limit: number) {
    return {
      offset: Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0,
      limit: Number.isFinite(limit) && limit > 0
        ? Math.min(
            Math.floor(limit),
            BillingService.MAX_CONTRACT_PAGE_SIZE,
          )
        : BillingService.MAX_CONTRACT_PAGE_SIZE,
    };
  }

  private parseContractErrorCode(error: unknown): number | null {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/Error\(Contract,\s*#(\d+)\)/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  private contractCodeToMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Contract already initialized';
      case 2:
        return 'Contract is not initialized yet';
      case 3:
        return 'Unauthorized contract action';
      case 4:
        return 'Plan already exists';
      case 5:
        return 'Plan not found';
      case 6:
        return 'Invalid period';
      case 7:
        return 'Plan is inactive';
      case 8:
        return 'Subscription already exists';
      case 9:
        return 'Subscription not found';
      case 10:
        return 'Subscription is cancelled';
      case 11:
        return 'Invalid price';
      case 12:
        return 'Renewal is too early';
      case 13:
        return 'Invalid page size';
      default:
        return `Contract rejected action (code #${code})`;
    }
  }

  private toClientException(
    error: unknown,
    fallbackMessage: string,
  ): BadRequestException {
    const code = this.parseContractErrorCode(error);
    if (code !== null) {
      return new BadRequestException(this.contractCodeToMessage(code));
    }
    const message = error instanceof Error ? error.message : fallbackMessage;
    return new BadRequestException(message || fallbackMessage);
  }

  private toCheckoutActionException(
    error: unknown,
    fallbackMessage: string,
  ): BadRequestException {
    const code = this.parseContractErrorCode(error);
    if (code !== null) {
      // Subscribe/cancel can bubble errors from token contracts too.
      // Keep only the subscription-contract codes that are unambiguous here.
      switch (code) {
        case 2:
        case 5:
        case 7:
        case 8:
        case 9:
        case 10:
        case 12:
          return new BadRequestException(this.contractCodeToMessage(code));
        default:
          return new BadRequestException(
            `Transaction rejected by contract (code #${code}). ` +
              'Check wallet trustline, token balance, and allowance.',
          );
      }
    }
    const message = error instanceof Error ? error.message : fallbackMessage;
    return new BadRequestException(message || fallbackMessage);
  }

  private getBackendPublicKey(): string {
    return this.soroban.getBackendKeypair().publicKey();
  }

  private clampAllowanceExpirationLedger(
    latestLedger: number,
    requested?: number,
  ): number {
    const maxByWindow =
      latestLedger +
      BillingService.MAX_TOKEN_ALLOWANCE_WINDOW -
      BillingService.ALLOWANCE_EXPIRATION_SAFETY_MARGIN;
    const fallback = maxByWindow;
    const candidate =
      Number.isFinite(requested) && (requested ?? 0) > latestLedger
        ? Math.floor(requested as number)
        : fallback;
    const clamped = Math.min(candidate, maxByWindow);
    if (clamped <= latestLedger) {
      throw new BadRequestException(
        `Unable to set allowance expiration: latest ledger ${latestLedger} is too close to token max window ${BillingService.MAX_TOKEN_ALLOWANCE_WINDOW}.`,
      );
    }
    return clamped;
  }

  private parseI128Like(value: unknown): bigint {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.trunc(value));
    if (typeof value === 'string') return BigInt(value);
    throw new BadRequestException('Unexpected token amount format');
  }

  private isAllowanceError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes('not enough allowance');
  }

  private resolveProjectPaymentTokenContractId(project: ProjectDocument): string | null {
    if (project.paymentTokenContractId) {
      return project.paymentTokenContractId;
    }
    const currency = (project.paymentCurrency ?? 'USDC').toUpperCase();
    const env = process.env;
    const scoped =
      project.network === 'public'
        ? currency === 'EURC'
          ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID_PUBLIC
          : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID_PUBLIC
        : currency === 'EURC'
          ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID_TESTNET
          : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID_TESTNET;
    const generic =
      currency === 'EURC'
        ? env.SB_PAYMENT_TOKEN_EURC_CONTRACT_ID
        : env.SB_PAYMENT_TOKEN_USDC_CONTRACT_ID;
    return scoped ?? generic ?? env.SB_PAYMENT_TOKEN_CONTRACT_ID ?? null;
  }

  private async initializeContractIfPossible(project: ProjectDocument) {
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const paymentTokenContractId = this.resolveProjectPaymentTokenContractId(project);
    if (!paymentTokenContractId) {
      throw new BadRequestException(
        'Contract is not initialized and project has no payment token contract configured',
      );
    }
    const backendPublicKey = this.getBackendPublicKey();
    try {
      await this.soroban.invokeSigned(project.subscriptionContractId, 'init', [
        { type: 'address', value: backendPublicKey },
        { type: 'address', value: paymentTokenContractId },
        { type: 'address', value: project.treasuryAddress },
      ]);
      if (!project.paymentTokenContractId) {
        await this.projects.updateContracts(project.id, {
          paymentTokenContractId,
        });
      }
    } catch (error) {
      const code = this.parseContractErrorCode(error);
      if (code === BillingService.CONTRACT_ERR_ALREADY_INITIALIZED) {
        return;
      }
      throw this.toClientException(error, 'Failed to initialize contract');
    }
  }

  async listPlans(
    ownerPublicKey: string,
    projectId: string,
    offset: number,
    limit: number,
  ) {
    const pagination = this.normalizePagination(offset, limit);
    const project = await this.assertProjectOwnership(projectId, ownerPublicKey);
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    let data: unknown;
    try {
      data = await this.soroban.invokeView(project.subscriptionContractId, 'list_plans', [
        { type: 'u32', value: pagination.offset },
        { type: 'u32', value: pagination.limit },
      ]);
    } catch (error) {
      if (
        this.parseContractErrorCode(error) ===
        BillingService.CONTRACT_ERR_NOT_INITIALIZED
      ) {
        await this.initializeContractIfPossible(project);
        data = await this.soroban.invokeView(project.subscriptionContractId, 'list_plans', [
          { type: 'u32', value: pagination.offset },
          { type: 'u32', value: pagination.limit },
        ]);
      } else {
        throw this.toClientException(error, 'Failed to list plans');
      }
    }
    const items = Array.isArray(data) ? data.map((p) => this.mapPlan(p)) : [];
    return {
      projectId,
      subscriptionContractId: project.subscriptionContractId,
      offset: pagination.offset,
      limit: pagination.limit,
      items,
    };
  }

  async listSubscriptions(
    ownerPublicKey: string,
    projectId: string,
    offset: number,
    limit: number,
  ) {
    const pagination = this.normalizePagination(offset, limit);
    const project = await this.assertProjectOwnership(projectId, ownerPublicKey);
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    let data: unknown;
    try {
      data = await this.soroban.invokeView(
        project.subscriptionContractId,
        'list_subscriptions',
        [
          { type: 'u32', value: pagination.offset },
          { type: 'u32', value: pagination.limit },
        ],
      );
    } catch (error) {
      if (
        this.parseContractErrorCode(error) ===
        BillingService.CONTRACT_ERR_NOT_INITIALIZED
      ) {
        await this.initializeContractIfPossible(project);
        data = await this.soroban.invokeView(
          project.subscriptionContractId,
          'list_subscriptions',
          [
            { type: 'u32', value: pagination.offset },
            { type: 'u32', value: pagination.limit },
          ],
        );
      } else {
        throw this.toClientException(error, 'Failed to list subscriptions');
      }
    }
    const items = Array.isArray(data)
      ? data.map((s) => this.mapSubscription(s))
      : [];
    return {
      projectId,
      subscriptionContractId: project.subscriptionContractId,
      offset: pagination.offset,
      limit: pagination.limit,
      items,
    };
  }

  async triggerRenewDue(ownerPublicKey: string, projectId: string) {
    const project = await this.assertProjectOwnership(projectId, ownerPublicKey);
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }

    const latestLedger = await this.soroban.getLatestLedgerSequence();
    const pageSize = 50;
    let offset = 0;
    let renewed = 0;
    let skippedAllowance = 0;
    let failed = 0;
    let scanned = 0;
    let pages = 0;

    while (pages < 200) {
      const page = await this.soroban.invokeView(
        project.subscriptionContractId,
        'list_subscriptions',
        [
          { type: 'u32', value: offset },
          { type: 'u32', value: pageSize },
        ],
      );
      const items = Array.isArray(page) ? page.map((s) => this.mapSubscription(s)) : [];
      if (!items.length) break;

      for (const item of items) {
        scanned += 1;
        if (!item.active) continue;
        if (item.nextRenewalLedger > latestLedger) continue;
        try {
          await this.soroban.invokeSigned(project.subscriptionContractId, 'renew', [
            { type: 'address', value: item.subscriber },
          ]);
          renewed += 1;
        } catch (error) {
          if (this.isAllowanceError(error)) {
            skippedAllowance += 1;
            continue;
          }
          failed += 1;
        }
      }
      offset += pageSize;
      pages += 1;
    }

    return {
      projectId,
      status: 'completed',
      subscriptionContractId: project.subscriptionContractId,
      scanned,
      renewed,
      skippedAllowance,
      failed,
      latestLedger,
    };
  }

  async createPlan(
    ownerPublicKey: string,
    projectId: string,
    input: {
      planId: number;
      name: string;
      periodLedgers: number;
      priceStroops: string;
    },
  ) {
    const project = await this.assertProjectOwnership(projectId, ownerPublicKey);
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const backendPublicKey = this.getBackendPublicKey();
    try {
      await this.soroban.invokeSigned(project.subscriptionContractId, 'create_plan', [
        { type: 'address', value: ownerPublicKey },
        { type: 'u32', value: input.planId },
        { type: 'string', value: input.name },
        { type: 'u32', value: input.periodLedgers },
        { type: 'i128', value: input.priceStroops },
      ]);
    } catch (error) {
      const code = this.parseContractErrorCode(error);
      if (code === BillingService.CONTRACT_ERR_NOT_INITIALIZED) {
        await this.initializeContractIfPossible(project);
        await this.soroban.invokeSigned(project.subscriptionContractId, 'create_plan', [
          { type: 'address', value: backendPublicKey },
          { type: 'u32', value: input.planId },
          { type: 'string', value: input.name },
          { type: 'u32', value: input.periodLedgers },
          { type: 'i128', value: input.priceStroops },
        ]);
      } else if (code === BillingService.CONTRACT_ERR_UNAUTHORIZED) {
        await this.soroban.invokeSigned(project.subscriptionContractId, 'create_plan', [
          { type: 'address', value: backendPublicKey },
          { type: 'u32', value: input.planId },
          { type: 'string', value: input.name },
          { type: 'u32', value: input.periodLedgers },
          { type: 'i128', value: input.priceStroops },
        ]);
      } else {
        throw this.toClientException(error, 'Failed to create plan');
      }
    }
    return { ok: true };
  }

  async setPlanStatus(
    ownerPublicKey: string,
    projectId: string,
    planId: number,
    active: boolean,
  ) {
    const project = await this.assertProjectOwnership(projectId, ownerPublicKey);
    if (!project.subscriptionContractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const backendPublicKey = this.getBackendPublicKey();
    try {
      await this.soroban.invokeSigned(
        project.subscriptionContractId,
        'set_plan_status',
        [
          { type: 'address', value: ownerPublicKey },
          { type: 'u32', value: planId },
          { type: 'bool', value: active },
        ],
      );
    } catch (error) {
      const code = this.parseContractErrorCode(error);
      if (code === BillingService.CONTRACT_ERR_NOT_INITIALIZED) {
        await this.initializeContractIfPossible(project);
        await this.soroban.invokeSigned(
          project.subscriptionContractId,
          'set_plan_status',
          [
            { type: 'address', value: backendPublicKey },
            { type: 'u32', value: planId },
            { type: 'bool', value: active },
          ],
        );
      } else if (code === BillingService.CONTRACT_ERR_UNAUTHORIZED) {
        await this.soroban.invokeSigned(
          project.subscriptionContractId,
          'set_plan_status',
          [
            { type: 'address', value: backendPublicKey },
            { type: 'u32', value: planId },
            { type: 'bool', value: active },
          ],
        );
      } else {
        throw this.toClientException(error, 'Failed to update plan status');
      }
    }
    return { ok: true };
  }

  async getCheckoutContext(projectId: string, subscriber?: string) {
    const project = await this.assertProjectForCheckout(projectId);
    const contractId = project.subscriptionContractId;
    if (!contractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    let plansData: unknown;
    const checkoutPageSizes = [20, 10, 5, 1];
    try {
      let lastError: unknown = null;
      for (const pageSize of checkoutPageSizes) {
        try {
          plansData = await this.soroban.invokeView(contractId, 'list_plans', [
            { type: 'u32', value: 0 },
            { type: 'u32', value: pageSize },
          ]);
          lastError = null;
          break;
        } catch (error) {
          if (this.parseContractErrorCode(error) === 13) {
            lastError = error;
            continue;
          }
          throw error;
        }
      }
      if (lastError) throw lastError;
    } catch (error) {
      if (
        this.parseContractErrorCode(error) ===
        BillingService.CONTRACT_ERR_NOT_INITIALIZED
      ) {
        await this.initializeContractIfPossible(project);
        let postInitError: unknown = null;
        for (const pageSize of checkoutPageSizes) {
          try {
            plansData = await this.soroban.invokeView(contractId, 'list_plans', [
              { type: 'u32', value: 0 },
              { type: 'u32', value: pageSize },
            ]);
            postInitError = null;
            break;
          } catch (innerError) {
            if (this.parseContractErrorCode(innerError) === 13) {
              postInitError = innerError;
              continue;
            }
            throw innerError;
          }
        }
        if (postInitError) throw postInitError;
      } else {
        throw this.toClientException(error, 'Failed to load checkout plans');
      }
    }

    const plans = Array.isArray(plansData)
      ? plansData.map((p) => this.mapPlan(p))
      : [];
    let subscription: ReturnType<typeof this.mapSubscription> | null = null;
    let remainingAllowanceStroops: string | null = null;
    let remainingCycles: number | null = null;

    if (subscriber?.trim()) {
      try {
        const rawSub = await this.soroban.invokeView(
          contractId,
          'get_subscription',
          [{ type: 'address', value: subscriber.trim() }],
        );
        if (rawSub) subscription = this.mapSubscription(rawSub);
      } catch (error) {
        const code = this.parseContractErrorCode(error);
        if (code !== 9) {
          throw this.toClientException(error, 'Failed to load subscriber state');
        }
      }
    }

    if (subscription?.active) {
      const paymentTokenContractId = this.resolveProjectPaymentTokenContractId(project);
      const currentPlan = plans.find((p) => p.id === subscription!.planId);
      if (paymentTokenContractId && currentPlan && Number(currentPlan.priceStroops) > 0) {
        try {
          const rawAllowance = await this.soroban.invokeView(
            paymentTokenContractId,
            'allowance',
            [
              { type: 'address', value: subscription.subscriber },
              { type: 'address', value: contractId },
            ],
          );
          const allowance = this.parseI128Like(rawAllowance);
          const price = this.parseI128Like(currentPlan.priceStroops);
          remainingAllowanceStroops = allowance.toString();
          remainingCycles = Number(allowance / price);
        } catch {
          remainingAllowanceStroops = null;
          remainingCycles = null;
        }
      }
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        network: project.network,
        paymentCurrency: project.paymentCurrency ?? 'USDC',
        subscriptionContractId: contractId,
      },
      remainingAllowanceStroops,
      remainingCycles,
      plans,
      subscription,
    };
  }

  async prepareSubscribe(projectId: string, subscriber: string, planId: number) {
    const project = await this.assertProjectForCheckout(projectId);
    const contractId = project.subscriptionContractId;
    if (!contractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const address = subscriber.trim();
    if (!address) {
      throw new BadRequestException('Subscriber address is required');
    }
    try {
      const rawPlan = await this.soroban.invokeView(contractId, 'get_plan', [
        { type: 'u32', value: planId },
      ]);
      const plan = this.mapPlan(rawPlan);
      if (!plan.active) {
        throw new BadRequestException('Plan is inactive');
      }
      return await this.soroban.prepareUnsignedInvokeXdr(
        address,
        contractId,
        'subscribe',
        [
          { type: 'address', value: address },
          { type: 'u32', value: planId },
        ],
      );
    } catch (error) {
      throw this.toCheckoutActionException(
        error,
        'Failed to prepare subscribe transaction',
      );
    }
  }

  async prepareCancel(projectId: string, subscriber: string) {
    const project = await this.assertProjectForCheckout(projectId);
    const contractId = project.subscriptionContractId;
    if (!contractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const address = subscriber.trim();
    if (!address) {
      throw new BadRequestException('Subscriber address is required');
    }
    try {
      return await this.soroban.prepareUnsignedInvokeXdr(
        address,
        contractId,
        'cancel',
        [{ type: 'address', value: address }],
      );
    } catch (error) {
      throw this.toCheckoutActionException(
        error,
        'Failed to prepare cancel transaction',
      );
    }
  }

  async prepareRenewAllowance(
    projectId: string,
    subscriber: string,
    amountStroops: string,
    expirationLedgers?: number,
  ) {
    const project = await this.assertProjectForCheckout(projectId);
    const contractId = project.subscriptionContractId;
    if (!contractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const paymentTokenContractId = this.resolveProjectPaymentTokenContractId(project);
    if (!paymentTokenContractId) {
      throw new BadRequestException('Project has no payment token contract configured');
    }
    const address = subscriber.trim();
    if (!address) {
      throw new BadRequestException('Subscriber address is required');
    }
    const amount = amountStroops.trim();
    if (!amount || Number(amount) <= 0) {
      throw new BadRequestException('amountStroops must be greater than 0');
    }
    const latestLedger = await this.soroban.getLatestLedgerSequence();
    const expiration = this.clampAllowanceExpirationLedger(
      latestLedger,
      expirationLedgers,
    );
    try {
      return await this.soroban.prepareUnsignedInvokeXdr(
        address,
        paymentTokenContractId,
        'approve',
        [
          { type: 'address', value: address },
          { type: 'address', value: contractId },
          { type: 'i128', value: amount },
          { type: 'u32', value: expiration },
        ],
      );
    } catch (error) {
      throw this.toCheckoutActionException(
        error,
        'Failed to prepare allowance transaction',
      );
    }
  }

  async prepareIncreaseAllowanceCycles(
    projectId: string,
    subscriber: string,
    planId: number,
    additionalCycles: number,
  ) {
    const project = await this.assertProjectForCheckout(projectId);
    const contractId = project.subscriptionContractId;
    if (!contractId) {
      throw new BadRequestException('Project has no deployed subscription contract');
    }
    const paymentTokenContractId = this.resolveProjectPaymentTokenContractId(project);
    if (!paymentTokenContractId) {
      throw new BadRequestException('Project has no payment token contract configured');
    }
    const address = subscriber.trim();
    if (!address) {
      throw new BadRequestException('Subscriber address is required');
    }
    const cycles = Math.floor(Number(additionalCycles));
    if (!Number.isFinite(cycles) || cycles <= 0) {
      throw new BadRequestException('additionalCycles must be greater than 0');
    }

    const rawPlan = await this.soroban.invokeView(contractId, 'get_plan', [
      { type: 'u32', value: planId },
    ]);
    const plan = this.mapPlan(rawPlan);
    const unitPrice = this.parseI128Like(plan.priceStroops);
    if (unitPrice <= 0n) {
      throw new BadRequestException('Plan price must be greater than 0');
    }
    const currentRawAllowance = await this.soroban.invokeView(
      paymentTokenContractId,
      'allowance',
      [
        { type: 'address', value: address },
        { type: 'address', value: contractId },
      ],
    );
    const currentAllowance = this.parseI128Like(currentRawAllowance);
    const newAllowance = currentAllowance + unitPrice * BigInt(cycles);
    const latestLedger = await this.soroban.getLatestLedgerSequence();
    const expiration = this.clampAllowanceExpirationLedger(latestLedger);

    const prepared = await this.soroban.prepareUnsignedInvokeXdr(
      address,
      paymentTokenContractId,
      'approve',
      [
        { type: 'address', value: address },
        { type: 'address', value: contractId },
        { type: 'i128', value: newAllowance.toString() },
        { type: 'u32', value: expiration },
      ],
    );
    return {
      ...prepared,
      expirationLedger: expiration,
    };
  }

  async submitUserSignedXdr(signedXdr: string) {
    if (!signedXdr?.trim()) {
      throw new BadRequestException('signedXdr is required');
    }
    try {
      return await this.soroban.submitSignedXdr(signedXdr.trim());
    } catch (error) {
      throw this.toCheckoutActionException(error, 'Failed to submit transaction');
    }
  }

  private mapPlan(plan: any) {
    return {
      id: Number(plan.id),
      name: String(plan.name ?? ''),
      periodLedgers: Number(plan.period_ledgers ?? plan.periodLedgers ?? 0),
      priceStroops: String(plan.price_stroops ?? plan.priceStroops ?? '0'),
      active: Boolean(plan.active),
    };
  }

  private mapSubscription(sub: any) {
    return {
      subscriber: String(sub.subscriber),
      planId: Number(sub.plan_id ?? sub.planId ?? 0),
      startedLedger: Number(sub.started_ledger ?? sub.startedLedger ?? 0),
      nextRenewalLedger: Number(
        sub.next_renewal_ledger ?? sub.nextRenewalLedger ?? 0,
      ),
      active: Boolean(sub.active),
    };
  }
}
