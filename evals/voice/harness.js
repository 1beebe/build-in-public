// Scripted voice test. Injected into the owner's /app page (main world) after a setup and
// /api/start: it stands in for the microphone with synthetic answer clips, starts the page's
// own GPT-Live session, plays the next clip whenever the interviewer has finished a turn,
// and records the transcript and every data-channel message the page sends (steers, wrap-ups).
// Progress and results go to localStorage "voiceTest" so the caller can read them.
(async () => {
  const out = { status: "loading", log: [], sent: [], events: {}, turns: [] };
  const save = () => { try { localStorage.setItem("voiceTest", JSON.stringify(out)); } catch {} };
  const log = (m) => { out.log.push(new Date().toISOString().slice(11, 19) + " " + m); save(); };
  try {
    const clips = await fetch("https://api.github.com/repos/1beebe/build-in-public/contents/evals/voice/" + (window.__voiceClips || "deadend-clips.json") + "?ref=" + (window.__voiceRef || "main"), { headers: { Accept: "application/vnd.github.raw+json" } }).then((r) => r.json());
    const ctx = new AudioContext(); await ctx.resume();
    const dest = ctx.createMediaStreamDestination();
    const bufs = await Promise.all(clips.map((b64) => ctx.decodeAudioData(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer)));
    log("decoded " + bufs.length + " clips, audio " + ctx.state);
    navigator.mediaDevices.getUserMedia = async () => dest.stream;
    const realSend = RTCDataChannel.prototype.send;
    RTCDataChannel.prototype.send = function (d) { try { const j = JSON.parse(d); out.sent.push({ at: Date.now(), type: j.type, content: j.content }); } catch {} return realSend.call(this, d); };
    let lastOut = 0, lastIn = 0, started = 0, playing = false, next = 0, interviewerTurns = 0;
    const realHandler = onGptLiveEvent;
    onGptLiveEvent = (ev) => {
      out.events[ev.type] = (out.events[ev.type] || 0) + 1;
      if (ev.type === "session.started") started = Date.now();
      if (ev.type === "session.output_transcript.delta") lastOut = Date.now();
      if (ev.type === "session.input_transcript.delta") lastIn = Date.now();
      if (ev.type === "error") log("error " + JSON.stringify(ev.error || ev).slice(0, 200));
      return realHandler(ev);
    };
    const play = (i) => new Promise((res) => { const s = ctx.createBufferSource(); s.buffer = bufs[i]; s.connect(dest); s.onended = res; playing = true; s.start(); log("play clip " + i); });
    out.status = "running"; save();
    await startGptLive();
    const t0 = Date.now();
    const timer = setInterval(async () => {
      out.turns = (state.turns || []).map((t) => ({ who: t.who, text: t.text })); save();
      const now = Date.now();
      if (!liveOn() || now - t0 > 8 * 60 * 1000) { clearInterval(timer); out.status = "done"; log(liveOn() ? "timeout" : "session ended"); if (liveOn()) await stopLive(); save(); return; }
      // GPT-Live should speak first; if it hasn't after 6s, open with the first clip like a person would.
      if (!lastOut && started && !playing && next === 0 && now - started > 6000) { log("no opener after 6s, speaking first"); await play(next++); playing = false; lastIn = Date.now(); return; }
      if (playing || !lastOut) return;
      const quiet = now - Math.max(lastOut, lastIn);
      // The interviewer finished a turn: 2.5s of silence after it last spoke.
      if (quiet > 2500 && lastOut > lastIn) {
        if (next < bufs.length) { await play(next++); playing = false; lastIn = Date.now(); }
        else if (quiet > 5000) { clearInterval(timer); log("script done"); await stopLive(); out.turns = (state.turns || []).map((t) => ({ who: t.who, text: t.text })); out.status = "done"; save(); }
      }
    }, 300);
  } catch (e) { out.status = "error"; log("failed: " + (e && e.message)); }
})();
