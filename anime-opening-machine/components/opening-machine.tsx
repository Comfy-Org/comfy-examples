"use client";

import { useEffect, useRef, useState } from "react";
import { defaultSelectedFrameIndexes, frames } from "../lib/story";

type Job = { id: string; status: string; error?: { message?: string } | null; frameIndex?: number };
type Output = { type: string; url: string };
type JobSnapshot = Job & { outputs?: Output[] };
type StoryFrame = { id: string; status: string; frameIndex: number; image?: string; error?: string };
type ClipJob = { id: string; status: string; frameIndex: number; error?: string };
const terminal = new Set(["succeeded", "failed", "canceled", "expired"]);
const acceptedImages = "image/png,image/jpeg,image/webp";

export function OpeningMachine() {
  const [protagonist, setProtagonist] = useState<File | null>(null);
  const [rival, setRival] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState("");
  const [rivalPreview, setRivalPreview] = useState("");
  const [theme, setTheme] = useState("");
  const [storyJobs, setStoryJobs] = useState<StoryFrame[]>([]);
  const [selected, setSelected] = useState<number[]>([...defaultSelectedFrameIndexes]);
  const [clipJobs, setClipJobs] = useState<ClipJob[]>([]);
  const [assembly, setAssembly] = useState<Job | null>(null);
  const [loopUrl, setLoopUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [assemblyStarted, setAssemblyStarted] = useState(false);
  const [notice, setNotice] = useState("Add a character and a theme to begin.");
  const [error, setError] = useState("");
  const protagonistInput = useRef<HTMLInputElement>(null);
  const rivalInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    if (rivalPreview) URL.revokeObjectURL(rivalPreview);
  }, [heroPreview, rivalPreview]);

  useEffect(() => {
    if (!storyJobs.some((job) => !terminal.has(job.status))) return;
    const timer = window.setTimeout(async () => {
      const updates = await Promise.all(storyJobs.filter((job) => !terminal.has(job.status)).map(async (job) => {
        try {
          const response = await fetch(`/api/jobs/${job.id}`);
          const next = await response.json() as JobSnapshot & { error?: string };
          if (!response.ok) throw new Error(next.error || "Couldn't check the storyboard.");
          const image = next.outputs?.find((output) => output.type.toLowerCase().includes("image"))?.url;
          return { id: job.id, status: next.status, image, error: next.error?.message };
        } catch (cause) {
          return { id: job.id, status: job.status, error: cause instanceof Error ? cause.message : "Couldn't check the storyboard." };
        }
      }));
      setStoryJobs((current) => current.map((job) => {
        const next = updates.find((update) => update.id === job.id);
        return next ? { ...job, ...next } : job;
      }));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [storyJobs]);

  useEffect(() => {
    if (!clipJobs.some((job) => !terminal.has(job.status))) return;
    const timer = window.setTimeout(async () => {
      const updates = await Promise.all(clipJobs.filter((job) => !terminal.has(job.status)).map(async (job) => {
        try {
          const response = await fetch(`/api/jobs/${job.id}`);
          const next = await response.json() as JobSnapshot & { error?: string };
          if (!response.ok) throw new Error(next.error || "Couldn't check animation status.");
          return { id: job.id, status: next.status, error: next.error?.message };
        } catch (cause) {
          return { id: job.id, status: job.status, error: cause instanceof Error ? cause.message : "Couldn't check animation status." };
        }
      }));
      setClipJobs((current) => current.map((job) => {
        const next = updates.find((update) => update.id === job.id);
        return next ? { ...job, ...next } : job;
      }));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [clipJobs]);

  useEffect(() => {
    if (!clipJobs.length || clipJobs.some((job) => job.status !== "succeeded") || assemblyStarted) return;
    setAssemblyStarted(true);
    setNotice("Joining the shots into one opening loop…");
    void (async () => {
      try {
        const response = await fetch("/api/assemble", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobIds: clipJobs.map((job) => job.id) }),
        });
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(next.error || "Unable to assemble the loop.");
        setAssembly(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to assemble the loop.");
      }
    })();
  }, [assemblyStarted, clipJobs]);

  useEffect(() => {
    if (!assembly || terminal.has(assembly.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${assembly.id}`);
        const next = await response.json() as JobSnapshot & { error?: string };
        if (!response.ok) throw new Error(next.error || "Couldn't check the final loop.");
        setAssembly(next);
        if (next.status === "succeeded") {
          const output = next.outputs?.find((item) => item.type.toLowerCase().includes("video"));
          if (!output) throw new Error("The loop finished without a video output.");
          setLoopUrl(output.url);
          setNotice("Your anime opening loop is ready.");
        } else if (terminal.has(next.status)) {
          setError(next.error?.message || "The loop couldn't be assembled.");
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't check the final loop.");
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [assembly]);

  const storyRunning = storyJobs.some((job) => !terminal.has(job.status));
  const allFramesReady = storyJobs.length === 8 && storyJobs.every((job) => job.status === "succeeded" && job.image);
  const animationRunning = clipJobs.some((job) => !terminal.has(job.status)) || (!!assembly && !terminal.has(assembly.status));

  function chooseImage(kind: "protagonist" | "rival", file?: File) {
    if (!file) return;
    if (!acceptedImages.split(",").includes(file.type)) { setError("Choose a PNG, JPEG, or WebP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Keep each image below 10 MB."); return; }
    setError("");
    const url = URL.createObjectURL(file);
    if (kind === "protagonist") {
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setProtagonist(file);
      setHeroPreview(url);
    } else {
      if (rivalPreview) URL.revokeObjectURL(rivalPreview);
      setRival(file);
      setRivalPreview(url);
    }
  }

  async function generateStoryboard() {
    if (!protagonist || theme.trim().length < 3 || busy || storyRunning) return;
    setBusy(true); setError(""); setLoopUrl(""); setClipJobs([]); setAssembly(null); setAssemblyStarted(false);
    setNotice("Composing the opening’s eight story beats…");
    const form = new FormData();
    form.append("protagonist", protagonist);
    if (rival) form.append("rival", rival);
    form.append("theme", theme.trim());
    try {
      const response = await fetch("/api/storyboards", { method: "POST", body: form });
      const next = await response.json() as { jobs?: Job[]; error?: string };
      if (!response.ok || !next.jobs || next.jobs.length !== 8) throw new Error(next.error || "Unable to start all eight frames.");
      setStoryJobs(next.jobs.map((job) => ({ id: job.id, status: job.status, frameIndex: job.frameIndex ?? 0 })));
      setNotice("Painting the storyboard frames…");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the storyboard.");
    } finally { setBusy(false); }
  }

  function toggleFrame(index: number) {
    setSelected((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : current.length < 4 ? [...current, index].sort((a, b) => a - b) : current);
  }

  async function animateSelection() {
    if (!allFramesReady || selected.length < 2 || selected.length > 4 || animationRunning) return;
    const storyboardJobIds = Array<string>(8).fill("");
    for (const job of storyJobs) storyboardJobIds[job.frameIndex] = job.id;
    setError(""); setLoopUrl(""); setClipJobs([]); setAssembly(null); setAssemblyStarted(false);
    setNotice("Animating your selected frames…");
    try {
      const response = await fetch("/api/animations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storyboardJobIds, frameIndexes: selected, theme: theme.trim() }),
      });
      const next = await response.json() as { jobs?: Job[]; error?: string };
      if (!response.ok || !next.jobs) throw new Error(next.error || "Unable to start the selected shots.");
      setClipJobs(next.jobs.map((job) => ({ id: job.id, status: job.status, frameIndex: job.frameIndex ?? 0 })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start animation.");
    }
  }

  return (
    <main className="shell">
      <header className="masthead"><a className="brand" href="#top"><span className="brand-mark">✳</span> FRAME / FABLE</a><span className="edition">A GENERATIVE OPENING STUDIO <i>·</i> NO. 08</span><a className="nav-link" href="#storyboard">Your storyboard <span>↓</span></a></header>
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">CHARACTER ART IN, OPENING SEQUENCE OUT</p><h1>Every legend<br />starts <em>somewhere.</em></h1><p className="lede">Give us a character and a theme. We’ll turn the spark into eight frames, then bring your favorite moments to life.</p><div className="hero-stats"><span><b>08</b> STORY BEATS</span><i /><span><b>01</b> ORIGINAL OPENING</span></div></div>
        <div className="hero-art">
          <img className="hero-character" src={heroPreview || "/opening-key-visual.png"} alt={heroPreview ? "Your protagonist in the opening key visual" : "Original anime courier beneath a moonlit city"}/>
          <div className="art-speedlines"><i/><i/><i/><i/><i/></div>
          <span className="art-label">第 01 話 <i>·</i> OPENING SEQUENCE</span><span className="art-side-note">世界は、ここから始まる。</span><span className="art-index">KEY VISUAL / 01</span>
        </div>
      </section>

      <section className="creation" aria-label="Opening details">
        <div className="creation-heading"><span className="step-number">01</span><div><p className="eyebrow">CAST YOUR OPENING</p><h2>Who’s in this story?</h2></div><p className="heading-note">Your image references guide the character design across all eight scenes.</p></div>
        <div className="cast-grid">
          <UploadCard title="THE PROTAGONIST" hint="Required · The hero of your story" preview={heroPreview} fileName={protagonist?.name} inputRef={protagonistInput} onChoose={(file) => chooseImage("protagonist", file)} onClick={() => protagonistInput.current?.click()} />
          <UploadCard title="THE RIVAL" hint="Optional · A second character reference" preview={rivalPreview} fileName={rival?.name} inputRef={rivalInput} onChoose={(file) => chooseImage("rival", file)} onClick={() => rivalInput.current?.click()} optional />
          <div className="theme-card"><label className="field-label" htmlFor="theme">THE THEME <span>THE SPARK THAT STARTS IT ALL</span></label><textarea id="theme" value={theme} maxLength={500} onChange={(event) => setTheme(event.target.value)} placeholder="A starlit courier races to stop a city-sized moon from falling…"/><div className="theme-bottom"><span>Describe the world, the conflict, or a feeling.</span><span>{theme.length}/500</span></div><button className="primary-button" type="button" onClick={generateStoryboard} disabled={!protagonist || theme.trim().length < 3 || busy || storyRunning}>{busy || storyRunning ? <><span className="spinner"/>Building your storyboard</> : <>Create the eight frames <b>↗</b></>}</button></div>
        </div>
        <p className={`status-line${error ? " is-error" : ""}`} aria-live="polite">{error || notice}</p>
      </section>

      <section className="story-section" id="storyboard">
        <div className="story-heading"><div className="creation-heading compact"><span className="step-number">02</span><div><p className="eyebrow">THE OPENING, FRAME BY FRAME</p><h2>Your storyboard.</h2></div></div><p className="select-hint">Choose 2–4 frames to animate <span>{selected.length} SELECTED</span></p></div>
        <div className="frame-grid">{frames.map((frame, index) => {
          const job = storyJobs.find((item) => item.frameIndex === index);
          const image = job?.image;
          const selectable = Boolean(allFramesReady && !animationRunning);
          return <button className={`frame-card${selected.includes(index) ? " selected" : ""}${image ? " ready" : ""}`} type="button" key={frame.title} onClick={() => selectable && toggleFrame(index)} disabled={!selectable} aria-pressed={selected.includes(index)}>
            <div className={`frame-image frame-${index + 1}`}>{image ? <img src={image} alt={`${frame.title} storyboard frame`} /> : <><span className="frame-number">0{index + 1}</span><span className="placeholder-symbol">✳</span>{job && !terminal.has(job.status) ? <span className="frame-progress"><i/> {job.status === "queued" ? "IN THE QUEUE" : "ILLUSTRATING"}</span> : job?.status === "failed" ? <span className="frame-progress failed">FRAME FAILED</span> : <span className="frame-progress waiting">AWAITING STORYBOARD</span>}</>}</div>
            <span className="frame-meta"><span><small>BEAT 0{index + 1}</small><strong>{frame.title}</strong></span><i className="select-mark">{selected.includes(index) ? "✓" : "+"}</i></span>
          </button>;
        })}</div>
        <div className="animate-row"><p><span className="spark">✳</span> Each selected scene gets its own camera move and instrumental cue.</p><button className="secondary-button" type="button" onClick={animateSelection} disabled={!allFramesReady || selected.length < 2 || selected.length > 4 || animationRunning}>{animationRunning ? <><span className="spinner"/>Animating your shots</> : <>Animate selected frames <b>↗</b></>}</button></div>
        {clipJobs.length > 0 && <div className="clip-status" aria-live="polite">{clipJobs.map((job) => <span key={job.id}>SHOT {job.frameIndex + 1}: {job.status === "succeeded" ? "READY" : job.status.toUpperCase()}</span>)}</div>}
      </section>

      <section className="final-section"><div className="final-heading"><div><p className="eyebrow">03 / THE OPENING THEME</p><h2>Now, let it move.</h2></div><span>YOUR PERSONAL ANIME OPENING</span></div><div className="video-stage">{loopUrl ? <video src={loopUrl} controls autoPlay loop muted playsInline /> : <div className="video-placeholder"><span className="play-mark">▶</span><strong>{assembly && !terminal.has(assembly.status) ? "Stitching your scenes together…" : clipJobs.some((job) => !terminal.has(job.status)) ? "Your scenes are coming to life…" : "Your music-video loop will appear here."}</strong><small>{loopUrl ? "READY TO REPLAY" : "ANIMATE 2–4 STORYBOARD FRAMES TO BEGIN"}</small></div>}</div>{loopUrl && <a className="download-link" href={loopUrl} download="anime-opening-loop.mp4">Download your opening <span>↓</span></a>}</section>
      <footer className="footer"><span>FRAME / FABLE</span><span>MADE OF MOMENTS, MADE BY YOU.</span><span>COMFY CLOUD · 2026</span></footer>
    </main>
  );
}

function UploadCard({ title, hint, preview, fileName, inputRef, onChoose, onClick, optional = false }: {
  title: string; hint: string; preview: string; fileName?: string; inputRef: React.RefObject<HTMLInputElement | null>;
  onChoose: (file?: File) => void; onClick: () => void; optional?: boolean;
}) {
  return <div className="upload-card"><div className="upload-top"><span>{title}</span>{optional && <i>OPTIONAL</i>}</div><button className={`upload-well${preview ? " has-image" : ""}`} type="button" onClick={onClick} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onChoose(event.dataTransfer.files[0]); }}>
    {preview ? <img src={preview} alt={`${title.toLowerCase()} reference preview`}/> : <><span className="upload-plus">+</span><strong>Drop an image or browse</strong><small>PNG · JPG · WEBP · UP TO 10 MB</small></>}
    <input ref={inputRef} className="visually-hidden" type="file" accept={acceptedImages} onChange={(event) => onChoose(event.target.files?.[0])}/>
  </button><p className="upload-hint"><span>{fileName || hint}</span>{preview && <button type="button" onClick={onClick}>CHANGE</button>}</p></div>;
}
