const COMFY_JOB_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;

export function isComfyJobId(value: unknown): value is string {
  return typeof value === "string" && COMFY_JOB_ID.test(value);
}
