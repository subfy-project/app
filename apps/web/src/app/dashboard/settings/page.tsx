"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  PageHeader,
  Separator,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@subfy/ui";
import { useProjects } from "@/lib/projects/context";
import { useWallet } from "@/lib/wallet";
import { renameProject } from "@/lib/api/projects";
import { useToast } from "@/components/toast-provider";
import { toDisplayError } from "@/lib/errors";

export default function SettingsPage() {
  const { token } = useWallet();
  const { showToast } = useToast();
  const { selectedProject, refreshProjects } = useProjects();
  const [name, setName] = useState(selectedProject?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(selectedProject?.name ?? "");
  }, [selectedProject?.id, selectedProject?.name]);

  async function onRename(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedProject) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await renameProject(token, selectedProject.id, name);
      await refreshProjects();
      setMessage("Project renamed successfully.");
      showToast({
        title: "Project updated",
        description: "Project renamed successfully.",
        variant: "success",
      });
    } catch (err) {
      const displayError = toDisplayError(err, "Unable to rename project");
      setError(displayError);
      showToast({
        title: "Rename failed",
        description: displayError,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Settings"
        subtitle="Project details and linked contract information."
      />
      <Separator />

      {!selectedProject ? (
        <p className="text-sm text-text-secondary">Select a project first.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Project information</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={onRename}>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Project name"
                  disabled={saving}
                />
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : "Rename project"}
                </Button>
              </form>
              {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
              {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contract information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-outfit text-sm text-text-secondary">
              <p>
                <span className="text-text-primary">Project ID:</span> {selectedProject.id}
              </p>
              <p>
                <span className="text-text-primary">Network:</span> {selectedProject.network}
              </p>
              <p>
                <span className="text-text-primary">Status:</span> {selectedProject.status}
              </p>
              <p>
                <span className="text-text-primary">Payment currency:</span>{" "}
                {selectedProject.paymentCurrency ?? "USDC"}
              </p>
              <p>
                <span className="text-text-primary">Subscription contract:</span>{" "}
                {selectedProject.subscriptionContractId ?? "-"}
              </p>
              <p>
                <span className="text-text-primary">Payment token contract:</span>{" "}
                {selectedProject.paymentTokenContractId ?? "-"}
              </p>
              <p>
                <span className="text-text-primary">Treasury:</span>{" "}
                {selectedProject.treasuryAddress}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
