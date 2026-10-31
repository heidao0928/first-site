/* 后台「致谢」：维护首页致谢名单，写入 assets/data/thanks.js */
(function () {
  "use strict";

  var DATA_PATH = "assets/data/thanks.js";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    list: document.getElementById("th-list"),
    status: document.getElementById("th-status"),
    load: document.getElementById("th-load"),
    save: document.getElementById("th-save"),
    add: document.getElementById("th-add")
  };

  if (!el.list) return;

  var state = { updated: "", items: [], sha: null };

  function tokenValue() {
    return (el.token.value || localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function repo() {
    return (el.repo.value || "heidao0928/first-site").trim();
  }

  function branch() {
    return (el.branch.value || "main").trim();
  }

  function api(path, options) {
    var headers = { Accept: "application/vnd.github+json" };
    if (tokenValue()) headers.Authorization = "token " + tokenValue();
    return fetch("https://api.github.com/repos/" + repo() + "/" + path, Object.assign({ headers: headers }, options || {}));
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

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function render() {
    if (!state.items.length) {
      el.list.innerHTML = '<p class="admin__empty">还没有名单，点下面「加一行」添加。</p>';
      return;
    }

    el.list.innerHTML = state.items
      .map(function (item, index) {
        return (
          '<div class="admin__row" data-index="' + index + '">' +
          '<div class="thanks-edit">' +
          '<input class="thanks-edit__name" data-field="name" value="' + esc(item.name) + '" placeholder="名字 / 昵称" />' +
          '<input class="thanks-edit__note" data-field="note" value="' + esc(item.note || "") + '" placeholder="备注（比如「赞助 50 元」，可留空）" />' +
          '<input class="thanks-edit__link" data-field="link" value="' + esc(item.link || "") + '" placeholder="主页链接（可留空）" />' +
          '<button type="button" class="admin__btn admin__btn--tiny" data-act="del">删除</button>' +
          "</div></div>"
        );
      })
      .join("");
  }

  function collect() {
    Array.prototype.forEach.call(el.list.querySelectorAll(".admin__row"), function (row) {
      var index = Number(row.getAttribute("data-index"));
      var item = state.items[index];
      if (!item) return;
      item.name = row.querySelector('[data-field="name"]').value.trim();
      item.note = row.querySelector('[data-field="note"]').value.trim();
      item.link = row.querySelector('[data-field="link"]').value.trim();
    });
  }

  function buildFile() {
    var items = state.items.filter(function (item) {
      return item.name;
    });

    var data = { updated: state.updated || today(), items: items };
    return "/* 致谢名单：由 admin.html 维护，也可直接手改。items 里每条 {name, note, link} */\nwindow.THANKS_DATA = " + JSON.stringify(data, null, 2) + ";\n";
  }

  function load() {
    status("读取中…");
    api("contents/" + DATA_PATH + "?ref=" + encodeURIComponent(branch()))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (file) {
        state.sha = file.sha;
        var raw = decodeBase64(file.content);
        var start = raw.indexOf("window.THANKS_DATA");
        var eq = raw.indexOf("=", start);
        var body = raw.slice(eq + 1).trim().replace(/;$/, "");
        var data = JSON.parse(body) || {};
        state.updated = data.updated || "";
        state.items = (data.items || []).map(function (item) {
          return { name: item.name || "", note: item.note || "", link: item.link || "" };
        });
        render();
        status("已读取 " + state.items.length + " 条致谢", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message + "（token 是否有效？）", "err");
      });
  }

  function save() {
    collect();
    status("保存中…");
    api("contents/" + DATA_PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: "更新致谢名单（admin）",
        content: encodeBase64(buildFile()),
        sha: state.sha,
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
        state.sha = json.content.sha;
        state.updated = today();
        status("已保存，约 1 分钟后生效", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  el.load.addEventListener("click", load);
  el.save.addEventListener("click", save);
  el.add.addEventListener("click", function () {
    collect();
    state.items.push({ name: "", note: "", link: "" });
    render();
    var inputs = el.list.querySelectorAll('[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  el.list.addEventListener("click", function (event) {
    var button = event.target.closest("[data-act]");
    if (!button) return;
    collect();
    var row = button.closest(".admin__row");
    state.items.splice(Number(row.getAttribute("data-index")), 1);
    render();
  });

  load();
})();
