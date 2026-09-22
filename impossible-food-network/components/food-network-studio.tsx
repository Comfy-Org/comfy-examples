"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { foodPresets, type FoodPreset } from "../lib/food-presets";
import { commercialDurationSeconds, defaultVideoAspectRatio, videoAspectRatios, type VideoAspectRatio } from "../lib/food-settings";

type Output = { id: string; name: string; type: string; url: string };
type Job = { id: string; status: string; outputs: Output[]; error: { message?: string } | null };
type RecentGeneration = { id: string; presetName: string; aspectRatio: VideoAspectRatio; stillUrl: string; videoUrl: string };

const terminal = new Set(["succeeded", "failed", "canceled", "expired"]);
const acceptedTypes = "image/png,image/jpeg,image/webp";

function outputOf(job: Job | null, type: "image" | "video") {
  return job?.outputs.find((output) => output.type.toLowerCase().includes(type)) ?? null;
}

export function FoodNetworkStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [presetId, setPresetId] = useState(foodPresets[0]!.id);
  const [imageJob, setImageJob] = useState<Job | null>(null);
  const [videoJob, setVideoJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoStarting, setVideoStarting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(defaultVideoAspectRatio);
  const [videoJobAspectRatio, setVideoJobAspectRatio] = useState<VideoAspectRatio | null>(null);
  const [recent, setRecent] = useState<RecentGeneration[]>([]);
  const [selectedRecentId, setSelectedRecentId] = useState("");
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const requestGeneration = useRef(0);
  const videoStartedFor = useRef("");
  const recentIds = useRef(new Set<string>());
  const preset = foodPresets.find((item) => item.id === presetId)!;
  const selectedRecent = recent.find((item) => item.id === selectedRecentId);
  const image = selectedRecent
    ? { id: selectedRecent.id, name: `${selectedRecent.presetName}.png`, type: "image", url: selectedRecent.stillUrl }
    : outputOf(imageJob, "image");
  const video = selectedRecent
    ? { id: selectedRecent.id, name: `${selectedRecent.presetName}.mp4`, type: "video", url: selectedRecent.videoUrl }
    : outputOf(videoJob, "video");
  const displayedPresetName = selectedRecent?.presetName ?? preset.name;
  const displayedAspectRatio = selectedRecent?.aspectRatio ?? videoJobAspectRatio ?? aspectRatio;
  const activeJob = videoJob && !terminal.has(videoJob.status) ? videoJob : imageJob;
  const working = busy || videoStarting || Boolean(activeJob && !terminal.has(activeJob.status));

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") !== "ramen") return;
    const generation: RecentGeneration = {
      id: "demo-ramen",
      presetName: foodPresets[0]!.name,
      aspectRatio: defaultVideoAspectRatio,
      stillUrl: "/demo/ramen-hero.png",
      videoUrl: "/demo/ramen-commercial.mp4",
    };
    setPresetId(foodPresets[0]!.id);
    setPreview("/demo/ramen-source.jpg");
    setImageJob({ id: "demo-still", status: "succeeded", outputs: [{ id: "demo-still-output", name: "ramen-hero.png", type: "image", url: generation.stillUrl }], error: null });
    setVideoJob({ id: generation.id, status: "succeeded", outputs: [{ id: "demo-video-output", name: "ramen-commercial.mp4", type: "video", url: generation.videoUrl }], error: null });
    setVideoJobAspectRatio(defaultVideoAspectRatio);
    setRecent([generation]);
    setSelectedRecentId(generation.id);
    setDemoLoaded(true);
    void fetch("/demo/ramen-source.jpg").then(async (response) => {
      if (!response.ok) return;
      const source = await response.blob();
      setFile(new File([source], "ramen-source.jpg", { type: source.type || "image/jpeg" }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeJob || terminal.has(activeJob.status)) return;
    const generation = requestGeneration.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${activeJob.id}`);
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(next.error || "Unable to check the generation.");
        if (generation !== requestGeneration.current) return;
        if (activeJob.id === imageJob?.id) setImageJob(next);
        else setVideoJob(next);
        if (next.status === "succeeded" && activeJob.id !== imageJob?.id) rememberRecent(next, preset, videoJobAspectRatio ?? aspectRatio);
        if (next.status === "failed") setError(next.error?.message || "That pass did not complete. Try again.");
      } catch (cause) {
        if (generation === requestGeneration.current) setError(cause instanceof Error ? cause.message : "Unable to check the generation.");
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [activeJob, imageJob?.id]);

  useEffect(() => {
    if (!imageJob || imageJob.status !== "succeeded" || videoJob || busy || videoStartedFor.current === imageJob.id) return;
    videoStartedFor.current = imageJob.id;
    void startVideo(imageJob.id, preset, aspectRatio, requestGeneration.current);
  }, [imageJob, videoJob, busy, presetId, aspectRatio]);

  function chooseFile(next?: File) {
    if (!next) return;
    if (!acceptedTypes.split(",").includes(next.type)) {
      setError("Choose a PNG, JPG, or WebP photo.");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError("Keep the photo under 10 MB.");
      return;
    }
    requestGeneration.current += 1;
    videoStartedFor.current = "";
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setImageJob(null);
    setVideoJob(null);
    setVideoStarting(false);
    setVideoJobAspectRatio(null);
    setSelectedRecentId("");
    setDemoLoaded(false);
    setError("");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  async function createCommercial() {
    if (!file || busy) return;
    const generation = ++requestGeneration.current;
    videoStartedFor.current = "";
    setBusy(true);
    setError("");
    setImageJob(null);
    setVideoJob(null);
    setVideoStarting(false);
    setVideoJobAspectRatio(null);
    setSelectedRecentId("");
    setDemoLoaded(false);
    const form = new FormData();
    form.append("image", file);
    form.append("preset", presetId);
    try {
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to start the food transformation.");
      if (generation === requestGeneration.current) setImageJob(next);
    } catch (cause) {
      if (generation === requestGeneration.current) setError(cause instanceof Error ? cause.message : "Unable to start the food transformation.");
    } finally {
      if (generation === requestGeneration.current) setBusy(false);
    }
  }

  function rememberRecent(job: Job, selectedPreset: FoodPreset, selectedAspectRatio: VideoAspectRatio) {
    if (recentIds.current.has(job.id)) return;
    const clip = outputOf(job, "video");
    const still = outputOf(imageJob, "image");
    if (!clip || !still) return;
    recentIds.current.add(job.id);
    setRecent((items) => [{ id: job.id, presetName: selectedPreset.name, aspectRatio: selectedAspectRatio, stillUrl: still.url, videoUrl: clip.url }, ...items].slice(0, 5));
    setSelectedRecentId(job.id);
  }

  async function startVideo(imageJobId: string, selectedPreset: FoodPreset, selectedAspectRatio: VideoAspectRatio, generation: number) {
    setVideoStarting(true);
    setVideoJobAspectRatio(selectedAspectRatio);
    setError("");
    try {
      const response = await fetch(`/api/jobs/${imageJobId}/video`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preset: selectedPreset.id, aspectRatio: selectedAspectRatio }),
      });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to start the commercial video.");
      if (generation === requestGeneration.current) {
        setVideoJob(next);
        if (next.status === "succeeded") rememberRecent(next, selectedPreset, selectedAspectRatio);
      }
    } catch (cause) {
      if (generation === requestGeneration.current) setError(cause instanceof Error ? cause.message : "Unable to start the commercial video.");
    } finally {
      if (generation === requestGeneration.current) setVideoStarting(false);
    }
  }

  function retryVideo() {
    if (!imageJob) return;
    videoStartedFor.current = imageJob.id;
    void startVideo(imageJob.id, preset, aspectRatio, requestGeneration.current);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  const status = error || (busy ? "Sending your ingredients to the studio…"
    : imageJob?.status === "failed" ? "The food transformation failed."
      : imageJob && !terminal.has(imageJob.status) ? "Building your impossible food world…"
        : imageJob?.status === "succeeded" && !videoJob ? "Hero image ready. Setting the scene in motion…"
          : videoJob && !terminal.has(videoJob.status) ? "Shooting your six-second commercial…"
            : videoJob?.status === "failed" ? "Your still is ready. The video pass needs another take."
              : video ? "Your impossible food commercial is ready." : "Add a food photo, choose a world, and roll camera.");

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#studio"><span className="brand-mark">IFN</span><span>IMPOSSIBLE<br />FOOD NETWORK</span></a>
        <div className="header-context"><span className="on-air"><i /> STUDIO ONLINE</span><span className="header-divider" /> IMAGE → MOTION</div>
        <a className="top-link" href={demoLoaded ? "/" : "?demo=ramen"}>{demoLoaded ? "NEW COMMERCIAL" : "TRY RAMEN DEMO"} <span>{demoLoaded ? "＋" : "↗"}</span></a>
      </header>

      <section className="workspace-heading" id="studio">
        <div><p className="eyebrow"><span>CREATE / 01</span> FOOD COMMERCIAL STUDIO</p><h1>Make it <em>impossible.</em></h1></div>
        <div className="pipeline" aria-label="Three production steps"><span className="current"><b>01</b> SOURCE</span><i /><span className={imageJob ? "current" : ""}><b>02</b> ART DIRECTION</span><i /><span className={videoJob?.status === "succeeded" ? "current" : ""}><b>03</b> FINAL CUT</span></div>
      </section>

      <section className="studio">
        <div className="controls">
          <div className="section-title"><span className="step-no">01</span><div><p>SOURCE IMAGE</p><h2>Bring your bite.</h2></div><span className="section-count">01 / 03</span></div>
          <div className={`upload-zone${dragging ? " is-dragging" : ""}${preview ? " has-image" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
            {preview ? <img src={preview} alt="Your uploaded meal" /> : <div className="upload-empty"><span className="upload-icon">＋</span><strong>Drop food photo</strong><small>or browse files</small><span className="file-types">PNG · JPG · WEBP / 10 MB MAX</span></div>}
            <input ref={fileInput} type="file" accept={acceptedTypes} onChange={onFileChange} aria-label="Upload a meal or snack photo" />
            <button className="upload-change" type="button" onClick={() => fileInput.current?.click()}>{preview ? "REPLACE IMAGE ↗" : "BROWSE ↗"}</button>
            {file && <span className="file-name">{file.name}</span>}
          </div>

          <div className="section-title preset-heading"><span className="step-no">02</span><div><p>ART DIRECTION</p><h2>Choose a world.</h2></div><span className="section-count">05 MODES</span></div>
          <div className="preset-list" role="group" aria-label="Choose a surreal food concept">
            {foodPresets.map((item, index) => <button key={item.id} type="button" disabled={working} className={`preset${presetId === item.id ? " selected" : ""}`} onClick={() => { if (imageJob) { setImageJob(null); setVideoJob(null); videoStartedFor.current = ""; } setPresetId(item.id); setError(""); }} aria-pressed={presetId === item.id}>
              <span className="preset-thumb"><img src={`/concepts/${item.id}.webp`} alt="" /></span>
              <span className="preset-copy"><strong><i>0{index + 1}</i>{item.name}</strong><small>{item.short}</small></span>
              <span className="preset-arrow">{presetId === item.id ? "●" : "↗"}</span>
            </button>)}
          </div>
          <p className="preset-description">{preset.description}</p>
          <div className="settings-row">
            <label htmlFor="aspect-ratio"><span>VIDEO FORMAT</span><select id="aspect-ratio" value={aspectRatio} disabled={working} onChange={(event) => setAspectRatio(event.target.value as VideoAspectRatio)}>{videoAspectRatios.map((ratio) => <option key={ratio.value} value={ratio.value}>{ratio.label}</option>)}</select></label>
            <div className="duration-setting"><span>RUNTIME</span><strong>{String(commercialDurationSeconds).padStart(2, "0")} SEC <i>LOCKED</i></strong></div>
          </div>
          <button className="produce-button" type="button" disabled={!file || working} onClick={createCommercial}>{working ? <><i className="button-spinner" /> {videoStarting ? "SETTING THE SCENE…" : "RENDERING…"}</> : <>GENERATE COMMERCIAL <span>↗</span></>}</button>
          <p className={`status-line${error ? " is-error" : ""}`} aria-live="polite"><i className={working ? "status-dot busy" : "status-dot"} />{status}</p>
        </div>

        <div className="output-column">
          <div className="output-heading"><div><p className="eyebrow"><span>OUTPUT / 02</span> CAMPAIGN PREVIEW</p><h2>{image ? displayedPresetName : "Your commercial"}</h2></div><div className="output-count"><span>STILL</span><i /> <span>06 SEC VIDEO</span></div></div>
          <div className="output-grid">
            <article className="output-card hero-output">
              <div className="card-topline"><span><b>01</b> HERO FRAME</span>{image && <a href={image.url} download="impossible-food-hero.png">SAVE IMAGE ↓</a>}</div>
              <div className="media-well still-well">
                {image ? <img src={image.url} alt={`Generated ${preset.name.toLowerCase()} food commercial hero image`} /> : preview ? <img className="source-preview" src={preview} alt="Source meal waiting for its transformation" /> : <div className="empty-media"><span>01</span><strong>Hero still</strong><small>Upload a meal to start the edit.</small></div>}
                {imageJob && !terminal.has(imageJob.status) && <div className="media-overlay"><i className="spinner" /><span>{imageJob.status === "queued" ? "QUEUED" : "BUILDING THE HERO FRAME"}</span></div>}
              </div>
              <div className="card-caption"><strong>{image ? displayedPresetName : "Waiting for source image"}</strong><span>{image ? "HERO STILL" : "COMFY / IMAGE EDIT"}</span></div>
            </article>
            <article className="output-card video-output">
              <div className="card-topline"><span><b>02</b> MOTION CUT</span>{video && <a href={video.url} download="impossible-food-commercial.mp4">SAVE MP4 ↓</a>}</div>
              <div className="media-well video-well">
                {video ? <video src={video.url} controls playsInline preload="metadata" poster={image?.url} /> : image ? <><img src={image.url} alt="Still frame awaiting animation" /><div className="play-wait"><span>▶</span><strong>VIDEO PASS<br />QUEUED</strong></div></> : <div className="empty-media video-empty"><span>02</span><strong>Six-second film</strong><small>LTX motion pass · 24 fps</small></div>}
                {videoJob && !terminal.has(videoJob.status) && <div className="media-overlay"><i className="spinner" /><span>RENDERING · {videoJob.status.toUpperCase()}</span></div>}
              </div>
              <div className="card-caption"><strong>Glossy product motion</strong><span>{video ? "H.264 · 24 FPS" : "LTX · 06 SEC"}</span></div>
            </article>
          </div>
          {((videoJob?.status === "failed") || (imageJob?.status === "succeeded" && !videoJob && !videoStarting && videoStartedFor.current === imageJob.id)) && image && <button className="retry-link" type="button" onClick={retryVideo}>Give the video another take ↗</button>}
          <div className="output-note"><span>OUTPUT SPEC</span><span>HERO IMAGE  /  06 SEC  /  {displayedAspectRatio.split(" ")[0]}  /  H.264 + AAC</span></div>
          <section className="recent-section" aria-label="Recent generations">
            <div className="recent-heading"><div><p className="eyebrow"><span>SESSION</span> RECENT GENERATIONS</p><small>Saved in this browser tab</small></div><span>{String(recent.length).padStart(2, "0")} / 05</span></div>
            {recent.length > 0 ? <div className="recent-list">{recent.map((item, index) => <button key={item.id} type="button" className={`recent-item${selectedRecentId === item.id ? " selected" : ""}`} onClick={() => setSelectedRecentId(item.id)} disabled={working}>
              <span className="recent-thumb"><img src={item.stillUrl} alt="" /><b>0:06</b></span>
              <span className="recent-copy"><strong>{item.presetName}</strong><small>{index === 0 ? "JUST NOW" : `TAKE ${String(recent.length - index).padStart(2, "0")}`}</small></span>
              <span className="recent-open">↗</span>
            </button>)}</div> : <div className="recent-empty">Your finished stills and films will collect here.</div>}
          </section>
        </div>
      </section>

      <footer className="footer"><span>IFN / GENERATIVE FOOD STUDIO</span><span>YOUR SOURCE IMAGE STAYS THE SUBJECT</span></footer>
    </main>
  );
}
