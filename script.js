/* ==========================================================
   Portfolio — interactions
   Theme, scroll progress, header state, nav, reveals.
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector("[data-header]");
  var progressBar = document.querySelector(".scroll-progress__bar");
  var themeToggle = document.querySelector("[data-theme-toggle]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-nav");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme ---------- */
  function currentTheme() {
    return root.getAttribute("data-theme") || "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#171914" : "#f7f5f0");
  }

  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("kc-theme", next); } catch (e) { /* storage unavailable */ }
    });
  }

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  var onSystemChange = function (e) {
    var saved = null;
    try { saved = localStorage.getItem("kc-theme"); } catch (err) { /* ignore */ }
    if (!saved) applyTheme(e.matches ? "dark" : "light");
  };
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemChange);
  else if (systemDark.addListener) systemDark.addListener(onSystemChange);

  /* ---------- Navigation targets ---------- */
  var navTargets = nav
    ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'))
        .map(function (link) {
          return { link: link, el: document.getElementById(link.getAttribute("href").slice(1)) };
        })
        .filter(function (t) { return t.el; })
    : [];

  function updateActiveLink() {
    if (!navTargets.length) return;
    var y = window.scrollY || 0;
    var marker = y + Math.max(150, window.innerHeight * 0.3);
    var active = navTargets[0];

    navTargets.forEach(function (t) {
      if (t.el.getBoundingClientRect().top + y <= marker) active = t;
    });

    if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      active = navTargets[navTargets.length - 1];
    }

    navTargets.forEach(function (t) {
      t.link.classList.toggle("is-active", t === active);
    });
  }

  /* ---------- Scroll progress + header state ---------- */
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(y / docHeight, 1) : 0;

    if (progressBar) progressBar.style.transform = "scaleX(" + pct + ")";
    if (header) header.classList.toggle("is-scrolled", y > 20);

    updateActiveLink();
    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  onScroll();

  /* ---------- Mobile navigation ---------- */
  function setNav(open) {
    if (!header || !navToggle) return;
    header.classList.toggle("is-nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setNav(!header.classList.contains("is-nav-open"));
    });
  }

  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
  }

  document.addEventListener("click", function (e) {
    if (header && !header.contains(e.target)) setNav(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  /* ---------- Scroll reveal ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (revealItems.length) {
    if (!("IntersectionObserver" in window) || prefersReduced.matches) {
      revealItems.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (child) {
              return child.hasAttribute && child.hasAttribute("data-reveal");
            });
            var index = Math.max(siblings.indexOf(el), 0);
            el.style.transitionDelay = Math.min(index * 0.08, 0.3) + "s";
            el.classList.add("is-visible");
            observer.unobserve(el);
          });
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
      );
      revealItems.forEach(function (el) { revealObserver.observe(el); });
    }
  }
})();
