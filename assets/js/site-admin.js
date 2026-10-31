/* 后台「页面文案」：首页文案、TIPS、相关网站列表，写入 assets/data/site.js */
(function () {
  "use strict";

  var DATA_PATH = "assets/data/site.js";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    body: document.getElementById("s-body"),
    status: document.getElementById("s-status"),
    load: document.getElementById("s-load"),
    save: document.getElementById("s-save")
  };

  if (!el.body) return;

  var state = { data: null, sha: null, groups: [] };

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

  function parseData(body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      return new Function("return (" + body + ")")();
    }
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

  function field(label, value, attrs) {
    return (
      '<label class="site-field">' +
      '<span class="site-field__label">' + esc(label) + "</span>" +
      '<input class="site-field__input" value="' + esc(value) + '" ' + (attrs || "") + " />" +
      "</label>"
    );
  }

  function render() {
    var d = state.data || {};
    var home = d.home || {};
    var tips = d.tips || {};
    var links = d.links || {};
    var wishes = home.wishes || {};

    el.body.innerHTML =
      '<section class="site-block">' +
      '<h3 class="site-block__title">首页</h3>' +
      '<div class="site-grid">' +
      field("眉标", home.eyebrow, 'data-f="home.eyebrow"') +
      field("大标题", home.title, 'data-f="home.title"') +
      "</div>" +
      field("副标题", home.sub, 'data-f="home.sub"') +
      '<div class="site-grid">' +
      field("致敬前缀", home.tributeLabel, 'data-f="home.tributeLabel"') +
      field("致敬名字", home.tributeName, 'data-f="home.tributeName"') +
      "</div>" +
      '<p class="site-sub">社交链接</p>' +
      '<div data-list="home.links"></div>' +
      '<button type="button" class="admin__btn admin__btn--tiny" data-add="home.links">+ 加一条</button>' +
      '<p class="site-sub">内容入口</p>' +
      '<div data-list="home.entries"></div>' +
      '<button type="button" class="admin__btn admin__btn--tiny" data-add="home.entries">+ 加一个入口</button>' +
      '<p class="site-sub">页脚一句话</p>' +
      '<div class="site-grid site-grid--4">' +
      field("首页", wishes.index, 'data-f="wish.index"') +
      field("教程", wishes.tutorials, 'data-f="wish.tutorials"') +
      field("资源", wishes.resources, 'data-f="wish.resources"') +
      field("相关网站", wishes.links, 'data-f="wish.links"') +
      "</div>" +
      "</section>" +

      '<section class="site-block">' +
      '<h3 class="site-block__title">TIPS（一行一条）</h3>' +
      '<div class="site-grid site-grid--3">' +
      '<label class="site-field"><span class="site-field__label">教程页</span>' +
      '<textarea class="site-field__area" data-f="tips.tutorials" rows="3">' + esc((tips.tutorials || []).join("\n")) + "</textarea></label>" +
      '<label class="site-field"><span class="site-field__label">资源页</span>' +
      '<textarea class="site-field__area" data-f="tips.resources" rows="3">' + esc((tips.resources || []).join("\n")) + "</textarea></label>" +
      '<label class="site-field"><span class="site-field__label">相关网站页</span>' +
      '<textarea class="site-field__area" data-f="tips.links" rows="3">' + esc((tips.links || []).join("\n")) + "</textarea></label>" +
      "</div>" +
      "</section>" +

      '<section class="site-block">' +
      '<h3 class="site-block__title">相关网站</h3>' +
      '<div data-list="links.rows"></div>' +
      '<button type="button" class="admin__btn admin__btn--tiny" data-add="links.rows">+ 加一行</button>' +
      '<p class="site-sub">群号（显示在「友情代挂」那一行）</p>' +
      '<div data-list="groups"></div>' +
      '<button type="button" class="admin__btn admin__btn--tiny" data-add="groups">+ 加一个群</button>' +
      '<p class="site-sub">右下角自制 mod 卡</p>' +
      '<div class="site-grid">' +
      field("小标题", (links.promo || {}).kicker, 'data-f="promo.kicker"') +
      field("封面代号", (links.promo || {}).cover, 'data-f="promo.cover"') +
      "</div>" +
      '<div class="site-grid">' +
      field("标题", (links.promo || {}).title, 'data-f="promo.title"') +
      field("链接", (links.promo || {}).href, 'data-f="promo.href"') +
      "</div>" +
      field("说明", (links.promo || {}).desc, 'data-f="promo.desc"') +
      "</section>";

    renderList("home.links", home.links || [], ["label", "href"]);
    renderList("home.entries", home.entries || [], ["label", "desc", "href"]);
    renderList("links.rows", links.rows || [], ["tag", "title", "desc", "href"]);
    renderList("groups", state.groups, ["name", "qq"]);
  }

  function renderList(key, items, fields) {
    var box = el.body.querySelector('[data-list="' + key + '"]');
    if (!box) return;

    box.innerHTML = items
      .map(function (item, index) {
        var inputs = fields
          .map(function (f) {
            return (
              '<input class="site-row__input" data-k="' + f + '" data-i="' + index +
              '" placeholder="' + f + '" value="' + esc(item[f] || "") + '" />'
            );
          })
          .join("");
        return '<div class="site-row">' + inputs +
          '<button type="button" class="admin__btn admin__btn--tiny" data-del="' + key + '" data-i="' + index + '">删除</button>' +
          "</div>";
      })
      .join("");
  }

  function collect() {
    var d = state.data;

    el.body.querySelectorAll("[data-f]").forEach(function (input) {
      var path = input.getAttribute("data-f");
      var value = input.value.trim();
      if (path.indexOf("wish.") === 0) {
        d.home.wishes = d.home.wishes || {};
        d.home.wishes[path.split(".")[1]] = value;
      } else if (path.indexOf("tips.") === 0) {
        d.tips = d.tips || {};
        d.tips[path.split(".")[1]] = input.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (path.indexOf("promo.") === 0) {
        d.links.promo = d.links.promo || {};
        d.links.promo[path.split(".")[1]] = value;
      } else if (path.indexOf("home.") === 0) {
        d.home[path.split(".")[1]] = value;
      }
    });

    ["home.links", "home.entries", "links.rows"].forEach(function (key) {
      var list = key === "home.links" ? d.home.links : key === "home.entries" ? d.home.entries : d.links.rows;
      var parts = key.split(".");
      var target = parts[0] === "home" ? d.home : d.links;
      var arr = target[parts[1]] || [];

      el.body.querySelectorAll('[data-list="' + key + '"] .site-row__input').forEach(function (input) {
        var i = Number(input.getAttribute("data-i"));
        if (!arr[i]) return;
        arr[i][input.getAttribute("data-k")] = input.value.trim();
      });
      target[parts[1]] = arr;
    });

    el.body.querySelectorAll('[data-list="groups"] .site-row__input').forEach(function (input) {
      var i = Number(input.getAttribute("data-i"));
      if (!state.groups[i]) return;
      state.groups[i][input.getAttribute("data-k")] = input.value.trim();
    });
  }

  function syncGroupsRow() {
    var rows = (state.data.links && state.data.links.rows) || [];
    var row = rows.filter(function (r) { return r.type === "groups"; })[0];
    if (row) row.groups = state.groups.filter(function (g) { return g.qq; });
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
        var start = raw.indexOf("window.SITE_DATA");
        var eq = raw.indexOf("=", start);
        state.data = parseData(raw.slice(eq + 1).trim().replace(/;$/, "")) || {};
        state.data.home = state.data.home || {};
        state.data.tips = state.data.tips || {};
        state.data.links = state.data.links || {};
        state.data.links.rows = state.data.links.rows || [];
        state.data.home.links = state.data.home.links || [];
        state.data.home.entries = state.data.home.entries || [];

        var row = state.data.links.rows.filter(function (r) { return r.type === "groups"; })[0];
        state.groups = (row && row.groups ? row.groups : []).map(function (g) {
          return { name: g.name || "", qq: g.qq || "" };
        });

        render();
        status("已读取，改完点保存", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message + "（token 是否有效？）", "err");
      });
  }

  function save() {
    collect();
    state.data.links.rows.forEach(function (row) {
      if (row.type === "groups") row.groups = state.groups.filter(function (g) { return g.qq; });
    });
    state.data.updated = new Date().toISOString().slice(0, 10);

    var text =
      "/* 站点文案与列表：由 admin.html 的「页面文案」维护，也可直接手改 */\nwindow.SITE_DATA = " +
      JSON.stringify(state.data, null, 2) + ";\n";

    status("保存中…");
    api("contents/" + DATA_PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: "更新页面文案（admin）",
        content: encodeBase64(text),
        sha: state.sha,
        branch: branch()
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (body) { throw new Error(body.message || "HTTP " + res.status); });
        }
        return res.json();
      })
      .then(function (json) {
        state.sha = json.content.sha;
        status("已保存，约 1 分钟后生效", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  el.load.addEventListener("click", load);
  el.save.addEventListener("click", save);

  el.body.addEventListener("click", function (event) {
    var add = event.target.closest("[data-add]");
    if (add) {
      collect();
      var key = add.getAttribute("data-add");
      if (key === "home.links") state.data.home.links.push({ label: "", href: "" });
      else if (key === "home.entries") state.data.home.entries.push({ label: "", desc: "", href: "" });
      else if (key === "links.rows") state.data.links.rows.push({ type: "link", tag: "", title: "", desc: "", href: "" });
      else if (key === "groups") state.groups.push({ name: "", qq: "" });
      render();
      return;
    }

    var del = event.target.closest("[data-del]");
    if (del) {
      collect();
      var listKey = del.getAttribute("data-del");
      var index = Number(del.getAttribute("data-i"));
      if (listKey === "home.links") state.data.home.links.splice(index, 1);
      else if (listKey === "home.entries") state.data.home.entries.splice(index, 1);
      else if (listKey === "links.rows") state.data.links.rows.splice(index, 1);
      else if (listKey === "groups") state.groups.splice(index, 1);
      render();
    }
  });

  load();
})();
