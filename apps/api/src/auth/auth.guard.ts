import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * JWT authentication guard.
 *
 * Usage:
 *   @UseGuards(AuthGuard)
 *   @Get('protected')
 *   handler(@Req() req) { req.user.sub === publicKey }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const token = authHeader.slice(7);
    const payload = this.authService.verifyJwt(token);

    // Attach decoded payload to request
    request.user = payload;
    return true;
  }
}
