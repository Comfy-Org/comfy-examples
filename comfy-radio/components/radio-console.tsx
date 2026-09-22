"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { stations } from "../lib/stations";

type Output = { id: string; name: string; type: string; url: string };
type Job = { id: string; status: string; outputs: Output[]; error: { message?: string } | null };

const terminal = new Set(["succeeded", "failed", "canceled", "expired"]);

export function RadioConsole() {
  const [stationIndex, setStationIndex] = useState(2);
  const [prompt, setPrompt] = useState<string>(stations[2].prompt);
  const [job, setJob] = useState<Job | null>(null);
  const [volume, setVolume] = useState(68);
  const [power, setPower] = useState(false);
  const [message, setMessage] = useState("THE AIR IS QUIET. PICK A STATION AND TUNE IN.");
  const [error, setError] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const station = stations[stationIndex];
  const output = job?.outputs.find((item) => item.type === "audio");
  const busy = Boolean(job && !terminal.has(job.status));

  useEffect(() => {
    if (!job || terminal.has(job.status)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}`, { signal: controller.signal });
        const next = await response.json() as Job & { error?: string };
        if (!response.ok) throw new Error(next.error || "The station can't reach the broadcast tower.");
        setJob(next);
        setPollFailures(0);
        if (next.status === "succeeded") {
          setMessage("FRESH OFF THE AIRWAVES. PRESS PLAY TO LISTEN.");
          setError(false);
        } else if (terminal.has(next.status)) {
          setMessage(next.error?.message || "That broadcast faded before it reached us. Try again.");
          setError(true);
        } else {
          setMessage("THE ENGINEER IS STILL AT THE CONSOLE…");
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        setPollFailures((count) => count + 1);
        setMessage(cause instanceof Error ? cause.message : "Signal lost. Checking again…");
        setError(true);
      }
    }, Math.min(6000, 1800 + pollFailures * 700));
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [job, pollFailures]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, output?.url]);

  function tune(index: number) {
    const next = Math.max(0, Math.min(stations.length - 1, index));
    if (next === stationIndex) return;
    setStationIndex(next);
    setPrompt(stations[next].prompt);
    setJob(null);
    setPower(false);
    setError(false);
    setMessage(`${stations[next].name.toUpperCase()} · READY TO TUNE IN.`);
  }

  async function generate() {
    if (busy) return;
    setPower(true);
    setError(false);
    setJob(null);
    setMessage(`CALLING ${station.name.toUpperCase()} IN TO THE STUDIO…`);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stationId: station.id, prompt }),
      });
      const next = await response.json() as Job & { error?: string };
      if (!response.ok) throw new Error(next.error || "The broadcast could not be started.");
      setJob(next);
      setMessage("THE TUBES ARE WARMING UP. YOUR TRACK IS BEING MADE…");
    } catch (cause) {
      setPower(false);
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "The broadcast desk is unavailable.");
    }
  }

  function play() {
    if (!audioRef.current) return;
    void audioRef.current.play().then(() => {
      setPower(true);
      setMessage("ON AIR · A BRAND NEW COMFY ORIGINAL.");
    }).catch(() => {
      setPower(false);
      setMessage("TAP PLAY ON THE PLAYER TO START THE BROADCAST.");
    });
  }

  const angle = -110 + (stationIndex / (stations.length - 1)) * 220;

  return (
    <main className="page-wrap">
      <header className="masthead">
        <a className="brand" href="#radio" aria-label="Comfy Radio home"><span className="brand-mark" aria-hidden="true">c</span><span>COMFY<br /><b>RADIO</b></span></a>
        <div className="masthead-note"><span className="live-dot" /> CHESTNUT COVE BROADCAST</div>
        <span className="serial">EST. 1947&nbsp; · &nbsp;FM / AM</span>
      </header>

      <section className={`radio-shell${power ? " is-on" : ""}`} id="radio" aria-label="Comfy Radio, a vintage tabletop radio">
        <div className="radio-art-frame">
          <img className="radio-art" src="/vintage-radio.png" alt="A restored dark walnut tube radio with woven speaker cloth, a smoked amber tuning dial, and two bakelite knobs." width="1536" height="1024" />

          <div className="dial-overlay" aria-label="Radio station dial">
            <div className="dial-current">
              <div><span className="dial-kicker">NOW TUNED</span><strong>{station.dialLabel}</strong></div>
              <span className="dial-frequency">{station.frequency}<small> FM</small></span>
            </div>
            <div className="dial-presets" aria-label="Choose a station">
              {stations.map((item, index) => <button key={item.id} type="button" className={`dial-preset${stationIndex === index ? " selected" : ""}`} style={{ "--station-position": `${((Number(item.frequency) - 88) / 20) * 100}%`, "--stop-color": item.color } as CSSProperties} onClick={() => tune(index)} aria-label={`Tune ${item.name}, ${item.frequency} megahertz`} aria-pressed={stationIndex === index} disabled={busy}><span>{item.dialLabel}</span><small>{item.frequency}</small></button>)}
            </div>
            <span className="dial-active-needle" style={{ left: `${((Number(station.frequency) - 88) / 20) * 100}%` }} aria-hidden="true" />
          </div>

          <div className="radio-knob volume-hotspot" style={{ left: "65.2%", top: "66.6%" }}>
            <span className="knob-hover-ring" aria-hidden="true" />
            <span className="knob-pointer" style={{ transform: `rotate(${-130 + volume * 2.6}deg)` }} aria-hidden="true" />
            <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" />
            <span className="knob-caption">VOLUME</span>
          </div>

          <div className="radio-knob tune-hotspot" style={{ left: "86%", top: "66.6%" }}>
            <span className="knob-hover-ring" aria-hidden="true" />
            <span className="knob-pointer" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true" />
            <input className="knob-hitbox" type="range" min="0" max={stations.length - 1} step="1" value={stationIndex} onChange={(event) => tune(Number(event.target.value))} aria-label="Tune to a radio station" aria-valuetext={`${station.name}, ${station.frequency} megahertz`} disabled={busy} />
            <span className="knob-caption">TUNE</span>
          </div>

          <div className="radio-power-area">
            <button className={`power-button${busy ? " generating" : output ? " has-track" : ""}`} type="button" onClick={busy ? undefined : output && job?.status === "succeeded" ? play : generate} disabled={busy || prompt.trim().length < 8}>
              <span className="power-icon">{busy ? <i className="spinner" /> : output && job?.status === "succeeded" ? "▶" : "⏻"}</span>
              <span><strong>{busy ? "WARMING THE TUBES" : output && job?.status === "succeeded" ? "PLAY BROADCAST" : "GENERATE NEW TRACK"}</strong><small>{busy ? job?.status === "running" ? "THE ORCHESTRA IS PLAYING…" : "PLEASE STAND BY" : "A COMFY ORIGINAL · ABOUT 30 SECONDS"}</small></span>
            </button>
          </div>
        </div>

        <div className="radio-status-line"><span className={`status-lamp${power && !busy ? " active" : ""}`} />{message}<span className="radio-status-mood">{station.mood}</span></div>
        {output && job?.status === "succeeded" && <div className="audio-player"><span className="player-label">NOW PLAYING / {station.frequency} FM</span><audio ref={audioRef} src={output.url} controls onPlay={() => setPower(true)} onPause={() => setPower(false)} /></div>}
      </section>

      <details className="studio">
        <summary className="studio-summary"><span>STUDIO NOTES</span><span>Change the music direction&nbsp; · &nbsp;{station.name}</span><i aria-hidden="true">＋</i></summary>
        <div className="studio-grid">
          <div className="station-list" aria-label="Choose a station">
            {stations.map((item, index) => <button type="button" key={item.id} onClick={() => tune(index)} className={`station-row${stationIndex === index ? " current" : ""}`} aria-current={stationIndex === index ? "true" : undefined} disabled={busy}>
              <span className="station-index">0{index + 1}</span><span className="station-copy"><strong>{item.name}</strong><small>{item.mood}</small></span><span className="station-freq">{item.frequency}<i> MHz</i></span><span className="station-arrow">↗</span>
            </button>)}
          </div>
          <div className="prompt-card">
            <div className="prompt-topline"><span>MUSIC DIRECTION</span><span>COMPOSED FRESH</span></div>
            <label htmlFor="prompt">What should {station.name} sound like?</label>
            <textarea id="prompt" value={prompt} maxLength={500} onChange={(event) => setPrompt(event.target.value)} disabled={busy} />
            <div className="prompt-examples"><span>TRY A SCENE</span><div>{station.examples.map((example) => <button type="button" key={example} onClick={() => setPrompt(`${station.prompt.split(".")[0]}. Inspired by ${example.toLowerCase()}, instrumental, no vocals.`)} disabled={busy}>{example}</button>)}</div></div>
          </div>
        </div>
      </details>

      <footer className="footer"><span>COMFY RADIO / CR-05</span><span>FIVE LITTLE STATIONS, MADE ONE TUNE AT A TIME.</span><span>✳ CHESTNUT COVE</span></footer>
    </main>
  );
}
