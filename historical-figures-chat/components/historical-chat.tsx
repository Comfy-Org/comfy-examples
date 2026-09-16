"use client";

import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { figures, type Figure } from "../lib/figures";

type Message =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; video: string };
type Job = { id: string; status: string; outputs: Array<{ url: string; type: string }>; error: { message?: string } | null };
const terminal = new Set(["succeeded", "failed", "canceled", "expired"]);
const MAX_MESSAGES = 12;
const MAX_POLL_RETRIES = 3;

function videoFrom(job: Job) {
  return job.outputs.find((output) => output.type.toLowerCase().includes("video"))?.url;
}

export function HistoricalChat() {
  const [figure, setFigure] = useState<Figure | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState("Select a person to begin.");
  const [pollRetries, setPollRetries] = useState(0);
  const [pollingStopped, setPollingStopped] = useState(false);
  const requestGenerationRef = useRef(0);
  const pollControllerRef = useRef<AbortController | null>(null);

  function finishJob(next: Job, generation: number) {
    if (generation !== requestGenerationRef.current) return;
    setJob(next);
    setPollingStopped(false);
    if (next.status === "succeeded") {
      const video = videoFrom(next);
      if (!video) {
        setNotice("The response finished without a video output.");
        return;
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant" as const, video }].slice(-MAX_MESSAGES));
      setNotice("Video response ready.");
      return;
    }
    setNotice(next.error?.message || "The response video was not completed.");
  }

  useEffect(() => {
    if (!job || terminal.has(job.status) || pollingStopped) return;
    const generation = requestGenerationRef.current;
    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      pollControllerRef.current = controller;
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { signal: controller.signal });
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(next.error || "Unable to check the video.");
        if (generation !== requestGenerationRef.current) return;
        setPollRetries(0);
        if (terminal.has(next.status)) finishJob(next, generation);
        else {
          setJob(next);
          setNotice("Generating the response video…");
        }
      } catch (error) {
        if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
        if (pollRetries < MAX_POLL_RETRIES) {
          setPollRetries((current) => current + 1);
          setNotice(`Connection interrupted. Retrying… (${pollRetries + 1}/${MAX_POLL_RETRIES})`);
        } else {
          setPollingStopped(true);
          setNotice(`${error instanceof Error ? error.message : "Unable to check the video."} Retry the status check.`);
        }
      }
    }, Math.min(1_800 * 2 ** pollRetries, 7_200));
    return () => {
      window.clearTimeout(timer);
      pollControllerRef.current?.abort();
    };
  }, [job, pollRetries, pollingStopped]);

  const waiting = Boolean(job && !terminal.has(job.status));
  const pageTitle = useMemo(() => figure ? `Correspondence with ${figure.name}` : "Choose a person", [figure]);
  const latestVideo = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.video,
    [messages],
  );
  function invalidateRequests() {
    requestGenerationRef.current += 1;
    pollControllerRef.current?.abort();
    pollControllerRef.current = null;
  }

  function choose(next: Figure) {
    invalidateRequests();
    setFigure(next);
    setMessages([]);
    setJob(null);
    setPollRetries(0);
    setPollingStopped(false);
    setNotice(`Ask ${next.name} a question.`);
  }

  function backToGallery() {
    invalidateRequests();
    setFigure(null);
    setJob(null);
    setPollRetries(0);
    setPollingStopped(false);
    setNotice("Select a person to begin.");
  }

  function retryPolling() {
    setPollRetries(0);
    setPollingStopped(false);
    setNotice("Checking the response video…");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!figure || !draft.trim() || waiting) return;
    const generation = ++requestGenerationRef.current;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: draft.trim() };
    const nextMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(nextMessages);
    setDraft("");
    setNotice("Submitting the question…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          figureId: figure.id,
          messages: nextMessages
            .filter((message): message is Extract<Message, { role: "user" }> => message.role === "user")
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "Unable to start the workflow.");
      if (generation !== requestGenerationRef.current) return;
      setPollRetries(0);
      setPollingStopped(false);
      if (terminal.has(next.status)) finishJob(next, generation);
      else {
        setJob(next);
        setNotice("Generating the response video…");
      }
    } catch (error) {
      if (generation !== requestGenerationRef.current) return;
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setDraft(userMessage.content);
      setNotice(error instanceof Error ? error.message : "Unable to start the workflow.");
    }
  }

  return (
    <main>
      <header className="topbar"><button className="wordmark" onClick={backToGallery}>THE RECORD<span> / historical correspondence</span></button><p>Questions answered as short films</p></header>
      {!figure ? <section className="gallery"><div className="intro"><p className="eyebrow">HISTORICAL CORRESPONDENCE / 08 SUBJECTS</p><h1>Ask a question of the past.</h1><p>Choose a person, write a question, and receive a short interpretive video response. It is a creative reconstruction, not a primary source.</p></div><div className="figure-grid">{figures.map((item) => <button className="figure-card" key={item.id} onClick={() => choose(item)} style={{ "--accent": item.accent } as CSSProperties}><img src={item.image} alt={`Portrait of ${item.name}`} /><span className="card-scrim" /><span className="card-copy"><small>{item.years}</small><strong>{item.name}</strong><em>{item.title}</em><b>Open correspondence <i>→</i></b></span></button>)}</div></section> : <section className="conversation"><aside><button className="back" onClick={backToGallery}>← All people</button><div className="portrait"><img src={figure.image} alt={`Portrait of ${figure.name}`} /></div><p className="eyebrow">{figure.years}</p><h1>{figure.name}</h1><p className="role">{figure.title}</p><p className="focus">A historical interpretation, not an attributed performance.</p><p className="side-note">This experience makes an interpretation from a curated persona brief. Check a reliable historical source for quotations and facts.</p></aside><div className="chat"><div className="chat-heading"><div><p className="eyebrow">CORRESPONDENCE</p><h2>{pageTitle}</h2></div><span className={waiting ? "live working" : "live"}>{waiting ? "Generating" : "Available"}</span></div><div className="stage" aria-label={`${figure.name} video stage`}>{latestVideo ? <video src={latestVideo} controls playsInline preload="metadata" /> : <img src={figure.image} alt={`Portrait of ${figure.name}`} />}{waiting && <div className="stage-status"><span /><span /><span /><p>Generating response video…</p></div>}</div><div className="message-list" aria-live="polite">{messages.length === 0 && <div className="empty"><p>Ask a question to start the conversation.</p><small>The portrait above will be replaced by the reply.</small></div>}{messages.map((message) => <article className={`message ${message.role}`} key={message.id}><p>{message.role === "user" ? message.content : "Video reply"}</p></article>)}{waiting && <div className="rendering"><span /><span /><span /> <p>Preparing {figure.name}’s response…</p></div>}</div><form onSubmit={submit}><label htmlFor="message">Your question</label><div className="composer"><textarea id="message" value={draft} maxLength={1000} onChange={(event) => setDraft(event.target.value)} placeholder={`What would you ask ${figure.name}?`} disabled={waiting} /><button type="submit" disabled={waiting || !draft.trim()}>Send <span>↗</span></button></div><p className="notice" aria-live="polite">{notice}</p>{pollingStopped && <button type="button" onClick={retryPolling}>Retry status</button>}</form></div></section>}
    </main>
  );
}
