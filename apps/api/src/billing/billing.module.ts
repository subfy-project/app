import { Module } from '@nestjs/common';
import { ProjectService } from '@subfy/database';
import { AuthModule } from '../auth/auth.module';
import { BillingCheckoutController } from './billing.checkout.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [AuthModule],
  controllers: [BillingController, BillingCheckoutController],
  providers: [BillingService, ProjectService],
})
export class BillingModule {}
