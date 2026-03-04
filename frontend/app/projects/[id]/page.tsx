"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi, projectApi } from "@/lib/api/endpoints";
import { Card, EmptyState, ErrorState, SectionTitle } from "@/components/ui";
import { useToastStore } from "@/lib/toast-store";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const pushToast = useToastStore((state) => state.push);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me, retry: false });
  const projectQuery = useQuery({ queryKey: ["project", id], queryFn: () => projectApi.detail(id) });
  const proposalQuery = useQuery({ queryKey: ["project-proposals", id], queryFn: () => projectApi.proposals(id) });

  const submitProposalMutation = useMutation({
    mutationFn: () => projectApi.submitProposal(id, { message: "I can deliver this quickly.", price: "1000" }),
    onSuccess: () => {
      pushToast("success", "Proposal submitted");
      proposalQuery.refetch();
    },
    onError: () => pushToast("error", "Proposal submit failed"),
  });

  const selectMutation = useMutation({
    mutationFn: (proposalId: number) => projectApi.selectFreelancer(id, proposalId),
    onSuccess: () => pushToast("success", "Freelancer selected"),
    onError: () => pushToast("error", "Select freelancer failed"),
  });

  const confirmMutation = useMutation({
    mutationFn: () => projectApi.confirmCompletion(id),
    onSuccess: () => pushToast("success", "Completion confirmed"),
    onError: () => pushToast("error", "Confirmation failed"),
  });

  const submitResultMutation = useMutation({
    mutationFn: async () => {
      await projectApi.addDeliverable(id, { file_id: "demo-file", checksum: "demo-checksum" });
      return projectApi.submitResult(id, { summary: "Delivery completed" });
    },
    onSuccess: () => pushToast("success", "Result submitted"),
    onError: () => pushToast("error", "Result submit failed"),
  });

  return (
    <div className="space-y-4">
      {projectQuery.isLoading ? <p className="text-sm text-slate-600">Loading project...</p> : null}
      {projectQuery.isError ? <ErrorState message="Could not load project" /> : null}

      {projectQuery.data ? (
        <Card>
          <SectionTitle title={projectQuery.data.title} subtitle={`Status: ${projectQuery.data.status ?? "unknown"}`} />
          <p className="text-sm text-slate-700">{projectQuery.data.description}</p>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Proposals" subtitle="Client selects, freelancer submits" />
        {proposalQuery.isLoading ? <p className="text-sm text-slate-600">Loading proposals...</p> : null}
        {proposalQuery.isError ? <ErrorState message="Could not load proposals" /> : null}
        {proposalQuery.data && proposalQuery.data.results.length === 0 ? (
          <EmptyState message="No proposals yet" />
        ) : null}
        <div className="space-y-2">
          {proposalQuery.data?.results.map((proposal) => (
            <div key={proposal.id} className="rounded border p-3 text-sm">
              <p>{proposal.message}</p>
              <p className="text-slate-600">Price: {proposal.price}</p>
              {meQuery.data?.role === "client" ? (
                <button
                  className="mt-2 rounded border px-2 py-1"
                  onClick={() => selectMutation.mutate(proposal.id)}
                  disabled={selectMutation.isPending}
                >
                  Select Freelancer
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {meQuery.data?.role === "freelancer" ? (
          <button
            className="mt-3 rounded bg-slate-900 px-3 py-2 text-sm text-white"
            onClick={() => submitProposalMutation.mutate()}
            disabled={submitProposalMutation.isPending}
          >
            Submit Proposal
          </button>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="Delivery & Completion" subtitle="Freelancer submit result, client confirm" />
        <div className="flex flex-wrap gap-2">
          {meQuery.data?.role === "freelancer" ? (
            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={() => submitResultMutation.mutate()}
              disabled={submitResultMutation.isPending}
            >
              Submit Result + Deliverable
            </button>
          ) : null}
          {meQuery.data?.role === "client" ? (
            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              Confirm Completion
            </button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
