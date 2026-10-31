// 本地截图小工具（不参与站点运行）：
// node tools/screenshot.mjs <url> <宽> <高> <输出文件> [滚动Y] [移动端1/0]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [url, width, height, out, scrollY = "0", mobile = "0"] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(tmpdir(), "cdp-shot-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars","--no-first-run","--no-default-browser-check",`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"about:blank"], { stdio: "ignore" });
try {
  let targets = null;
  for (let i = 0; i < 40 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {} }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
  let seq = 0; const pending = new Map();
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: Number(width), height: Number(height), deviceScaleFactor: 1, mobile: mobile === "1" });
  await send("Page.navigate", { url }); await sleep(1900);
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${Number(scrollY)})` }); await sleep(900);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  const info = await send("Runtime.evaluate", { expression: `JSON.stringify({sh: document.documentElement.scrollHeight, ih: innerHeight})`, returnByValue: true });
  console.log("OK", out, info.result.value);
  ws.close();
} catch (e) { console.error("FAIL", e.message); process.exitCode = 1; } finally { try { chrome.kill(); } catch {} }