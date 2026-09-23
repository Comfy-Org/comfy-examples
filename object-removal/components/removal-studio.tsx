"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent } from "react";
import { canvasPoint, copyStrokes, drawPath, type Point, type Stroke } from "../lib/canvas";

type SourceImage = { file: File; url: string; width: number; height: number };
type Job = {
  id: string;
  status: string;
  outputs: Array<{ id: string; name: string; url: string }>;
  error: { message: string } | null;
};

const terminalStatuses = new Set(["succeeded", "failed", "canceled", "expired"]);
const acceptedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxImageBytes = 15 * 1024 * 1024;

export function RemovalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<SourceImage | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const undoStackRef = useRef<Stroke[][]>([]);
  const gestureBeforeRef = useRef<Stroke[] | null>(null);
  const activePointerRef = useRef<number | null>(null);

  const [source, setSource] = useState<SourceImage | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<"brush" | "erase">("brush");
  const [brushPercent, setBrushPercent] = useState(2);
  const [canUndo, setCanUndo] = useState(false);
  const [edgeExpansion, setEdgeExpansion] = useState(10);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("Choose an image to begin the correction.");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);

  sourceRef.current = source;
  strokesRef.current = strokes;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const currentSource = sourceRef.current;
    const image = imageElementRef.current;
    if (!canvas || !overlay || !currentSource || !image) return;

    const { width, height } = currentSource;
    canvas.width = width;
    canvas.height = height;
    overlay.width = width;
    overlay.height = height;

    const context = canvas.getContext("2d");
    const overlayContext = overlay.getContext("2d");
    if (!context || !overlayContext) return;
    context.clearRect(0, 0, width, height);
    overlayContext.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const stroke of strokesRef.current) {
      overlayContext.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      overlayContext.strokeStyle = "rgba(193, 43, 39, 0.58)";
      overlayContext.fillStyle = "rgba(193, 43, 39, 0.58)";
      drawPath(overlayContext, stroke);
    }

    overlayContext.globalCompositeOperation = "source-over";
    context.drawImage(overlay, 0, 0);
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw, source, strokes]);

  useEffect(() => () => {
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
  }, []);

  useEffect(() => {
    if (!job || terminalStatuses.has(job.status) || pollingStopped) return;

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`);
        const next = await response.json() as Job & { error?: string | { message?: string } };
        if (!response.ok) {
          const detail = typeof next.error === "string" ? next.error : next.error?.message;
          throw new Error(detail || "Unable to check the correction status.");
        }

        setJob(next);
        setPollFailureCount(0);
        setError(next.status === "failed" || next.status === "canceled" || next.status === "expired");
        if (next.status === "succeeded") setMessage("Correction complete. Review the revised record.");
        else if (next.status === "failed") setMessage(next.error?.message || "The correction could not be completed.");
        else if (next.status === "canceled") setMessage("Correction canceled. You may issue a new order.");
        else if (next.status === "expired") setMessage("Correction expired. You may issue a new order.");
        else setMessage("The Bureau is processing your correction…");
      } catch (cause) {
        if (pollFailureCount >= 3) {
          setPollingStopped(true);
          setMessage(cause instanceof Error ? cause.message : "Unable to check the correction status.");
        } else {
          setPollFailureCount((count) => count + 1);
          setMessage(cause instanceof Error ? `${cause.message} Retrying…` : "Connection interrupted. Retrying…");
        }
        setError(true);
      }
    }, Math.min(1800 * 2 ** pollFailureCount, 7200));

    return () => window.clearTimeout(timer);
  }, [job, pollFailureCount, pollingStopped]);

  function selectImage(file: File | undefined) {
    if (!file) return;
    if (!acceptedImageTypes.has(file.type)) {
      setMessage("Please choose a PNG, JPEG, or WebP image.");
      setError(true);
      return;
    }
    if (file.size > maxImageBytes) {
      setMessage("Keep the source image below 15 MB.");
      setError(true);
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      imageElementRef.current = image;
      const next = { file, url, width: image.naturalWidth, height: image.naturalHeight };
      sourceRef.current = next;
      setSource(next);
      strokesRef.current = [];
      setStrokes([]);
      undoStackRef.current = [];
      setCanUndo(false);
      setJob(null);
      setError(false);
      setPollFailureCount(0);
      setPollingStopped(false);
      setMessage("Mark the object that should be removed.");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage("That image could not be opened. Choose another file.");
      setError(true);
    };
    image.src = url;
  }

  async function loadDemonstrationImage() {
    try {
      const response = await fetch("/sample-street.png");
      if (!response.ok) throw new Error("The demonstration photo is unavailable.");
      const file = new File([await response.blob()], "bureau-sample-street.png", { type: "image/png" });
      selectImage(file);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to load the demonstration photo.");
      setError(true);
    }
  }

  function eventPoint(event: PointerEvent<HTMLCanvasElement>): Point | null {
    const canvas = canvasRef.current;
    const currentSource = sourceRef.current;
    if (!canvas || !currentSource) return null;
    return canvasPoint(event.clientX, event.clientY, canvas.getBoundingClientRect(), currentSource.width, currentSource.height);
  }

  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!source || inProgress) return;
    const point = eventPoint(event);
    if (!point) return;

    setJob(null);
    setError(false);
    setMessage("Correction marks updated.");
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    gestureBeforeRef.current = copyStrokes(strokesRef.current);
    const width = Math.max(4, Math.min(source.width, source.height) * brushPercent / 100);
    const next = [...strokesRef.current, { points: [point], width, erase: tool === "erase" }];
    strokesRef.current = next;
    setStrokes(next);
  }

  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current !== event.pointerId) return;
    const point = eventPoint(event);
    if (!point) return;

    const current = strokesRef.current;
    const last = current.at(-1);
    if (!last) return;
    const next = [...current.slice(0, -1), { ...last, points: [...last.points, point] }];
    strokesRef.current = next;
    setStrokes(next);
  }

  function pointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    if (gestureBeforeRef.current) {
      undoStackRef.current = [...undoStackRef.current, gestureBeforeRef.current];
      setCanUndo(true);
    }
    gestureBeforeRef.current = null;
  }

  function undo() {
    const previous = undoStackRef.current.at(-1);
    if (!previous) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    const next = copyStrokes(previous);
    strokesRef.current = next;
    setStrokes(next);
    setCanUndo(undoStackRef.current.length > 0);
    setJob(null);
    setError(false);
    setMessage("Last brush action revoked.");
  }

  function clearMask() {
    if (strokesRef.current.length === 0) return;
    undoStackRef.current = [...undoStackRef.current, copyStrokes(strokesRef.current)];
    strokesRef.current = [];
    setStrokes([]);
    setCanUndo(true);
    setJob(null);
    setError(false);
    setPollFailureCount(0);
    setPollingStopped(false);
    setMessage("Mask cleared. Mark a subject to continue.");
  }

  async function exportMask(): Promise<File> {
    if (!source) throw new Error("Choose a source image first.");
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = source.width;
    maskCanvas.height = source.height;
    const context = maskCanvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare the removal mask.");

    context.fillStyle = "#000";
    context.fillRect(0, 0, source.width, source.height);
    for (const stroke of strokesRef.current) {
      context.globalCompositeOperation = stroke.erase ? "source-over" : "destination-out";
      context.strokeStyle = "#000";
      context.fillStyle = "#000";
      drawPath(context, stroke);
    }
    context.globalCompositeOperation = "source-over";

    const blob = await new Promise<Blob>((resolve, reject) => {
      maskCanvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to export the mask.")), "image/png");
    });
    return new File([blob], "removal-mask.png", { type: "image/png" });
  }

  async function submit() {
    if (!source || strokesRef.current.length === 0 || submitting) return;
    setSubmitting(true);
    setJob(null);
    setError(false);
    setPollFailureCount(0);
    setPollingStopped(false);
    setMessage("Submitting the correction order…");

    try {
      const form = new FormData();
      form.append("image", source.file);
      form.append("mask", await exportMask());
      form.append("edgeExpansion", String(edgeExpansion));

      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to issue the correction order.");

      setJob(next);
      setMessage("The Bureau is processing your correction…");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to issue the correction order.");
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (inProgress) return;
    selectImage(event.dataTransfer.files[0]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function retryStatus() {
    setPollingStopped(false);
    setPollFailureCount(0);
    setError(false);
    setMessage("Checking correction status…");
  }

  const result = job?.status === "succeeded" ? job.outputs[0] : null;
  const inProgress = submitting || Boolean(job && !terminalStatuses.has(job.status));

  return (
    <main className="bureau-shell">
      <aside className="bureau-rail" aria-label="Bureau navigation">
        <div className="rail-brand">
          <div className="rail-imprint"><span className="imprint-mark"><b>B</b><i>V</i><b>C</b></span><span>PEOPLE’S<br />IMAGE OFFICE</span></div>
          <h1>Bureau of<br /><em>Visual</em><br />Corrections</h1>
          <p className="rail-motto">A CLEANER<br />TOMORROW<br />TOGETHER</p>
        </div>

        <nav className="rail-tools" aria-label="Correction tools">
          <span className="rail-label">CURRENT PROCEDURE</span>
          <button type="button" className={tool === "brush" ? "rail-tool active" : "rail-tool"} onClick={() => setTool("brush")} disabled={!source || inProgress} aria-pressed={tool === "brush"}>
            <span className="rail-icon crop-icon" aria-hidden="true" /> <span>REDACT</span><b>01</b>
          </button>
          <button type="button" className={tool === "erase" ? "rail-tool active" : "rail-tool"} onClick={() => setTool("erase")} disabled={!source || inProgress} aria-pressed={tool === "erase"}>
            <span className="rail-icon restore-icon" aria-hidden="true" /> <span>RESTORE</span><b>02</b>
          </button>
        </nav>

        <div className="rail-foot">
          <span>LESS DISTRACTION<br />A CLEARER RECORD</span>
          <i>OFFICE SEAL · BVC 01</i>
        </div>
      </aside>

      <div className="bureau-main">
        <header className="bureau-topline">
          <span>VISUAL CORRECTION FOR A BRIGHTER TOMORROW</span>
          <i aria-hidden="true" />
          <span>PEOPLE PLACE A CLEANER RECORD</span>
          <b>FORM BVC—01</b>
        </header>

        <section className="workbench" aria-label="Object removal editor">
          <div className="editor-column">
            <div className="panel-heading editor-heading">
              <span><b>01</b> / EDIT IMAGE</span>
              {source && <span className="image-dimensions">{source.width} × {source.height}</span>}
            </div>

            <div
              className={`canvas-stage${dragging ? " is-dragging" : ""}${source ? " has-image" : ""}`}
              onDragOver={(event) => { event.preventDefault(); if (!inProgress) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <canvas
                ref={canvasRef}
                className={`source-canvas${source ? " is-ready" : ""}`}
                aria-label="Image and marked object removal area"
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
              />
              {source ? (
                <div className="canvas-corner-label">MASK LAYER · {strokes.length ? "ACTIVE" : "EMPTY"}</div>
              ) : (
                <div className="empty-state">
                  <span className="upload-mark" aria-hidden="true">＋</span>
                  <strong>Submit a source image</strong>
                  <span>Drop a file here or choose from your records</span>
                  <button type="button" className="secondary-button" onClick={() => uploadRef.current?.click()}>Choose image</button>
                  <button type="button" className="demo-button" onClick={() => void loadDemonstrationImage()}>Load demonstration photo: remove a bicycle</button>
                  <small>PNG · JPEG · WEBP · 15 MB MAX</small>
                </div>
              )}
              <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} hidden />
              <canvas ref={overlayRef} className="overlay-canvas" aria-hidden="true" />
              <div className="canvas-coordinate" aria-hidden="true"><span>DOCUMENT AREA</span><span>{source ? "SOURCE REGISTERED" : "AWAITING SOURCE"}</span></div>
            </div>

            <div className="canvas-toolbar">
              <div className="toolbar-actions">
                <button type="button" className="quiet-button" onClick={() => uploadRef.current?.click()} disabled={inProgress}><span className="toolbar-glyph">＋</span> Replace</button>
                <button type="button" className="quiet-button" onClick={undo} disabled={!canUndo || inProgress}><span className="toolbar-glyph">↶</span> Undo</button>
                <button type="button" className="quiet-button" onClick={clearMask} disabled={!strokes.length || inProgress}><span className="toolbar-glyph">↺</span> Clear</button>
              </div>
              <label className="brush-control">
                <span>BRUSH DIAMETER</span>
                <input type="range" min="1" max="12" value={brushPercent} onChange={(event) => setBrushPercent(Number(event.target.value))} disabled={!source || inProgress} />
                <output>{source ? `${Math.round(Math.min(source.width, source.height) * brushPercent / 100)} px` : "—"}</output>
              </label>
              <div className="canvas-scale"><span>100%</span><b>FIT</b></div>
            </div>
          </div>

          <aside className="order-panel">
            <div className="panel-heading"><span><b>02</b> / SELECTION</span><span className="status-seal">BVC</span></div>
            <div className="selection-card">
              <div className="selection-thumbnail" aria-hidden="true"><span>{strokes.length ? "✳" : "＋"}</span></div>
              <div><p>SUBJECT STATUS</p><strong>{strokes.length ? "MARKED FOR REMOVAL" : "NO SUBJECT MARKED"}</strong><small>{strokes.length ? "Mask layer registered" : "Paint over an object to begin"}</small></div>
              <span className="selection-reticle" aria-hidden="true">⌖</span>
            </div>

            <div className="inspector-section">
              <div className="inspector-heading"><span>ADJUSTMENTS</span><i /></div>
              <div className="order-copy">
                <p className="eyebrow">CORRECTION ORDER</p>
                <h2>Remove the marked object.</h2>
                <p>Reconstruct the background in keeping with the surrounding record.</p>
              </div>
              <label className="adjustment-label" htmlFor="edge-expansion">Mask edge expansion <span>{edgeExpansion} PX</span></label>
              <input
                id="edge-expansion"
                className="expansion-slider"
                type="range"
                min="0"
                max="25"
                step="1"
                value={edgeExpansion}
                onChange={(event) => setEdgeExpansion(Number(event.target.value))}
                disabled={inProgress}
              />
              <p className="adjustment-hint">Extend the repair just beyond the marked edge.</p>
            </div>

            <div className="inspector-section preview-section">
              <div className="inspector-heading"><span>PREVIEW RECORD</span><i /></div>
              <div className="preview-pair">
                <div className="preview-tile"><span>BEFORE</span>{source ? <img src={source.url} alt="Original source" /> : <div className="preview-empty">SOURCE</div>}</div>
                <div className="preview-tile"><span>AFTER</span>{result ? <img src={result.url} alt="Corrected result" /> : <div className="preview-empty after-empty">AWAITING<br />ORDER</div>}</div>
              </div>
              {result && <a className="download-link" href={result.url} download={result.name}>Download revised record ↗</a>}
            </div>

            <div className="approval-card">
              <div><span>VISUAL CORRECTION</span><strong>{result ? "REVISED" : inProgress ? "IN REVIEW" : strokes.length ? "READY" : "PENDING"}</strong></div>
              <span className="approval-check" aria-hidden="true">{result ? "✓" : "✳"}</span>
              <div className="approval-meta"><span>MASK LAYER <b>{strokes.length ? "ACTIVE" : "EMPTY"}</b></span><span>RECORD <b>{result ? "REVISED" : inProgress ? "IN REVIEW" : "PENDING"}</b></span></div>
            </div>

            <button type="button" className="issue-button" onClick={() => void submit()} disabled={!source || !strokes.length || inProgress}>
              <span>{submitting ? "Submitting order…" : inProgress ? "Correction in progress…" : "Process correction"}</span>
              <span className="button-arrow" aria-hidden="true">→</span>
            </button>
            <p className={`status-message${error ? " is-error" : ""}`} role="status" aria-live="polite">{message}</p>
            {pollingStopped && job && !terminalStatuses.has(job.status) && <button type="button" className="retry-button" onClick={retryStatus}>Retry status check</button>}
          </aside>
        </section>
        <footer className="bureau-footer"><span>THE BUREAU OF VISUAL CORRECTIONS</span><span>LESS DISTRACTION · A CLEARER RECORD</span></footer>
      </div>
    </main>
  );
}
