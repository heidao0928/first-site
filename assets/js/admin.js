/* 资源表管理页的脚本（只给站长自己用，不在导航里出现） */
(function () {
  "use strict";

  var PATH = "assets/data/resources.js";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    list: document.getElementById("a-list"),
    status: document.getElementById("a-status"),
    save: document.getElementById("a-save"),
    load: document.getElementById("a-load"),
    add: document.getElementById("a-add")
  };

  if (!el.list) return;

  var sha = null;
  var data = { items: [] };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function status(message, kind) {
    el.status.textContent = message;
    el.status.className = "admin__status" + (kind ? " is-" + kind : "");
  }

  function tokenValue() {
    return (localStorage.getItem(TOKEN_KEY) || el.token.value || "").trim();
  }

  function headers() {
    var h = { Accept: "application/vnd.github+json" };
    var t = tokenValue();
    if (t) h.Authorization = "token " + t;
    return h;
  }

  function repo() {
    return el.repo.value.trim() || "heidao0928/first-site";
  }

  function branch() {
    return el.branch.value.trim() || "main";
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

  function load() {
    status("读取中…");
    api("contents/" + PATH + "?ref=" + encodeURIComponent(branch()))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        sha = json.sha;
        var raw = decodeBase64(json.content)
          .replace(/^\s*window\.RESOURCE_DATA\s*=\s*/, "")
          .replace(/;\s*$/, "");
        data = JSON.parse(raw);
        if (!Array.isArray(data.items)) data.items = [];
        render();
        status("已读取，共 " + data.items.length + " 条", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message + "（私有库需要先填 token）", "err");
      });
  }

  function rowHtml(item, index) {
    var file = item.file || { kind: "none" };
    var kinds = [
      ["none", "无"],
      ["pending", "待补"],
      ["download", "下载"],
      ["view", "查看"]
    ];
    var options = kinds
      .map(function (pair) {
        return (
          '<option value="' + pair[0] + '"' + (file.kind === pair[0] ? " selected" : "") + ">" + pair[1] + "</option>"
        );
      })
      .join("");

    return (
      '<li class="admin__row" data-index="' + index + '">' +
      '<div class="admin__row-head">' +
      '<span class="admin__row-num">' + ("0" + (index + 1)).slice(-2) + "</span>" +
      '<div class="admin__row-actions">' +
      '<button type="button" data-action="up" aria-label="上移">↑</button>' +
      '<button type="button" data-action="down" aria-label="下移">↓</button>' +
      '<button type="button" data-action="remove" aria-label="删除">×</button>' +
      "</div>" +
      "</div>" +
      '<label class="admin__field"><span>名称</span><input data-field="name" value="' + esc(item.name) + '" /></label>' +
      '<label class="admin__field"><span>类型（逗号分隔）</span><input data-field="tags" value="' + esc((item.tags || []).join("，")) + '" /></label>' +
      '<label class="admin__field"><span>说明</span><textarea data-field="desc" rows="2">' + esc(item.desc) + "</textarea></label>" +
      '<label class="admin__field"><span>链接（官网 / 文档 / 网盘）</span><input data-field="link" value="' + esc(item.link) + '" placeholder="https://" /></label>' +
      '<div class="admin__grid">' +
      '<label class="admin__field"><span>附件类型</span><select data-field="fileKind">' + options + "</select></label>" +
      '<label class="admin__field"><span>附件地址</span><input data-field="fileHref" value="' + esc(file.href) + '" placeholder="网盘链接或图片路径" /></label>' +
      '<label class="admin__field"><span>提取码（可选）</span><input data-field="fileHint" value="' + esc(file.hint) + '" /></label>' +
      "</div>" +
      "</li>"
    );
  }

  function render() {
    if (!data.items.length) {
      el.list.innerHTML = '<li class="admin__empty">还没有条目，点下面的「新增一条」。</li>';
      return;
    }
    el.list.innerHTML = data.items.map(rowHtml).join("");
  }

  function readField(target) {
    var row = target.closest("[data-index]");
    if (!row) return;
    var index = Number(row.getAttribute("data-index"));
    var item = data.items[index];
    if (!item) return;
    var field = target.getAttribute("data-field");

    if (field === "tags") {
      item.tags = target.value
        .split(/[,，]/)
        .map(function (tag) {
          return tag.trim();
        })
        .filter(Boolean);
      return;
    }

    if (field === "fileKind") {
      item.file = Object.assign({ kind: target.value }, item.file, { kind: target.value });
      if (target.value === "none" || target.value === "pending") {
        delete item.file.href;
        delete item.file.hint;
        item.file = { kind: target.value };
      }
      return;
    }

    if (field === "fileHref" || field === "fileHint") {
      item.file = item.file || { kind: "download" };
      if (field === "fileHref") item.file.href = target.value.trim();
      else item.file.hint = target.value.trim();
      if (!item.file.kind || item.file.kind === "none") item.file.kind = "download";
      return;
    }

    item[field] = target.value;
  }

  function save() {
    status("保存中…");
    var text =
      "/* 资源表数据：由 admin.html 生成，也可直接手改 */\nwindow.RESOURCE_DATA = " +
      JSON.stringify(data, null, 2) +
      ";\n";

    api("contents/" + PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: "更新资源表（admin）",
        content: encodeBase64(text),
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
        status("已提交，等 GitHub Pages 重新部署（约 1 分钟）", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  el.list.addEventListener("input", function (event) {
    if (event.target.matches("[data-field]")) readField(event.target);
  });

  el.list.addEventListener("change", function (event) {
    if (event.target.matches("select[data-field]")) readField(event.target);
  });

  el.list.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var row = button.closest("[data-index]");
    var index = Number(row.getAttribute("data-index"));
    var action = button.getAttribute("data-action");

    if (action === "remove") {
      data.items.splice(index, 1);
    } else if (action === "up" && index > 0) {
      var previous = data.items[index - 1];
      data.items[index - 1] = data.items[index];
      data.items[index] = previous;
    } else if (action === "down" && index < data.items.length - 1) {
      var next = data.items[index + 1];
      data.items[index + 1] = data.items[index];
      data.items[index] = next;
    }
    render();
  });

  el.add.addEventListener("click", function () {
    data.items.push({ name: "新资源", tags: ["插件"], desc: "", link: "", file: { kind: "pending" } });
    render();
  });

  el.save.addEventListener("click", save);
  el.load.addEventListener("click", load);

  el.token.addEventListener("change", function () {
    localStorage.setItem(TOKEN_KEY, el.token.value.trim());
    status(el.token.value.trim() ? "token 已存在本机浏览器" : "token 已清空", "ok");
  });

  el.token.value = localStorage.getItem(TOKEN_KEY) || "";
  el.repo.value = localStorage.getItem("dsh_gh_repo") || "heidao0928/first-site";
  el.repo.addEventListener("change", function () {
    localStorage.setItem("dsh_gh_repo", el.repo.value.trim());
  });

  load();
})();
