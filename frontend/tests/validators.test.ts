import {
  createProjectSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  proposalSchema,
  registerSchema,
  reviewSchema,
} from "@/lib/validators";

describe("otpRequestSchema", () => {
  it("accepts valid email", () => {
    expect(otpRequestSchema.safeParse({ email: "user@test.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(otpRequestSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });
});

describe("otpVerifySchema", () => {
  it("accepts valid data", () => {
    const result = otpVerifySchema.safeParse({
      email: "user@test.com",
      otp_token: "abc123def456",
      otp: "1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short otp_token", () => {
    expect(
      otpVerifySchema.safeParse({ email: "user@test.com", otp_token: "ab", otp: "1234" }).success,
    ).toBe(false);
  });

  it("rejects short otp", () => {
    expect(
      otpVerifySchema.safeParse({ email: "user@test.com", otp_token: "abc123def456", otp: "12" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      email: "new@user.com",
      password: "StrongPass1",
      role: "freelancer",
    });
    expect(result.success).toBe(true);
  });

  it("defaults role to client", () => {
    const result = registerSchema.safeParse({
      email: "new@user.com",
      password: "StrongPass1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("client");
    }
  });

  it("rejects short password", () => {
    expect(
      registerSchema.safeParse({ email: "new@user.com", password: "short" }).success,
    ).toBe(false);
  });

  it("rejects invalid role", () => {
    expect(
      registerSchema.safeParse({ email: "new@user.com", password: "StrongPass1", role: "admin" }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(
      loginSchema.safeParse({ email: "user@test.com", password: "12345678" }).success,
    ).toBe(true);
  });

  it("rejects short password", () => {
    expect(
      loginSchema.safeParse({ email: "user@test.com", password: "123" }).success,
    ).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("accepts valid project", () => {
    const result = createProjectSchema.safeParse({
      title: "Website",
      description: "Build a website for my business",
      budget: 500000,
      timeline_days: 30,
      category: "web",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    expect(
      createProjectSchema.safeParse({
        title: "ab",
        description: "Build a website",
        budget: 500000,
        timeline_days: 30,
        category: "web",
      }).success,
    ).toBe(false);
  });

  it("rejects zero budget", () => {
    expect(
      createProjectSchema.safeParse({
        title: "Website",
        description: "Build a website",
        budget: 0,
        timeline_days: 30,
        category: "web",
      }).success,
    ).toBe(false);
  });

  it("coerces string budget to number", () => {
    const result = createProjectSchema.safeParse({
      title: "Website",
      description: "Build a website",
      budget: "500000",
      timeline_days: "30",
      category: "web",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBe(500000);
      expect(result.data.timeline_days).toBe(30);
    }
  });
});

describe("proposalSchema", () => {
  it("accepts valid proposal", () => {
    const result = proposalSchema.safeParse({
      price: 300000,
      timeline_days: 14,
      message: "I can do this",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional message", () => {
    const result = proposalSchema.safeParse({ price: 100000, timeline_days: 7 });
    expect(result.success).toBe(true);
  });

  it("rejects zero price", () => {
    expect(proposalSchema.safeParse({ price: 0, timeline_days: 7 }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts valid rating 1-5", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(reviewSchema.safeParse({ rating }).success).toBe(true);
    }
  });

  it("rejects rating below 1", () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
  });

  it("rejects rating above 5", () => {
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it("allows optional comment", () => {
    const result = reviewSchema.safeParse({ rating: 4, comment: "Great work!" });
    expect(result.success).toBe(true);
  });
});
