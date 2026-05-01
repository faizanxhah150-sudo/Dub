import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  "English","Spanish","French","German","Hindi","Arabic",
  "Portuguese","Japanese","Korean","Chinese","Italian","Russian",
  "Urdu"   // ← Hardcoded support for Urdu (SeamlessM4T: urd)
];

const PHASES = [
  { id: 1, label: "Download & Chunk",     icon: "⬇️" },
  { id: 2, label: "Vocal Isolation",      icon: "🎵" },
  { id: 3, label: "Transcribe & Translate", icon: "🌍" },
  { id: 4, label: "Voice Clone",          icon: "🗣" },
  { id: 5, label: "Lip Sync (Wav2Lip)",   icon: "💋" },
];

function parsePhaseIdx(phase = "") {
  const m = phase.match(/Phase (\d)/);
  if (m) return parseInt(m[1]);
  if (phase.includes("Vocal") || phase.includes("Separating")) return 2;
  if (phase.includes("Transcrib") || phase.includes("Translat")) return 3;
  if (phase.includes("Cloning") || phase.includes("voice")) return 4;
  if (phase.includes("Lip") || phase.includes("Wav2Lip")) return 5;
  if (phase.includes("Merging") || phase.includes("Concat")) return 5;
  return 1;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --bg:       #080b10;
    --surface:  #0e1318;
    --border:   #1a2433;
    --border2:  #243044;
    --accent:   #00e5ff;
    --accent2:  #ff3366;
    --accent3:  #aaff00;
    --text:     #c8d8e8;
    --muted:    #4a6080;
    --panel:    #0a1020;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .scanline {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 2px,
      rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px
    );
  }
  .noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 9998; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 320px 1fr;
    grid-template-areas: "header header" "sidebar main";
    gap: 0;
  }

  /* ── Header ── */
  header {
    grid-area: header;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .logo { display: flex; align-items: baseline; gap: 12px; }
  .logo-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 4px;
    background: linear-gradient(90deg, var(--accent), var(--accent3));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .logo-sub {
    font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 3px;
    color: var(--muted); text-transform: uppercase;
  }
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent3);
    box-shadow: 0 0 8px var(--accent3);
    animation: pulse 2s infinite;
  }
  .status-dot.offline { background: var(--muted); box-shadow: none; animation: none; }
  .status-dot.error   { background: var(--accent2); box-shadow: 0 0 8px var(--accent2); }

  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes barFill { from { width:0; } }
  @keyframes blink { 0%,100%{opacity:1;} 49%{opacity:1;} 50%{opacity:0;} }

  /* ── Sidebar ── */
  aside {
    grid-area: sidebar;
    background: var(--panel);
    border-right: 1px solid var(--border);
    padding: 24px 20px;
    display: flex; flex-direction: column; gap: 24px;
    overflow-y: auto;
  }

  .section-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 3px;
    color: var(--muted); text-transform: uppercase;
    margin-bottom: 10px;
  }

  .backend-row {
    display: flex; gap: 8px;
    align-items: center;
  }
  .backend-input {
    flex: 1; background: var(--surface);
    border: 1px solid var(--border2);
    color: var(--text);
    padding: 8px 12px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    border-radius: 4px;
    outline: none;
    transition: border-color .2s;
  }
  .backend-input:focus { border-color: var(--accent); }
  .connect-btn {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 8px 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 1px;
    cursor: pointer; border-radius: 4px;
    transition: all .2s;
    white-space: nowrap;
  }
  .connect-btn:hover { background: var(--accent); color: #000; }

  .url-input {
    width: 100%; background: var(--surface);
    border: 1px solid var(--border2);
    color: var(--text);
    padding: 10px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    border-radius: 4px; outline: none; transition: border-color .2s;
    resize: none;
  }
  .url-input:focus { border-color: var(--accent); }

  .lang-row {
    display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px;
    align-items: center;
  }
  .lang-select {
    background: var(--surface); border: 1px solid var(--border2);
    color: var(--text); padding: 8px 10px;
    font-family: 'DM Sans', sans-serif; font-size: 12px;
    border-radius: 4px; outline: none; cursor: pointer;
    transition: border-color .2s;
  }
  .lang-select:focus { border-color: var(--accent); }
  .arrow-icon { color: var(--muted); font-size: 16px; text-align: center; }

  .submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #00c4d4, #00e5ff);
    border: none; color: #000;
    padding: 14px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 3px;
    cursor: pointer; border-radius: 4px;
    transition: all .2s;
    position: relative; overflow: hidden;
  }
  .submit-btn:disabled {
    background: var(--border); color: var(--muted); cursor: not-allowed;
  }
  .submit-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,229,255,0.3);
  }
  .submit-btn .spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(0,0,0,.3); border-top-color: #000;
    border-radius: 50%; animation: spin .7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }

  /* ── Main ── */
  main {
    grid-area: main;
    padding: 32px;
    display: flex; flex-direction: column; gap: 28px;
    overflow-y: auto;
  }

  /* ── Pipeline diagram ── */
  .pipeline-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
  }
  .pipeline-row {
    display: flex; align-items: stretch; gap: 0;
    position: relative;
  }
  .pipeline-step {
    flex: 1;
    display: flex; flex-direction: column; align-items: center;
    padding: 16px 8px;
    position: relative;
    border-radius: 4px;
    transition: all .3s;
  }
  .pipeline-step.active {
    background: rgba(0,229,255,0.06);
    outline: 1px solid rgba(0,229,255,0.3);
  }
  .pipeline-step.done { opacity: 0.6; }
  .pipeline-step.done .step-icon { filter: grayscale(1); }
  .pipeline-connector {
    width: 32px; display: flex; align-items: center; justify-content: center;
    color: var(--border2); font-size: 18px; flex-shrink: 0;
  }
  .step-icon { font-size: 22px; margin-bottom: 8px; }
  .step-num {
    font-family: 'Space Mono', monospace;
    font-size: 9px; color: var(--muted);
    letter-spacing: 1px; margin-bottom: 4px;
  }
  .step-label {
    font-size: 11px; color: var(--text);
    text-align: center; line-height: 1.3;
  }
  .step-badge {
    margin-top: 6px;
    background: rgba(0,229,255,0.15);
    border: 1px solid rgba(0,229,255,0.4);
    color: var(--accent);
    font-family: 'Space Mono', monospace;
    font-size: 9px; padding: 2px 6px; border-radius: 2px;
    letter-spacing: 1px;
  }
  .step-badge.done-badge {
    background: rgba(170,255,0,0.1);
    border-color: rgba(170,255,0,0.4);
    color: var(--accent3);
  }

  /* ── Progress bar ── */
  .progress-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 24px;
    animation: fadeIn .4s ease;
  }
  .prog-header {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 16px;
  }
  .prog-phase {
    font-size: 14px; color: var(--text);
  }
  .prog-pct {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px; line-height: 1;
    background: linear-gradient(90deg, var(--accent), var(--accent3));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .progress-track {
    height: 6px; background: var(--border);
    border-radius: 3px; overflow: hidden; margin-bottom: 16px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent3));
    border-radius: 3px;
    transition: width .6s cubic-bezier(.4,0,.2,1);
    position: relative;
  }
  .progress-fill::after {
    content: '';
    position: absolute; right: 0; top: 0; bottom: 0;
    width: 40px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }

  .chunk-track {
    display: flex; gap: 3px; flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .chunk-cell {
    height: 20px; border-radius: 2px;
    transition: all .3s;
    background: var(--border);
    flex: 0 0 auto;
  }
  .chunk-cell.done   { background: var(--accent3); }
  .chunk-cell.active {
    background: var(--accent);
    animation: pulse 1s infinite;
  }
  .chunk-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--muted);
  }

  /* ── Log terminal ── */
  .log-card {
    background: #04080f;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .log-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 8px 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .log-dot { width:10px;height:10px;border-radius:50%; }
  .log-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--muted); letter-spacing: 2px;
    margin-left: 8px;
  }
  .log-body {
    padding: 12px 16px;
    height: 180px; overflow-y: auto;
    font-family: 'Space Mono', monospace;
    font-size: 11px; line-height: 1.8;
    color: #4a9;
  }
  .log-body::-webkit-scrollbar { width: 4px; }
  .log-body::-webkit-scrollbar-track { background: transparent; }
  .log-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
  .log-line { animation: fadeIn .2s ease; }
  .cursor { animation: blink 1s step-end infinite; color: var(--accent); }

  /* ── Output gallery ── */
  .gallery-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 24px;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px; margin-top: 16px;
  }
  .output-item {
    background: var(--panel);
    border: 1px solid var(--border2);
    border-radius: 4px; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
    animation: fadeIn .4s ease;
    transition: border-color .2s;
  }
  .output-item:hover { border-color: var(--accent); }
  .output-thumb {
    width: 100%; aspect-ratio: 16/9;
    background: var(--border);
    border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
  }
  .output-meta {
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--muted);
  }
  .output-id {
    font-family: 'Space Mono', monospace;
    font-size: 12px; color: var(--text);
    margin-bottom: 2px;
  }
  .download-btn {
    background: transparent;
    border: 1px solid var(--accent3);
    color: var(--accent3);
    padding: 8px; font-family: 'Space Mono', monospace;
    font-size: 11px; letter-spacing: 1px;
    cursor: pointer; border-radius: 3px;
    transition: all .2s; text-align: center;
    text-decoration: none; display: block;
  }
  .download-btn:hover {
    background: var(--accent3); color: #000;
  }

  /* ── Health bar ── */
  .health-row {
    display: flex; gap: 12px; align-items: center;
    padding: 12px 16px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--muted);
  }
  .health-val { color: var(--accent3); margin-left: 4px; }

  .empty-state {
    text-align: center; padding: 60px 20px;
    color: var(--muted);
  }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .5; }
  .empty-text { font-size: 13px; line-height: 1.6; }

  /* ── Upload zone ── */
  .source-tabs {
    display: flex; gap: 0; margin-bottom: 10px;
  }
  .source-tab {
    flex: 1; padding: 7px 0;
    background: var(--surface); border: 1px solid var(--border2);
    color: var(--muted); font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 1px; cursor: pointer;
    transition: all .2s; text-align: center;
  }
  .source-tab:first-child { border-radius: 4px 0 0 4px; }
  .source-tab:last-child  { border-radius: 0 4px 4px 0; border-left: none; }
  .source-tab.active {
    background: rgba(0,229,255,0.1);
    border-color: var(--accent); color: var(--accent);
  }

  .upload-zone {
    border: 2px dashed var(--border2);
    border-radius: 4px; padding: 24px 16px;
    text-align: center; cursor: pointer;
    transition: all .2s; background: var(--surface);
    position: relative;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(0,229,255,0.04);
  }
  .upload-zone input[type=file] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%;
  }
  .upload-icon { font-size: 28px; margin-bottom: 8px; }
  .upload-label { font-size: 12px; color: var(--muted); }
  .upload-label strong { color: var(--accent); }
  .upload-file-name {
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--accent3);
    margin-top: 6px; word-break: break-all;
  }

  /* ── Upload progress ── */
  .upload-prog-wrap {
    margin-top: 8px;
  }
  .upload-prog-track {
    height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;
  }
  .upload-prog-fill {
    height: 100%; background: var(--accent);
    transition: width .3s ease; border-radius: 2px;
  }
  .upload-prog-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px; color: var(--muted); margin-top: 4px;
  }

  /* ── Detailed step progress ── */
  .step-progress-list {
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 12px;
  }
  .step-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    background: var(--panel); border-radius: 3px;
    border-left: 3px solid var(--border);
    font-size: 12px; transition: all .3s;
  }
  .step-row.active {
    border-left-color: var(--accent);
    background: rgba(0,229,255,0.06);
  }
  .step-row.done  { border-left-color: var(--accent3); opacity: 0.7; }
  .step-row.error { border-left-color: var(--accent2); }
  .step-row-icon  { font-size: 14px; flex-shrink: 0; }
  .step-row-text  { flex: 1; color: var(--text); }
  .step-row-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px; padding: 2px 6px; border-radius: 2px;
  }
  .step-row.active .step-row-badge {
    background: rgba(0,229,255,0.15); color: var(--accent);
    border: 1px solid rgba(0,229,255,0.3);
  }
  .step-row.done .step-row-badge {
    background: rgba(170,255,0,0.1); color: var(--accent3);
    border: 1px solid rgba(170,255,0,0.3);
  }

  /* ── Connection status panel ── */
  .conn-panel {
    padding: 10px 12px;
    border-radius: 4px; margin-top: 10px;
    font-family: 'Space Mono', monospace; font-size: 10px;
    display: flex; align-items: center; gap: 8px;
    transition: all .3s;
  }
  .conn-panel.online  { background: rgba(170,255,0,0.08); border: 1px solid rgba(170,255,0,0.3); }
  .conn-panel.offline { background: rgba(74,96,128,0.1);  border: 1px solid var(--border); }
  .conn-panel.error   { background: rgba(255,51,102,0.08); border: 1px solid rgba(255,51,102,0.3); }
  .conn-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .conn-panel.online  .conn-dot { background: var(--accent3); box-shadow: 0 0 6px var(--accent3); animation: pulse 2s infinite; }
  .conn-panel.offline .conn-dot { background: var(--muted); }
  .conn-panel.error   .conn-dot { background: var(--accent2); box-shadow: 0 0 6px var(--accent2); }
  .conn-info { flex: 1; line-height: 1.5; }
  .conn-info .conn-main { color: var(--text); }
  .conn-info .conn-sub  { color: var(--muted); font-size: 9px; }
`;
// ─────────────────────────────────────────────────────────────
// Step definitions for the detailed progress list
// ─────────────────────────────────────────────────────────────
const STEP_DEFS = [
  { key:"download",   icon:"⬇️",  label:"Download & Chunk"         },
  { key:"separate",   icon:"🎵",  label:"Vocal / BGM Isolation"     },
  { key:"transcribe", icon:"📝",  label:"Transcription (Whisper)"   },
  { key:"translate",  icon:"🌍",  label:"Translation (SeamlessM4T)" },
  { key:"clone",      icon:"🗣",  label:"Voice Clone (XTTS v2)"     },
  { key:"lipsync",    icon:"💋",  label:"Lip-Sync (Wav2Lip-GAN)"    },
  { key:"merge",      icon:"🔗",  label:"Merge & Export HQ"         },
];

function phaseToStepKey(phase = "") {
  const p = phase.toLowerCase();
  if (p.includes("download") || p.includes("chunk") || p.includes("upload"))
    return "download";
  if (p.includes("separat") || p.includes("vocal") || p.includes("bgm") || p.includes("demucs"))
    return "separate";
  if (p.includes("transcrib"))   return "transcribe";
  if (p.includes("translat"))    return "translate";
  if (p.includes("clone") || p.includes("xtts") || p.includes("voice"))
    return "clone";
  if (p.includes("lip") || p.includes("wav2lip"))
    return "lipsync";
  if (p.includes("merg") || p.includes("concat") || p.includes("export") || p.includes("complete"))
    return "merge";
  return null;
}

// ─────────────────────────────────────────────────────────────
// Fetch with Retry-After / 429 / 502 handling
// ─────────────────────────────────────────────────────────────
async function fetchWithRetry(url, opts = {}, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, opts);
      // Retry-After handling for 429 / 502 / 503
      if ([429, 502, 503].includes(res.status)) {
        const wait = parseInt(res.headers.get("Retry-After") || String(10 * (attempt + 1))) * 1000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error("Request failed after retries");
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function NeuralDubStudio() {
  // ── Backend connection ─────────────────────────────────────
  const [backendUrl, setBackendUrl]   = useState("https://your-ngrok-url.ngrok-free.app");
  const [connected, setConnected]     = useState(false);
  const [connError, setConnError]     = useState("");
  const [healthInfo, setHealthInfo]   = useState(null);
  const [connecting, setConnecting]   = useState(false);

  // ── Source input mode ──────────────────────────────────────
  const [sourceMode, setSourceMode]   = useState("url");   // "url" | "upload"
  const [videoUrl, setVideoUrl]       = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);  // File object
  const [uploadedPath, setUploadedPath] = useState("");    // Colab path after upload
  const [uploadPct, setUploadPct]     = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef(null);

  // ── Language ───────────────────────────────────────────────
  const [srcLang, setSrcLang]         = useState("English");
  const [tgtLang, setTgtLang]         = useState("Urdu");

  // ── Job state ──────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [activeJob, setActiveJob]     = useState(null);
  const [jobStatus, setJobStatus]     = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [completedStepKeys, setCompletedStepKeys] = useState([]);
  const [activeStepKey, setActiveStepKey]          = useState(null);

  // ── Log ────────────────────────────────────────────────────
  const [logLines, setLogLines]       = useState([]);
  const logRef                        = useRef(null);
  const pollRef                       = useRef(null);

  // ── Helpers ────────────────────────────────────────────────
  const base = useCallback(() => backendUrl.replace(/\/$/, ""), [backendUrl]);

  const appendLog = useCallback((line) =>
    setLogLines(prev => [...prev.slice(-150), line]), []);

  // ── Connect to backend ─────────────────────────────────────
  const connect = async () => {
    setConnecting(true);
    setConnError("");
    try {
      const res = await fetchWithRetry(`${base()}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthInfo(data);
      setConnected(true);
      appendLog(
        `✅ Connected — ${data.gpu || "CPU"} | ` +
        `VRAM: ${data.vram_free_gb ?? "N/A"}GB | ` +
        `Disk free: ${data.disk_free_gb ?? "?"}GB`
      );
    } catch (e) {
      setConnected(false);
      setConnError(e.message);
      appendLog(`❌ Connection failed: ${e.message}`);
    } finally {
      setConnecting(false);
    }
  };

  // Auto-reconnect ping every 30s to keep status fresh
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${base()}/health`);
        if (!res.ok) { setConnected(false); setConnError("Lost connection"); }
        else {
          const data = await res.json();
          setHealthInfo(data);
        }
      } catch { setConnected(false); setConnError("Lost connection"); }
    }, 30000);
    return () => clearInterval(id);
  }, [connected, base]);

  // ── File upload via XHR (supports progress %) ─────────────
  const uploadFile = useCallback((file) => {
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    setUploadedPath("");
    appendLog(`📤 Uploading: ${file.name} (${(file.size / 1e6).toFixed(1)} MB)…`);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base()}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setUploadPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setUploadedPath(data.uploaded_path);
        appendLog(`✅ Upload complete → ${data.filename} (${data.size_mb} MB)`);
        setUploadPct(100);
      } else {
        appendLog(`❌ Upload failed: HTTP ${xhr.status}`);
        setUploadPct(0);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setUploadPct(0);
      appendLog("❌ Upload network error — check CORS / backend URL");
    };
    xhr.send(formData);
  }, [base, appendLog]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setUploadedFile(file); uploadFile(file); }
  };

  // ── Poll job status ────────────────────────────────────────
  useEffect(() => {
    if (!activeJob) return;
    const seenSteps = new Set();

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetchWithRetry(`${base()}/status/${activeJob}`);
        if (!res.ok) { appendLog(`⚠️  Status HTTP ${res.status}`); return; }
        const data = await res.json();
        setJobStatus(data);

        // Update detailed step tracker
        const stepKey = phaseToStepKey(data.phase || "");
        if (stepKey) {
          setActiveStepKey(stepKey);
          // Mark all steps before current one as done
          const idx = STEP_DEFS.findIndex(s => s.key === stepKey);
          const done = STEP_DEFS.slice(0, idx).map(s => s.key);
          setCompletedStepKeys(done);
        }

        // Append new log lines
        if (data.log?.length) {
          const last = data.log[data.log.length - 1];
          setLogLines(prev => {
            if (prev[prev.length - 1] !== last) return [...prev.slice(-150), last];
            return prev;
          });
        }

        if (data.status === "done") {
          clearInterval(pollRef.current);
          setSubmitting(false);
          setActiveStepKey("merge");
          setCompletedStepKeys(STEP_DEFS.map(s => s.key));
          setCompletedJobs(prev => [
            ...prev.filter(j => j.id !== activeJob),
            { id: activeJob, ts: Date.now(), src: srcLang, tgt: tgtLang }
          ]);
          appendLog("🎬 Dubbing complete! Download your video below.");
        }
        if (data.status === "error") {
          clearInterval(pollRef.current);
          setSubmitting(false);
          setActiveStepKey(null);
          appendLog(`❌ Pipeline error: ${data.error}`);
        }
      } catch (e) {
        appendLog(`⚠️  Poll error: ${e.message}`);
      }
    }, 1500);
    return () => clearInterval(pollRef.current);
  }, [activeJob, base, srcLang, tgtLang, appendLog]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  // ── Submit job ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const hasUrl    = sourceMode === "url" && videoUrl.trim();
    const hasUpload = sourceMode === "upload" && uploadedPath;
    if (!hasUrl && !hasUpload) return;
    if (!connected) return;

    setSubmitting(true);
    setJobStatus(null);
    setCompletedStepKeys([]);
    setActiveStepKey("download");

    const label = hasUrl ? videoUrl.slice(0, 55) + "…" : uploadedFile?.name;
    appendLog(`🚀 Starting job — ${label}`);
    appendLog(`🌍 Language: ${srcLang} → ${tgtLang}`);

    try {
      const body = {
        video_url:     hasUrl ? videoUrl.trim() : "",
        uploaded_path: hasUpload ? uploadedPath : "",
        src_lang:      srcLang.toLowerCase(),
        tgt_lang:      tgtLang.toLowerCase(),
      };
      const res = await fetchWithRetry(`${base()}/process`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setActiveJob(data.job_id);
      appendLog(`📋 Job ID: ${data.job_id} — queued on backend.`);
    } catch (e) {
      setSubmitting(false);
      setActiveStepKey(null);
      appendLog(`❌ Submit failed: ${e.message}`);
    }
  };

  // ── Derived display values ─────────────────────────────────
  const currentPhase   = parsePhaseIdx(jobStatus?.phase || "");
  const totalChunks    = jobStatus?.total_chunks || 0;
  const currentChunk   = jobStatus?.chunk || 0;
  const progress       = jobStatus?.progress || 0;
  const isRunning      = jobStatus?.status === "running";
  const isDone         = jobStatus?.status === "done";
  const isError        = jobStatus?.status === "error";

  const canSubmit = connected && !submitting && !uploading &&
    (sourceMode === "url" ? !!videoUrl.trim() : !!uploadedPath);

  // ── Connection status helper ───────────────────────────────
  const connState = connecting ? "error" : connected ? "online" : "offline";
  const connLabel = connecting
    ? "Connecting to Colab…"
    : connected
      ? `Backend Online — ${healthInfo?.gpu || "CPU"}`
      : connError ? `Offline: ${connError}` : "Not connected";
  const connSub = connected && healthInfo
    ? `VRAM ${healthInfo.vram_free_gb ?? "?"}GB free | Disk ${healthInfo.disk_free_gb ?? "?"}GB free`
    : "Enter your Ngrok URL above and click Connect";

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="scanline" />
      <div className="noise" />
      <div className="app">

        {/* ══ Header ══════════════════════════════════════════ */}
        <header>
          <div className="logo">
            <span className="logo-text">Neural Dub Studio</span>
            <span className="logo-sub">AI Dubbing Engine v1.1</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className={`status-dot ${connected ? "" : connecting ? "error" : "offline"}`} />
            <span style={{ fontFamily:"Space Mono", fontSize:10, color:"var(--muted)", letterSpacing:2 }}>
              {connected ? "BACKEND ONLINE" : connecting ? "CONNECTING…" : "OFFLINE"}
            </span>
            {connected && healthInfo && (
              <span style={{ fontFamily:"Space Mono", fontSize:9, color:"var(--muted)",
                             marginLeft:8, borderLeft:"1px solid var(--border)", paddingLeft:8 }}>
                {healthInfo.gpu || "CPU"} &nbsp;|&nbsp; {healthInfo.disk_free_gb}GB disk
              </span>
            )}
          </div>
        </header>

        {/* ══ Sidebar ═════════════════════════════════════════ */}
        <aside>

          {/* ── Backend URL + Connection Status ────────────── */}
          <div>
            <div className="section-label">Backend (Ngrok URL)</div>
            <div className="backend-row">
              <input
                className="backend-input"
                value={backendUrl}
                onChange={e => { setBackendUrl(e.target.value); setConnected(false); }}
                placeholder="https://xxxx.ngrok-free.app"
              />
            </div>
            <div style={{ marginTop:8 }}>
              <button className="connect-btn" style={{ width:"100%" }}
                      onClick={connect} disabled={connecting}>
                {connecting ? "⏳ CONNECTING…" : connected ? "✓ RECONNECT" : "▶ CONNECT"}
              </button>
            </div>

            {/* ── Connection Status Panel ── */}
            <div className={`conn-panel ${connState}`}>
              <div className="conn-dot" />
              <div className="conn-info">
                <div className="conn-main">{connLabel}</div>
                <div className="conn-sub">{connSub}</div>
              </div>
            </div>
          </div>

          {/* ── Video Source (URL / Upload tabs) ───────────── */}
          <div>
            <div className="section-label">Video Source</div>

            <div className="source-tabs">
              <button
                className={`source-tab ${sourceMode === "url" ? "active" : ""}`}
                onClick={() => setSourceMode("url")}
              >🔗 URL</button>
              <button
                className={`source-tab ${sourceMode === "upload" ? "active" : ""}`}
                onClick={() => setSourceMode("upload")}
              >📁 UPLOAD</button>
            </div>

            {sourceMode === "url" ? (
              <textarea
                className="url-input"
                rows={3}
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="YouTube URL, direct MP4 link, or any yt-dlp compatible source…"
              />
            ) : (
              <div>
                <div
                  className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp4,.mkv,.mov,.avi,.webm"
                    onChange={handleFileChange}
                    style={{ display:"none" }}
                  />
                  <div className="upload-icon">
                    {uploadedPath ? "✅" : uploading ? "⏳" : "🎬"}
                  </div>
                  <div className="upload-label">
                    {uploadedPath
                      ? <strong style={{ color:"var(--accent3)" }}>Upload complete</strong>
                      : uploading
                        ? <strong>Uploading…</strong>
                        : <><strong>Click or drag</strong> a video file</>
                    }
                  </div>
                  <div className="upload-label" style={{ fontSize:10, marginTop:4 }}>
                    .mp4 · .mkv · .mov · .avi · .webm
                  </div>
                  {uploadedFile && (
                    <div className="upload-file-name">{uploadedFile.name}</div>
                  )}
                </div>

                {(uploading || uploadPct > 0) && (
                  <div className="upload-prog-wrap">
                    <div className="upload-prog-track">
                      <div className="upload-prog-fill" style={{ width:`${uploadPct}%` }} />
                    </div>
                    <div className="upload-prog-label">
                      {uploading
                        ? `Uploading to Colab… ${uploadPct}%`
                        : `Upload done (${uploadPct}%)`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Language Pair ───────────────────────────────── */}
          <div>
            <div className="section-label">Language Pair</div>
            <div className="lang-row">
              <select className="lang-select"
                value={srcLang} onChange={e => setSrcLang(e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <div className="arrow-icon">→</div>
              <select className="lang-select"
                value={tgtLang} onChange={e => setTgtLang(e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────────── */}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {uploading
              ? <><span className="spinner"/>UPLOADING…</>
              : submitting
                ? <><span className="spinner"/>PROCESSING</>
                : "▶  START DUBBING"
            }
          </button>

          {/* ── Completed Jobs list ─────────────────────────── */}
          {completedJobs.length > 0 && (
            <div>
              <div className="section-label">Completed Jobs</div>
              {completedJobs.map(j => (
                <div key={j.id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"6px 0", borderBottom:"1px solid var(--border)"
                }}>
                  <span style={{ fontFamily:"Space Mono", color:"var(--accent)", fontSize:10 }}>
                    #{j.id}
                  </span>
                  <span style={{ color:"var(--muted)", fontSize:10 }}>
                    {j.src} → {j.tgt}
                  </span>
                  <a
                    href={`${base()}/download/${j.id}`}
                    download={`dubbed_${j.id}.mp4`}
                    style={{ color:"var(--accent3)", fontSize:10,
                             fontFamily:"Space Mono", textDecoration:"none" }}
                    target="_blank" rel="noreferrer"
                  >⬇</a>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ══ Main ════════════════════════════════════════════ */}
        <main>

          {/* ── Pipeline Phase Diagram ──────────────────────── */}
          <div className="pipeline-card">
            <div className="section-label" style={{ marginBottom:16 }}>Production Pipeline</div>
            <div className="pipeline-row">
              {PHASES.map((ph, i) => {
                const phDone   = currentPhase > ph.id && (isRunning || isDone);
                const phActive = currentPhase === ph.id && isRunning;
                const phFinal  = isDone;
                return (
                  <div key={ph.id} style={{ display:"contents" }}>
                    <div className={`pipeline-step ${phActive ? "active" : ""} ${phDone || phFinal ? "done" : ""}`}>
                      <div className="step-icon">{ph.icon}</div>
                      <div className="step-num">PHASE {ph.id}</div>
                      <div className="step-label">{ph.label}</div>
                      {phActive && <div className="step-badge">ACTIVE</div>}
                      {(phDone || phFinal) && <div className="step-badge done-badge">✓ DONE</div>}
                    </div>
                    {i < PHASES.length - 1 && (
                      <div className="pipeline-connector">›</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Active Job Progress ─────────────────────────── */}
          {activeJob && jobStatus ? (
            <div className="progress-card">
              <div className="prog-header">
                <div>
                  <div className="section-label">
                    JOB #{activeJob} —&nbsp;
                    <span style={{ color: isDone ? "var(--accent3)"
                                       : isError ? "var(--accent2)"
                                       : "var(--accent)" }}>
                      {jobStatus.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="prog-phase">{jobStatus.phase}</div>
                </div>
                <div className="prog-pct">{progress}%</div>
              </div>

              {/* Main progress bar */}
              <div className="progress-track">
                <div className="progress-fill"
                     style={{ width:`${progress}%`,
                              background: isError
                                ? "var(--accent2)"
                                : "linear-gradient(90deg, var(--accent), var(--accent3))" }} />
              </div>

              {/* Chunk cells */}
              {totalChunks > 0 && (
                <>
                  <div className="chunk-label" style={{ marginBottom:8 }}>
                    CHUNK PROGRESS — {currentChunk}/{totalChunks}
                  </div>
                  <div className="chunk-track">
                    {Array.from({ length: totalChunks }, (_, i) => {
                      const n = i + 1;
                      const cls = n < currentChunk ? "done"
                                : n === currentChunk && isRunning ? "active" : "";
                      return (
                        <div key={i}
                          className={`chunk-cell ${cls}`}
                          style={{ width: Math.max(14, Math.min(38, 340 / totalChunks)) }}
                          title={`Chunk ${n}${n < currentChunk ? " ✓" : n === currentChunk ? " ←" : ""}`}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Detailed Step-by-Step list ── */}
              <div className="step-progress-list">
                {STEP_DEFS.map(step => {
                  const isCurActive  = activeStepKey === step.key;
                  const isCurDone    = completedStepKeys.includes(step.key) ||
                                       (isDone);
                  const rowClass = isCurActive ? "active"
                                 : isCurDone   ? "done"
                                 : isError && activeStepKey === step.key ? "error"
                                 : "";
                  return (
                    <div key={step.key} className={`step-row ${rowClass}`}>
                      <span className="step-row-icon">{step.icon}</span>
                      <span className="step-row-text">{step.label}</span>
                      {isCurActive && (
                        <span className="step-row-badge">
                          {totalChunks > 0
                            ? `CHUNK ${currentChunk}/${totalChunks}`
                            : "RUNNING"}
                        </span>
                      )}
                      {isCurDone && !isCurActive && (
                        <span className="step-row-badge">✓ DONE</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          ) : !activeJob ? (
            <div className="pipeline-card">
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <div className="empty-text">
                  Connect your Colab backend · paste a URL or upload a file<br />
                  · select languages · click <strong>Start Dubbing</strong>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Pipeline Log Terminal ───────────────────────── */}
          <div className="log-card">
            <div className="log-header">
              <div className="log-dot" style={{ background:"#ff5f57" }} />
              <div className="log-dot" style={{ background:"#febc2e" }} />
              <div className="log-dot" style={{ background:"#28c840" }} />
              <span className="log-title">PIPELINE LOG</span>
              {logLines.length > 0 && (
                <button
                  onClick={() => setLogLines([])}
                  style={{ marginLeft:"auto", background:"none", border:"none",
                           color:"var(--muted)", cursor:"pointer", fontSize:10,
                           fontFamily:"Space Mono" }}
                >CLEAR</button>
              )}
            </div>
            <div className="log-body" ref={logRef}>
              {logLines.length === 0 && (
                <div style={{ color:"var(--muted)" }}>
                  Awaiting connection… Connect backend to begin.
                </div>
              )}
              {logLines.map((line, i) => (
                <div key={i} className="log-line"
                     style={{ color: line.startsWith("❌") ? "var(--accent2)"
                                   : line.startsWith("✅") ? "var(--accent3)"
                                   : line.startsWith("⚠️") ? "#f90"
                                   : "#4a9" }}>
                  {line}
                </div>
              ))}
              {isRunning && <span className="cursor">█</span>}
            </div>
          </div>

          {/* ── Output Gallery ──────────────────────────────── */}
          {completedJobs.length > 0 && (
            <div className="gallery-card">
              <div className="section-label">Output Gallery</div>
              <div className="gallery-grid">
                {completedJobs.map(j => (
                  <div key={j.id} className="output-item">
                    <div className="output-thumb">🎥</div>
                    <div>
                      <div className="output-id">dubbed_{j.id}.mp4</div>
                      <div className="output-meta">
                        {j.src} → {j.tgt} &nbsp;|&nbsp;
                        {new Date(j.ts).toLocaleTimeString()}
                      </div>
                    </div>
                    <a
                      href={`${base()}/download/${j.id}`}
                      download={`dubbed_${j.id}.mp4`}
                      className="download-btn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇ DOWNLOAD MP4
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
