import assert from "node:assert/strict";
import test from "node:test";
import {
  advancePollFailure,
  describeJobStatus,
  isTerminalStatus,
  MAX_POLL_FAILURES,
  pollDelay,
} from "../lib/job-state.ts";

test("terminal states include every state that should stop polling", () => {
  for (const status of ["succeeded", "failed", "canceled", "expired"]) {
    assert.equal(isTerminalStatus(status), true, status);
  }

  for (const status of ["pending", "running", "queued"]) {
    assert.equal(isTerminalStatus(status), false, status);
  }
});

test("terminal states have coherent user-facing messages", () => {
  assert.deepEqual(describeJobStatus("succeeded"), { message: "Done.", isError: false });
  assert.deepEqual(describeJobStatus("failed", "GPU unavailable"), {
    message: "GPU unavailable",
    isError: true,
  });
  assert.match(describeJobStatus("canceled").message, /canceled/i);
  assert.match(describeJobStatus("expired").message, /expired/i);
});

test("poll retries use bounded exponential backoff", () => {
  assert.equal(MAX_POLL_FAILURES, 3);
  assert.equal(pollDelay(0), 1400);
  assert.equal(pollDelay(1), 2800);
  assert.equal(pollDelay(2), 5600);
  assert.equal(pollDelay(10), 8000);
});

test("polling stops after the bounded failure count", () => {
  assert.deepEqual(advancePollFailure(0), { failureCount: 1, stopped: false });
  assert.deepEqual(advancePollFailure(1), { failureCount: 2, stopped: false });
  assert.deepEqual(advancePollFailure(2), { failureCount: 3, stopped: true });
});
