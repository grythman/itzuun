import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["client", "freelancer"]).optional(),
});

export const otpRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().min(4, "OTP code is required"),
  otp_token: z.string().optional(),
});
