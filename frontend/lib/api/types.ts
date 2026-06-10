export type Primitive = string | number | boolean | null;

export type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

export interface ApiErrorEnvelope {
  code?: string;
  message?: string;
  detail?: string;
  details?: JsonValue | Record<string, unknown>;
  correlation_id?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthUser {
  id: number;
  email: string;
  role: "client" | "freelancer" | "admin";
  is_verified?: boolean;
  verification_status?: "unverified" | "pending" | "verified" | "suspended";
  first_name: string;
  last_name: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ProjectDto {
  id: number;
  owner: number;
  title: string;
  description: string;
  budget: number;
  timeline_days: number;
  category: string;
  category_obj?: CategoryDto | null;
  required_skills?: string[];
  contact_info?: string;
  status: string;
  selected_proposal?: number | null;
  [key: string]: unknown;
}

export interface CategoryDto {
  id: number;
  name_en?: string;
  name_mn?: string;
  name?: string;
  slug?: string;
  icon?: string;
}

export interface ProposalDto {
  id: number;
  project: number;
  freelancer: number | { id: number; [key: string]: unknown };
  cover_letter?: string;
  proposed_budget?: number;
  estimated_days?: number;
  price: number;
  timeline_days: number;
  message?: string;
  status: string;
  created_at?: string;
  freelancer_verification_status?: string;
  freelancer_is_verified?: boolean;
  [key: string]: unknown;
}

export interface RatingSummaryDto {
  average: number;
  total: number;
}

export interface ReviewDto {
  id: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface EscrowDto {
  id: number;
  project: number;
  amount: number;
  platform_fee_amount?: number;
  freelancer_amount?: number;
  status: string;
}

export interface LedgerEntryDto {
  id: number;
  escrow: number;
  entry_type: string;
  amount: number;
  note?: string;
  created_at: string;
}

export interface DisputeDto {
  id: number;
  project: number;
  raised_by?: number;
  reason: string;
  evidence_files?: unknown[];
  resolved_by?: number | null;
  resolved_at?: string | null;
  note?: string;
}

export interface AdminUserDto extends AuthUser {}

export interface PaymentDto {
  id: string;
  project: number;
  invoice_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  escrow_status?: string | null;
  [key: string]: unknown;
}

export interface PaymentCreateResponse {
  invoice_id: string;
  invoice_url: string;
  qr_text: string;
  qr_image: string;
  expires_in_seconds: number;
  fee_pct?: number;
  payment: PaymentDto;
  [key: string]: unknown;
}

export interface PaymentStatusResponse {
  invoice_id: string | null;
  // "not_created" — backend хариу: project дээр хараахан Payment row үүсээгүй.
  status: "not_created" | "pending" | "paid" | "failed";
  payment: PaymentDto | null;
  verification?: Record<string, unknown>;
}

export interface AdminPaymentDto extends PaymentDto {
  paid_at?: string | null;
}

export interface PremiumMeResponse {
  tier: "free" | "premium_freelancer";
  is_premium: boolean;
  premium_plan_type: string;
  premium_expiry: string | null;
  proposal_limit_monthly: number;
}

export interface PremiumSubscribeResponse {
  subscribed: boolean;
  tier: "premium_freelancer";
  premium_plan_type: string;
  premium_expiry: string | null;
}
