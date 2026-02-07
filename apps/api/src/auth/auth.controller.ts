import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

/* ── DTOs ──────────────────────────────────────────── */

class VerifyDto {
  publicKey!: string;
  /** Base64 signature (for message-signing flow) */
  signature?: string;
  /** Signed XDR (for transaction-signing flow) */
  transaction?: string;
}

/* ── Controller ────────────────────────────────────── */

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/challenge?publicKey=G...
   *
   * Returns both a plain challenge string and a SEP-10
   * challenge transaction XDR. The client picks whichever
   * signing method their wallet supports.
   */
  @Get('challenge')
  async getChallenge(@Query('publicKey') publicKey: string) {
    if (!publicKey) {
      throw new BadRequestException('publicKey query parameter is required');
    }
    return this.authService.generateChallenge(publicKey);
  }

  /**
   * POST /auth/verify
   *
   * Accepts either:
   *  - { publicKey, signature }    → message-signing verification
   *  - { publicKey, transaction }  → transaction-signing verification
   */
  @Post('verify')
  async verify(@Body() body: VerifyDto) {
    const { publicKey, signature, transaction } = body;

    if (!publicKey) {
      throw new BadRequestException('publicKey is required');
    }

    if (signature) {
      return this.authService.verifyMessageSignature(publicKey, signature);
    }

    if (transaction) {
      return this.authService.verifyTransactionSignature(
        publicKey,
        transaction,
      );
    }

    throw new BadRequestException(
      'Either "signature" or "transaction" must be provided',
    );
  }

  /**
   * GET /auth/me  (protected)
   *
   * Returns the authenticated user's public key.
   */
  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return { publicKey: req.user.sub };
  }
}
