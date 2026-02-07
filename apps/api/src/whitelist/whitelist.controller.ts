import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';

class AddEmailDto {
  email!: string;
}

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Post()
  async addEmail(@Body() body: AddEmailDto) {
    const { email } = body;

    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required.');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    return this.whitelistService.addEmail(email.toLowerCase().trim());
  }

  @Get('stats')
  async getStats() {
    return this.whitelistService.getStats();
  }
}
