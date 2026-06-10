import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["client", "freelancer"]).default("client"),
  first_name: z.string().min(2, "Нэрээ оруулна уу").optional(),
});

export const otpRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().min(4, "OTP code is required"),
  otp_token: z.string().min(6, "OTP token is required").optional(),
});

export const createProjectSchema = z.object({
  title: z.union([z.string().min(3, "Title must be at least 3 characters"), z.literal("")]).optional().default(""),
  description: z.string().min(10, "Description must be at least 10 characters"),
  budget: z.coerce.number().min(1, "Budget must be greater than 0"),
  timeline_days: z.coerce.number().min(1, "Timeline must be at least 1 day"),
  category: z.string().min(1, "Category is required").optional().default("other"),
  category_id: z.union([z.string(), z.number()]).optional(),
  contact_info: z.string().min(3, "Contact information is required"),
});

export const proposalSchema = z.object({
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  timeline_days: z.coerce.number().min(1, "Timeline must be at least 1 day"),
  message: z.string().optional().default(""),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  title: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  skills: z.string().optional().default(""),
  hourly_rate: z.coerce.number().min(0).default(0),
  is_available: z.boolean().optional().default(true),
  response_time_hours: z.coerce.number().min(1).optional().default(24),
  portfolio: z.array(z.any()).optional().default([]),
});
