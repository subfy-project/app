import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BillingService } from './billing.service';

class PrepareSubscribeDto {
  subscriber!: string;
  planId!: number;
}

class PrepareCancelDto {
  subscriber!: string;
}

class SubmitSignedXdrDto {
  signedXdr!: string;
}

class PrepareAllowanceDto {
  subscriber!: string;
  amountStroops!: string;
  expirationLedgers?: number;
}

class PrepareIncreaseAllowanceCyclesDto {
  subscriber!: string;
  planId!: number;
  additionalCycles!: number;
}

@Controller('checkout')
export class BillingCheckoutController {
  constructor(private readonly billingService: BillingService) {}

  @Get(':projectId')
  async getCheckout(
    @Param('projectId') projectId: string,
    @Query('subscriber') subscriber?: string,
  ) {
    return this.billingService.getCheckoutContext(projectId, subscriber);
  }

  @Post(':projectId/subscribe/prepare')
  async prepareSubscribe(
    @Param('projectId') projectId: string,
    @Body() body: PrepareSubscribeDto,
  ) {
    return this.billingService.prepareSubscribe(
      projectId,
      body.subscriber,
      Number(body.planId),
    );
  }

  @Post(':projectId/cancel/prepare')
  async prepareCancel(
    @Param('projectId') projectId: string,
    @Body() body: PrepareCancelDto,
  ) {
    return this.billingService.prepareCancel(projectId, body.subscriber);
  }

  @Post(':projectId/allowance/prepare')
  async prepareAllowance(
    @Param('projectId') projectId: string,
    @Body() body: PrepareAllowanceDto,
  ) {
    return this.billingService.prepareRenewAllowance(
      projectId,
      body.subscriber,
      body.amountStroops,
      body.expirationLedgers,
    );
  }

  @Post(':projectId/allowance/increase-cycles/prepare')
  async prepareIncreaseAllowanceCycles(
    @Param('projectId') projectId: string,
    @Body() body: PrepareIncreaseAllowanceCyclesDto,
  ) {
    return this.billingService.prepareIncreaseAllowanceCycles(
      projectId,
      body.subscriber,
      Number(body.planId),
      Number(body.additionalCycles),
    );
  }

  @Post('submit')
  async submit(@Body() body: SubmitSignedXdrDto) {
    return this.billingService.submitUserSignedXdr(body.signedXdr);
  }
}
