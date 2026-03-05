import { profileSchema } from "@/lib/validators";

describe("profileSchema", () => {
  it("accepts valid profile data", () => {
    const result = profileSchema.safeParse({
      full_name: "Bat-Erdene",
      bio: "Full-stack developer with 5 years of experience",
      skills: "React, TypeScript, Python",
      hourly_rate: 50000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe("Bat-Erdene");
      expect(result.data.hourly_rate).toBe(50000);
    }
  });

  it("rejects empty full_name", () => {
    const result = profileSchema.safeParse({
      full_name: "",
      bio: "some bio",
      skills: "React",
      hourly_rate: 1000,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative hourly_rate", () => {
    const result = profileSchema.safeParse({
      full_name: "Test User",
      bio: "bio",
      skills: "",
      hourly_rate: -100,
    });

    expect(result.success).toBe(false);
  });

  it("allows zero hourly_rate", () => {
    const result = profileSchema.safeParse({
      full_name: "Test User",
      bio: "",
      skills: "",
      hourly_rate: 0,
    });

    expect(result.success).toBe(true);
  });

  it("defaults bio and skills to empty string", () => {
    const result = profileSchema.safeParse({
      full_name: "Test User",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe("");
      expect(result.data.skills).toBe("");
      expect(result.data.hourly_rate).toBe(0);
    }
  });

  it("coerces string hourly_rate to number", () => {
    const result = profileSchema.safeParse({
      full_name: "Test",
      hourly_rate: "25000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hourly_rate).toBe(25000);
    }
  });
});
