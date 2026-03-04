"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { projectsApi, toArray } from "@/lib/api/endpoints";
import { useMe, useMutation, useProjectDetail, useProjectMessages, useProjectProposals } from "@/lib/hooks";
import { useToastStore } from "@/lib/toast-store";
import { proposalSchema, reviewSchema } from "@/lib/validators";

import type { z } from "zod";

type ProposalForm = z.infer<typeof proposalSchema>;
type ReviewForm = z.infer<typeof reviewSchema>;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const toast = useToastStore((s) => s.push);
  const me = useMe();

  const detail = useProjectDetail(id);
  const proposals = useProjectProposals(id);
  const messages = useProjectMessages(id);

  const [messageText, setMessageText] = useState("");
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [checksum, setChecksum] = useState("");

  const proposalForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: 1000000, timeline_days: 14, message: "" },
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
    mutationFn: (text: string) => projectsApi.sendMessage(id, text),
    onSuccess: () => {
      setMessageText("");
      messages.refetch();
      toast("success", "Message sent");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const selectMutation = useMutation({
    mutationFn: (proposal_id: number) => projectsApi.selectFreelancer(id, proposal_id),
    onSuccess: () => {
      detail.refetch();
      proposals.refetch();
      toast("success", "Freelancer selected");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const completionMutation = useMutation({
    mutationFn: () => projectsApi.confirmCompletion(id),
    onSuccess: () => {
      detail.refetch();
      toast("success", "Escrow released and project completed");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const disputeMutation = useMutation({
    mutationFn: () => projectsApi.createDispute(id, { reason: "Dispute raised from dashboard" }),
    onSuccess: () => {
      detail.refetch();
      toast("warn", "Dispute submitted");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const uploadDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!deliverableFile) {
        throw new Error("Select a file first");
      }
      if (!checksum.trim()) {
        throw new Error("Checksum is required");
      }
      const upload = await projectsApi.uploadMessageFile(id, deliverableFile);
      await projectsApi.uploadDeliverable(id, { file_id: String(upload.file_id), checksum: checksum.trim() });
    },
    onSuccess: () => toast("success", "Deliverable uploaded"),
    onError: (error: Error) => toast("error", error.message),
  });

  const resultMutation = useMutation({
    mutationFn: () => projectsApi.submitResult(id, { note: "Work submitted" }),
    onSuccess: () => {
      detail.refetch();
      toast("success", "Result submitted for client review");
    },
    onError: (error: Error) => toast("error", error.message),
  });

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewForm) => projectsApi.review(id, values),
    onSuccess: () => toast("success", "Review submitted"),
    onError: (error: Error) => toast("error", error.message),
  });

  if (detail.isLoading || me.isLoading) return <LoadingState label="Loading project..." />;
  if (detail.isError || !detail.data) return <ErrorState label="Project not found." />;
  if (!me.data) return <ErrorState label="Please sign in first." />;

  const project = detail.data;
  const proposalItems = proposals.data ? toArray(proposals.data) : [];
  const messageItems = messages.data ? toArray(messages.data) : [];

  const isClientOwner = me.data.id === project.owner;
  const canFreelancerPropose = me.data.role === "freelancer" && project.status === "open";
  const isSelectedFreelancer = proposalItems.some(
    (item) => item.id === project.selected_proposal && item.freelancer === me.data?.id,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{project.description}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status: {project.status}</p>
      </div>

      {isClientOwner ? (
        <div className="grid gap-3 md:grid-cols-3">
          <button className="bg-slate-900 text-white" onClick={() => router.push(`/projects/${id}/payment`)}>
            Open Payment Page
          </button>
          <button className="bg-slate-900 text-white" onClick={() => completionMutation.mutate()}>
            Release Escrow
          </button>
          <button className="bg-amber-600 text-white" onClick={() => disputeMutation.mutate()}>
            Open Dispute
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {canFreelancerPropose ? (
          <form
            className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
            onSubmit={proposalForm.handleSubmit((v) => proposalMutation.mutate(v))}
          >
            <h2 className="text-lg font-medium">Submit Proposal</h2>
            <input type="number" {...proposalForm.register("price", { valueAsNumber: true })} aria-label="Proposal price" />
            <input
              type="number"
              {...proposalForm.register("timeline_days", { valueAsNumber: true })}
              aria-label="Proposal timeline"
            />
            <textarea placeholder="Message" {...proposalForm.register("message")} aria-label="Proposal message" rows={3} />
            <button className="bg-blue-600 text-white" type="submit">Send Proposal</button>
          </form>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Proposal submission is available for freelancers on open projects.
          </div>
        )}

        {project.status === "completed" ? (
          <form
            className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
            onSubmit={reviewForm.handleSubmit((v) => reviewMutation.mutate(v))}
          >
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
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Review is available after escrow is released and project is completed.
          </div>
        )}
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
                <p>Timeline: {item.timeline_days} days</p>
                {isClientOwner && project.status === "open" ? (
                  <button className="mt-2 bg-green-600 text-white" onClick={() => selectMutation.mutate(item.id)}>
                    Select Freelancer
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">Project Chat</h2>
        {!messageItems.length ? (
          <EmptyState label="No messages." />
        ) : (
          <ul className="space-y-2">
            {messageItems.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
                <p>Sender #{item.sender}</p>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 space-y-2">
          <textarea
            aria-label="Message text"
            rows={3}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Type your message"
          />
          <button className="bg-blue-600 text-white" onClick={() => messageMutation.mutate(messageText)}>
            Send Message
          </button>
        </div>
      </div>

      {me.data.role === "freelancer" && isSelectedFreelancer ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-medium">Delivery Actions</h2>
          <input type="file" onChange={(event) => setDeliverableFile(event.target.files?.[0] || null)} />
          <input
            value={checksum}
            onChange={(event) => setChecksum(event.target.value)}
            placeholder="Checksum"
            aria-label="Deliverable checksum"
          />
          <div className="flex gap-2">
            <button className="bg-slate-900 text-white" onClick={() => uploadDeliverableMutation.mutate()}>
              Upload Deliverable
            </button>
            <button className="bg-green-600 text-white" onClick={() => resultMutation.mutate()}>
              Submit Result
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
