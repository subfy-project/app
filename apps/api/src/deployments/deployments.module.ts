import { Module } from '@nestjs/common';
import { DeploymentService, ProjectService, WasmReleaseService } from '@subfy/database';
import { AuthModule } from '../auth/auth.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsExecutionService } from './deployments.execution.service';
import { DeploymentsService } from './deployments.service';
import { DeploymentsTasksController } from './deployments.tasks.controller';
import { WasmReleasesInternalController } from './wasm-releases.internal.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    DeploymentsController,
    DeploymentsTasksController,
    WasmReleasesInternalController,
  ],
  providers: [
    DeploymentsService,
    DeploymentsExecutionService,
    DeploymentService,
    ProjectService,
    WasmReleaseService,
  ],
  exports: [DeploymentsService, DeploymentsExecutionService],
})
export class DeploymentsModule {}
