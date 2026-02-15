import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DeploymentsService } from './deployments.service';

class SubmitDeploymentDto {
  signedXdr!: string;
  wasmReleaseId!: string;
  wasmHash!: string;
  saltHex!: string;
  proposedPaymentTokenContractId?: string;
}

@Controller()
@UseGuards(AuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post('projects/:projectId/deployments/prepare')
  async prepare(@Req() req: any, @Param('projectId') projectId: string) {
    return this.deploymentsService.prepare(req.user.sub, projectId);
  }

  @Post('projects/:projectId/deployments/submit')
  async submit(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Body() body: SubmitDeploymentDto,
  ) {
    return this.deploymentsService.submit(req.user.sub, projectId, body);
  }

  @Get('deployments/:deploymentId')
  async status(@Req() req: any, @Param('deploymentId') deploymentId: string) {
    return this.deploymentsService.getStatus(req.user.sub, deploymentId);
  }
}
