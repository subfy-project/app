import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { DeploymentsExecutionService } from './deployments.execution.service';

class DeploymentTaskDto {
  deploymentId!: string;
  projectId!: string;
}

@Controller('internal/tasks')
export class DeploymentsTasksController {
  constructor(private readonly execution: DeploymentsExecutionService) {}

  @Post('deploy-contract')
  async deployContractTask(
    @Body() body: DeploymentTaskDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = process.env.INTERNAL_TASKS_TOKEN;
    if (token && authorization !== `Bearer ${token}`) {
      throw new UnauthorizedException('Invalid internal task token');
    }

    await this.execution.executeTask({
      deploymentId: body.deploymentId,
      projectId: body.projectId,
    });
    return { ok: true };
  }
}
