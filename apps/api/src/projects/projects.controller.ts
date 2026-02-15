import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ProjectsService } from './projects.service';

class CreateProjectDto {
  name!: string;
  network!: 'testnet' | 'public';
  paymentCurrency!: 'USDC' | 'EURC';
  treasuryAddress!: string;
}

class RenameProjectDto {
  name!: string;
}

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject({
      ownerPublicKey: req.user.sub,
      name: body.name,
      network: body.network ?? 'testnet',
      paymentCurrency: body.paymentCurrency ?? 'USDC',
      treasuryAddress: body.treasuryAddress,
    });
  }

  @Get()
  async listProjects(@Req() req: any) {
    return this.projectsService.listOwnerProjects(req.user.sub);
  }

  @Get(':projectId')
  async getProject(@Req() req: any, @Param('projectId') projectId: string) {
    return this.projectsService.getProjectOwnedBy(projectId, req.user.sub);
  }

  @Patch(':projectId')
  async renameProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Body() body: RenameProjectDto,
  ) {
    return this.projectsService.renameProject(
      projectId,
      req.user.sub,
      body.name,
    );
  }
}
