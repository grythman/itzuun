"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMutation, useProjectDetail, useProjectMessages, useProjectProposals } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { proposalSchema, reviewSchema } from "@/lib/validators";

import type { z } from "zod";

type ProposalForm = z.infer<typeof proposalSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToastStore((s) => s.push);

  const detail = useProjectDetail(id);
  const proposals = useProjectProposals(id);
  const messages = useProjectMessages(id);

  const proposalForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: "", message: "" },
  });

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  const proposalMutation = useMutation({
    mutationFn: (values: ProposalForm) => projectsApi.submitProposal(id, values),
    onSuccess: () => {
      proposals.refetch();
      toast("success", "Proposal submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const messageMutation = useMutation({
    mutationFn: (content: string) => projectsApi.sendMessage(id, content),
    onSuccess: () => {
      messages.refetch();
      toast("success", "Message sent");
    },
  });

  const selectMutation = useMutation({
    mutationFn: (proposal_id: number) => projectsApi.selectFreelancer(id, proposal_id),
    onSuccess: () => toast("success", "Freelancer selected"),
  });

  const completionMutation = useMutation({
    mutationFn: () => projectsApi.confirmCompletion(id),
    onSuccess: () => toast("success", "Completion confirmed"),
  });

  const disputeMutation = useMutation({
    mutationFn: () => projectsApi.createDispute(id, { reason: "Need admin review" }),
    onSuccess: () => toast("warn", "Dispute submitted"),
  });

  const escrowMutation = useMutation({
    mutationFn: () => projectsApi.depositEscrow(id),
    onSuccess: () => toast("success", "Escrow deposited"),
  });

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewForm) => projectsApi.review(id, values),
    onSuccess: () => toast("success", "Review submitted"),
  });

  const resultMutation = useMutation({
    mutationFn: async () => {
      await projectsApi.uploadDeliverable(id, { file_id: "sample-file", checksum: "abc123" });
      await projectsApi.submitResult(id, { note: "Delivered" });
    },
    onSuccess: () => toast("success", "Result submitted with deliverable"),
  });

  if (detail.isLoading) return <LoadingState label="Loading project..." />;
  if (detail.isError || !detail.data) return <ErrorState label="Project not found." />;

  const proposalItems = proposals.data ? toArray(proposals.data) : [];
  const messageItems = messages.data ? toArray(messages.data) : [];

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold">{detail.data.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{detail.data.description}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {detail.data.status}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button className="bg-slate-900 text-white" onClick={() => escrowMutation.mutate()}>Deposit Escrow</button>
        <button className="bg-slate-900 text-white" onClick={() => completionMutation.mutate()}>Confirm Completion</button>
        <button className="bg-amber-600 text-white" onClick={() => disputeMutation.mutate()}>Create Dispute</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form className="space-y-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={proposalForm.handleSubmit((v) => proposalMutation.mutate(v))}>
          <h2 className="text-lg font-medium">Submit Proposal</h2>
          <input placeholder="Price" {...proposalForm.register("price")} aria-label="Proposal price" />
          <textarea placeholder="Message" {...proposalForm.register("message")} aria-label="Proposal message" rows={3} />
          <button className="bg-blue-600 text-white" type="submit">Send Proposal</button>
        </form>

        <form className="space-y-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={reviewForm.handleSubmit((v) => reviewMutation.mutate(v))}>
          <h2 className="text-lg font-medium">Leave Review</h2>
          <input
            type="number"
            min={1}
            max={5}
            aria-label="Review rating"
            {...reviewForm.register("rating", { valueAsNumber: true })}
          />
          <textarea placeholder="Comment" {...reviewForm.register("comment")} aria-label="Review comment" rows={3} />
          <button className="bg-blue-600 text-white" type="submit">Submit Review</button>
        </form>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Proposals</h2>
          <button className="bg-slate-900 text-white" onClick={() => proposals.refetch()}>Refresh</button>
        </div>
        {!proposalItems.length ? (
          <EmptyState label="No proposals yet." />
        ) : (
          <ul className="space-y-2">
            {proposalItems.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                <p>Freelancer #{item.freelancer}</p>
                <p>Price: {item.price}</p>
                <button className="mt-2 bg-green-600 text-white" onClick={() => selectMutation.mutate(item.id)}>
                  Select
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Messages</h2>
          <button className="bg-slate-900 text-white" onClick={() => resultMutation.mutate()}>
            Submit Result + Deliverable
          </button>
        </div>
        {!messageItems.length ? (
          <EmptyState label="No messages." />
        ) : (
          <ul className="space-y-2">
            {messageItems.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                <p>Sender #{item.sender}</p>
                <p>{item.content}</p>
              </li>
            ))}
          </ul>
        )}
        <button className="mt-3 bg-blue-600 text-white" onClick={() => messageMutation.mutate("Hello from web UI")}>Send sample message</button>
      </div>
    </section>
  );
}
