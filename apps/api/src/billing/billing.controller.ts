import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BillingService } from './billing.service';

class CreatePlanDto {
  planId!: number;
  name!: string;
  periodLedgers!: number;
  priceStroops!: string;
}

class SetPlanStatusDto {
  active!: boolean;
}

@Controller('projects/:projectId')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  async listPlans(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.listPlans(
      req.user.sub,
      projectId,
      Number(offset ?? 0),
      Number(limit ?? 20),
    );
  }

  @Get('subscriptions')
  async listSubscriptions(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.listSubscriptions(
      req.user.sub,
      projectId,
      Number(offset ?? 0),
      Number(limit ?? 20),
    );
  }

  @Post('renew-due')
  async renewDue(@Req() req: any, @Param('projectId') projectId: string) {
    return this.billingService.triggerRenewDue(req.user.sub, projectId);
  }

  @Post('plans')
  async createPlan(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Body() body: CreatePlanDto,
  ) {
    return this.billingService.createPlan(req.user.sub, projectId, {
      planId: Number(body.planId),
      name: body.name,
      periodLedgers: Number(body.periodLedgers),
      priceStroops: body.priceStroops,
    });
  }

  @Patch('plans/:planId/status')
  async setPlanStatus(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Body() body: SetPlanStatusDto,
  ) {
    return this.billingService.setPlanStatus(
      req.user.sub,
      projectId,
      Number(planId),
      Boolean(body.active),
    );
  }
}
