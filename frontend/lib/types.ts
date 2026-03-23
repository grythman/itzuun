import { z } from "zod";

// Shared Types
export interface User {
  id: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  first_name: string;
  last_name: string;
  is_verified?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: "open" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  client: {
    id: string;
    email: string;
  };
}

export interface Proposal {
  id: string;
  freelancer: {
    id: string;
    first_name: string;
    last_name: string;
  };
  cover_letter: string;
  proposed_budget: number;
  estimated_days: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface Escrow {
  id: string;
  project: string;
  amount: number;
  status: "pending_deposit" | "funded" | "released" | "disputed" | "refunded";
  funded_at?: string;
  released_at?: string;
}

export interface LedgerEntry {
  id: string;
  escrow: string;
  entry_type: "deposit" | "release" | "refund" | "fee";
  amount: number;
  reference_id: string;
  created_at: string;
}

// Zod Validators for Forms
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["client", "freelancer"]),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const projectSchema = z.object({
  title: z.string().min(5, "Title is too short").max(200),
  description: z.string().min(20, "Please provide more details"),
  budget_min: z.coerce.number().min(0),
  budget_max: z.coerce.number().min(1),
}).refine(data => data.budget_max >= data.budget_min, {
  message: "Max budget must be greater than or equal to min budget",
  path: ["budget_max"],
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const proposalSchema = z.object({
  cover_letter: z.string().min(10, "Please provide a more detailed cover letter"),
  proposed_budget: z.coerce.number().min(1, "Budget must be greater than 0"),
  estimated_days: z.coerce.number().min(1, "Estimated days must be at least 1"),
});
export type ProposalInput = z.infer<typeof proposalSchema>;