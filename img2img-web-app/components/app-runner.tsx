"use client";

import { useEffect, useState } from "react";
import {
  advancePollFailure,
  describeJobStatus,
  isTerminalStatus,
  pollDelay,
} from "../lib/job-state";

type Template = {
  branding: { title: string; description: string; action: string };
  fields: Array<{ id: string; accept: string[]; label: string }>;
};

type Job = {
  id: string;
  status: string;
  outputs: Array<{ id: string; name: string; url: string }>;
  error: { message: string } | null;
};

const fallbackTemplate: Template = {
  branding: {
    title: "Upscale\nanything.",
    description: "Upload an image and get a clean 4× high-resolution result.",
    action: "Upscale image",
  },
  fields: [
    {
      id: "image",
      accept: ["image/png", "image/jpeg", "image/webp"],
      label: "Upload an image",
    },
  ],
};

export function AppRunner() {
  const [template, setTemplate] = useState<Template>(fallbackTemplate);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("Choose an image to begin.");
  const [error, setError] = useState(false);
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);

  useEffect(() => {
    fetch("/api/template")
      .then((response) => response.json())
      .then(setTemplate)
      .catch(() => setMessage("Unable to load the app template."));
  }, []);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!job || isTerminalStatus(job.status) || pollingStopped) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { signal: controller.signal });
        const next = await response.json() as Job & { error?: { message?: string } | string };

        if (!response.ok) {
          const apiMessage = typeof next.error === "string" ? next.error : next.error?.message;
          throw new Error(apiMessage || "Unable to check the job.");
        }

        setJob(next);
        setPollFailureCount(0);
        const status = describeJobStatus(
          next.status,
          typeof next.error === "object" && next.error !== null ? next.error.message : undefined,
        );
        setMessage(status.message);
        setError(status.isError);
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }

        const failure = advancePollFailure(pollFailureCount);
        const failureMessage = cause instanceof Error ? cause.message : "Unable to check the job.";

        if (failure.stopped) {
          setPollingStopped(true);
          setMessage(`${failureMessage} Retry the status check.`);
        } else {
          setPollFailureCount(failure.failureCount);
          setMessage(`${failureMessage} Retrying…`);
        }
        setError(true);
      }
    }, pollDelay(pollFailureCount));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [job, pollFailureCount, pollingStopped]);

  const imageField = template.fields.find((field) => field.id === "image") ?? fallbackTemplate.fields[0];
  const result = job?.status === "succeeded" ? job.outputs[0] : null;

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;

    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setJob(null);
    setError(false);
    setPollFailureCount(0);
    setPollingStopped(false);
    setMessage(selected ? "Ready to process." : "Choose an image to begin.");
  }

  function retryPolling() {
    setPollFailureCount(0);
    setPollingStopped(false);
    setError(false);
    setMessage("Checking job status…");
  }

  async function submit() {
    if (!file) {
      return;
    }

    setError(false);
    setPollFailureCount(0);
    setPollingStopped(false);
    setMessage("Uploading and submitting…");

    const form = new FormData();
    form.append("image", file);

    try {
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };

      if (!response.ok) {
        throw new Error(typeof next.error === "string" ? next.error : "Unable to submit the job.");
      }

      setJob(next);
      setMessage("Processing…");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to submit the job.");
      setError(true);
    }
  }

  return (
    <main>
      <header className="masthead">
        <h1>
          {template.branding.title.split("\n").map((line, index) => (
            <span key={line}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <p className="lede">{template.branding.description}</p>
      </header>

      <section className="workspace" aria-label="Image processing">
        <div className="source">
          <div className="section-label">
            <span>01 / SOURCE</span>
            <span>4× SCALE</span>
          </div>

          <label className="upload">
            <input type="file" accept={imageField.accept.join(",")} onChange={selectImage} />
            {preview ? (
              <img src={preview} alt="Selected source" />
            ) : (
              <span>
                {imageField.label}
                <br />
                <em>or choose a file</em>
              </span>
            )}
          </label>
        </div>

        <div className="actions">
          <div>
            <p className="section-label">02 / PROCESS</p>
            <p className="process-copy">Preserve the composition. Render at four times the original dimensions.</p>
          </div>

          <div>
            <button
              type="button"
              onClick={pollingStopped ? retryPolling : submit}
              disabled={!file || (job !== null && !isTerminalStatus(job.status) && !pollingStopped)}
            >
              {pollingStopped ? "Retry status" : template.branding.action} <span>→</span>
            </button>
            <p className={`status${error ? " is-error" : ""}`}>{message}</p>
          </div>
        </div>
      </section>

      {result && (
        <section className="result">
          <div className="section-label">
            <span>03 / OUTPUT</span>
            <span>READY</span>
          </div>
          <img src={result.url} alt="Upscaled result" />
          <a href={result.url} download={result.name}>
            Download result
          </a>
        </section>
      )}
    </main>
  );
}
