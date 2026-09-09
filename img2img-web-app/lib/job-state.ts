export const MAX_POLL_FAILURES = 3;

const terminalStatuses = new Set(["succeeded", "failed", "canceled", "expired"]);

export function isTerminalStatus(status: string) {
  return terminalStatuses.has(status);
}

export function pollDelay(failureCount: number) {
  return Math.min(1400 * (2 ** failureCount), 8000);
}

export function advancePollFailure(failureCount: number) {
  const nextFailureCount = failureCount + 1;

  return {
    failureCount: nextFailureCount,
    stopped: nextFailureCount >= MAX_POLL_FAILURES,
  };
}

export function describeJobStatus(status: string, errorMessage?: string) {
  switch (status) {
    case "succeeded":
      return { message: "Done.", isError: false };
    case "failed":
      return { message: errorMessage || "Job failed.", isError: true };
    case "canceled":
      return { message: "Job was canceled. You can submit it again.", isError: true };
    case "expired":
      return { message: "Job expired. Submit it again to restart.", isError: true };
    default:
      return { message: "Processing…", isError: false };
  }
}
