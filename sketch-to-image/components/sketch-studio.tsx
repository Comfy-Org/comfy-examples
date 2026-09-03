"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tool = "select" | "brush" | "eraser";
type Point = { x: number; y: number };
type Stroke = { points: Point[]; width: number; erase: boolean; color: string };
type CanvasImage = { id: string; src: string; x: number; y: number; width: number; height: number };
type Scene = { strokes: Stroke[]; images: CanvasImage[] };
type Job = { id: string; status: string; outputs: Array<{ name: string; url: string }>; error: { message: string } | null };

const emptyScene: Scene = { strokes: [], images: [] };
const terminalStatuses = new Set(["succeeded", "failed", "canceled", "expired"]);
const palette = ["#171718", "#df5b53", "#dfa735", "#68a8f7", "#74b98a", "#9d7ce8"];
const colorNames: Record<string, string> = {
  "#171718": "black",
  "#df5b53": "red",
  "#dfa735": "yellow",
  "#68a8f7": "blue",
  "#74b98a": "green",
  "#9d7ce8": "violet",
};
const dimensions = {
  square: { width: 768, height: 768, label: "1:1" },
  wide: { width: 960, height: 540, label: "16:9" },
  portrait: { width: 540, height: 960, label: "9:16" },
} as const;

type Aspect = keyof typeof dimensions;
type Gesture =
  | { kind: "draw" }
  | { kind: "drag"; id: string; offsetX: number; offsetY: number }
  | { kind: "resize"; id: string; startX: number; startY: number; startWidth: number; startHeight: number }
  | null;

function cloneScene(scene: Scene): Scene {
  return structuredClone(scene);
}

export function SketchStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const sceneRef = useRef<Scene>(emptyScene);
  const historyRef = useRef<Scene[]>([emptyScene]);
  const historyIndexRef = useRef(0);
  const beforeGestureRef = useRef<Scene | null>(null);
  const gestureRef = useRef<Gesture>(null);
  const requestRef = useRef(0);
  const renderInFlightRef = useRef(false);
  const queuedRenderRef = useRef<"preview" | "final" | null>(null);

  const [scene, setScene] = useState<Scene>(emptyScene);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(40);
  const [color, setColor] = useState(palette[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aspect, setAspect] = useState<Aspect>("square");
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(0.4);
  const [live, setLive] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("Draw, arrange, then describe the image.");
  const [error, setError] = useState(false);

  const size = dimensions[aspect];

  const setLiveScene = useCallback((next: Scene) => {
    sceneRef.current = next;
    setScene(next);
  }, []);

  const commitScene = useCallback((next: Scene) => {
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(cloneScene(next));
    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
    setHistoryIndex(historyIndexRef.current);
    setLiveScene(next);
  }, [setLiveScene]);

  const paintScene = useCallback((canvas: HTMLCanvasElement, includeSelection: boolean) => {
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = size.width;
    canvas.height = size.height;

    for (const item of scene.images) {
      let image = imageCache.current.get(item.src);

      if (!image) {
        image = new Image();
        image.onload = drawScene;
        image.src = item.src;
        imageCache.current.set(item.src, image);
      }

      if (image.complete) {
        context.drawImage(image, item.x, item.y, item.width, item.height);
      }
    }

    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of scene.strokes) {
      if (stroke.points.length < 2) continue;
      context.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
      context.stroke();
    }

    context.globalCompositeOperation = "source-over";

    const selected = includeSelection && scene.images.find((item) => item.id === selectedId);
    if (selected) {
      context.strokeStyle = "#7366ff";
      context.lineWidth = 3;
      context.strokeRect(selected.x, selected.y, selected.width, selected.height);
      context.fillStyle = "#7366ff";
      context.fillRect(selected.x + selected.width - 10, selected.y + selected.height - 10, 20, 20);
    }
  }, [scene, selectedId, size]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) paintScene(canvas, true);
  }, [paintScene]);

  useEffect(() => {
    drawScene();
  }, [drawScene]);

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (size.width / rect.width),
      y: (event.clientY - rect.top) * (size.height / rect.height),
    };
  }

  function startGesture(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    beforeGestureRef.current = cloneScene(sceneRef.current);
    const point = canvasPoint(event);

    if (tool === "brush" || tool === "eraser") {
      const next = cloneScene(sceneRef.current);
      next.strokes.push({ points: [point], width: brushSize, erase: tool === "eraser", color });
      gestureRef.current = { kind: "draw" };
      setLiveScene(next);
      return;
    }

    const target = [...sceneRef.current.images].reverse().find((item) => (
      point.x >= item.x && point.x <= item.x + item.width && point.y >= item.y && point.y <= item.y + item.height
    ));

    if (!target) {
      setSelectedId(null);
      gestureRef.current = null;
      return;
    }

    setSelectedId(target.id);
    const onHandle = Math.abs(point.x - (target.x + target.width)) < 26 && Math.abs(point.y - (target.y + target.height)) < 26;
    gestureRef.current = onHandle
      ? { kind: "resize", id: target.id, startX: point.x, startY: point.y, startWidth: target.width, startHeight: target.height }
      : { kind: "drag", id: target.id, offsetX: point.x - target.x, offsetY: point.y - target.y };
  }

  function moveGesture(event: React.PointerEvent<HTMLCanvasElement>) {
    const gesture = gestureRef.current;
    if (!gesture) return;

    const point = canvasPoint(event);
    const current = sceneRef.current;

    if (gesture.kind === "draw") {
      const stroke = current.strokes.at(-1);
      if (!stroke) return;

      setLiveScene({
        ...current,
        strokes: [...current.strokes.slice(0, -1), { ...stroke, points: [...stroke.points, point] }],
      });
    } else {
      const index = current.images.findIndex((image) => image.id === gesture.id);
      if (index < 0) return;
      const item = { ...current.images[index] };

      if (gesture.kind === "drag") {
        item.x = Math.max(0, Math.min(size.width - item.width, point.x - gesture.offsetX));
        item.y = Math.max(0, Math.min(size.height - item.height, point.y - gesture.offsetY));
      } else {
        item.width = Math.max(48, gesture.startWidth + point.x - gesture.startX);
        item.height = Math.max(48, gesture.startHeight + point.y - gesture.startY);
      }

      setLiveScene({ ...current, images: current.images.map((image, imageIndex) => imageIndex === index ? item : image) });
    }
  }

  function endGesture() {
    if (!gestureRef.current) return;
    gestureRef.current = null;

    if (beforeGestureRef.current) {
      commitScene(sceneRef.current);
      beforeGestureRef.current = null;
    }
  }

  async function importImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to import image."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const loaded = new Image();
      loaded.onload = () => resolve(loaded);
      loaded.onerror = () => reject(new Error("Unable to read image."));
      loaded.src = src;
    });

    const scale = Math.min(280 / image.width, 280 / image.height, 1);
    const next = cloneScene(sceneRef.current);
    const item = {
      id: crypto.randomUUID(),
      src,
      width: Math.round(image.width * scale),
      height: Math.round(image.height * scale),
      x: Math.round((size.width - image.width * scale) / 2),
      y: Math.round((size.height - image.height * scale) / 2),
    };

    next.images.push(item);
    setSelectedId(item.id);
    commitScene(next);
    event.target.value = "";
  }

  function undo() {
    if (historyIndexRef.current === 0) return;
    historyIndexRef.current -= 1;
    setHistoryIndex(historyIndexRef.current);
    setSelectedId(null);
    setLiveScene(cloneScene(historyRef.current[historyIndexRef.current]));
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setHistoryIndex(historyIndexRef.current);
    setSelectedId(null);
    setLiveScene(cloneScene(historyRef.current[historyIndexRef.current]));
  }

  function clear() {
    setSelectedId(null);
    commitScene(emptyScene);
  }

  async function canvasFile() {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas is not ready.");

    const guide = document.createElement("canvas");
    paintScene(guide, false);

    const blob = await new Promise<Blob>((resolve, reject) => {
      guide.toBlob((result) => result ? resolve(result) : reject(new Error("Unable to export canvas.")), "image/png");
    });

    return new File([blob], "canvas-guide.png", { type: "image/png" });
  }

  const render = useCallback(async (kind: "preview" | "final") => {
    if (!prompt.trim()) return;

    if (renderInFlightRef.current) {
      queuedRenderRef.current = kind === "final" ? "final" : queuedRenderRef.current || "preview";
      return;
    }

    const request = ++requestRef.current;
    renderInFlightRef.current = true;
    setError(false);
    setMessage(kind === "preview" ? "Updating preview…" : "Rendering…");

    try {
      const form = new FormData();
      form.append("guide", await canvasFile());
      form.append("prompt", prompt);
      form.append("strength", String(strength));
      const primaryColor = sceneRef.current.strokes
        .find((stroke) => !stroke.erase && stroke.color !== "#171718")?.color;
      form.append("primaryColor", primaryColor ? colorNames[primaryColor] : "");
      form.append("guideColors", [...new Set(sceneRef.current.strokes
        .filter((stroke) => !stroke.erase)
        .map((stroke) => colorNames[stroke.color]))]
        .filter(Boolean)
        .join(","));

      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const next = await response.json() as Job & { error?: string };

      if (!response.ok) {
        throw new Error(typeof next.error === "string" ? next.error : "Unable to submit canvas.");
      }

      if (request === requestRef.current) {
        setJob(next);
        setMessage("Generating…");
      }
    } catch (cause) {
      if (request === requestRef.current) {
        renderInFlightRef.current = false;
        setMessage(cause instanceof Error ? cause.message : "Unable to render canvas.");
        setError(true);
      }
    }
  }, [prompt, strength]);

  useEffect(() => {
    if (!live || !prompt.trim()) return;

    const timer = window.setTimeout(() => {
      void render("preview");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [scene, aspect, prompt, strength, live, render]);

  useEffect(() => {
    if (!job || terminalStatuses.has(job.status)) return;

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`);
        const next = await response.json() as Job;

        if (!response.ok) {
          throw new Error(next.error?.message || "Unable to check render.");
        }

        setJob(next);

        if (next.status === "succeeded") {
          setMessage("Ready.");
        } else if (next.status === "failed") {
          setMessage(next.error?.message || "Generation failed.");
          setError(true);
        }

        if (terminalStatuses.has(next.status) && renderInFlightRef.current) {
          renderInFlightRef.current = false;
          const queuedRender = queuedRenderRef.current;
          queuedRenderRef.current = null;

          if (queuedRender) {
            void render(queuedRender);
          }
        }
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Unable to check render.");
        setError(true);
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [job, render]);

  const result = job?.status === "succeeded" ? job.outputs[0] : null;

  return (
    <main>
      <header className="topbar">
        <h1>Canvas to image</h1>
        <div className="top-actions">
          <button type="button" className="quiet" onClick={undo} disabled={historyIndex === 0}>Undo</button>
          <button type="button" className="quiet" onClick={redo} disabled={historyIndex === historyRef.current.length - 1}>Redo</button>
          {(Object.keys(dimensions) as Aspect[]).map((option) => (
            <button key={option} type="button" className={aspect === option ? "ratio active" : "ratio"} onClick={() => setAspect(option)}>
              {dimensions[option].label}
            </button>
          ))}
        </div>
      </header>

      <section className="studio">
        <aside className="tools" aria-label="Canvas tools">
          <button type="button" className={tool === "select" ? "tool active" : "tool"} onClick={() => setTool("select")}>Select</button>
          <button type="button" className={tool === "brush" ? "tool active" : "tool"} onClick={() => setTool("brush")}>Brush</button>
          <button type="button" className={tool === "eraser" ? "tool active" : "tool"} onClick={() => setTool("eraser")}>Erase</button>
          <button type="button" className="tool" onClick={() => uploadRef.current?.click()}>Import</button>
          <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={importImage} hidden />
          <div className="palette" aria-label="Brush color">
            {palette.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use ${swatch} brush`}
                className={color === swatch ? "swatch active" : "swatch"}
                style={{ backgroundColor: swatch }}
                onClick={() => { setColor(swatch); setTool("brush"); }}
              />
            ))}
          </div>
          <label className="brush-size">Size<input type="range" min="3" max="42" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /></label>
          <button type="button" className="tool clear" onClick={clear}>Clear</button>
        </aside>

        <div className="artboards has-result">
          <section className="canvas-stage">
            <span className="artboard-label">GUIDE</span>
            <canvas
              ref={canvasRef}
              className={`canvas ${tool}`}
              onPointerDown={startGesture}
              onPointerMove={moveGesture}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
            />
            <p className="canvas-hint">Draw or place an image</p>
          </section>

          <section className="result-stage">
            <span className="artboard-label">RENDER</span>
            {result ? (
              <>
              <img src={result.url} alt="Generated image" />
              <a href={result.url} download={result.name}>Download image</a>
              </>
            ) : <p className="render-placeholder">Your generated image appears here.</p>}
          </section>
        </div>

        <aside className="controls">
          <label className="prompt-label">
            <span>Describe the result</span>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A cinematic product photograph…" rows={5} />
          </label>
          <label className="strength-label">
            <span>Structure <output>{strength.toFixed(1)}</output></span>
            <input type="range" min="0" max="1" step="0.1" value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
          </label>
          <label className="live-toggle"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> Live preview</label>
          <button type="button" className="render" onClick={() => void render("final")} disabled={!prompt.trim()}>Render image <span>→</span></button>
          <p className={error ? "status error" : "status"}>{message}</p>

        </aside>
      </section>
    </main>
  );
}
