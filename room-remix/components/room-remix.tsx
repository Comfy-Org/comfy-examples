"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type ItemKind = "sofa" | "plant" | "lamp" | "rug" | "art" | "table" | "mushroom-stool" | "disco-ball" | "snail-planter";
type Item = { id: number; kind: ItemKind; x: number; y: number; scale: number; rotation: number };
type Room = { name: string; image: string };
type Style = { name: string; mood: string; swatches: string[]; className: string };
type ApiJob = { id: string; status: string; outputs: Array<{ id: string; name: string; type: string; url: string }>; error: { message?: string } | null };

const terminalStatuses = new Set(["succeeded", "completed", "failed", "canceled", "cancelled", "expired"]);

const rooms: Room[] = [
  { name: "Sunny living room", image: "/rooms/sunny-living-room.jpg" },
  { name: "Reading nook", image: "/rooms/reading-nook.jpg" },
  { name: "Cabin living room", image: "/rooms/weekend-cabin.jpg" },
];

const styles: Style[] = [
  { name: "Moss arcade", mood: "Moss · lime", swatches: ["#b5e83c", "#ee654e", "#693fd2"], className: "style-goblin" },
  { name: "Space motel", mood: "Teal · ultraviolet", swatches: ["#53dfd0", "#ff6489", "#6743eb"], className: "style-space" },
  { name: "Disco fruit", mood: "Citrus · cobalt", swatches: ["#e4ef38", "#ff4f9b", "#5265ee"], className: "style-disco" },
  { name: "Night greenhouse", mood: "Green · violet", swatches: ["#42d899", "#ff7958", "#563294"], className: "style-haunt" },
];

const itemLabels: Record<ItemKind, string> = { sofa: "Cloud sofa", plant: "Leafy plant", lamp: "Paper lamp", rug: "Round rug", art: "Framed art", table: "Side table", "mushroom-stool": "Mushroom stool", "disco-ball": "Disco ball", "snail-planter": "Snail planter" };
const itemPrices: Record<ItemKind, string> = { sofa: "$899", plant: "$68", lamp: "$129", rug: "$240", art: "$45", table: "$149", "mushroom-stool": "$88", "disco-ball": "$66", "snail-planter": "$42" };
const itemColors: Record<ItemKind, string> = { sofa: "#c8b7ea", plant: "#85bd35", lamp: "#72d9e8", rug: "#ff5b8e", art: "#fc795e", table: "#9a73dc", "mushroom-stool": "#f26955", "disco-ball": "#a9b5db", "snail-planter": "#b5e83c" };
const initialItems: Item[] = [
  { id: 1, kind: "sofa", x: 53, y: 69, scale: 1, rotation: 0 },
  { id: 2, kind: "plant", x: 84, y: 50, scale: 1, rotation: 0 },
  { id: 3, kind: "lamp", x: 70, y: 56, scale: 0.85, rotation: 0 },
];

function ItemDrawing({ kind, color }: { kind: ItemKind; color: string }) {
  if (kind === "mushroom-stool") return <svg viewBox="0 0 80 90" aria-hidden="true"><path d="M39 16C19 16 8 29 8 42c0 8 10 11 32 11s32-3 32-11C72 29 59 16 39 16Z" fill={color}/><circle cx="28" cy="32" r="5" fill="#f5dc56"/><circle cx="49" cy="26" r="4" fill="#f5dc56"/><circle cx="53" cy="42" r="5" fill="#f5dc56"/><path d="M31 51h17l8 29H24z" fill="#f4d8ad"/><path d="M23 81h34" stroke="#34253f" strokeWidth="5" strokeLinecap="round"/></svg>;
  if (kind === "disco-ball") return <svg viewBox="0 0 80 100" aria-hidden="true"><path d="M39 4v12" stroke="#34253f" strokeWidth="3"/><path d="M27 15h25l7 8H20z" fill="#a08bd7"/><circle cx="39" cy="51" r="27" fill={color}/><path d="M15 51h48M39 24v54M21 34l37 34M58 34 21 68" stroke="#f8f4ff" strokeWidth="2"/><path d="m18 44 7-7m26 27 7-7m-33 6 7 7m20-34 7 7" stroke="#fff" strokeWidth="4"/><path d="M38 78v10m-12 4h25" stroke="#7256a8" strokeWidth="4" strokeLinecap="round"/></svg>;
  if (kind === "snail-planter") return <svg viewBox="0 0 90 80" aria-hidden="true"><path d="M9 55c9-12 18-14 27-6l12 11H15c-6 0-8-2-6-5Z" fill="#b5e83c"/><path d="M29 51c-2-18 7-31 21-31 13 0 19 11 15 24-3 10-14 16-25 16" fill={color}/><path d="M42 40c0-8 7-12 13-8 7 4 6 13 0 16-5 3-10 0-10-4 0-3 4-5 7-3" fill="none" stroke="#693fd2" strokeWidth="3" strokeLinecap="round"/><path d="m61 48 4-13m-3 13 11-10" stroke="#34253f" strokeWidth="2" strokeLinecap="round"/><circle cx="64" cy="34" r="2" fill="#34253f"/><circle cx="74" cy="37" r="2" fill="#34253f"/><path d="M15 62h46l-5 13H21z" fill="#ee654e"/><path d="M20 65h36" stroke="#ffd84c" strokeWidth="3"/></svg>;
  if (kind === "plant") return <svg viewBox="0 0 70 90" aria-hidden="true"><path d="M35 57C20 44 15 28 26 24c8-3 11 7 10 17C34 25 43 9 52 16c10 8-2 25-15 33 16-13 27-10 27-1 0 10-16 14-29 9Z" fill={color}/><path d="M27 56h17l-3 27H30z" fill="#bd8b65"/><path d="M27 59h17" stroke="#e4c3a3" strokeWidth="3"/></svg>;
  if (kind === "sofa") return <svg viewBox="0 0 130 76" aria-hidden="true"><path d="M15 37V25a9 9 0 0 1 9-9h17v24H15Zm100 0V25a9 9 0 0 0-9-9H89v24h26Z" fill={color}/><rect x="11" y="35" width="108" height="30" rx="10" fill={color}/><path d="M22 62v9m86-9v9M65 38v24" stroke="#755b45" strokeWidth="4" strokeLinecap="round"/><path d="M18 45h94" stroke="#fff" strokeOpacity=".3" strokeWidth="3"/></svg>;
  if (kind === "lamp") return <svg viewBox="0 0 70 100" aria-hidden="true"><path d="M17 11h36l9 28H8z" fill={color}/><path d="M35 39v45m-13 5h26" stroke="#926f4d" strokeWidth="5" strokeLinecap="round"/><ellipse cx="35" cy="39" rx="27" ry="5" fill="#fff" fillOpacity=".32"/></svg>;
  if (kind === "rug") return <svg viewBox="0 0 130 54" aria-hidden="true"><ellipse cx="65" cy="27" rx="60" ry="22" fill={color}/><ellipse cx="65" cy="27" rx="46" ry="14" fill="none" stroke="#f5dfc4" strokeWidth="2" strokeDasharray="3 4"/></svg>;
  if (kind === "art") return <svg viewBox="0 0 76 86" aria-hidden="true"><rect x="5" y="5" width="66" height="76" rx="2" fill="#f3dfbf"/><rect x="10" y="10" width="56" height="66" fill="#d98a62"/><circle cx="47" cy="29" r="11" fill="#f2cc70"/><path d="M12 67 31 43l12 13 8-9 13 20Z" fill="#748969"/><rect x="5" y="5" width="66" height="76" fill="none" stroke="#8b664c" strokeWidth="3"/></svg>;
  return <svg viewBox="0 0 90 80" aria-hidden="true"><path d="M13 17h64l-8 21H21z" fill={color}/><path d="m26 38-5 31m48-31 5 31" stroke="#8b664c" strokeWidth="5" strokeLinecap="round"/><path d="M20 48h50" stroke="#fff" strokeOpacity=".3" strokeWidth="2"/></svg>;
}

export function RoomRemix() {
  const [room, setRoom] = useState(0);
  const [style, setStyle] = useState(0);
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"furniture" | "details" | "oddities">("furniture");
  const [generating, setGenerating] = useState(false);
  const [madeover, setMadeover] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [toast, setToast] = useState("");
  const [job, setJob] = useState<ApiJob | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeStyle = styles[style]!;
  const currentRoom = rooms[room]!;
  const image = roomImage || currentRoom.image;
  const previewImage = madeover && generatedImage ? generatedImage : image;

  useEffect(() => {
    if (!job) return;
    if (terminalStatuses.has(job.status)) {
      setGenerating(false);
      if (job.status === "succeeded" || job.status === "completed") {
        const output = job.outputs.find((candidate) => candidate.type.toLowerCase().includes("image")) || job.outputs[0];
        if (output) {
          setGeneratedImage(output.url);
          setMadeover(true);
          setJobMessage("Preview ready.");
        } else {
          setJobMessage("Comfy Cloud finished, but did not return an image.");
        }
      } else {
        setJobMessage(job.error?.message || `The Comfy Cloud render ${job.status}. Try again.`);
      }
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}`);
        const next = await response.json() as ApiJob & { error?: string };
        if (!response.ok) throw new Error(next.error || "Unable to check the Comfy Cloud render.");
        if (!cancelled) setJob(next);
      } catch (error) {
        if (!cancelled) {
          setJobMessage(error instanceof Error ? `${error.message} Retrying…` : "Connection interrupted. Retrying…");
          setJob((current) => current?.id === job.id ? { ...current } : current);
        }
      }
    }, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [job]);

  useEffect(() => () => {
    if (roomImage) URL.revokeObjectURL(roomImage);
  }, [roomImage]);

  function addItem(kind: ItemKind) {
    const id = Date.now();
    setItems((current) => [...current, { id, kind, x: 42 + Math.random() * 22, y: 61 + Math.random() * 12, scale: 0.9, rotation: 0 }]);
    setSelectedItem(id);
    setMadeover(false);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("");
  }

  function placeItem(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (generating) return;
    const bounds = canvasRef.current?.getBoundingClientRect();
    const payload = event.dataTransfer.getData("application/room-item");
    if (!bounds || !payload) return;
    const { kind, id } = JSON.parse(payload) as { kind?: ItemKind; id?: number };
    const x = Math.max(5, Math.min(95, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(8, Math.min(94, ((event.clientY - bounds.top) / bounds.height) * 100));
    if (kind) {
      const newId = Date.now();
      setItems((current) => [...current, { id: newId, kind, x, y, scale: 1, rotation: 0 }]);
      setSelectedItem(newId);
    } else if (id !== undefined) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, x, y } : item));
      setSelectedItem(id);
    }
    setMadeover(false);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("");
  }

  function startDrag(event: DragEvent<HTMLElement>, data: { kind?: ItemKind; id?: number }) {
    event.dataTransfer.setData("application/room-item", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "copyMove";
  }

  function uploadRoom(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || generating) return;
    setRoomImage(URL.createObjectURL(file));
    setRoomFile(file);
    setRoomName(file.name.replace(/\.[^.]+$/, ""));
    setMadeover(false);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("");
    setToast("Your room is ready to remix ✨");
    window.setTimeout(() => setToast(""), 2400);
  }

  function chooseRoom(index: number) {
    setRoom(index);
    setRoomImage(null);
    setRoomFile(null);
    setRoomName(null);
    setMadeover(false);
    setItems(initialItems);
    setSelectedItem(null);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("");
  }

  function surpriseMe() {
    const nextStyle = Math.floor(Math.random() * styles.length);
    setStyle(nextStyle);
    const funSet: Item[] = [
      { id: Date.now(), kind: "mushroom-stool", x: 50, y: 75, scale: 1, rotation: -4 },
      { id: Date.now() + 1, kind: "disco-ball", x: 68, y: 44, scale: .9, rotation: 0 },
      { id: Date.now() + 2, kind: "snail-planter", x: 84, y: 63, scale: .95, rotation: 0 },
      { id: Date.now() + 3, kind: "plant", x: 25, y: 54, scale: 1, rotation: 0 },
      { id: Date.now() + 4, kind: "art", x: 35, y: 35, scale: .8, rotation: 0 },
    ];
    setItems(funSet);
    setSurprise(true);
    setMadeover(true);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("");
  }

  async function makeOver() {
    setGenerating(true);
    setMadeover(false);
    setGeneratedImage(null);
    setJob(null);
    setJobMessage("Sending to Comfy Cloud…");

    try {
      let imageFile = roomFile;
      if (!imageFile) {
        const response = await fetch(currentRoom.image);
        if (!response.ok) throw new Error("Could not load the sample room photo.");
        const blob = await response.blob();
        imageFile = new File([blob], `${currentRoom.name.toLowerCase().replace(/\s+/g, "-")}.jpg`, { type: blob.type || "image/jpeg" });
      }

      const form = new FormData();
      form.set("image", imageFile);
      form.set("style", activeStyle.name);
      form.set("furniture", JSON.stringify(items.map(({ kind, x, y }) => ({ kind, x, y }))));
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const result = await response.json() as ApiJob & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not submit this room makeover.");

      setJob(result);
      setJobMessage("Rendering…");
    } catch (error) {
      setGenerating(false);
      setJobMessage(error instanceof Error ? error.message : "Could not submit this room makeover.");
    }
  }

  function saveIdea() {
    const data = { room: roomName || currentRoom.name, style: activeStyle.name, items };
    localStorage.setItem("room-remix-project", JSON.stringify(data));
    setToast("Saved to your idea folder ♡");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <main className={`app-shell ${activeStyle.className}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Room Remix home"><span className="brand-mark">r<span>✳</span></span><span>room<span className="brand-light">remix</span></span></a>
        <div className="topbar-center">DESIGN STUDIO</div>
        <div className="topbar-actions"><span className="save-note">{madeover ? "READY" : "DRAFT"}</span><button className="save-button" onClick={saveIdea}>♡ <span>Save</span></button><button className="avatar" aria-label="Your profile">J</button></div>
      </header>

      <section className="intro" id="top">
        <div><h1>Make room.</h1><p className="intro-copy">Add what you love.</p></div>
        <div className="intro-side"><div className="step-dots"><i className="done">1</i><span /><i className="done">2</i><span /><i className={madeover ? "done" : "current"}>3</i></div></div>
      </section>

      <section className="studio">
        <aside className="shelf">
          <div className="shelf-head"><div><p className="section-kicker">01 / ROOM</p><h2>Choose a room</h2></div><button className="text-action" disabled={generating} onClick={() => fileRef.current?.click()}>＋ Upload</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadRoom} hidden /></div>
          <div className="room-picks" aria-label="Choose a room">
            {rooms.map((option, index) => <button key={option.name} disabled={generating} className={`room-pick ${!roomImage && room === index ? "active" : ""}`} onClick={() => chooseRoom(index)}><span className="room-thumb" style={{ backgroundImage: `url("${option.image}")` }} /><span className="room-pick-copy"><strong>{option.name}</strong></span>{!roomImage && room === index && <span className="pick-check">✓</span>}</button>)}
          </div>

          <div className="shelf-divider" />
          <div className="shelf-head style-heading"><div><p className="section-kicker">02 / THEME</p><h2>Pick a look</h2></div><button className="shuffle" disabled={generating} onClick={surpriseMe} title="Surprise me">⤨</button></div>
          <div className="style-grid">{styles.map((option, index) => <button key={option.name} disabled={generating} className={`style-card ${style === index ? "active" : ""}`} onClick={() => { setStyle(index); setMadeover(false); setSurprise(false); setGeneratedImage(null); setJob(null); setJobMessage(""); }}><span className={`style-art ${option.className}`}><i /><i /><i /><i /></span><span className="style-card-copy"><strong>{option.name}</strong><small>{option.mood}</small></span>{style === index && <span className="style-check">✓</span>}</button>)}</div>

          <div className="shelf-divider" />
          <div className="shelf-head furniture-heading"><div><p className="section-kicker">03 / OBJECTS</p><h2>Add objects</h2></div><span className="item-count">{items.length}</span></div>
          <div className="catalog-tabs"><button className={activeTab === "furniture" ? "active" : ""} onClick={() => setActiveTab("furniture")}>Furniture</button><button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>Small stuff</button><button className={activeTab === "oddities" ? "active" : ""} onClick={() => setActiveTab("oddities")}>Oddities ✳</button></div>
          <p className="drag-hint">Drag to place <span>↗</span></p>
          <div className="item-grid">{(activeTab === "furniture" ? (["sofa", "table", "rug"] as ItemKind[]) : activeTab === "details" ? (["plant", "lamp", "art"] as ItemKind[]) : (["mushroom-stool", "disco-ball", "snail-planter"] as ItemKind[])).map((kind) => <button key={kind} className="item-card" disabled={generating} draggable={!generating} onDragStart={(event) => startDrag(event, { kind })} onClick={() => addItem(kind)}><span className={`item-art item-${kind}`}><ItemDrawing kind={kind} color={itemColors[kind]} /></span><span className="item-info"><strong>{itemLabels[kind]}</strong><small>{itemPrices[kind]}</small></span><span className="item-add">＋</span></button>)}</div>
        </aside>

        <section className="preview-column">
          <div className="preview-head"><div><h2>{roomName || currentRoom.name}</h2><p className="preview-sub">{activeStyle.name} <span>·</span> {items.length} objects</p></div><button className="before-after" disabled={generating} aria-pressed={madeover} onClick={() => { setMadeover(!madeover); setSurprise(false); }}><span className={`toggle ${madeover ? "on" : ""}`}><i /></span>Preview</button></div>
          <div ref={canvasRef} className={`room-canvas ${madeover ? "madeover" : ""} ${activeStyle.className}`} onDragOver={(event) => event.preventDefault()} onDrop={placeItem}>
            <div className="room-photo" style={{ backgroundImage: `linear-gradient(0deg, rgba(33,23,17,.1), rgba(33,23,17,.02)), url("${previewImage}")` }} />
            <div className="photo-tint" />
            <span className="canvas-label"><i /> LIVE PREVIEW</span>
            {(!generatedImage || !madeover) && items.map((item) => <div key={item.id} draggable className={`placed-item ${selectedItem === item.id ? "selected" : ""} placed-${item.kind}`} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)` }} onDragStart={(event) => startDrag(event, { id: item.id })} onClick={() => setSelectedItem(item.id)}><ItemDrawing kind={item.kind} color={itemColors[item.kind]} />{selectedItem === item.id && <button className="remove-item" title="Remove item" onClick={(event) => { event.stopPropagation(); setItems((current) => current.filter((entry) => entry.id !== item.id)); setSelectedItem(null); setMadeover(false); setGeneratedImage(null); setJob(null); setJobMessage(""); }}>×</button>}</div>)}
            {generating && <div className="generating"><span className="loader">✳</span><strong>Making your room…</strong><small>Comfy Cloud render</small></div>}
            {surprise && <div className="surprise-tag">SURPRISE MIX</div>}
            {toast && <div className="toast">{toast}</div>}
            <button className="canvas-expand" disabled={generating} onClick={() => fileRef.current?.click()} aria-label="Change room photo">↗</button>
          </div>
          <div className="preview-bottom"><div className="palette">{activeStyle.swatches.map((swatch) => <i key={swatch} style={{ background: swatch }} />)}<small>{activeStyle.mood}</small></div><div className="canvas-tip">Drag to arrange</div><div className="preview-actions"><button className="undo-button" disabled={generating} title="Start over" onClick={() => { setItems(initialItems); setMadeover(false); setSelectedItem(null); setGeneratedImage(null); setJob(null); setJobMessage(""); }}>↺</button><button className="remix-button" onClick={makeOver} disabled={generating}>{generating ? <>… RENDERING</> : <>REMIX <span>✳</span></>}</button></div></div>
          {jobMessage && <p className={`job-status ${generating ? "working" : generatedImage ? "success" : "error"}`} role="status">{jobMessage}</p>}
          <div className="bottom-note">Photo goes to Comfy Cloud when you remix.</div>
        </section>
      </section>

      <footer className="page-footer"><span>ROOM REMIX <i>✳</i> COMFY CLOUD</span><span>2026</span></footer>
    </main>
  );
}
