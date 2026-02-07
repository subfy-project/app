import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import { createHmac, randomBytes } from 'node:crypto';
import { UserService, type UserDocument } from '@subfy/database';

/* ──────────────────────────────────────────────────────────
 * AuthService
 *
 * SEP-10 challenge-response authentication for Stellar wallets.
 * Generates a challenge transaction, verifies the signed response,
 * and issues a JWT upon success.
 * ──────────────────────────────────────────────────────── */

interface ChallengeEntry {
  /** Plain challenge string (for message-signing path) */
  challenge: string;
  /** XDR of the unsigned challenge transaction */
  transactionXdr: string;
  /** When this challenge expires */
  expiresAt: number;
  networkPassphrase: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  /** Temporary in-memory challenge store (publicKey → ChallengeEntry) */
  private readonly challenges = new Map<string, ChallengeEntry>();

  private serverKeypair!: StellarSdk.Keypair;
  private networkPassphrase!: string;
  private jwtSecret!: string;

  constructor(private readonly userService: UserService) {}

  /* ── Lifecycle ────────────────────────────────────── */

  onModuleInit() {
    const secret = process.env.STELLAR_SERVER_SECRET;
    if (!secret) throw new Error('STELLAR_SERVER_SECRET env var is required');

    this.serverKeypair = StellarSdk.Keypair.fromSecret(secret);

    const network = (process.env.STELLAR_NETWORK || 'testnet').toLowerCase();
    this.networkPassphrase =
      network === 'public'
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET;

    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

    this.logger.log(
      `SEP-10 auth ready — server pubkey ${this.serverKeypair.publicKey()} on ${network}`,
    );
  }

  /* ── Challenge generation ─────────────────────────── */

  async generateChallenge(clientPublicKey: string): Promise<{
    challenge: string;
    transaction: string;
    networkPassphrase: string;
  }> {
    // Validate the public key
    try {
      StellarSdk.Keypair.fromPublicKey(clientPublicKey);
    } catch {
      throw new BadRequestException('Invalid Stellar public key');
    }

    const nonce = randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);

    // Build a SEP-10 challenge transaction
    const account = new StellarSdk.Account(
      this.serverKeypair.publicKey(),
      '-1',
    );

    const builder = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
      timebounds: {
        minTime: now,
        maxTime: now + 300, // 5 minutes
      },
    });

    builder.addOperation(
      StellarSdk.Operation.manageData({
        source: clientPublicKey,
        name: 'subfy auth',
        value: nonce,
      }),
    );

    const tx = builder.build();
    tx.sign(this.serverKeypair);

    const transactionXdr = tx.toXDR();

    // Plain challenge string for message-signing flow
    const challenge = `subfy-auth:${clientPublicKey}:${nonce}`;

    // Store challenge for verification
    this.challenges.set(clientPublicKey, {
      challenge,
      transactionXdr,
      expiresAt: (now + 300) * 1000, // ms
      networkPassphrase: this.networkPassphrase,
    });

    return {
      challenge,
      transaction: transactionXdr,
      networkPassphrase: this.networkPassphrase,
    };
  }

  /* ── Transaction signature verification ──────────── */

  async verifyTransactionSignature(
    clientPublicKey: string,
    signedTransactionXdr: string,
  ): Promise<{ token: string; user: UserDocument }> {
    const entry = this.challenges.get(clientPublicKey);
    if (!entry) {
      throw new UnauthorizedException(
        'No pending challenge for this public key. Request a new one.',
      );
    }

    if (Date.now() > entry.expiresAt) {
      this.challenges.delete(clientPublicKey);
      throw new UnauthorizedException('Challenge has expired');
    }

    try {
      const tx = StellarSdk.TransactionBuilder.fromXDR(
        signedTransactionXdr,
        this.networkPassphrase,
      ) as StellarSdk.Transaction;

      // Verify that the server signed the original challenge
      const serverPubkey = this.serverKeypair.publicKey();
      const clientKp = StellarSdk.Keypair.fromPublicKey(clientPublicKey);

      // Check structure: must have exactly 1 manageData op
      if (tx.operations.length !== 1) {
        throw new Error('Invalid challenge transaction structure');
      }

      const op = tx.operations[0] as StellarSdk.Operation.ManageData;
      if (op.type !== 'manageData' || op.name !== 'subfy auth') {
        throw new Error('Invalid challenge operation');
      }

      // Verify signatures — need both server and client
      const txHash = tx.hash();

      const serverSigned = tx.signatures.some((sig) => {
        try {
          return this.serverKeypair.verify(txHash, sig.signature());
        } catch {
          return false;
        }
      });

      const clientSigned = tx.signatures.some((sig) => {
        try {
          return clientKp.verify(txHash, sig.signature());
        } catch {
          return false;
        }
      });

      if (!serverSigned || !clientSigned) {
        throw new Error('Missing required signatures');
      }
    } catch (err) {
      this.challenges.delete(clientPublicKey);
      const msg = err instanceof Error ? err.message : 'Verification failed';
      throw new UnauthorizedException(msg);
    }

    // Cleanup and issue token
    this.challenges.delete(clientPublicKey);
    const user = await this.userService.upsertUser(clientPublicKey);
    const token = this.issueJwt(clientPublicKey);

    return { token, user };
  }

  /* ── Message signature verification ──────────────── */

  async verifyMessageSignature(
    clientPublicKey: string,
    signature: string,
  ): Promise<{ token: string; user: UserDocument }> {
    const entry = this.challenges.get(clientPublicKey);
    if (!entry) {
      throw new UnauthorizedException(
        'No pending challenge for this public key. Request a new one.',
      );
    }

    if (Date.now() > entry.expiresAt) {
      this.challenges.delete(clientPublicKey);
      throw new UnauthorizedException('Challenge has expired');
    }

    try {
      const clientKp = StellarSdk.Keypair.fromPublicKey(clientPublicKey);
      const messageBuffer = Buffer.from(entry.challenge, 'utf-8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      const valid = clientKp.verify(messageBuffer, signatureBuffer);

      if (!valid) {
        throw new Error('Invalid message signature');
      }
    } catch (err) {
      this.challenges.delete(clientPublicKey);
      const msg = err instanceof Error ? err.message : 'Verification failed';
      throw new UnauthorizedException(msg);
    }

    this.challenges.delete(clientPublicKey);
    const user = await this.userService.upsertUser(clientPublicKey);
    const token = this.issueJwt(clientPublicKey);

    return { token, user };
  }

  /* ── JWT helpers ──────────────────────────────────── */

  private issueJwt(publicKey: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: publicKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64url');

    const unsigned = `${encode(header)}.${encode(payload)}`;
    const sig = createHmac('sha256', this.jwtSecret)
      .update(unsigned)
      .digest('base64url');

    return `${unsigned}.${sig}`;
  }

  verifyJwt(token: string): { sub: string; iat: number; exp: number } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed token');
    }

    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = createHmac('sha256', this.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (sigB64 !== expectedSig) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString(),
    );

    if (payload.exp < Date.now() / 1000) {
      throw new UnauthorizedException('Token has expired');
    }

    return payload;
  }
}
