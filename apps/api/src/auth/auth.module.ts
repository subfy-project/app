import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UserService } from '@subfy/database';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, UserService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
