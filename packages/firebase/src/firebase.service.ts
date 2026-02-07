import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { readFileSync } from "node:fs";
import {
  ServiceAccount,
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { FIREBASE_MODULE_OPTIONS } from "./firebase.constants";
import type { FirebaseModuleOptions } from "./firebase.types";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firestoreInstance: Firestore | null = null;

  constructor(
    @Inject(FIREBASE_MODULE_OPTIONS)
    private readonly options: FirebaseModuleOptions,
  ) {}

  onModuleInit(): void {
    if (getApps().length > 0) {
      return;
    }

    const appOptions = this.buildAppOptions();
    if (this.options.appName) {
      initializeApp(appOptions, this.options.appName);
      return;
    }

    const app = initializeApp(appOptions);
    if (process.env.NODE_ENV !== "production") {
      console.log("[firebase-admin] initialized", {
        projectId: app.options.projectId ?? null,
        envProjectId: process.env.FIREBASE_PROJECT_ID ?? null,
        databaseId: this.options.databaseId ?? null,
      });
    }
  }

  getFirestore(): Firestore {
    if (this.firestoreInstance) {
      return this.firestoreInstance;
    }

    const app = this.options.appName ? getApp(this.options.appName) : getApp();
    this.firestoreInstance = this.options.databaseId
      ? getFirestore(app, this.options.databaseId)
      : getFirestore(app);
    return this.firestoreInstance;
  }

  private buildAppOptions() {
    const serviceAccountPath =
      this.options.serviceAccountPath ??
      (this.options.serviceAccountPathEnv
        ? process.env[this.options.serviceAccountPathEnv]
        : undefined);

    if (serviceAccountPath) {
      const serviceAccount = this.loadServiceAccount(serviceAccountPath);
      const projectId = this.resolveProjectId(serviceAccount.projectId);
      return {
        credential: cert(serviceAccount),
        projectId,
        storageBucket: this.options.storageBucket,
      };
    }

    if (this.options.useApplicationDefaultCredentials) {
      return {
        credential: applicationDefault(),
        projectId: this.resolveProjectId(),
        storageBucket: this.options.storageBucket,
      };
    }

    if (this.options.clientEmail && this.options.privateKey) {
      const projectId = this.resolveProjectId();
      return {
        credential: cert({
          projectId,
          clientEmail: this.options.clientEmail,
          privateKey: this.normalizePrivateKey(this.options.privateKey),
        }),
        projectId,
        storageBucket: this.options.storageBucket,
      };
    }

    return {
      projectId: this.resolveProjectId(),
      storageBucket: this.options.storageBucket,
    };
  }

  private normalizePrivateKey(privateKey: string): string {
    return privateKey.replace(/\\n/g, "\n");
  }

  private resolveProjectId(fallback?: string): string | undefined {
    return (
      this.options.projectId ??
      fallback ??
      process.env.FIREBASE_PROJECT_ID ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.GCLOUD_PROJECT
    );
  }

  private loadServiceAccount(path: string): ServiceAccount {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
    };

    const projectId = parsed.projectId ?? parsed.project_id;
    const clientEmail = parsed.clientEmail ?? parsed.client_email;
    const privateKeyRaw = parsed.privateKey ?? parsed.private_key;
    const privateKey = privateKeyRaw ? this.normalizePrivateKey(privateKeyRaw) : undefined;

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    if (!serviceAccount.projectId && !serviceAccount.clientEmail && !serviceAccount.privateKey) {
      return parsed as ServiceAccount;
    }

    return serviceAccount;
  }
}
