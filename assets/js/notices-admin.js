/* 首页公告的编辑逻辑（跟在 admin.js 后面加载，复用仓库/token 输入框） */
(function () {
  "use strict";

  var PATH = "assets/data/notices.js";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    text: document.getElementById("n-text"),
    status: document.getElementById("n-status"),
    load: document.getElementById("n-load"),
    save: document.getElementById("n-save")
  };

  if (!el.text) return;

  var sha = null;

  function tokenValue() {
    return (el.token.value || localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function headers() {
    var h = { Accept: "application/vnd.github+json" };
    var t = tokenValue();
    if (t) h.Authorization = "token " + t;
    return h;
  }

  function repo() {
    return (el.repo.value || "heidao0928/first-site").trim();
  }

  function branch() {
    return (el.branch.value || "main").trim();
  }

  function api(path, options) {
    var opts = Object.assign({ headers: headers() }, options || {});
    return fetch("https://api.github.com/repos/" + repo() + "/" + path, opts);
  }

  function decodeBase64(b64) {
    var text = atob(String(b64).replace(/\s/g, ""));
    try {
      return decodeURIComponent(escape(text));
    } catch (error) {
      return text;
    }
  }

  function encodeBase64(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }

  function status(message, kind) {
    el.status.textContent = message;
    el.status.className = "admin__status" + (kind ? " is-" + kind : "");
  }

  function parseNotices(text) {
    var items = [];
    String(text)
      .split(/\r?\n/)
      .forEach(function (line) {
        var value = line.trim();
        if (!value) return;
        var match = value.match(/^(\d{4}\.\d{2}\.\d{2}|\d{2}\.\d{2})\s+(.*)$/);
        if (match) {
          items.push({ date: match[1], text: match[2] });
        } else {
          items.push({ date: "", text: value });
        }
      });
    return items;
  }

  function today() {
    var now = new Date();
    var m = ("0" + (now.getMonth() + 1)).slice(-2);
    var d = ("0" + now.getDate()).slice(-2);
    return now.getFullYear() + "-" + m + "-" + d;
  }

  function toText(data) {
    return (data.items || [])
      .map(function (item) {
        return item.date ? item.date + " " + item.text : item.text;
      })
      .join("\n");
  }

  function load() {
    status("读取公告中…");
    api("contents/" + PATH + "?ref=" + encodeURIComponent(branch()))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        sha = json.sha;
        var raw = decodeBase64(json.content);
        var start = raw.indexOf("window.NOTICE_DATA");
        if (start >= 0) {
          var eq = raw.indexOf("=", start);
          raw = raw.slice(eq + 1).trim();
          if (raw.charAt(raw.length - 1) === ";") raw = raw.slice(0, -1);
        }
        var data = JSON.parse(raw);
        el.text.value = toText(data);
        status("已读取 " + (data.items || []).length + " 条公告", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message, "err");
      });
  }

  function save() {
    var items = parseNotices(el.text.value);
    var payload =
      "/* 首页公告数据：由 admin.html 生成，也可直接手改 */\nwindow.NOTICE_DATA = " +
      JSON.stringify({ updated: today(), items: items }, null, 2) +
      ";\n";

    status("保存公告中…");
    api("contents/" + PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: "更新首页公告（admin）",
        content: encodeBase64(payload),
        sha: sha,
        branch: branch()
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (body) {
            throw new Error(body.message || "HTTP " + res.status);
          });
        }
        return res.json();
      })
      .then(function (json) {
        sha = json.content.sha;
        status("公告已提交，约 1 分钟后生效（共 " + items.length + " 条）", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  el.load.addEventListener("click", load);
  el.save.addEventListener("click", save);
  load();
})();
