/* Mission Mimosa — project site
 * Renders the repository's own Markdown (README + docs/) at runtime.
 * No Markdown files are modified; images and links are resolved to repo paths on the fly.
 */
(function () {
  "use strict";

  var BASE = location.pathname.replace(/\/[^/]*$/, "");
  var REPO = "https://github.com/zademahi238/mission-mimosa";
  var REPO_TREE = REPO + "/tree/main/";

  var ROUTES = {
    "":         { file: "README.md",                              nav: "" },
    "act":      { file: "docs/imitation-learning/ACT.md",         nav: "act" },
    "diffusion":{ file: "docs/imitation-learning/diffusion_policy.md", nav: "diffusion" },
    "bspline":  { file: "docs/imitation-learning/Bspline_policy.md", nav: "bspline" },
    "flexitac": { file: "docs/tactile-sensors/flexitac.md",       nav: "flexitac" },
    "eflesh":   { file: "docs/tactile-sensors/eflesh.md",         nav: "eflesh" }
  };

  var docEl = document.getElementById("doc");
  var tocEl = document.getElementById("toc");
  var contentEl = document.getElementById("content");
  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("scrim");
  var menuToggle = document.getElementById("menu-toggle");
  var themeToggle = document.getElementById("theme-toggle");

  var cache = {};
  var headings = [];
  var scrollSpyRaf = 0;

  var heroVideo = document.getElementById("hero-video");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.autoplay = false;
    try { heroVideo.pause(); } catch (e) {}
  }

  function syncHero(key) {
    if (!heroVideo) return;
    if (key === "" && !reduceMotion) {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      try { heroVideo.pause(); } catch (e) {}
    }
  }

  /* ---------------- Markdown / math setup ---------------- */

  function renderMath(tex, display) {
    if (window.katex) {
      try {
        return window.katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          strict: false
        });
      } catch (e) { /* fall through */ }
    }
    var esc = tex.replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
    return display ? '<pre class="math-fallback">' + esc + "</pre>" : "<code>" + esc + "</code>";
  }

  var mathExtension = {
    extensions: [
      {
        name: "blockMath",
        level: "block",
        start: function (src) { var i = src.indexOf("$$"); return i < 0 ? undefined : i; },
        tokenizer: function (src) {
          var m = /^\$\$([\s\S]+?)\$\$/.exec(src);
          if (m) return { type: "blockMath", raw: m[0], text: m[1].trim() };
        },
        renderer: function (t) {
          return '<div class="math-block">' + renderMath(t.text, true) + "</div>";
        }
      },
      {
        name: "inlineMath",
        level: "inline",
        start: function (src) { var i = src.indexOf("$"); return i < 0 ? undefined : i; },
        tokenizer: function (src) {
          var m = /^\$([^$\n]+?)\$/.exec(src);
          if (m && /[^\s]/.test(m[1])) return { type: "inlineMath", raw: m[0], text: m[1].trim() };
        },
        renderer: function (t) { return renderMath(t.text, false); }
      }
    ]
  };

  if (window.marked && typeof window.marked.use === "function") {
    window.marked.use({ gfm: true, breaks: false });
    window.marked.use(mathExtension);
  }

  /* ---------------- Helpers ---------------- */

  function slugify(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  }

  function resolveAsset(src) {
    if (!src || /^(https?:|data:|#|mailto:)/i.test(src)) return src;
    var i = src.indexOf("assets/");
    if (i >= 0) return BASE + "/" + src.slice(i);
    return src.replace(/^(\.\.\/)+/, BASE + "/");
  }

  function resolveLink(href) {
    if (!href) return href;
    if (/^(https?:|mailto:|#)/i.test(href)) return href;
    // Relative link to a repo file/folder (e.g. ./flexitac from the README)
    return REPO_TREE + href.replace(/^\.\//, "").replace(/^\//, "");
  }

  function decorate(root) {
    // Images / media
    root.querySelectorAll("img").forEach(function (img) {
      var s = img.getAttribute("src");
      img.setAttribute("src", resolveAsset(s));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      if (img.hasAttribute("width")) {
        img.style.maxWidth = img.getAttribute("width") + "px";
        img.removeAttribute("width");
      }
      img.removeAttribute("height");
    });

    // Links
    root.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (/^#/.test(href)) return;
      var resolved = resolveLink(href);
      a.setAttribute("href", resolved);
      if (/^https?:/i.test(resolved)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });

    // Wrap tables for horizontal scroll
    root.querySelectorAll("table").forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("table-wrap")) return;
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // Copy buttons on code blocks
    root.querySelectorAll("pre").forEach(function (pre) {
      if (pre.classList.contains("math-fallback")) return;
      var code = pre.querySelector("code");
      if (!code) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.textContent = "Copied";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1600);
        });
      });
      pre.appendChild(btn);
    });
  }

  function buildToc(root) {
    headings = [];
    tocEl.innerHTML = "";
    var used = {};
    var firstH1 = root.querySelector("h1");
    var nodes = Array.prototype.filter.call(
      root.querySelectorAll("h1, h2, h3"),
      function (h) { return h !== firstH1; }
    );
    if (!nodes.length) { tocEl.hidden = true; return; }
    tocEl.hidden = false;

    var title = document.createElement("p");
    title.className = "toc-title";
    title.textContent = "On this page";
    tocEl.appendChild(title);

    nodes.forEach(function (h) {
      var base = slugify(h.textContent);
      var id = base;
      var n = 2;
      while (used[id]) { id = base + "-" + n++; }
      used[id] = true;
      h.id = id;

      var link = document.createElement("a");
      link.href = "#" + id;
      link.textContent = h.textContent;
      link.className = h.tagName === "H3" ? "lvl-3" : "lvl-2";
      if (h.tagName === "H1") link.classList.add("lvl-1");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        h.scrollIntoView({ block: "start" });
        history.replaceState(null, "", location.pathname + location.search + location.hash);
      });
      tocEl.appendChild(link);
      headings.push({ id: id, el: h, link: link });
    });
  }

  function updateScrollSpy() {
    if (!headings.length) return;
    var offset = 120;
    var current = headings[0];
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].el.getBoundingClientRect().top <= offset) current = headings[i];
      else break;
    }
    headings.forEach(function (h) {
      h.link.classList.toggle("active", h === current);
    });
  }

  function onScroll() {
    if (scrollSpyRaf) return;
    scrollSpyRaf = requestAnimationFrame(function () {
      scrollSpyRaf = 0;
      updateScrollSpy();
    });
  }

  /* ---------------- Routing ---------------- */

  function currentKey() {
    return location.hash.replace(/^#\/?/, "").replace(/[#?].*$/, "").trim();
  }

  function setActiveNav(navKey) {
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === navKey);
    });
  }

  // Render-time normalization only (the source files are never modified):
  // guarantee a blank line around a standalone "---" so it is parsed as a
  // horizontal rule (the authors' clear intent) rather than a setext heading
  // when it directly follows a line of text.
  function normalize(md) {
    return md.replace(/\r\n/g, "\n").replace(/([^\n])\n(-{3,})[ \t]*\n/g, "$1\n\n$2\n\n");
  }

  function fetchDoc(file) {
    if (cache[file]) return Promise.resolve(cache[file]);
    return fetch(BASE + "/" + file, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + file);
      return r.text();
    }).then(function (text) {
      text = normalize(text);
      cache[file] = text;
      return text;
    });
  }

  /* ---------------- Success-rate charts ---------------- */
  // A ```chart <json> fence block is replaced with a theme-aware grouped
  // bar chart, styled to match the π0.5 ablation-chart aesthetic. The block
  // content is the JSON only (any caption after "chart" is consumed by the
  // parser's info string, not the body). JSON is a list of groups:
  //   { "label": "ACT", "bars": [ { "label": "Vision (50 eps)",
  //                                  "value": 80, "series": "Vision" }, ... ] }
  // Each bar may carry a "series" key; bars sharing the same series get the
  // same color across groups, and the legend is built from the series list.

  var CHART_SERIES_CLASSES = [
    "ch-s1", "ch-s2", "ch-s3", "ch-s4", "ch-s5", "ch-s6", "ch-s7", "ch-s8"
  ];

  function buildCharts(root) {
    root.querySelectorAll("pre code.language-chart").forEach(function (code) {
      var pre = code.parentElement;
      var raw = code.textContent.trim();

      var data, err = null;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        err = e;
      }

      var chart = document.createElement("div");
      chart.className = "chart";
      if (err || !isChartData(data)) {
        chart.innerHTML = '<h4 class="chart-error">Unable to render chart — invalid data.</h4>' +
                          '<pre class="chart-raw">' + raw.replace(/[&<>]/g, function (c) {
                            return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
                          }) + "</pre>";
        pre.parentNode.replaceChild(chart, pre);
        return;
      }

      // Normalise the axis to 0..100 by default, extending if any value exceeds it.
      var maxVal = 100;
      data.forEach(function (g) {
        g.bars.forEach(function (b) { if (b.value > maxVal) maxVal = b.value; });
      });
      var ticks = makeTicks(maxVal);

      // Build the legend from the declared series, keeping first-seen order.
      var seriesOrder = [];
      data.forEach(function (g) {
        g.bars.forEach(function (b) {
          if (b.series && seriesOrder.indexOf(b.series) === -1) seriesOrder.push(b.series);
        });
      });
      var legendItems = seriesOrder.map(function (name, i) {
        return '<span class="chart-legend-item"><i class="' +
               CHART_SERIES_CLASSES[i % CHART_SERIES_CLASSES.length] + '"></i>' +
               esc(name) + "</span>";
      }).join("");
      var legend = legendItems
        ? '<div class="chart-legend">' + legendItems + "</div>"
        : "";

      var grid = ticks.map(function (t) {
        return '<span class="chart-tick" style="bottom:' + t.pct + '%">' + t.label + "</span>";
      }).join("");

      var groups = data.map(function (g) {
        var bars = g.bars.map(function (b, i) {
          var pct = (b.value / maxVal) * 100;
          var seriesClass = "";
          if (b.series) {
            var si = seriesOrder.indexOf(b.series);
            if (si >= 0) seriesClass = CHART_SERIES_CLASSES[si % CHART_SERIES_CLASSES.length];
          }
          return '<div class="chart-bar ' + seriesClass + '" style="height:' + pct.toFixed(2) + '%" ' +
                 'role="img" aria-label="' + esc(b.label) + ': ' + b.value + '% success">' +
                 '<span class="chart-val">' + b.value + '%</span>' +
                 '</div>';
        }).join("");
        var barLabels = g.bars.map(function (b) {
          return '<span class="chart-bl">' + esc(b.label) + "</span>";
        }).join("");
        return '<div class="chart-group"><div class="chart-bars">' + bars + "</div>" +
               '<div class="chart-barlabels">' + barLabels + "</div>" +
               '<div class="chart-grouplab">' + esc(g.label) + "</div></div>";
      }).join("");

      chart.innerHTML =
        '<div class="chart-head">' +
          '<span class="chart-title">Success Rate</span>' + legend +
        "</div>" +
        '<div class="chart-body">' +
          '<div class="chart-meta">' + grid + "</div>" +
          '<div class="chart-plot"><div class="chart-groups">' + groups + "</div></div>" +
        "</div>" +
        '<div class="chart-xlabel">Configuration</div>';

      pre.parentNode.replaceChild(chart, pre);
    });
  }

  // Pick "nice" 0-100 axis ticks (100/80/60/40/20/0, or adapt step for maxVal).
  function makeTicks(max) {
    var step, ticks = [], target = 5;
    if (max <= 20) step = 5;
    else if (max <= 50) step = 10;
    else if (max <= 100) step = 100 / target; // 20
    else step = Math.ceil(max / target / 10) * 10;
    for (var v = 0; v <= max; v += step) {
      ticks.push({ pct: (v / max) * 100, label: v + "%" });
    }
    var top = ticks[ticks.length - 1];
    if (top.pct < 100 && top.label !== "100%") {
      ticks.push({ pct: 100, label: max + "%" });
    }
    return ticks;
  }

  function isChartData(d) {
    return Array.isArray(d) && d.length && d.every(function (g) {
      return g && typeof g.label === "string" && Array.isArray(g.bars) &&
             g.bars.every(function (b) {
               return b && typeof b.label === "string" && typeof b.value === "number";
             });
    });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var rawKey = currentKey();
    var key = ROUTES[rawKey] ? rawKey : "";
    var route = ROUTES[key];
    setActiveNav(route.nav);
    closeMenu();

    document.body.setAttribute("data-route", key);
    syncHero(key);

    docEl.innerHTML = '<p class="doc-loading">Loading…</p>';
    tocEl.hidden = true;

    fetchDoc(route.file).then(function (md) {
      docEl.innerHTML = window.marked.parse(md);
      decorate(docEl);
      buildCharts(docEl);
      buildToc(docEl);

      var h1 = docEl.querySelector("h1");
      var h1t = h1 ? h1.textContent.trim() : "";
      document.title = (h1t && h1t !== "Mission Mimosa") ? h1t + " — Mission Mimosa" : "Mission Mimosa";

      contentEl.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      updateScrollSpy();
    }).catch(function (err) {
      docEl.innerHTML =
        '<h1>Unable to load this page</h1>' +
        '<p class="doc-error">' + String(err.message || err) + '</p>' +
        '<p>You can read this document directly on ' +
        '<a href="' + REPO + '" target="_blank" rel="noopener">GitHub</a>.</p>';
      console.error(err);
    });
  }

  /* ---------------- Mobile menu ---------------- */

  function openMenu() {
    sidebar.classList.add("open");
    scrim.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    sidebar.classList.remove("open");
    scrim.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) closeMenu(); else openMenu();
  });
  scrim.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
  sidebar.addEventListener("click", function (e) {
    if (e.target.classList.contains("nav-link")) closeMenu();
  });

  /* ---------------- Theme ---------------- */

  function storedTheme() {
    try { return localStorage.getItem("mm-theme"); } catch (e) { return null; }
  }
  function effectiveTheme() {
    var s = storedTheme();
    if (s === "light" || s === "dark") return s;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyStoredTheme() {
    var s = storedTheme();
    if (s === "light" || s === "dark") document.documentElement.setAttribute("data-theme", s);
    else document.documentElement.removeAttribute("data-theme");
  }
  themeToggle.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("mm-theme", next); } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
  });
  applyStoredTheme();

  /* ---------------- Init ---------------- */

  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!location.hash) location.replace("#/");
  render();
})();
