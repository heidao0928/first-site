/* 后台「教程」：增删教程、改标题/分类/链接，管理全部置顶与分类置顶 */
(function () {
  "use strict";

  var DATA_PATH = "assets/data/tutorials.js";
  var COVER_DIR = "assets/img/covers/";
  var TOKEN_KEY = "dsh_gh_token";

  var el = {
    repo: document.getElementById("a-repo"),
    branch: document.getElementById("a-branch"),
    token: document.getElementById("a-token"),
    list: document.getElementById("t-list"),
    status: document.getElementById("t-status"),
    load: document.getElementById("t-load"),
    save: document.getElementById("t-save"),
    addFile: document.getElementById("t-add-file"),
    addTitle: document.getElementById("t-add-title"),
    addBtn: document.getElementById("t-add")
  };

  if (!el.list) return;

  var CATS = [
    { key: "weiyue", label: "卫月" },
    { key: "brio", label: "brio" },
    { key: "ana", label: "ana" },
    { key: "filter", label: "滤镜" },
    { key: "ps", label: "PS" },
    { key: "other", label: "其他" }
  ];

  var state = { updated: "", items: [], sha: null, deleted: [] };

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

  function parseData(body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      /* 手写时可能省了键的引号，退一步按 JS 字面量求值 */
      return new Function("return (" + body + ")")();
    }
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
    if (!el.status) return;
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

  function render() {
    if (!state.items.length) {
      el.list.innerHTML = '<p class="admin__empty">还没有教程，先在下面加一条。</p>';
      return;
    }

    el.list.innerHTML = state.items
      .map(function (item, index) {
        var cats = item.cats || [];
        return (
          '<div class="admin__row" data-index="' + index + '">' +
          '<div class="tut-edit">' +
          '<img class="tut-edit__cover" src="' + COVER_DIR + item.cover + '.webp" alt="" loading="lazy" />' +
          '<div class="tut-edit__body">' +
          '<input class="tut-edit__title" data-field="title" value="' + esc(item.title) + '" placeholder="教程标题" />' +
          '<input class="tut-edit__link" data-field="link" value="' + esc(item.link || "") + '" placeholder="链接（小红书 / B站，可留空）" />' +
          '<div class="tut-edit__cats">' +
          CATS.map(function (cat) {
            var checked = cats.indexOf(cat.key) !== -1 ? " checked" : "";
            return (
              '<label class="tut-edit__cat"><input type="checkbox" data-cat="' + cat.key + '"' + checked + " /> " + cat.label + "</label>"
            );
          }).join("") +
          "</div>" +
          '<div class="tut-edit__pins">' +
          '<label class="tut-edit__pin"><input type="checkbox" data-field="pinAll"' + (item.pinAll ? " checked" : "") + " /> 全部置顶</label>" +
          '<label class="tut-edit__pin">分类置顶：' +
          '<select data-field="catPin">' +
          '<option value=""' + (!item.catPin ? " selected" : "") + ">无</option>" +
          CATS.map(function (cat) {
            return '<option value="' + cat.key + '"' + (item.catPin === cat.key ? " selected" : "") + ">" + cat.label + "</option>";
          }).join("") +
          "</select></label>" +
          '<span class="tut-edit__order">' +
          '<button type="button" class="admin__btn admin__btn--tiny" data-act="up">↑</button>' +
          '<button type="button" class="admin__btn admin__btn--tiny" data-act="down">↓</button>' +
          '<button type="button" class="admin__btn admin__btn--tiny" data-act="del">删除</button>' +
          "</span>" +
          "</div>" +
          "</div></div></div>"
        );
      })
      .join("");
  }

  function collect() {
    Array.prototype.forEach.call(el.list.querySelectorAll(".admin__row"), function (row) {
      var index = Number(row.getAttribute("data-index"));
      var item = state.items[index];
      if (!item) return;

      item.title = row.querySelector('[data-field="title"]').value.trim();
      item.link = row.querySelector('[data-field="link"]').value.trim();
      item.cats = Array.prototype.filter
        .call(row.querySelectorAll("[data-cat]"), function (input) {
          return input.checked;
        })
        .map(function (input) {
          return input.getAttribute("data-cat");
        });
      item.pinAll = row.querySelector('[data-field="pinAll"]').checked;
      item.catPin = row.querySelector('[data-field="catPin"]').value;
    });
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
        var start = raw.indexOf("window.TUTORIAL_DATA");
        var eq = raw.indexOf("=", start);
        var body = raw.slice(eq + 1).trim().replace(/;$/, "");
        var data = parseData(body) || {};

        var featured = data.featured || [];
        var catFeatured = data.catFeatured || {};
        var catPinByCover = {};
        Object.keys(catFeatured).forEach(function (cat) {
          catPinByCover[catFeatured[cat]] = cat;
        });

        state.updated = data.updated || "";
        state.items = (data.items || []).map(function (item) {
          return {
            cover: item.cover,
            title: item.title,
            link: item.link || "",
            cats: item.cats || [],
            pinAll: featured.indexOf(item.cover) !== -1,
            catPin: catPinByCover[item.cover] || ""
          };
        });

        render();
        status("已读取 " + state.items.length + " 条教程，其中 " + featured.length + " 条全部置顶", "ok");
      })
      .catch(function (error) {
        status("读取失败：" + error.message + "（token 是否有效？）", "err");
      });
  }

  function buildFile() {
    var featured = state.items
      .filter(function (item) {
        return item.pinAll;
      })
      .map(function (item) {
        return item.cover;
      });

    var catFeatured = {};
    state.items.forEach(function (item) {
      if (item.catPin) catFeatured[item.catPin] = item.cover;
    });

    var data = {
      updated: state.updated,
      featured: featured,
      catFeatured: catFeatured,
      items: state.items.map(function (item) {
        return {
          cover: item.cover,
          title: item.title,
          cats: item.cats,
          link: item.link || ""
        };
      })
    };

    return "/* 教程数据：由 admin.html 维护，也可直接手改 */\nwindow.TUTORIAL_DATA = " + JSON.stringify(data, null, 2) + ";\n";
  }

  /* 远端被别人改过时：把远端新增的条目并进来，本地编辑优先 */
  function mergeWith(latest) {
    var local = state.items;
    var localCovers = local.map(function (item) {
      return item.cover;
    });

    (latest.items || []).forEach(function (item) {
      if (localCovers.indexOf(item.cover) !== -1) return;
      if (state.deleted.indexOf(item.cover) !== -1) return;
      local.push({
        cover: item.cover,
        title: item.title,
        link: item.link || "",
        cats: item.cats || [],
        pinAll: (latest.featured || []).indexOf(item.cover) !== -1,
        catPin: ""
      });
    });

    Object.keys(latest.catFeatured || {}).forEach(function (cat) {
      var cover = latest.catFeatured[cat];
      var hasLocal = local.some(function (item) {
        return item.catPin === cat;
      });
      if (hasLocal) return;
      local.forEach(function (item) {
        if (item.cover === cover) item.catPin = cat;
      });
    });

    (latest.featured || []).forEach(function (cover) {
      var item = local.filter(function (i) {
        return i.cover === cover;
      })[0];
      if (item && !item.pinAll) item.pinAll = true;
    });
  }

  function save() {
    collect();

    var empty = state.items.filter(function (item) {
      return !item.title;
    });
    if (empty.length) {
      status("有 " + empty.length + " 条没写标题，先补上再保存", "err");
      return;
    }

    status("保存中…");

    api("contents/" + DATA_PATH + "?ref=" + encodeURIComponent(branch()))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (file) {
        var raw = decodeBase64(file.content);
        var start = raw.indexOf("window.TUTORIAL_DATA");
        var eq = raw.indexOf("=", start);
        var latest = parseData(raw.slice(eq + 1).trim().replace(/;$/, "")) || {};
        mergeWith(latest);
        render();

        return api("contents/" + DATA_PATH, {
          method: "PUT",
          body: JSON.stringify({
            message: "更新教程数据（admin）",
            content: encodeBase64(buildFile()),
            sha: file.sha,
            branch: branch()
          })
        });
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
        state.deleted = [];
        status("已保存 " + state.items.length + " 条教程，约 1 分钟后生效", "ok");
      })
      .catch(function (error) {
        status("保存失败：" + error.message, "err");
      });
  }

  function nextCoverId() {
    var max = 0;
    state.items.forEach(function (item) {
      var m = String(item.cover).match(/^c(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return "c" + (max + 1);
  }

  function toWebpBase64(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var width = 720;
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.round((img.height / img.width) * width);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        var dataUrl = canvas.toDataURL("image/webp", 0.75);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("图片读取失败"));
      };
      img.src = url;
    });
  }

  function addItem() {
    var file = el.addFile.files && el.addFile.files[0];
    var title = el.addTitle.value.trim();

    if (!file) {
      status("先选一张封面图", "err");
      return;
    }

    status("上传封面中…");
    var cover = nextCoverId();

    toWebpBase64(file)
      .then(function (base64) {
        return api("contents/" + COVER_DIR + cover + ".webp", {
          method: "PUT",
          body: JSON.stringify({
            message: "新增教程封面 " + cover,
            content: base64,
            branch: branch()
          })
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error("封面 HTTP " + res.status);
        collect();
        // 新加的放最前面（列表是按发布时间从新到旧的）
        state.items.unshift({
          cover: cover,
          title: title || "新教程",
          link: "",
          cats: [],
          pinAll: false,
          catPin: ""
        });
        el.addFile.value = "";
        el.addTitle.value = "";
        render();
        status("封面已上传为 " + cover + "，已放到列表最前面；补好分类和链接后点「保存」", "ok");
        if (el.list.scrollIntoView) el.list.scrollIntoView({ block: "start", behavior: "smooth" });
      })
      .catch(function (error) {
        status("添加失败：" + error.message, "err");
      });
  }

  if (el.load) el.load.addEventListener("click", load);
  if (el.save) el.save.addEventListener("click", save);
  if (el.addBtn) el.addBtn.addEventListener("click", addItem);

  el.list.addEventListener("click", function (event) {
    var button = event.target.closest("[data-act]");
    if (!button) return;

    collect();
    var row = button.closest(".admin__row");
    var index = Number(row.getAttribute("data-index"));
    var act = button.getAttribute("data-act");

    if (act === "del") {
      if (!window.confirm("确定删除「" + state.items[index].title + "」？保存后才会真正生效。")) return;
      state.deleted.push(state.items[index].cover);
      state.items.splice(index, 1);
    } else if (act === "up" && index > 0) {
      var prev = state.items[index - 1];
      state.items[index - 1] = state.items[index];
      state.items[index] = prev;
    } else if (act === "down" && index < state.items.length - 1) {
      var next = state.items[index + 1];
      state.items[index + 1] = state.items[index];
      state.items[index] = next;
    }

    render();
  });

  load();
})();
