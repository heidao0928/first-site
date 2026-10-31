# 从小红书分享链接抓取标题与封面（需带 xsec_token）
# 用法: python tools/fetch_xhs.py <链接> [<链接> ...]
import re, json, sys, os, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "covers")
PROXY = "http://127.0.0.1:29290"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

os.makedirs(OUT, exist_ok=True)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http": PROXY, "https": PROXY}))
opener.addheaders = [("User-Agent", UA), ("Accept-Language", "zh-CN,zh;q=0.9")]

def extract_state(html):
    m = re.search(r"window\.__INITIAL_STATE__\s*=\s*", html)
    if not m:
        return None
    start = m.end(); depth = 0
    for i in range(start, len(html)):
        if html[i] == "{": depth += 1
        elif html[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1; break
    return json.loads(html[start:end].replace("undefined", "null"))

def handle(url):
    html = opener.open(url, timeout=30).read().decode("utf-8", "ignore")
    state = extract_state(html)
    if not state or "note" not in state:
        print(json.dumps({"url": url, "ok": False, "error": "no state"}, ensure_ascii=False))
        return
    dm = state["note"].get("noteDetailMap") or {}
    if not dm:
        print(json.dumps({"url": url, "ok": False, "error": "empty noteDetailMap (需要带 xsec_token 的链接)"}, ensure_ascii=False))
        return
    nid, item = next(iter(dm.items()))
    n = item.get("note", {})
    title = (n.get("title") or "").strip() or (n.get("desc") or "").split("\n")[0][:40]
    imgs = n.get("imageList") or []
    if not imgs:
        print(json.dumps({"url": url, "ok": False, "error": "no image"}, ensure_ascii=False))
        return
    cover = imgs[0].get("urlDefault") or ""
    path = os.path.join(OUT, nid + ".jpg")
    try:
        data = opener.open(cover, timeout=30).read()
        with open(path, "wb") as f:
            f.write(data)
        ok = True
    except Exception as e:
        ok = False
        print(json.dumps({"url": url, "ok": False, "error": "download: %s" % e}, ensure_ascii=False))
        return
    print(json.dumps({
        "url": url, "ok": ok, "noteId": nid, "title": title,
        "type": n.get("type"), "desc": (n.get("desc") or "")[:80],
        "cover": os.path.relpath(path, ROOT).replace("\\", "/"),
        "bytes": len(data)
    }, ensure_ascii=False))

def main():
    urls = sys.argv[1:]
    if not urls:
        print("用法: python tools/fetch_xhs.py <链接> ...")
        return
    for u in urls:
        try:
            handle(u)
        except Exception as e:
            print(json.dumps({"url": u, "ok": False, "error": str(e)}, ensure_ascii=False))

main()