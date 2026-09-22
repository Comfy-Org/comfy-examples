export const MAX_POLL_FAILURES = 3;

const terminalStatuses = new Set(["succeeded", "failed", "canceled", "expired"]);
const jobIdPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function isJobId(value: string) {
  return value.length === 36 && jobIdPattern.test(value);
}

export function isTerminalStatus(status: string) {
  return terminalStatuses.has(status);
}

export function pollDelay(failureCount: number) {
  return Math.min(1400 * 2 ** failureCount, 8000);
}

export function describeJobStatus(status: string, errorMessage?: string) {
  switch (status) {
    case "succeeded":
      return { message: "Goal achieved. Your subject is now aligned with our values.", isError: false };
    case "failed":
      return { message: errorMessage || "The review hit a snag. Please resubmit the request.", isError: true };
    case "canceled":
      return { message: "Request canceled. Morale alignment remains outstanding.", isError: true };
    case "expired":
      return { message: "Request expired. Please submit a fresh morale plan.", isError: true };
    default:
      return { message: "Review in progress. Thanks for bringing your whole self to this process.", isError: false };
  }
}
