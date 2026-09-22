"use client";

import { useEffect, useRef, useState } from "react";
import { BundleGrid, type Picture } from "./bundle-grid";
import { StylePicker } from "./style-picker";
import { styles } from "../lib/styles";

type Generation = {
  id: string;
  status: string;
  styleId: string;
  requestedCount: number;
  completedCount: number;
  outputs: Picture[];
  error?: { message?: string } | null;
};

const supportedTypes = ["image/png", "image/jpeg", "image/webp"];
const storageKey = "forma-active-generation-v1";

export function ProfilePictureStudio() {
  const [portrait, setPortrait] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string>(styles[0].id);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const recovered = JSON.parse(saved) as Generation;
      if (recovered?.id && styles.some((style) => style.id === recovered.styleId)) {
        setStyleId(recovered.styleId);
        setGeneration(recovered);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (generation) sessionStorage.setItem(storageKey, JSON.stringify(generation));
    else sessionStorage.removeItem(storageKey);
  }, [generation]);

  useEffect(() => {
    if (!generation || isTerminal(generation.status)) return;
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/bundles/${encodeURIComponent(generation.id)}`, { cache: "no-store" });
        const next = await response.json() as Generation & { error?: string };
        if (!response.ok) throw new Error(next.error || "Could not check this generation.");
        if (stopped) return;
        setGeneration(next);
        if (next.status === "failed") setError(next.error?.message || "This set could not be finished. Try again.");
        if (next.status === "succeeded" && next.outputs.length === 0) setError("The job finished without images. Please try again.");
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Could not check this generation.");
      }
    }, 2200);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [generation?.id, generation?.status]);

  function choosePortrait(file?: File) {
    if (!file) return;
    if (!supportedTypes.includes(file.type)) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Keep your image under 10 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPortrait(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneration(null);
    setError("");
  }

  async function generate(mode: "bundle" | "single" = "bundle") {
    if (!portrait || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    if (mode === "bundle") setGeneration(null);
    const form = new FormData();
    form.append("portrait", portrait);
    form.append("styleId", styleId);
    form.append("mode", mode);
    try {
      const response = await fetch("/api/bundles", { method: "POST", body: form });
      const next = await response.json() as Generation & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to start generation.");
      setGeneration(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start generation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const working = isSubmitting || (!!generation && !isTerminal(generation.status));
  const finishedPictures = generation?.status === "succeeded" ? generation.outputs : [];
  const currentStyle = styles.find((style) => style.id === styleId) ?? styles[0];

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Forma home"><span className="brand-mark">✦</span><span className="brand-name">FORMA</span><span className="brand-subtitle">/ PORTRAIT STUDIO</span></a>
        <nav aria-label="Main navigation"><a href="#top">Create</a><a href="#styles">Styles</a><a href="#results">Your portraits</a></nav>
        <span className="top-note">SET 001 / 8 SHOTS</span>
      </header>

      <section className="workspace" aria-label="Profile picture studio">
        <aside className="control-rail">
          <div className="rail-label"><span>NEW SET</span><span>{portrait ? "PHOTO LOADED ●" : "NO PHOTO YET"}</span></div>
          <div className="source-block">
            <div className="block-heading"><span>01 / SOURCE PHOTO</span><span>FACE LOCK <b>ON</b></span></div>
            <div className={`source-frame ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choosePortrait(event.dataTransfer.files[0]); }}>
              {previewUrl ? <img src={previewUrl} alt="Your portrait preview" /> : <div className="placeholder-astronaut"><div className="placeholder-helmet"><i /><i /><span /></div><div className="placeholder-suit" /></div>}
              <span className="frame-index">PHOTO / 01</span>
            </div>
            <input ref={fileInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => choosePortrait(event.target.files?.[0])} />
            <button className="upload-action" type="button" onClick={() => fileInput.current?.click()}>{portrait ? "Change photo" : "Add your photo"}<span>↗</span></button>
            <p className="photo-tip">One face, clear light. No astronaut training.</p>
          </div>

          <div className="style-block" id="styles">
            <div className="block-heading"><span>02 / COSMIC STYLE</span><span>5 WORLDS</span></div>
            <StylePicker styles={styles} selected={styleId} previewUrl={previewUrl} onSelect={setStyleId} compact />
          </div>

          <div className="launch-block">
            <div className="selected-note"><span className="selected-dot" style={{ background: currentStyle.colors[1] }} /> ORBIT <strong>{currentStyle.name}</strong></div>
            <button className="generate-button" type="button" disabled={!portrait || working} onClick={() => generate("bundle")}>
              {working ? <><span className="spinner" />Developing…</> : <><span className="launch-rocket">↗</span> Launch 8 portraits <span>→</span></>}
            </button>
            <p className={`status-message ${error ? "is-error" : ""}`} aria-live="polite">{error || (working ? `${generation?.completedCount ?? 0} of 8 portraits ready.` : "Same face. Wildly different coordinates.")}</p>
          </div>
        </aside>

        <section className="portrait-workspace" id="results" aria-labelledby="results-title">
          <div className="canvas-heading">
            <div><p className="eyebrow">NEW SET / EIGHT SHOTS</p><h1 id="results-title">Your portraits<span>✳</span></h1></div>
            <div className="canvas-meta"><span>{generation?.status === "succeeded" ? `${finishedPictures.length} READY` : "8 FRAMES"}</span><i /> <span>{currentStyle.name.toUpperCase()}</span></div>
          </div>
          <div className="canvas-toolbar"><span><b>●</b> {working ? "COOKING UP YOUR COSMOS" : generation?.status === "succeeded" ? "ALL EIGHT LANDED" : "PICK A PHOTO TO START"}</span><span>01 — 08 <i>✦</i></span></div>
          {finishedPictures.length > 0 ? (
            <BundleGrid pictures={finishedPictures} onMakeAnother={() => generate("single")} />
          ) : (
            <EmptyPortraitGrid working={working} styleName={currentStyle.name} />
          )}
          {finishedPictures.length > 0 && <button type="button" className="regenerate-button" onClick={() => generate("bundle")} disabled={working}>↻ &nbsp;Launch a fresh set</button>}
          <div className="canvas-footer"><span>{finishedPictures.length || 8} SQUARES · ONE VERY HUMAN FACE</span><span>PRIVATE TO THIS BROWSER</span></div>
        </section>
      </section>

      {generation?.status === "failed" && <section className="retry-panel"><span>That set didn’t come through.</span><button type="button" onClick={() => generate("bundle")} disabled={working}>Try again ↗</button></section>}

      <footer className="footer"><span>SET 001 · PORTRAIT WORKSPACE</span><span>DOWNLOAD A FAVORITE WHEN ONE FINDS YOU ✦</span></footer>
    </main>
  );
}

function EmptyPortraitGrid({ working, styleName }: { working: boolean; styleName: string }) {
  const orbitMarks = ["☾", "✦", "☻", "♄", "◉", "☄", "★", "☼"];
  return (
    <div className={`empty-portrait-grid ${working ? "is-working" : ""}`} aria-label={working ? "Portraits are generating" : "Eight portraits will appear here"}>
      {Array.from({ length: 8 }, (_, index) => (
        <div className="empty-portrait" key={index} style={{ "--slot": index } as React.CSSProperties}>
          <div className="empty-orbit"><span>{orbitMarks[index]}</span><i /></div>
          <span className="empty-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="empty-caption">{working ? "IN TRANSMIT" : styleName.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

function isTerminal(status: string) {
  return ["succeeded", "failed", "canceled", "cancelled", "expired"].includes(status);
}
