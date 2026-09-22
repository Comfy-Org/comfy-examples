import assert from "node:assert/strict";
import test from "node:test";
import { isSmileLevel, maxImageBytes, smilePrompt, supportedImageTypes, validateImageUpload } from "../lib/smile.ts";
import { describeJobStatus, isJobId, isTerminalStatus, pollDelay } from "../lib/job-state.ts";

function imageFile(type: string, size = 1) {
  return new File([new Uint8Array(size)], "subject", { type });
}

test("only the three published joy levels are accepted", () => {
  assert.equal(isSmileLevel("polite"), true);
  assert.equal(isSmileLevel("enthusiastic"), true);
  assert.equal(isSmileLevel("mandatory"), true);
  assert.equal(isSmileLevel("unlimited"), false);
  assert.equal(isSmileLevel(null), false);
});

test("each joy level maps to an edit prompt that preserves the subject", () => {
  assert.match(smilePrompt("polite"), /subtle, closed-mouth smile/);
  assert.match(smilePrompt("enthusiastic"), /company values poster/);
  assert.match(smilePrompt("mandatory"), /mandatory fun day/);
  assert.match(smilePrompt("mandatory"), /keep the object recognizable/i);
  assert.match(smilePrompt("mandatory"), /Do not change anything else/);
});

test("image uploads accept supported formats and reject invalid or oversized files", () => {
  for (const type of supportedImageTypes) {
    assert.equal("image" in validateImageUpload(imageFile(type)), true, type);
  }

  assert.deepEqual(validateImageUpload(null), { error: "Submit a subject for review first." });
  assert.deepEqual(validateImageUpload(imageFile("image/png", 0)), {
    error: "Submit a subject for review first.",
  });
  assert.deepEqual(validateImageUpload(imageFile("image/gif")), {
    error: "Upload a PNG, JPEG, or WebP image.",
  });
  assert.deepEqual(validateImageUpload(imageFile("image/png", maxImageBytes + 1)), {
    error: "Keep uploads under 10 MB for processing.",
  });
});

test("job lookups only accept UUIDs", () => {
  assert.equal(isJobId("c987008b-d251-4819-bad6-cd31b9b1d3e3"), true);
  assert.equal(isJobId("c987008b-d251-4819-bad6-cd31b9b1d3e3\n"), false);
  assert.equal(isJobId("https://example.com/jobs/abc"), false);
  assert.equal(isJobId("../jobs/abc"), false);
});

test("polling stops on terminal states and backs off after failures", () => {
  for (const status of ["succeeded", "failed", "canceled", "expired"]) {
    assert.equal(isTerminalStatus(status), true, status);
  }
  assert.equal(isTerminalStatus("running"), false);
  assert.equal(pollDelay(0), 1400);
  assert.equal(pollDelay(3), 8000);
});

test("job statuses produce the matching People Ops update", () => {
  assert.deepEqual(describeJobStatus("succeeded"), {
    message: "Goal achieved. Your subject is now aligned with our values.",
    isError: false,
  });
  assert.equal(describeJobStatus("failed", "Queue unavailable").message, "Queue unavailable");
  assert.equal(describeJobStatus("canceled").isError, true);
  assert.equal(describeJobStatus("expired").isError, true);
  assert.equal(describeJobStatus("running").isError, false);
});
