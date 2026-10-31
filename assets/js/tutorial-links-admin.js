/* 后台「教程」页：给每张教程封面填跳转链接，保存到 assets/data/tutorial-links.js */
(function () {
  "use strict";

  var LINKS_PATH = "assets/data/tutorial-links.js";
  var TUT_PATH = "tutorials.html";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    list: document.getElementById("t-list"),
    status: document.getElementById("t-status"),
    load: document.getElementById("t-load"),
    save: document.getElementById("t-save")
  };

  if (!el.list) return;

  var linksSha = null;
  var current = {};

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

  function getFile(path) {
    return api("contents/" + path + "?ref=" + encodeURIComponent(branch())).then(function (res) {
      if (!res.ok) throw new Error(path + " HTTP " + res.status);
      return res.json();
    });
  }

  function parseCards(html) {
    var items = [];
    var re = /<a class="tut-card"[^>]*>[\s\S]*?<\/a>/g;
    var m;
    while ((m = re.exec(html))) {
      var block = m[0];
      var cover = (block.match(/covers\/([^./"]+)\.webp/) || [])[1];
      var title = (block.match(/<h3 class="tut-card__title">([\s\S]*?)<\/h3>/) || [])[1];
      if (cover && title) items.push({ cover: cover, title: title.trim() });
    }
    return items;
  }

  function render(items) {
    if (!items.length) {
      el.list.innerHTML = '<p class="admin__empty">没有读到教程卡片。</p>';
      return;
    }
    el.list.innerHTML = items
      .map(function (item) {
        var value = current[item.cover] || "";
        return (
          '<div class="admin__row">' +
          '<div class="tut-link-row">' +
          '<img class="tut-link-row__cover" src="assets/img/covers/' + item.cover + '.webp" alt="" loading="lazy" />' +
          '<div class="tut-link-row__body">' +
          '<p class="tut-link-row__title">' + item.title + "</p>" +
          '<input class="tut-link-row__input" data-cover="' + item.cover + '" value="' + value.replace(/"/g, "&quot;") + '" placeholder="https:// 小红书 / B站 链接" />' +
          "</div></div></div>"
        );
      })
      .join("");
  }

  function load() {
    status("读取中…");
    Promise.all([getFile(TUT_PATH), getFile(LINKS_PATH).catch(function () { return null; })])
      .then(function (results) {
        var tutFile = results[0];
        var linksFile = results[1];

        var cards = parseCards(decodeBase64(tutFile.content));

        if (linksFile) {
          linksSha = linksFile.sha;
          var raw = decodeBase64(linksFile.content);
          var start = raw.indexOf("window.TUTORIAL_LINKS");
          if (start >= 0) {
            var eq = raw.indexOf("=", start);
            raw = raw.slice(eq + 1).trim();
            if (raw.charAt(raw.length - 1) === ";") raw = raw.slice(0, -1);
          }
          try {
            current = JSON.parse(raw) || {};
          } catch (error) {
            current = {};
          }
        } else {
          linksSha = null;
          current = {};
        }

        render(cards);
        status("已读取 " + cards.length + " 条教程，其中 " + Object.keys(current).length + " 条已有链接", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message + "（token 是否有效？）", "err");
      });
  }

  function save() {
    var map = {};
    Array.prototype.forEach.call(el.list.querySelectorAll("[data-cover]"), function (input) {
      var value = input.value.trim();
      if (value) map[input.getAttribute("data-cover")] = value;
    });

    var text =
      "/* 教程链接：键是封面文件名（不含扩展名），值是跳转地址；由 admin.html 生成，也可手改 */\nwindow.TUTORIAL_LINKS = " +
      JSON.stringify(map, null, 2) +
      ";\n";

    status("保存中…");
    api("contents/" + LINKS_PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: "更新教程链接（admin）",
        content: encodeBase64(text),
        sha: linksSha,
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
        linksSha = json.content.sha;
        current = map;
        status("已保存 " + Object.keys(map).length + " 条链接，约 1 分钟后生效", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  el.load.addEventListener("click", load);
  el.save.addEventListener("click", save);
  load();
})();
