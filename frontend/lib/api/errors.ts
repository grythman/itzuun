import type { ApiErrorEnvelope } from "./types";

export function extractApiErrorMessage(
  error: unknown,
  fallback: string = "Request failed. Please try again.",
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const maybeResponse = "response" in error ? (error as { response?: { data?: ApiErrorEnvelope & { file?: string[] } } }).response : undefined;
  const payload = maybeResponse?.data;

  return (
    payload?.message ||
    payload?.detail ||
    payload?.error ||
    payload?.file?.[0] ||
    ("message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : fallback)
  );
}
