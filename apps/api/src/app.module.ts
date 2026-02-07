import { Module } from '@nestjs/common';
import { FirebaseModule } from '@subfy/firebase';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhitelistModule } from './whitelist/whitelist.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    FirebaseModule.forRoot({
      projectId: process.env.FIREBASE_PROJECT_ID,
      useApplicationDefaultCredentials: true,
    }),
    WhitelistModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
