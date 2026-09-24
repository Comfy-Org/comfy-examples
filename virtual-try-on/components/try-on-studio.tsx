"use client";

import { useEffect, useRef, useState } from "react";

type Job = {
  id: string;
  status: string;
  outputs: Array<{ id: string; name: string; type: string; url: string }>;
  error: { message?: string } | null;
};

type UploadKind = "person" | "garment";
type PreviewMode = "before" | "after";

const categories = [
  { id: "auto", label: "Auto" },
  { id: "upper", label: "Tops" },
  { id: "lower", label: "Bottoms" },
  { id: "dress", label: "Dresses" },
  { id: "outerwear", label: "Outerwear" },
];

const acceptedImages = "image/png,image/jpeg,image/webp";

export function TryOnStudio() {
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("auto");
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("after");
  const [loadingSamples, setLoadingSamples] = useState(true);
  const personInput = useRef<HTMLInputElement>(null);
  const garmentInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void useSamplePhotos();
    // Sample photos are the initial demo state; don't reload them on each preview update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (personPreview?.startsWith("blob:")) URL.revokeObjectURL(personPreview);
    if (garmentPreview?.startsWith("blob:")) URL.revokeObjectURL(garmentPreview);
  }, [personPreview, garmentPreview]);

  useEffect(() => {
    if (!job || isTerminal(job.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`);
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(typeof next.error === "string" ? next.error : "Couldn't check the try-on status.");
        setJob(next);
        if (next.status === "failed") setError(next.error?.message || "The try-on couldn't be completed. Try different photos.");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't check the try-on status.");
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [job]);

  const result = job?.status === "succeeded" ? job.outputs[0] ?? null : null;
  const downloadUrl = previewMode === "after" ? result?.url ?? (demoMode ? "/samples/example-result.png" : null) : null;
  const shownImage = previewMode === "before"
    ? personPreview
    : result?.url ?? (demoMode ? "/samples/example-result.png" : null);
  const working = busy || (!!job && !isTerminal(job.status));

  function chooseFile(kind: UploadKind, file?: File) {
    if (!file) return;
    if (!acceptedImages.split(",").includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Keep each image below 10 MB.");
      return;
    }

    setError("");
    setJob(null);
    setDemoMode(false);
    setPreviewMode("after");
    if (kind === "person") {
      setPerson(file);
      setPersonPreview(URL.createObjectURL(file));
    } else {
      setGarment(file);
      setGarmentPreview(URL.createObjectURL(file));
      setCategory("auto");
    }
  }

  async function generate() {
    if (!person || !garment || busy) return;
    setBusy(true);
    setError("");
    setJob(null);
    setPreviewMode("after");
    try {
      const form = new FormData();
      form.append("person", person);
      form.append("garment", garment);
      form.append("garmentType", category);
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to start the try-on.");
      setJob(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the try-on.");
    } finally {
      setBusy(false);
    }
  }

  async function useSamplePhotos() {
    setLoadingSamples(true);
    try {
      const [personResponse, garmentResponse] = await Promise.all([
        fetch("/sample-person.png"),
        fetch("/sample-garment.png"),
      ]);
      if (!personResponse.ok || !garmentResponse.ok) throw new Error("Couldn't load the sample photos.");
      const [personBlob, garmentBlob] = await Promise.all([personResponse.blob(), garmentResponse.blob()]);
      const personFile = new File([personBlob], "sample-person.png", { type: personBlob.type });
      const garmentFile = new File([garmentBlob], "sample-garment.png", { type: garmentBlob.type });
      setPerson(personFile);
      setGarment(garmentFile);
      setPersonPreview(URL.createObjectURL(personFile));
      setGarmentPreview(URL.createObjectURL(garmentFile));
      setCategory("outerwear");
      setJob(null);
      setError("");
      setDemoMode(true);
      setPreviewMode("after");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't load the sample photos.");
    } finally {
      setLoadingSamples(false);
    }
  }

  function selectCategory(id: string) {
    if (id !== category) {
      setCategory(id);
      setJob(null);
      setDemoMode(false);
      setPreviewMode("after");
      setError("");
    }
  }

  return (
    <main className="page-shell" id="top">
      <nav className="topbar" aria-label="Main navigation">
        <a className="wordmark" href="#top">THREAD <span>&</span> FORM</a>
        <div className="nav-links">
          <a className="active" href="#studio">Try-on</a>
          <a href="#how-it-works">How it works</a>
        </div>
      </nav>

      <section className="workspace" id="studio">
        <section className="controls" aria-labelledby="page-title">
          <div className="intro">
            <p className="eyebrow">VIRTUAL TRY-ON</p>
            <h1 id="page-title">Try it on.</h1>
            <p className="lede">See a garment on your photo.</p>
          </div>

          <div className="upload-grid">
            <UploadCard kind="person" title="Person photo" preview={personPreview} file={person} inputRef={personInput} onChoose={(file) => chooseFile("person", file)} />
            <UploadCard kind="garment" title="Garment photo" preview={garmentPreview} file={garment} inputRef={garmentInput} onChoose={(file) => chooseFile("garment", file)} />
          </div>

          <div className="category-section" id="how-it-works">
            <div className="category-topline"><span>Garment category</span>{!demoMode && <button className="demo-link" type="button" onClick={useSamplePhotos} disabled={loadingSamples}>{loadingSamples ? "Loading…" : "Load sample pair"}</button>}</div>
            <div className="category-options" role="group" aria-label="Garment category">
              {categories.map((item) => <button type="button" key={item.id} className={category === item.id ? "category is-selected" : "category"} onClick={() => selectCategory(item.id)}>{item.label}</button>)}
            </div>
          </div>

          <div className="action-block">
            <button className="generate-button" type="button" disabled={!person || !garment || working || loadingSamples} onClick={generate}>
              {working ? <><span className="spinner" />Working…</> : <>Generate try-on <span aria-hidden="true">→</span></>}
            </button>
            <p className={`status${error ? " is-error" : ""}`} aria-live="polite">{error || statusMessage(job, !!result, demoMode, !!person && !!garment)}</p>
          </div>
        </section>

        <section className="preview-column" aria-label="Try-on result">
          <div className="preview-heading"><h2>Preview</h2>{demoMode && <span className="sample-label">Sample</span>}</div>
          <div className={`look-preview${shownImage ? " has-image" : ""}`}>
            {shownImage ? (
              <img src={shownImage} alt={previewMode === "before" ? "Original person photo" : "Virtual try-on result"} />
            ) : (
              <div className="empty-preview"><strong>Your preview<br />will appear here.</strong></div>
            )}
            {personPreview && <div className="compare-control" role="group" aria-label="Compare before and after">
              <button type="button" className={previewMode === "before" ? "is-active" : ""} onClick={() => setPreviewMode("before")}>Before</button>
              <button type="button" className={previewMode === "after" ? "is-active" : ""} onClick={() => setPreviewMode("after")}>After</button>
            </div>}
          </div>
          <div className="preview-caption"><span>{previewMode === "before" ? "Original photo" : result ? garmentName(garment?.name ?? "", demoName(garment?.name ?? "", "garment")) : demoMode ? "Tailored blazer · Burgundy" : "Try-on preview"}</span>{downloadUrl && <a className="download-link" href={downloadUrl} download="thread-and-form-look.png">Download</a>}</div>
        </section>
      </section>
    </main>
  );
}

function UploadCard({
  kind,
  title,
  preview,
  file,
  inputRef,
  onChoose,
}: {
  kind: UploadKind;
  title: string;
  preview: string | null;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChoose: (file?: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className={`upload-card${preview ? " has-file" : ""}${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); onChoose(event.dataTransfer.files[0]); }}>
      <input ref={inputRef} className="visually-hidden" type="file" accept={acceptedImages} onChange={(event) => { onChoose(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      {preview ? <img className="upload-card-image" src={preview} alt={kind === "person" ? "Your uploaded photo" : "Your garment photo"} /> : <div className="upload-card-symbol"><Icon name={kind === "person" ? "user" : "hanger"} /></div>}
      <div className="upload-card-copy"><strong>{title}</strong><span>{file ? (demoName(file.name, kind) ? "Sample selected" : file.name) : "Click or drag and drop"}</span></div>
      <button type="button" className="upload-change" aria-label={file ? `Change ${title.toLowerCase()}` : `Upload ${title.toLowerCase()}`} onClick={() => inputRef.current?.click()}><Icon name={preview ? "edit" : "plus"} /></button>
    </div>
  );
}

function Icon({ name }: { name: "user" | "hanger" | "edit" | "plus" }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.3 20c.5-3.4 3-5.4 6.7-5.4s6.2 2 6.7 5.4" /></>,
    hanger: <><path d="m4 19 8-8 8 8H4Z" /><path d="M12 11V8.4a2.1 2.1 0 1 0-2.1-2.1" /></>,
    edit: <><path d="m14.5 6.5 3 3" /><path d="m5 19 3.8-.8L19 8a2.1 2.1 0 0 0-3-3l-10.2 10.2L5 19Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg className={`icon icon-${name}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function garmentName(filename: string, demo: boolean) {
  if (demo) return "Tailored Blazer";
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function demoName(filename: string, kind: UploadKind) {
  return filename === (kind === "person" ? "sample-person.png" : "sample-garment.png");
}

function categoryLabel(value: string) {
  return categories.find((item) => item.id === value)?.label ?? "Auto";
}

function isTerminal(status: string) {
  return ["succeeded", "failed", "canceled", "expired"].includes(status);
}

function statusMessage(job: Job | null, hasResult: boolean, demoMode: boolean, hasInputs: boolean) {
  if (job?.status === "failed") return job.error?.message || "The try-on failed. Try another photo.";
  if (job?.status === "canceled") return "Try-on canceled. You can run it again.";
  if (hasResult) return demoMode ? "Sample try-on · use your photos to create a look." : "Your custom look is ready.";
  if (job) return "Preparing your fitting room…";
  if (demoMode) return "Sample photos loaded. Try your own or create this look.";
  if (hasInputs) return "Photos are ready. Create your look when you're ready.";
  return "Add a person photo and garment to create a look.";
}
