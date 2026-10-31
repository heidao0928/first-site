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

  /* ------------------------------------------------------ 页面文案渲染 */
  function initSiteContent() {
    var data = window.SITE_DATA;
    if (!data) return;

    var home = data.home || {};
    var file = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
    var page = file || "index";

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function setText(sel, text) {
      var el = document.querySelector(sel);
      if (el && text) el.textContent = text;
    }

    setText("[data-site-eyebrow]", home.eyebrow);
    setText("[data-site-title]", home.title);
    setText("[data-site-sub]", home.sub);

    var meta = document.querySelector("[data-site-links]");
    if (meta && Array.isArray(home.links) && home.links.length) {
      meta.innerHTML = home.links
        .map(function (item, index) {
          var a =
            '<a href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer">' +
            esc(item.label) + "</a>";
          return index ? '<span aria-hidden="true">·</span>' + a : a;
        })
        .join("");
    }

    var entries = document.querySelector("[data-site-entries]");
    if (entries && Array.isArray(home.entries)) {
      entries.innerHTML = home.entries
        .map(function (item) {
          return (
            '<li><a class="entry" href="' + esc(item.href) + '">' +
            '<span class="entry__text">' +
            '<span class="entry__label">' + esc(item.label) + "</span>" +
            '<span class="entry__desc">' + esc(item.desc) + "</span>" +
            "</span>" +
            '<span class="entry__arrow" aria-hidden="true">→</span>' +
            "</a></li>"
          );
        })
        .join("");
    }

    var trib = document.querySelector("[data-site-tribute]");
    if (trib && home.tributeName) {
      trib.innerHTML =
        "<span>" + esc(home.tributeLabel || "") + "</span><strong>" + esc(home.tributeName) + "</strong>";
    }

    var wish = document.querySelector("[data-site-wish]");
    if (wish && home.wishes && home.wishes[page]) {
      wish.textContent = home.wishes[page];
    }

    var tips = document.querySelector("[data-page-tips]");
    if (tips && data.tips && Array.isArray(data.tips[page]) && data.tips[page].length) {
      tips.innerHTML = data.tips[page]
        .map(function (line) {
          return "<li>" + esc(line) + "</li>";
        })
        .join("");
    }

    var rowsBox = document.querySelector("[data-links-rows]");
    if (rowsBox && data.links && Array.isArray(data.links.rows)) {
      rowsBox.innerHTML = data.links.rows
        .map(function (row) {
          var head =
            '<span class="post-item__date">' + esc(row.tag) + "</span>" +
            '<span class="post-item__body">' +
            '<span class="post-item__title">' + esc(row.title) + "</span>" +
            '<span class="post-item__summary">' + esc(row.desc) + "</span>";

          if (row.type === "groups") {
            var buttons = (row.groups || [])
              .map(function (g) {
                return (
                  '<button type="button" class="chip" data-copy="' + esc(g.qq) + '">' +
                  esc(g.name) + " " + esc(g.qq) + "</button>"
                );
              })
              .join("");
            return (
              '<li class="post-item"><div class="post-item__link post-item__link--static">' +
              head + '<span class="link-buttons">' + buttons + "</span></span></div></li>"
            );
          }

          return (
            '<li class="post-item"><a class="post-item__link" href="' + esc(row.href) +
            '" target="_blank" rel="noopener noreferrer">' +
            head + "</span>" +
            '<span class="post-item__arrow" aria-hidden="true">↗</span></a></li>'
          );
        })
        .join("");
    }

    var promo = document.querySelector("[data-links-promo]");
    if (promo && data.links && data.links.promo) {
      var pr = data.links.promo;
      if (pr.href) promo.setAttribute("href", pr.href);
      var img = promo.querySelector("img");
      if (img && pr.cover) img.src = "assets/img/covers/" + pr.cover + ".webp";
      if (img && pr.title) img.alt = pr.title;
      var pt = promo.querySelector(".links-promo__title");
      if (pt && pr.title) pt.textContent = pr.title;
      var pd = promo.querySelector(".links-promo__desc");
      if (pd && pr.desc) pd.textContent = pr.desc;
      var kicker = document.querySelector(".links-promo__kicker");
      if (kicker && pr.kicker) kicker.textContent = pr.kicker;
    }
  }

  /* ------------------------------------------------------ 教程数据渲染 */
  function initTutorialData() {
    var data = window.TUTORIAL_DATA;
    if (!data || !Array.isArray(data.items)) return;

    var featuredBox = document.querySelector("[data-tut-featured]");
    var catBox = document.querySelector("[data-tut-cat-featured]");
    var grid = document.querySelector(".tut-grid");
    if (!grid) return;

    var meta = document.querySelector("[data-tut-meta]");
    if (meta) {
      var stamp = String(data.updated || "").replace(/-/g, ".").slice(0, 7);
      meta.textContent = "共 " + data.items.length + " 篇" + (stamp ? " · 更新于 " + stamp : "");
    }

    var byCover = {};
    data.items.forEach(function (item) {
      byCover[item.cover] = item;
    });

    var featured = (data.featured || []).filter(function (c) {
      return byCover[c];
    });

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function coverSrc(cover) {
      return "assets/img/covers/" + cover + ".webp";
    }

    function linkAttrs(item) {
      var link = (item.link || "").trim();
      // 没链接时不给 href：卡片不可点，也不会跳回页首
      if (!link) return "";
      return ' href="' + esc(link) + '" target="_blank" rel="noopener noreferrer"';
    }

    // 全部置顶
    if (featuredBox) {
      featuredBox.innerHTML = featured
        .map(function (cover) {
          var item = byCover[cover];
          return (
            '<a class="tut-featured__item"' + linkAttrs(item) + ">" +
            '<span class="tut-featured__cover">' +
            '<img src="' + coverSrc(cover) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async" />' +
            '<span class="tut-featured__badge">置顶</span>' +
            "</span>" +
            '<span class="tut-featured__title">' + esc(item.title) + "</span>" +
            "</a>"
          );
        })
        .join("");
    }

    // 分类置顶
    var catFeatured = data.catFeatured || {};
    if (catBox) {
      catBox.innerHTML = Object.keys(catFeatured)
        .map(function (cat) {
          var cover = catFeatured[cat];
          var item = byCover[cover];
          if (!item) return "";
          var extra = cat === "other" ? " tut-featured__item--sm" : "";
          return (
            '<a class="tut-featured__item' + extra + '" data-cat-featured="' + cat + '"' + linkAttrs(item) + ' hidden>' +
            '<span class="tut-featured__cover">' +
            '<img src="' + coverSrc(cover) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async" />' +
            '<span class="tut-featured__badge">置顶</span>' +
            "</span>" +
            '<span class="tut-featured__title">' + esc(item.title) + "</span>" +
            "</a>"
          );
        })
        .join("");
    }

    // 宫格（全部置顶的卡不进宫格）
    var catPin = {};
    Object.keys(catFeatured).forEach(function (cat) {
      catPin[catFeatured[cat]] = cat;
    });

    grid.innerHTML = data.items
      .map(function (item) {
        var attrs = "";
        if (featured.indexOf(item.cover) !== -1) attrs += ' data-pin="1"';
        if (catPin[item.cover]) attrs += ' data-cat-featured="' + catPin[item.cover] + '"';
        if (item.cats && item.cats.length) attrs += ' data-cat="' + item.cats.join(" ") + '"';
        else attrs += ' data-cat=""';

        return (
          '<a class="tut-card"' + linkAttrs(item) + attrs + ">" +
          '<div class="tut-card__cover">' +
          '<img src="' + coverSrc(item.cover) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async" />' +
          "</div>" +
          '<h3 class="tut-card__title">' + esc(item.title) + "</h3>" +
          "</a>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------------------- 致谢 */
  function initThanks() {
    var box = document.querySelector("[data-thanks-list]");
    if (!box) return;

    var data = window.THANKS_DATA || {};
    var items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      box.innerHTML = '<li class="hub__thanks-empty">还没有名单，欢迎通过爱发电支持。</li>';
      return;
    }

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    box.innerHTML = items
      .map(function (item) {
        var name = esc(item.name);
        var link = (item.link || "").trim();
        var label = link
          ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + name + "</a>"
          : "<span>" + name + "</span>";
        var note = item.note ? '<em>' + esc(item.note) + "</em>" : "";
        return '<li class="hub__thanks-item">' + label + note + "</li>";
      })
      .join("");
  }

  /* ---------------------------------------------------------------- 启动 */
  function boot() {
    // 先让内容可见，再逐个启用交互；某个模块出错不会连累其他功能
    var steps = [
      initSiteContent,
      initReveal,
      initNav,
      initScrollSpy,
      initToTop,
      initYear,
      initCopyCode,
      initTutorialData,
      initTutorialGallery,
      initLightbox,
      initResourcesTable,
      initNotices,
      initThanks,
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
