import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9600 + Math.floor(Math.random() * 200);
const profile = mkdtempSync(path.join(tmpdir(), "cdp-home-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run",`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"about:blank"], { stdio: "ignore" });
try {
  let t = null;
  for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {} }
  const page = t.find((x) => x.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
  let seq = 0; const pend = new Map();
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } });
  const send = (m, p = {}) => new Promise((resolve, reject) => { const id = ++seq; pend.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method: m, params: p })); });
  await send("Page.enable");
  const expr = `(function(){
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return {top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width)}; };
    return JSON.stringify({ ih: window.innerHeight, sh: document.documentElement.scrollHeight,
      hub: r('.hub'), intro: r('.hub__intro'), panel: r('.hub__panel'), footer: r('.site-footer') });
  })()`;
  for (const [w, h] of [[1440,900],[1920,963],[1366,768]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: "file:///D:/工作-dk/index.html" });
    await sleep(1200);
    const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    console.log(w + "x" + h, res.result.value);
  }
  ws.close();
} catch (e) { console.error("FAIL", e.message); } finally { try { chrome.kill(); } catch {} }