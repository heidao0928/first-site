/* ==========================================================================
   个人主页 · 交互脚本
   无依赖，全部功能都做了降级：JS 失效时页面依然可读可导航。
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  var $$ = function (sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  };

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -------------------------------------------------------------- 移动端菜单 */
  function initNav() {
    var toggle = $("#nav-toggle");
    var nav = $("#primary-nav");
    var header = $("#site-header");
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    };

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    /* 点击菜单项后收起 */
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    /* 点空白处或按 Esc 收起 */
    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* 从手机布局切回桌面时，清掉残留状态 */
    var desktop = window.matchMedia("(min-width: 56.0625rem)");
    var onBreakpoint = function (event) {
      if (event.matches) setOpen(false);
    };
    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", onBreakpoint);
    }

    /* 页头滚动阴影 */
    if (header) {
      var updateShadow = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      updateShadow();
      window.addEventListener("scroll", updateShadow, { passive: true });
    }
  }

  /* ------------------------------------------------------------ 滚动出现动画 */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (item, index) {
      item.style.setProperty("--reveal-delay", (index % 4) * 80 + "ms");
      observer.observe(item);
    });
  }

  /* ---------------------------------------------------------- 导航高亮当前区块 */
  function initScrollSpy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = new Map();
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) map.set(target, link);
    });

    if (!map.size) return;

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("is-active");
          });
          var active = map.get(entry.target);
          if (active) active.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    map.forEach(function (_link, section) {
      spy.observe(section);
    });
  }

  /* -------------------------------------------------------------- 返回顶部 */
  function initToTop() {
    var button = $("#to-top");
    if (!button) return;

    var update = function () {
      button.classList.toggle("is-visible", window.scrollY > 600);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });

    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  }

  /* ------------------------------------------------------------ 页脚年份 */
  function initYear() {
    $$("[data-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  /* --------------------------------------------------------- 代码块复制按钮 */
  function initCopyCode() {
    if (!navigator.clipboard) return;

    $$(".prose pre").forEach(function (pre) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "复制";

      button.addEventListener("click", function () {
        var code = pre.querySelector("code");
        var text = code ? code.innerText : pre.innerText;

        navigator.clipboard.writeText(text).then(
          function () {
            button.textContent = "已复制";
            window.setTimeout(function () {
              button.textContent = "复制";
            }, 1600);
          },
          function () {
            button.textContent = "复制失败";
            window.setTimeout(function () {
              button.textContent = "复制";
            }, 1600);
          }
        );
      });

      pre.appendChild(button);
    });
  }

  /* -------------------------------------------------- 水下气泡与像素星光 */
  function initBubbles() {
    var host = document.getElementById("bubbles");
    if (!host || prefersReducedMotion) return;

    // 只在两侧露出水面的位置放气泡：中间被玻璃窗盖住，气泡会显得像被切了一半
    if (window.innerWidth < 1024) return;

    // 按内容栏的实际宽度算出两侧水面有多宽，让气泡贴着玻璃窗的外侧
    // 首页用 .hub，内页用 .page-head / .section，都量一下内容栏的实际宽度
    var panel = document.querySelector(".hub, .hero, .page-head, .section");
    if (!panel) return;

    var panelWidth = panel.getBoundingClientRect().width;
    var margin = (window.innerWidth - panelWidth) / 2;
    if (margin < 90) return;

    var sizes = [32, 40];

    // 返回气泡左边缘的像素位置：离窗口 12–110px 的水面带，左右随机
    function edgePosition(size) {
      var band = Math.max(0, Math.min(110, margin - size - 30));
      var gap = 12 + Math.random() * band;

      return Math.random() < 0.5
        ? margin - size - gap
        : window.innerWidth - margin + gap;
    }

    for (var i = 0; i < 10; i++) {
      var bubble = document.createElement("span");
      var size = sizes[Math.floor(Math.random() * sizes.length)];

      bubble.className = "bubble";
      bubble.style.width = size + "px";
      bubble.style.height = size + "px";
      bubble.style.left = edgePosition(size) + "px";

      var duration = 28 + size * 0.25 + Math.random() * 8;
      bubble.style.animationDuration = duration.toFixed(1) + "s";
      bubble.style.animationDelay = (-Math.random() * duration).toFixed(1) + "s";

      host.appendChild(bubble);
    }

    for (var j = 0; j < 10; j++) {
      var sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.style.left = edgePosition(12) + "px";
      sparkle.style.top = 5 + Math.random() * 40 + "%";
      sparkle.style.setProperty(
        "--sparkle-delay",
        (Math.random() * 7).toFixed(2) + "s"
      );
      host.appendChild(sparkle);
    }
  }

  /* ------------------------------------------------------ 教程卡片标签 */
  var TUT_CAT_LABELS = {
    weiyue: "卫月",
    brio: "brio",
    ana: "ana",
    filter: "滤镜",
    ps: "PS",
    other: "其他",
  };

  function renderCardTags() {
    $$(".tut-card").forEach(function (card) {
      var cover = card.querySelector(".tut-card__cover");
      if (!cover) return;

      var old = cover.querySelector(".tut-card__cats");
      if (old) old.parentNode.removeChild(old);

      var cats = (card.getAttribute("data-cat") || "").split(/\s+/).filter(Boolean);
      if (!cats.length) return;

      var box = document.createElement("span");
      box.className = "tut-card__cats";
      box.innerHTML = cats
        .map(function (cat) {
          return '<span class="tut-card__tag">' + (TUT_CAT_LABELS[cat] || cat) + "</span>";
        })
        .join("");
      cover.appendChild(box);
    });
  }

  /* ------------------------------------------------------ 教程筛选与分页 */
  function initTutorialGallery() {
    var bar = document.querySelector("[data-tut-filters]");
    var grid = document.querySelector(".tut-grid");
    var pager = document.querySelector("[data-tut-pager]");
    var featured = document.querySelector("[data-tut-featured]");
    var emptyHint = document.querySelector("[data-tut-empty]");
    var catFeatured = document.querySelector("[data-tut-cat-featured]");
    var searchBox = document.querySelector("[data-tut-search]");
    var searchClear = document.querySelector("[data-tut-search-clear]");
    if (!bar || !grid) return;

    var cards = $$(".tut-card", grid);
    var perPage = 15;
    var filter = "all";
    var page = 1;
    var query = "";

    function catsOf(card) {
      return (card.getAttribute("data-cat") || "")
        .split(/\s+/)
        .filter(Boolean);
    }

    function matches(card) {
      var q = query.trim().toLowerCase();
      if (q) {
        var title = card.querySelector(".tut-card__title");
        var text = title ? title.textContent.toLowerCase() : "";
        if (text.indexOf(q) === -1) {
          // 标题没命中时，再按分类标签匹配（搜「brio」也能出这一类）
          var hitCat = catsOf(card).some(function (cat) {
            var label = (TUT_CAT_LABELS[cat] || cat).toLowerCase();
            return label.indexOf(q) !== -1 || cat.indexOf(q) !== -1;
          });
          if (!hitCat) return false;
        }
      }

      if (filter === "all") {
        return !card.getAttribute("data-pin");
      }
      // 该分类的「置顶」会单独显示成一张大卡，宫格里不再重复
      if (card.getAttribute("data-cat-featured") === filter) return false;
      return catsOf(card).indexOf(filter) !== -1;
    }

    function setPageButtons(total) {
      if (!pager) return;
      pager.innerHTML = "";
      if (total <= 1) {
        pager.hidden = true;
        return;
      }
      pager.hidden = false;

      function add(label, target, options) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        if (target) button.setAttribute("data-page", String(target));
        if (options && options.active) {
          button.classList.add("is-active");
          button.setAttribute("aria-current", "page");
        }
        if (options && options.disabled) button.disabled = true;
        pager.appendChild(button);
      }

      add("‹", page - 1, { disabled: page === 1 });
      for (var i = 1; i <= total; i++) {
        add(String(i), i, { active: i === page });
      }
      add("›", page + 1, { disabled: page === total });
    }

    function render(scroll) {
      var list = cards.filter(matches);
      var total = Math.max(1, Math.ceil(list.length / perPage));
      if (page > total) page = total;

      var start = (page - 1) * perPage;
      var visible = new Set(list.slice(start, start + perPage));

      cards.forEach(function (card) {
        card.classList.toggle("is-hidden", !visible.has(card));
      });

        renderCardTags();

      if (emptyHint) {
        emptyHint.hidden = list.length !== 0;
        emptyHint.textContent = searching ? "没有找到相关教程。" : "这个分类还没有教程。";
      }

      setPageButtons(total);

      var searching = query.trim().length > 0;

      if (featured) {
        featured.hidden = searching || !(filter === "all" && page === 1);
      }

      if (catFeatured) {
        var pinnedCat = ["ana", "weiyue", "brio", "other"].indexOf(filter) !== -1 ? filter : null;
        catFeatured.hidden = searching || !pinnedCat;
        $$("[data-cat-featured]", catFeatured).forEach(function (item) {
          item.hidden = item.getAttribute("data-cat-featured") !== pinnedCat;
        });
      }

      if (scroll) {
        var top = grid.getBoundingClientRect().top + window.scrollY - 160;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      }
    }

    if (searchBox) {
      searchBox.addEventListener("input", function () {
        query = searchBox.value;
        page = 1;
        if (searchClear) searchClear.hidden = !query;
        render(false);
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", function () {
        searchBox.value = "";
        query = "";
        page = 1;
        searchClear.hidden = true;
        render(false);
        searchBox.focus();
      });
    }

    bar.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-filter]");
      if (!button) return;
      filter = button.getAttribute("data-filter");
      page = 1;
      $$("button", bar).forEach(function (item) {
        var active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render(false);
    });

    if (pager) {
      pager.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-page]");
        if (!button || button.disabled) return;
        var next = Number(button.getAttribute("data-page"));
        if (!next || next === page) return;
        page = next;
        render(true);
      });
    }

    render(false);
  }
  /* ------------------------------------------------------------ 图片灯箱 */
  function initLightbox() {
    var dialogs = $$("dialog.lightbox");
    if (!dialogs.length) return;

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-lightbox]");
      if (trigger) {
        var dialog = document.getElementById(trigger.getAttribute("data-lightbox"));
        if (dialog && typeof dialog.showModal === "function") {
          event.preventDefault();
          dialog.showModal();
        }
        return;
      }

      var closer = event.target.closest("[data-lightbox-close]");
      if (closer) {
        var open = closer.closest("dialog");
        if (open) open.close();
        return;
      }

      // 点遮罩关闭
      if (event.target.tagName === "DIALOG") {
        event.target.close();
      }
    });
  }
  /* ---------------------------------------------------------- 资源表渲染 */
  function initResourcesTable() {
    var body = document.querySelector("[data-res-body]");
    if (!body) return;

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    var data = window.RESOURCE_DATA;
    if (!data || !data.items || !data.items.length) {
      body.innerHTML = '<tr><td class="res-table__empty" colspan="5">资源列表暂时为空。</td></tr>';
      return;
    }

    body.innerHTML = data.items
      .map(function (item, index) {
        var tags = (item.tags || [])
          .map(function (tag) {
            return '<span class="res-tag">' + esc(tag) + "</span>";
          })
          .join("");

        var desc = esc(item.desc || "");
        if (item.link) {
          desc +=
            '<a class="res-link" href="' +
            esc(item.link) +
            '" target="_blank" rel="noopener noreferrer">' +
            esc(item.link) +
            "</a>";
        }

        var file = item.file || { kind: "none" };
        var fileHtml;
        if (file.kind === "download") {
          var hintText = file.hint || "";
          if (hintText && hintText.indexOf("提取码") !== 0) hintText = "提取码 " + hintText;
          fileHtml =
            (hintText ? '<span class="res-hint">' + esc(hintText) + "</span>" : "") +
            '<a class="res-dl" href="' +
            esc(file.href) +
            '" target="_blank" rel="noopener noreferrer">下载</a>';
        } else if (file.kind === "view") {
          fileHtml =
            '<a class="res-dl" href="' +
            esc(file.href) +
            '" data-lightbox="guide-lightbox" target="_blank" rel="noopener noreferrer">查看</a>';
        } else if (file.kind === "pending") {
          fileHtml = '<span class="res-dl res-dl--muted" title="网盘链接待补">待补</span>';
        } else {
          fileHtml = '<span class="res-dl res-dl--muted">—</span>';
        }

        var num = ("0" + (index + 1)).slice(-2);
        return (
          "<tr>" +
          '<td class="res-table__num">' + num + "</td>" +
          '<td class="res-table__name">' + esc(item.name) + "</td>" +
          '<td class="res-table__tags">' + tags + "</td>" +
          '<td class="res-table__desc">' + desc + "</td>" +
          '<td class="res-table__file">' + fileHtml + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  /* ------------------------------------------------------------ 首页公告 */
  function initNotices() {
    var list = document.querySelector("[data-notice-list]");
    if (!list) return;

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    var data = window.NOTICE_DATA;
    var updated = document.querySelector("[data-notice-updated]");

    if (!data || !data.items || !data.items.length) {
      list.innerHTML = '<li class="hub__feed-empty">暂时还没有公告。</li>';
      return;
    }

    list.innerHTML = data.items
      .map(function (item) {
        var date = item.date ? "<time>" + esc(item.date) + "</time>" : "";
        return "<li>" + date + "<span>" + esc(item.text) + "</span></li>";
      })
      .join("");

    if (updated) updated.textContent = data.updated ? "更新于 " + data.updated : "";
  }

  /* ------------------------------------------------------------ 复制群号 */
  function initCopyButtons() {
    var buttons = $$("[data-copy]");
    if (!buttons.length) return;

    var copyText = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand("copy");
          resolve();
        } catch (error) {
          reject(error);
        }
        document.body.removeChild(area);
      });
    };

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var text = button.getAttribute("data-copy");
        var label = button.textContent;
        copyText(text)
          .then(function () {
            button.textContent = "已复制 " + text;
            button.classList.add("is-copied");
          })
          .catch(function () {
            button.textContent = "复制失败，手动选一下";
          })
          .then(function () {
            setTimeout(function () {
              button.textContent = label;
              button.classList.remove("is-copied");
            }, 1600);
          });
      });
    });
  }

  /* ---------------------------------------------------------------- 启动 */
  function boot() {
    // 先让内容可见，再逐个启用交互；某个模块出错不会连累其他功能
    var steps = [
      initReveal,
      initNav,
      initScrollSpy,
      initToTop,
      initYear,
      initCopyCode,
      initBubbles,
      initTutorialGallery,
      initLightbox,
      initResourcesTable,
      initNotices,
      initCopyButtons,
    ];

    steps.forEach(function (step) {
      try {
        step();
      } catch (err) {
        /* 单个模块失败时静默降级 */
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
