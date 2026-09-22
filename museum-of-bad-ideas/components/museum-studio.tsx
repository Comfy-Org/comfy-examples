"use client";

import { useEffect, useRef, useState } from "react";
import { exhibits, type ExhibitId } from "../lib/exhibits";

type Job = {
  id: string;
  status: string;
  outputs: Array<{ id: string; name: string; url: string }>;
  error: { message?: string } | null;
};

type ViewMode = "before" | "after";

const terminalStatuses = new Set(["succeeded", "failed", "canceled", "expired"]);
const maxFileBytes = 10 * 1024 * 1024;
const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const demoSource = "/demo/bad-doodle.png";
const demoResult = "/demo/ancient-artifact.png";

export function MuseumStudio() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(demoSource);
  const [demoReady, setDemoReady] = useState(true);
  const [exhibitId, setExhibitId] = useState<ExhibitId>("artifact");
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("A Cloud-made exhibit is ready. Try another style or your own doodle.");
  const [viewMode, setViewMode] = useState<ViewMode>("after");
  const [title, setTitle] = useState("The Lumpy Guardian");
  const [curatorNote, setCuratorNote] = useState("An improbable creature of uncertain purpose, now considered essential to the collection.");

  const activeExhibit = exhibits.find((exhibit) => exhibit.id === exhibitId)!;
  const generated = job?.status === "succeeded" ? job.outputs[0] : undefined;
  const resultUrl = generated?.url || (demoReady ? demoResult : "");
  const resultName = generated?.name || "museum-demo-exhibit.png";

  useEffect(() => {
    let stopped = false;
    fetch(demoSource)
      .then((response) => {
        if (!response.ok) throw new Error("Sample unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (!stopped) setFile(new File([blob], "bad-doodle.png", { type: "image/png" }));
      })
      .catch(() => {
        if (!stopped) setStatus("Upload a doodle to begin your own exhibit.");
      });
    return () => { stopped = true; };
  }, []);

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!job || terminalStatuses.has(job.status) || error) return;
    let stopped = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}`);
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(next.error || "The registrar lost track of this exhibit.");
        if (stopped) return;
        setJob(next);
        if (next.status === "succeeded") {
          setStatus("The curators are ready to unveil it.");
          setBusy(false);
          setViewMode("after");
        }
        if (["failed", "canceled", "expired"].includes(next.status)) {
          setError(next.error?.message || "The exhibit could not be completed. Please try again.");
          setBusy(false);
        }
      } catch (cause) {
        if (!stopped) {
          setError(cause instanceof Error ? cause.message : "Unable to check the exhibit status.");
          setBusy(false);
        }
      }
    }, 1800);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [job, error]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!acceptedTypes.has(next.type)) {
      setError("We accept PNG, JPEG, and WebP masterpieces.");
      return;
    }
    if (next.size > maxFileBytes) {
      setError("Even a bad idea has its limits. Keep the file under 10 MB.");
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setDemoReady(false);
    setJob(null);
    setError("");
    setViewMode("before");
    setStatus("The registrar has accepted your submission.");
  }

  async function createExhibit() {
    if (!file) {
      setError("Choose a doodle before asking the museum to take it seriously.");
      return;
    }
    setBusy(true);
    setError("");
    setJob(null);
    setDemoReady(false);
    setViewMode("after");
    setStatus("The conservators are putting on their gloves…");
    try {
      const form = new FormData();
      form.append("doodle", file);
      form.append("exhibit", exhibitId);
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "The museum could not accept this submission.");
      setJob(next);
      if (next.status === "succeeded") {
        setStatus("The curators are ready to unveil it.");
        setBusy(false);
      } else if (terminalStatuses.has(next.status)) {
        throw new Error(next.error?.message || "The exhibit could not be completed. Please try again.");
      } else {
        setStatus("A panel of experts is considering the line work…");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The museum could not complete this exhibit.");
      setBusy(false);
    }
  }

  function chooseExhibit(nextId: ExhibitId) {
    setExhibitId(nextId);
    setJob(null);
    setDemoReady(false);
    setViewMode("before");
    setError("");
    setTitle("The Lumpy Guardian");
    setCuratorNote(exhibits.find((exhibit) => exhibit.id === nextId)!.note);
    setStatus("Exhibit style selected. Ready for curatorial review.");
  }

  async function restoreDemo() {
    try {
      const response = await fetch(demoSource);
      if (!response.ok) throw new Error("Sample unavailable");
      const blob = await response.blob();
      setFile(new File([blob], "bad-doodle.png", { type: "image/png" }));
    } catch {
      setError("The sample doodle is unavailable. Upload your own image instead.");
      return;
    }
    setPreview(demoSource);
    setExhibitId("artifact");
    setJob(null);
    setDemoReady(true);
    setViewMode("after");
    setError("");
    setTitle("The Lumpy Guardian");
    setCuratorNote("An improbable creature of uncertain purpose, now considered essential to the collection.");
    setStatus("Cloud-made demo exhibit restored.");
  }

  const isShowingResult = viewMode === "after" && Boolean(resultUrl);

  return (
    <main className="museum-app">
      <header className="app-bar">
        <a className="app-brand" href="#studio" aria-label="Museum of Bad Ideas studio">
          <span className="brand-seal">M</span><span>MUSEUM <i>OF</i> BAD IDEAS</span>
        </a>
        <div className="workspace-tab"><span className="live-dot" /> EXHIBIT STUDIO</div>
        <div className="app-tools"><span className="draft-state">{busy ? "REVIEW IN PROGRESS" : job ? "EXHIBIT READY" : "STUDIO OPEN"}</span><span className="app-tool-mark">✳</span><span className="app-user">M</span></div>
      </header>

      <section className="studio" id="studio">
        <aside className="submission-rail">
          <div className="rail-heading"><div><p className="eyebrow">THE SOURCE MATERIAL</p><h1>Your submission</h1></div><span className="step-index">01</span></div>
          <button
            className={`upload-well ${dragging ? "dragging" : ""}`}
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
            aria-label="Replace doodle image"
          >
            <img src={preview} alt="Original doodle submission" />
            <span className="image-corner">ORIGINAL DOODLE</span>
          </button>
          <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
          <div className="source-meta"><span>{file?.name || "bad-doodle.png"}</span><span>{file ? `${(file.size / 1024).toFixed(0)} KB` : "DEMO"}</span></div>
          <button className="replace-button" type="button" onClick={() => fileRef.current?.click()}><span>↥</span> Replace image</button>

          <div className="rail-divider" />
          <div className="rail-heading style-heading"><div><p className="eyebrow">THE NEW PRESENTATION</p><h2>Choose an exhibit</h2></div><span className="step-index">02</span></div>
          <div className="style-list" role="radiogroup" aria-label="Choose an exhibit style">
            {exhibits.map((exhibit) => <button key={exhibit.id} type="button" role="radio" aria-checked={exhibitId === exhibit.id} className={`style-card ${exhibitId === exhibit.id ? "selected" : ""}`} onClick={() => chooseExhibit(exhibit.id)}>
              <span className={`style-thumb tone-${exhibit.tone}`}><img src={demoResult} alt="" /><i>{exhibit.icon}</i></span>
              <span className="style-copy"><strong>{exhibit.name}</strong><small>{exhibit.description}</small></span>
              <span className="style-check">{exhibitId === exhibit.id ? "✓" : ""}</span>
            </button>)}
          </div>
          <p className="rail-foot"><span>✳</span> Silly ideas. Serious art.</p>
        </aside>

        <section className="canvas-column" aria-live="polite">
          <div className="canvas-toolbar">
            <div><span className="canvas-kicker">CURRENT EXHIBIT</span><h2>{activeExhibit.name}</h2></div>
            <div className="compare-toggle" role="group" aria-label="Compare original and result">
              <button type="button" aria-pressed={viewMode === "before"} className={viewMode === "before" ? "active" : ""} onClick={() => setViewMode("before")}>Before</button>
              <button type="button" aria-pressed={viewMode === "after"} className={viewMode === "after" ? "active" : ""} onClick={() => setViewMode("after")}>After</button>
            </div>
          </div>
          <div className={`artwork-stage ${isShowingResult ? "has-result" : "show-source"}`}>
            {isShowingResult ? <img className="main-artwork" src={resultUrl} alt={`Doodle transformed into ${activeExhibit.name.toLowerCase()} art`} /> : <img className="main-artwork original-artwork" src={preview} alt="Original doodle before transformation" />}
            {isShowingResult && <div className="source-inset"><img src={preview} alt="Original doodle" /><span>YOUR ORIGINAL</span></div>}
            {busy && <div className="review-overlay"><span className="review-spinner">✳</span><strong>Curatorial review in progress</strong><small>{status}</small></div>}
            {!busy && !resultUrl && viewMode === "after" && <div className="canvas-empty"><span>✳</span><strong>Your exhibit is ready to be reimagined.</strong><small>Choose a look, then send it to the curators.</small></div>}
            <span className="canvas-stamp">{demoReady && !job ? "CLOUD DEMO · REAL GENERATION" : isShowingResult ? "MUSEUM OF BAD IDEAS" : "SOURCE DOODLE · BEFORE"}</span>
          </div>
          <div className="canvas-footer"><span><i /> {status}</span><span>{isShowingResult ? "AFTER · REIMAGINED" : "BEFORE · ORIGINAL"}</span></div>
        </section>

        <aside className="inspector">
          <div className="inspector-heading"><span className="inspector-icon">♧</span><div><p className="eyebrow">MUSEUM RECORD</p><h2>Exhibit label</h2></div></div>
          <label className="field"><span>Title</span><input value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="field"><span>Medium</span><input value={activeExhibit.medium} readOnly /></label>
          <div className="field"><span>Accession number</span><div className="accession-field">{job?.id ? `MBI-${job.id.slice(-6).toUpperCase()}` : demoReady ? "MBI-2026-017" : "ASSIGNED ON ACQUISITION"}</div></div>
          <label className="field curator-field"><span>Curator's note</span><textarea value={curatorNote} maxLength={300} onChange={(event) => setCuratorNote(event.target.value)} rows={4} /><small>{curatorNote.length}/300</small></label>
          <div className="inspector-actions">
            <button className="generate-button" type="button" onClick={createExhibit} disabled={busy || !file}><span>✦</span>{busy ? "Under review…" : generated || demoReady ? "Generate another" : "Generate exhibit"}<b>→</b></button>
            {resultUrl ? <a className="download-button" href={resultUrl} download={resultName}><span>↧</span> Download image</a> : <button className="download-button" type="button" disabled><span>↧</span> Download image</button>}
            {(!demoReady || job) && <button className="text-button" type="button" onClick={() => void restoreDemo()}>Restore Cloud demo</button>}
            {error && <p className="error-message" role="alert">{error}</p>}
          </div>
          <div className="inspector-quote"><span>“</span><p>Preserving the beautifully bad ideas of humanity.</p><small>— THE MUSEUM</small></div>
        </aside>
      </section>
    </main>
  );
}
