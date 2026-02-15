"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createProject,
  getDeploymentStatus,
  listProjects,
  prepareDeployment,
  submitDeployment,
  type Project,
} from "@/lib/api/projects";
import { getKit, useWallet } from "@/lib/wallet";

const DEPLOYMENT_TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED"]);

interface CreateProjectInput {
  name: string;
  treasuryAddress: string;
  paymentCurrency: "USDC" | "EURC";
  network: "testnet" | "public";
}

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId: string | null;
  selectedProject: Project | null;
  loadingProjects: boolean;
  creatingProject: boolean;
  mustCreateProject: boolean;
  createError: string | null;
  setSelectedProjectId: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
  createAndDeployProject: (input: CreateProjectInput) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { token, publicKey } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectIdRaw] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mustCreateProject, setMustCreateProject] = useState(false);

  const refreshProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
      setSelectedProjectIdRaw(null);
      setLoadingProjects(false);
      setMustCreateProject(false);
      return;
    }
    setLoadingProjects(true);
    try {
      const items = await listProjects(token);
      setProjects(items);
      setMustCreateProject(items.length === 0);
      setSelectedProjectIdRaw((prev) => {
        if (!items.length) return null;
        if (prev && items.some((p) => p.id === prev)) return prev;
        return items[0].id;
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const setSelectedProjectId = useCallback((projectId: string) => {
    setSelectedProjectIdRaw(projectId);
  }, []);

  const createAndDeployProject = useCallback(
    async (input: CreateProjectInput) => {
      if (!token || !publicKey) {
        throw new Error("Wallet session missing");
      }

      setCreateError(null);
      setCreatingProject(true);
      try {
        const created = await createProject(token, {
          name: input.name,
          network: input.network,
          paymentCurrency: input.paymentCurrency,
          treasuryAddress: input.treasuryAddress,
        });

        const prepared = await prepareDeployment(token, created.id);
        const { signedTxXdr } = await getKit().signTransaction(prepared.unsignedXdr, {
          address: publicKey,
          networkPassphrase: prepared.networkPassphrase,
        });

        const submitted = await submitDeployment(token, created.id, {
          signedXdr: signedTxXdr,
          wasmReleaseId: prepared.wasmReleaseId,
          wasmHash: prepared.wasmHash,
          saltHex: prepared.saltHex,
        });

        const start = Date.now();
        const timeoutMs = 5 * 60 * 1000;
        while (Date.now() - start < timeoutMs) {
          const status = await getDeploymentStatus(token, submitted.deploymentId);
          if (DEPLOYMENT_TERMINAL_STATUSES.has(status.status)) {
            if (status.status === "FAILED") {
              throw new Error(status.errorMessage ?? "Deployment failed");
            }
            break;
          }
          await sleep(2500);
        }
        if (Date.now() - start >= timeoutMs) {
          throw new Error(
            "Deployment is taking too long. Check worker/queue configuration and retry.",
          );
        }

        await refreshProjects();
        setSelectedProjectIdRaw(created.id);
        setMustCreateProject(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Project creation/deployment failed";
        setCreateError(message);
        throw err;
      } finally {
        setCreatingProject(false);
      }
    },
    [publicKey, refreshProjects, token],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      selectedProjectId,
      selectedProject,
      loadingProjects,
      creatingProject,
      mustCreateProject,
      createError,
      setSelectedProjectId,
      refreshProjects,
      createAndDeployProject,
    }),
    [
      projects,
      selectedProjectId,
      selectedProject,
      loadingProjects,
      creatingProject,
      mustCreateProject,
      createError,
      setSelectedProjectId,
      refreshProjects,
      createAndDeployProject,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const value = useContext(ProjectContext);
  if (!value) {
    throw new Error("useProjects must be used within ProjectProvider");
  }
  return value;
}
