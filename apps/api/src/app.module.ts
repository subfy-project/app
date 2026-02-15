import { Module } from '@nestjs/common';
import { FirebaseModule } from '@subfy/firebase';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhitelistModule } from './whitelist/whitelist.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { BillingModule } from './billing/billing.module';
import { SorobanModule } from './soroban/soroban.module';

@Module({
  imports: [
    FirebaseModule.forRoot({
      projectId: process.env.FIREBASE_PROJECT_ID,
      useApplicationDefaultCredentials: true,
    }),
    WhitelistModule,
    AuthModule,
    ProjectsModule,
    DeploymentsModule,
    BillingModule,
    SorobanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
