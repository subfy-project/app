export interface FirebaseModuleOptions {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  serviceAccountPath?: string;
  serviceAccountPathEnv?: string;
  storageBucket?: string;
  databaseId?: string;
  appName?: string;
  useApplicationDefaultCredentials?: boolean;
}
