"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDeploymentStatus, type DeploymentStatus } from "@/lib/api/projects";
import { useWallet } from "@/lib/wallet";

const TERMINAL_STATES = new Set(["SUCCESS", "FAILED"]);

export default function DeploymentStatusPage() {
  const { token } = useWallet();
  const params = useParams<{ deploymentId: string }>();
  const deploymentId = params?.deploymentId;
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !deploymentId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const payload = await getDeploymentStatus(token, deploymentId);
        if (cancelled) return;
        setStatus(payload);
        setError(null);

        if (!TERMINAL_STATES.has(payload.status)) {
          timer = setTimeout(poll, 3000);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Unable to fetch deployment status",
        );
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [deploymentId, token]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Deployment status</h1>
      <p className="text-sm text-neutral-400">Deployment id: {deploymentId}</p>

      {error ? (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!status ? (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
          Waiting for first status update...
        </div>
      ) : (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200">
          <div>Status: {status.status}</div>
          <div>Project: {status.projectId}</div>
          <div>Tx hash: {status.txHash ?? "-"}</div>
          <div>Error: {status.errorMessage ?? "-"}</div>
          <div>Updated at: {status.updatedAt}</div>
        </div>
      )}

      <Link className="inline-block text-sm text-main-400" href="/dashboard/projects">
        Back to projects
      </Link>
    </div>
  );
}
