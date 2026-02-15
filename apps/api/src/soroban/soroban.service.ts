import { Injectable } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import { randomBytes } from 'node:crypto';

type ScArg =
  | { type: 'u32'; value: number }
  | { type: 'i128'; value: string | number | bigint }
  | { type: 'bool'; value: boolean }
  | { type: 'address'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'string'; value: string };
type InvokeSpec = {
  contractId: string;
  method: string;
  args: ScArg[];
};

@Injectable()
export class SorobanService {
  getRpcServer(): StellarSdk.rpc.Server {
    const rpcUrl =
      process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
    return new StellarSdk.rpc.Server(rpcUrl);
  }

  getNetworkPassphrase(): string {
    if (process.env.SOROBAN_NETWORK_PASSPHRASE) {
      return process.env.SOROBAN_NETWORK_PASSPHRASE;
    }
    const network = (process.env.STELLAR_NETWORK ?? 'testnet').toLowerCase();
    return network === 'public'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;
  }

  getBackendKeypair(): StellarSdk.Keypair {
    const secret =
      process.env.SB_BACKEND_SIGNER_SECRET ?? process.env.STELLAR_SERVER_SECRET;
    if (!secret) {
      throw new Error(
        'Missing signer secret (SB_BACKEND_SIGNER_SECRET or STELLAR_SERVER_SECRET)',
      );
    }
    return StellarSdk.Keypair.fromSecret(secret);
  }

  private toScVal(arg: ScArg): StellarSdk.xdr.ScVal {
    switch (arg.type) {
      case 'u32':
        return StellarSdk.nativeToScVal(arg.value, { type: 'u32' });
      case 'i128':
        return StellarSdk.nativeToScVal(arg.value, { type: 'i128' });
      case 'bool':
        return StellarSdk.nativeToScVal(arg.value, { type: 'bool' });
      case 'address':
        return StellarSdk.nativeToScVal(arg.value, { type: 'address' });
      case 'symbol':
        return StellarSdk.nativeToScVal(arg.value, { type: 'symbol' });
      case 'string':
        return StellarSdk.nativeToScVal(arg.value, { type: 'string' });
      default:
        throw new Error('Unsupported argument type');
    }
  }

  private async buildInvokeTx(
    sourcePublicKey: string,
    contractId: string,
    method: string,
    args: ScArg[],
  ): Promise<StellarSdk.Transaction> {
    const server = this.getRpcServer();
    const account = await server.getAccount(sourcePublicKey);
    return new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: args.map((a) => this.toScVal(a)),
        }),
      )
      .setTimeout(60)
      .build();
  }

  private async buildBackendInvokeTx(
    contractId: string,
    method: string,
    args: ScArg[],
  ): Promise<StellarSdk.Transaction> {
    return this.buildInvokeTx(
      this.getBackendKeypair().publicKey(),
      contractId,
      method,
      args,
    );
  }

  async invokeView(contractId: string, method: string, args: ScArg[]) {
    const server = this.getRpcServer();
    const tx = await this.buildBackendInvokeTx(contractId, method, args);
    const sim = await server.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(sim)) {
      throw new Error(sim.error);
    }
    const retval = sim.result?.retval;
    if (!retval) return null;
    return StellarSdk.scValToNative(retval);
  }

  async invokeSigned(
    contractId: string,
    method: string,
    args: ScArg[],
  ): Promise<{ txHash: string }> {
    const server = this.getRpcServer();
    const source = this.getBackendKeypair();
    const tx = await this.buildBackendInvokeTx(contractId, method, args);
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(source);

    const send = await server.sendTransaction(prepared);
    if (send.status === 'ERROR') {
      throw new Error('sendTransaction returned ERROR');
    }

    const polled = await server.pollTransaction(send.hash);
    if ((polled as { status?: string }).status !== 'SUCCESS') {
      throw new Error(
        `Transaction failed or not confirmed (${(polled as { status?: string }).status ?? 'unknown'})`,
      );
    }
    return { txHash: send.hash };
  }

  async prepareUnsignedInvokeXdr(
    sourcePublicKey: string,
    contractId: string,
    method: string,
    args: ScArg[],
  ): Promise<{ unsignedXdr: string; networkPassphrase: string }> {
    const server = this.getRpcServer();
    const tx = await this.buildInvokeTx(sourcePublicKey, contractId, method, args);
    const prepared = await server.prepareTransaction(tx);
    return {
      unsignedXdr: prepared.toXDR(),
      networkPassphrase: this.getNetworkPassphrase(),
    };
  }

  async prepareUnsignedBatchInvokeXdr(
    sourcePublicKey: string,
    invocations: InvokeSpec[],
  ): Promise<{ unsignedXdr: string; networkPassphrase: string }> {
    if (!invocations.length) {
      throw new Error('At least one invocation is required');
    }
    const server = this.getRpcServer();
    const account = await server.getAccount(sourcePublicKey);
    const builder = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.getNetworkPassphrase(),
    });
    for (const invocation of invocations) {
      builder.addOperation(
        StellarSdk.Operation.invokeContractFunction({
          contract: invocation.contractId,
          function: invocation.method,
          args: invocation.args.map((a) => this.toScVal(a)),
        }),
      );
    }
    const tx = builder.setTimeout(60).build();
    const prepared = await server.prepareTransaction(tx);
    return {
      unsignedXdr: prepared.toXDR(),
      networkPassphrase: this.getNetworkPassphrase(),
    };
  }

  async prepareDeployContractXdr(
    ownerPublicKey: string,
    wasmHashHex: string,
  ): Promise<{ unsignedXdr: string; saltHex: string }> {
    const server = this.getRpcServer();
    const account = await server.getAccount(ownerPublicKey);
    const salt = randomBytes(32);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.createCustomContract({
          address: StellarSdk.Address.fromString(ownerPublicKey),
          wasmHash: Buffer.from(wasmHashHex, 'hex'),
          salt,
        }),
      )
      .setTimeout(60)
      .build();

    const prepared = await server.prepareTransaction(tx);
    return {
      unsignedXdr: prepared.toXDR(),
      saltHex: salt.toString('hex'),
    };
  }

  async submitSignedXdr(
    signedXdr: string,
  ): Promise<{ txHash: string; contractId: string | null }> {
    const server = this.getRpcServer();
    const tx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      this.getNetworkPassphrase(),
    ) as StellarSdk.Transaction;

    const send = await server.sendTransaction(tx);
    if (send.status === 'ERROR') {
      throw new Error('sendTransaction returned ERROR');
    }

    const polled = await server.pollTransaction(send.hash);
    if ((polled as { status?: string }).status !== 'SUCCESS') {
      throw new Error(
        `Transaction failed or not confirmed (${(polled as { status?: string }).status ?? 'unknown'})`,
      );
    }
    let contractId: string | null = null;
    const success = polled as { returnValue?: StellarSdk.xdr.ScVal };
    if (success.returnValue) {
      const native = StellarSdk.scValToNative(success.returnValue);
      if (typeof native === 'string' && native.startsWith('C')) {
        contractId = native;
      }
    }
    return { txHash: send.hash, contractId };
  }

  async getLatestLedgerSequence(): Promise<number> {
    const server = this.getRpcServer();
    const latest = await server.getLatestLedger();
    return latest.sequence;
  }
}
