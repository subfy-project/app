import { DynamicModule, Module, Provider } from "@nestjs/common";
import { FIREBASE_MODULE_OPTIONS } from "./firebase.constants";
import { FirebaseService } from "./firebase.service";
import { FirebaseModuleOptions } from "./firebase.types";

@Module({})
export class FirebaseModule {
  static forRoot(options: FirebaseModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: FIREBASE_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: FirebaseModule,
      providers: [optionsProvider, FirebaseService],
      exports: [FirebaseService],
      global: true,
    };
  }
}
