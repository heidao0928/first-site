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

  /* ---------------------------------------------------------------- 主题切换 */
  function initTheme() {
    var root = document.documentElement;
    var toggle = $("#theme-toggle");
    if (!toggle) return;

    var sync = function () {
      var isDark = root.dataset.theme === "dark";
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", isDark ? "#010c15" : "#0a6383");
    };

    toggle.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (err) {
        /* 隐私模式下写入失败，忽略即可 */
      }
      sync();
    });

    /* 用户没手动选过时，跟随系统明暗变化 */
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function (event) {
      var stored = null;
      try {
        stored = localStorage.getItem("theme");
      } catch (err) {
        stored = null;
      }
      if (stored) return;
      root.dataset.theme = event.matches ? "dark" : "light";
      sync();
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onSystemChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onSystemChange);
    }

    sync();
  }

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
    var panel = document.querySelector(".hero");
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

  /* ---------------------------------------------------------------- 启动 */
  function boot() {
    // 先让内容可见，再逐个启用交互；某个模块出错不会连累其他功能
    var steps = [
      initReveal,
      initTheme,
      initNav,
      initScrollSpy,
      initToTop,
      initYear,
      initCopyCode,
      initBubbles,
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
