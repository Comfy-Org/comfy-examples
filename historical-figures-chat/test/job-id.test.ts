import assert from "node:assert/strict";
import test from "node:test";
import { isComfyJobId } from "../lib/job-id.ts";

test("accepts opaque Comfy job identifiers", () => {
  assert.equal(isComfyJobId("019d1c48-4d75-7f20-a168-18d075432d2c"), true);
  assert.equal(isComfyJobId("job_abc-123"), true);
});

test("rejects request targets and malformed identifiers", () => {
  for (const value of [
    "http://127.0.0.1:3000/private",
    "https://example.com/api/v2/jobs/123",
    "/api/v2/jobs/123",
    "../jobs/123",
    " job_123",
    "job_123?admin=true",
    "",
  ]) {
    assert.equal(isComfyJobId(value), false, String(value));
  }
});
