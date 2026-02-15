import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  type PaymentCurrency,
  ProjectService,
  type ProjectDocument,
  type ProjectNetwork,
} from '@subfy/database';

@Injectable()
export class ProjectsService {
  constructor(private readonly projects: ProjectService) {}

  async createProject(input: {
    ownerPublicKey: string;
    name: string;
    network: ProjectNetwork;
    paymentCurrency: PaymentCurrency;
    treasuryAddress: string;
    paymentTokenContractId?: string | null;
  }): Promise<ProjectDocument> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Project name is required');
    }
    if (!input.treasuryAddress?.trim()) {
      throw new BadRequestException('Treasury address is required');
    }
    const paymentCurrency = input.paymentCurrency?.toUpperCase();
    if (paymentCurrency !== 'USDC' && paymentCurrency !== 'EURC') {
      throw new BadRequestException('Payment currency must be USDC or EURC');
    }
    return this.projects.create({
      ownerPublicKey: input.ownerPublicKey,
      name: input.name.trim(),
      network: input.network,
      paymentCurrency,
      treasuryAddress: input.treasuryAddress.trim(),
      paymentTokenContractId: input.paymentTokenContractId?.trim() || null,
    });
  }

  async listOwnerProjects(ownerPublicKey: string): Promise<ProjectDocument[]> {
    return this.projects.listByOwner(ownerPublicKey);
  }

  async getProjectOwnedBy(
    projectId: string,
    ownerPublicKey: string,
  ): Promise<ProjectDocument> {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerPublicKey !== ownerPublicKey) {
      throw new UnauthorizedException('You do not own this project');
    }
    return project;
  }

  async renameProject(
    projectId: string,
    ownerPublicKey: string,
    name: string,
  ): Promise<ProjectDocument> {
    if (!name?.trim()) {
      throw new BadRequestException('Project name is required');
    }
    await this.getProjectOwnedBy(projectId, ownerPublicKey);
    await this.projects.updateName(projectId, name.trim());
    const updated = await this.projects.findById(projectId);
    if (!updated) throw new NotFoundException('Project not found after update');
    return updated;
  }
}
