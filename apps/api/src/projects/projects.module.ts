import { Module } from '@nestjs/common';
import { ProjectService } from '@subfy/database';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
