export interface UserDocument {
  /** Stellar public key — used as the Firestore document ID */
  publicKey: string;
  /** ISO-8601 timestamp of account creation */
  createdAt: string;
  /** ISO-8601 timestamp of last successful login */
  lastLoginAt: string;
}
