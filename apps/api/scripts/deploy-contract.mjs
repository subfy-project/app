#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import * as StellarSDK from "@stellar/stellar-sdk";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(apiDir, "..", "..");
const contractsDir = path.resolve(repoRoot, "contracts");

dotenv.config({ path: path.resolve(apiDir, ".env") });

function printHelp() {
  console.log(`Usage:
  pnpm --filter @repo/api soroban:deploy -- [options]

Options:
  --contract-name <name>       Contract crate name (default: sb_subscription)
  --wasm-path <path>           Path to wasm file (default: contracts target path)
  --source-secret <secret>     Stellar secret key (S...) used to upload wasm
  --release-network <name>     Release network label: testnet/public (default from STELLAR_NETWORK)
  --gcs-uri <uri>              Artifact URI stored in DB (example gs://bucket/path/file.wasm)
  --bucket-path <path>         Bucket path metadata stored in DB
  --git-sha <sha>              Git SHA metadata (default from GITHUB_SHA or local)
  --network <name>             Network alias (testnet/public/custom from stellar config)
  --rpc-url <url>              Soroban RPC URL
  --network-passphrase <text>  Network passphrase (used with --rpc-url)
  --register-only              Skip upload and register release metadata only
  --build                      Build before deploy (default)
  --no-build                   Skip build
  --help                       Show this help

Environment fallback (apps/api/.env loaded first):
  SOROBAN_RPC_URL
  SOROBAN_NETWORK_PASSPHRASE
  STELLAR_NETWORK
  SB_RELEASE_NETWORK
  SB_WASM_GCS_URI
  SB_WASM_BUCKET_PATH
  SB_BACKEND_SIGNER_SECRET
  STELLAR_SERVER_SECRET
  FIREBASE_PROJECT_ID
  GOOGLE_APPLICATION_CREDENTIALS
`);
}

function readArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

if (hasFlag("--help")) {
  printHelp();
  process.exit(0);
}

const contractName = readArg("--contract-name") ?? "sb_subscription";
const shouldBuild = hasFlag("--no-build") ? false : true;
const registerOnly = hasFlag("--register-only");
const wasmPath =
  readArg("--wasm-path") ??
  path.resolve(
    contractsDir,
    "target",
    "wasm32v1-none",
    "release",
    `${contractName}.wasm`,
  );
const sourceSecret =
  readArg("--source-secret") ??
  process.env.SB_BACKEND_SIGNER_SECRET ??
  process.env.STELLAR_SERVER_SECRET;
const rpcUrl = readArg("--rpc-url") ?? process.env.SOROBAN_RPC_URL;
const network = readArg("--network") ?? process.env.STELLAR_NETWORK;
const releaseNetworkRaw =
  readArg("--release-network") ??
  process.env.SB_RELEASE_NETWORK ??
  network ??
  "testnet";
const releaseNetwork =
  releaseNetworkRaw.toLowerCase() === "public" ? "public" : "testnet";
const gcsUri = readArg("--gcs-uri") ?? process.env.SB_WASM_GCS_URI;
const bucketPath = readArg("--bucket-path") ?? process.env.SB_WASM_BUCKET_PATH;
const gitSha =
  readArg("--git-sha") ??
  process.env.GITHUB_SHA ??
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  }).stdout?.trim() ??
  "unknown";
let networkPassphrase =
  readArg("--network-passphrase") ?? process.env.SOROBAN_NETWORK_PASSPHRASE;

if (!networkPassphrase && network) {
  const n = network.toLowerCase();
  if (n === "testnet") {
    networkPassphrase = "Test SDF Network ; September 2015";
  } else if (n === "public" || n === "mainnet") {
    networkPassphrase = "Public Global Stellar Network ; September 2015";
  }
}

if (!registerOnly && !sourceSecret) {
  console.error(
    "Missing source secret. Pass --source-secret or set SB_BACKEND_SIGNER_SECRET / STELLAR_SERVER_SECRET in env.",
  );
  process.exit(1);
}

if (shouldBuild) {
  console.log(`Building contract '${contractName}' in ${contractsDir}...`);
  const build = spawnSync("stellar", ["contract", "build"], {
    cwd: contractsDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

if (!fs.existsSync(wasmPath)) {
  console.error(`WASM file not found: ${wasmPath}`);
  process.exit(1);
}

if (!rpcUrl || !networkPassphrase) {
  console.error(
    "Missing RPC config. Provide --rpc-url and --network-passphrase (or SOROBAN_RPC_URL + SOROBAN_NETWORK_PASSPHRASE / STELLAR_NETWORK).",
  );
  process.exit(1);
}

const wasmBytecode = fs.readFileSync(wasmPath);
const sha256 = createHash("sha256").update(wasmBytecode).digest("hex");
const uploadedAtUtc = new Date().toISOString();

async function uploadWasmAndGetHash() {
  const server = new StellarSDK.rpc.Server(rpcUrl);
  const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
  const account = await server.getAccount(sourceKeypair.publicKey());

  const tx = new StellarSDK.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(StellarSDK.Operation.uploadContractWasm({ wasm: wasmBytecode }))
    .setTimeout(120)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sourceKeypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error("sendTransaction returned ERROR for uploadContractWasm");
  }

  const txResult = await server.pollTransaction(sendResult.hash);
  if (txResult.status !== "SUCCESS") {
    throw new Error(`uploadContractWasm failed: ${txResult.status}`);
  }
  if (!txResult.returnValue) {
    throw new Error("Missing returnValue from uploadContractWasm transaction");
  }

  const native = StellarSDK.scValToNative(txResult.returnValue);
  if (Buffer.isBuffer(native)) return native.toString("hex");
  if (native instanceof Uint8Array) return Buffer.from(native).toString("hex");
  if (typeof native === "string") return native.replace(/^0x/, "");
  throw new Error("Unexpected wasm hash return value format");
}

async function registerWasmRelease(wasmHashHex) {
  const buildDatabase = spawnSync(
    "pnpm",
    ["--filter", "@subfy/database", "build"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (buildDatabase.status !== 0) {
    throw new Error("Failed to build @subfy/database");
  }

  const buildFirebase = spawnSync(
    "pnpm",
    ["--filter", "@subfy/firebase", "build"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (buildFirebase.status !== 0) {
    throw new Error("Failed to build @subfy/firebase");
  }

  const { WasmReleaseService } = await import(
    pathToFileURL(path.resolve(repoRoot, "packages/database/dist/index.js")).href,
  );
  const { FirebaseService } = await import(
    pathToFileURL(path.resolve(repoRoot, "packages/firebase/dist/index.js")).href,
  );

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const firebase = new FirebaseService({
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountPath: credentialPath
      ? path.isAbsolute(credentialPath)
        ? credentialPath
        : path.resolve(apiDir, credentialPath)
      : undefined,
    useApplicationDefaultCredentials: !credentialPath,
  });
  firebase.onModuleInit();

  const wasmReleaseService = new WasmReleaseService(firebase);
  const defaultUri = `local://${path.relative(repoRoot, wasmPath).replaceAll("\\", "/")}`;
  const release = await wasmReleaseService.create({
    contractName,
    network: releaseNetwork,
    bucketPath: bucketPath ?? defaultUri,
    gcsUri: gcsUri ?? defaultUri,
    wasmHash: wasmHashHex,
    sha256,
    gitSha,
    uploadedAtUtc,
    paymentTokenContractId: null,
  });
  return release;
}

async function main() {
  let wasmHashHex = "manual-unknown";
  if (!registerOnly) {
    console.log("Uploading wasm using Stellar SDK uploadContractWasm...");
    wasmHashHex = await uploadWasmAndGetHash();
    console.log(`WASM hash: ${wasmHashHex}`);
  } else {
    const provided = process.env.SB_WASM_HASH;
    if (!provided) {
      throw new Error("register-only requires SB_WASM_HASH in environment");
    }
    wasmHashHex = provided;
  }

  console.log("Registering wasm release in Firestore...");
  const release = await registerWasmRelease(wasmHashHex);
  console.log("Release registered:");
  console.log(`  id=${release.id}`);
  console.log(`  contractName=${release.contractName}`);
  console.log(`  network=${release.network}`);
  console.log(`  wasmHash=${release.wasmHash}`);
  console.log(`  gcsUri=${release.gcsUri}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
