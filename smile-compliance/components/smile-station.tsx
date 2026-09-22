"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { describeJobStatus, isTerminalStatus, pollDelay } from "../lib/job-state";
import { smileLevels, supportedImageTypes, type SmileLevel } from "../lib/smile";

type Job = {
  id: string;
  status: string;
  outputs: Array<{ id: string; name: string; url: string }>;
  error: { message: string } | null;
};

const levels = Object.entries(smileLevels) as [SmileLevel, (typeof smileLevels)[SmileLevel]][];

function StaplerSample({ smiling = false }: { smiling?: boolean }) {
  return (
    <svg className="stapler-sample" viewBox="0 0 360 220" role="img" aria-label={smiling ? "Example smiling stapler" : "Example frowning stapler"}>
      <ellipse cx="181" cy="190" rx="126" ry="12" fill="#172c4512" />
      <path d="M67 151h233c8 0 14 6 14 13v14H59v-15c0-7 3-12 8-12Z" fill="#7f8d98" stroke="#101e2c" strokeWidth="3" />
      <path d="M72 157h215M81 168h209" fill="none" stroke="#d5dce0" strokeWidth="3" opacity=".8" />
      <path d="M77 148c13-10 15-34 21-51 9-25 31-40 67-44l84-9c21-2 39 9 48 27l24 49-13 25-231 11Z" fill="#384a59" stroke="#101e2c" strokeWidth="4" strokeLinejoin="round" />
      <path d="m166 58 79-7c17-1 29 6 36 18l14 26-134 7c-13 0-21-8-18-19 2-12 9-23 23-25Z" fill="#71808c" stroke="#9daab3" strokeWidth="2" />
      <path d="M91 133h216M115 144h174" fill="none" stroke="#101e2c" strokeWidth="4" />
      <rect x="107" y="158" width="38" height="7" rx="2" fill="#263744" />
      <circle cx="134" cy="160" r="2" fill="#d7dbd9" />
      <g className="stapler-face" fill="none" stroke="#101e2c" strokeLinecap="round" strokeWidth="4">
        <path d="M249 111v2m26-2v2" />
        {smiling ? <path d="M245 123c5 8 12 11 18 11s13-3 18-11" /> : <path d="M246 134c5-8 11-12 17-12s13 4 18 12" />}
      </g>
      <path d="M150 181h65" stroke="#f6e85a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function SmileStation() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [level, setLevel] = useState<SmileLevel>("enthusiastic");
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("Awaiting supporting material.");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!job || isTerminalStatus(job.status) || pollingStopped) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { signal: controller.signal });
        const next = await response.json() as Job & { error?: string | { message?: string } };
        if (!response.ok) {
          const detail = typeof next.error === "string" ? next.error : next.error?.message;
          throw new Error(detail || "People Ops could not retrieve this request.");
        }

        setJob(next);
        setPollFailures(0);
        const status = describeJobStatus(next.status, next.error?.message);
        setMessage(status.message);
        setError(status.isError);
      } catch (cause) {
        if (controller.signal.aborted) return;
        const failures = pollFailures + 1;
        if (failures >= 3) {
          setPollingStopped(true);
          setMessage(`${cause instanceof Error ? cause.message : "Unable to check with People Ops."} Please retry.`);
        } else {
          setPollFailures(failures);
          setMessage("People Ops is aligning stakeholders. Checking again…");
        }
        setError(true);
      }
    }, pollDelay(pollFailures));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [job, pollFailures, pollingStopped]);

  const result = job?.status === "succeeded" ? job.outputs[0] : null;
  const activeJob = Boolean(job && !isTerminalStatus(job.status));
  const working = submitting || activeJob;
  const caseStatus = pollingStopped
    ? "STATUS CHECK NEEDED"
    : working
      ? "WITH PEOPLE OPS"
      : result
        ? "GOAL ACHIEVED"
        : "REQUIRED";
  const buttonLabel = submitting
    ? "ROUTING TO PEOPLE OPS…"
    : pollingStopped
      ? "CHECK STATUS"
      : result || (job && isTerminalStatus(job.status))
        ? "SUBMIT ANOTHER SUBJECT"
        : "SUBMIT FOR CHEER REVIEW";

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setJob(null);
    setError(false);
    setPollFailures(0);
    setPollingStopped(false);
    setMessage(selected ? "Attachment received. Please select an enthusiasm target." : "Awaiting supporting material.");
  }

  async function submit() {
    if (!file || working) return;
    setSubmitting(true);
    setError(false);
    setPollingStopped(false);
    setPollFailures(0);
    setMessage("Preparing your morale improvement plan…");

    const form = new FormData();
    form.append("image", file);
    form.append("level", level);
    try {
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to submit this subject.");
      setJob(next);
      setMessage("Request accepted. Aligning expression with company values…");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The People Ops portal is unavailable.");
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function retryPolling() {
    setPollFailures(0);
    setPollingStopped(false);
    setError(false);
    setMessage("Reopening your request with People Ops…");
  }

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="People and Culture">
        <a className="wordmark" href="#top" aria-label="People and Culture home">
          <svg className="bureau-seal" viewBox="0 0 48 48" aria-hidden="true">
            <rect x="3" y="3" width="42" height="42" rx="10" />
            <path d="M16 19v2m16-2v2M15 27c1.8 5 5 7.5 9 7.5s7.2-2.5 9-7.5" />
          </svg>
          <span>PEOPLE & CULTURE<br /><b>MANDATORY MORALE PORTAL</b></span>
        </a>
        <div className="topbar-note"><span>HAPPIER PEOPLE<br /><b>HIGHER OUTPUT</b></span><i aria-hidden="true" /></div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>EMPLOYEE EXPERIENCE INITIATIVE</span> / NOTICE 04</p>
          <h1>A SMILE IS A CORE<br /><em>COMPETENCY.</em></h1>
          <p className="intro">Participation is optional in the same way team building is optional.</p>
        </div>
        <div className="program-card" aria-label="Mandatory team spirit notice">
          <div className="program-card-head"><span>PEOPLE & CULTURE</span><span>REQUIRED</span></div>
          <div className="program-card-body">
            <div className="sun-face" aria-hidden="true"><i /><i /><b /></div>
            <p>TEAM SPIRIT<br /><strong>is now an<br />individual deliverable.</strong></p>
            <span className="sticker">FUN!</span>
          </div>
          <div className="program-card-foot">PLEASE ENJOY THIS INITIATIVE</div>
        </div>
      </header>

      <section className="station" aria-label="Smile processing station">
        <div className="comparison">
          <div className="image-card source-card">
            <div className="card-label"><strong>BEFORE</strong><span>REF: HR-04<br />STATE: LOW MORALE</span></div>
            <label className={`image-stage upload-stage${working ? " is-locked" : ""}`} aria-disabled={working}>
              <input type="file" accept={supportedImageTypes.join(",")} onChange={selectImage} disabled={working} />
              {preview ? <img src={preview} alt="Selected subject" /> : <span className="sample-image"><StaplerSample /><span>CLICK TO REPLACE SAMPLE ↗</span></span>}
              {preview && <span className="stage-corner">FILED</span>}
            </label>
          </div>

          <div className="comparison-arrow" aria-hidden="true">→</div>

          <div className="image-card result-card">
            <div className="card-label"><strong>AFTER</strong><span>REF: HR-04<br />STATE: {result ? "IMPROVED" : "PENDING"}</span></div>
            <div className={`image-stage output-stage${result ? " has-result" : ""}`}>
              {result ? <img src={result.url} alt="Smiling subject after review" /> : <div className="sample-image result-sample"><StaplerSample smiling /><span>SAME THING. BRIGHTER OUTLOOK.</span></div>}
              {result && <span className="approval-stamp">GOAL<br />ACHIEVED</span>}
            </div>
            {result && <a className="download-link" href={result.url} download={result.name}>Download your improved outlook <span>↗</span></a>}
          </div>
        </div>

        <div className="control-desk">
          <div className="control-status"><span>SELECT ENTHUSIASM LEVEL</span><span className={`case-status${working ? " is-busy" : result ? " is-approved" : ""}`}><i />{caseStatus}</span></div>
          <div className="mandate-block">
            <div className="level-options" role="radiogroup" aria-label="Joy mandate">
              {levels.map(([id, item], index) => (
                <label className={`level-option${level === id ? " selected" : ""}`} key={id}>
                  <input type="radio" name="level" value={id} checked={level === id} onChange={() => setLevel(id)} disabled={working} />
                  <span className="level-index">0{index + 1}</span>
                  <span className="level-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                  <span className="radio-mark" />
                </label>
              ))}
            </div>
          </div>

          <div className="submit-block">
            <button className="submit-button" type="button" onClick={pollingStopped ? retryPolling : submit} disabled={!file || (working && !pollingStopped)}>
              <span>{buttonLabel}</span><b aria-hidden="true">↗</b>
            </button>
            <p className={`status-message${error ? " is-error" : ""}`} aria-live="polite"><span className="status-led" />{message}</p>
            <div className="control-foot"><span>SAME PEOPLE.<br />BRIGHTER DAYS.</span><span>IT’S A<br />CULTURE THING.</span></div>
          </div>
        </div>
      </section>

      <footer className="page-footer"><span>PEOPLE & CULTURE / POLICY 04</span><span>MAKING MANDATORY FUN FEEL VOLUNTARY SINCE THIS MORNING.</span><span>INTERNAL USE ONLY</span></footer>
    </main>
  );
}
