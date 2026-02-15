export interface WasmReleaseDocument {
  id: string;
  contractName: string;
  network: 'testnet' | 'public';
  bucketPath: string;
  gcsUri: string;
  wasmHash: string;
  sha256: string;
  gitSha: string;
  uploadedAtUtc: string;
  paymentTokenContractId: string | null;
  createdAt: string;
}

export interface CreateWasmReleaseInput {
  contractName: string;
  network: 'testnet' | 'public';
  bucketPath: string;
  gcsUri: string;
  wasmHash: string;
  sha256: string;
  gitSha: string;
  uploadedAtUtc: string;
  paymentTokenContractId?: string | null;
}
