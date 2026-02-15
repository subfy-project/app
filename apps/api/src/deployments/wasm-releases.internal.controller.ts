import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { WasmReleaseService } from '@subfy/database';

class RegisterWasmReleaseDto {
  contractName!: string;
  network!: 'testnet' | 'public';
  bucketPath!: string;
  gcsUri!: string;
  wasmHash!: string;
  sha256!: string;
  gitSha!: string;
  uploadedAtUtc!: string;
  paymentTokenContractId?: string | null;
}

@Controller('internal/wasm-releases')
export class WasmReleasesInternalController {
  constructor(private readonly wasmReleaseService: WasmReleaseService) {}

  @Post('register')
  async register(
    @Body() body: RegisterWasmReleaseDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = process.env.WASM_RELEASES_INTERNAL_TOKEN;
    if (token && authorization !== `Bearer ${token}`) {
      throw new UnauthorizedException('Invalid wasm release internal token');
    }
    const created = await this.wasmReleaseService.create(body);
    return { id: created.id };
  }
}
