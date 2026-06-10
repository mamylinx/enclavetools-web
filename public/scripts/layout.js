(function () {
  // Navigation & UI Management
  let previousScrollPosition = 0;
  let pageCTAPosition = 0;

  const handleNavScroll = () => {
    const nav = document.querySelector(".floating-nav");
    if (!nav) return;

    const currentScrolledPosition = window.scrollY || window.pageYOffset;
    const scrollingDown = currentScrolledPosition > previousScrollPosition;

    if (scrollingDown) {
      nav.classList.add("scroll-down");
      nav.classList.remove("scroll-up");
    } else {
      nav.classList.add("scroll-up");
      nav.classList.remove("scroll-down");
    }

    if (currentScrolledPosition > pageCTAPosition + 50) {
      nav.classList.add("is-active");
    } else {
      nav.classList.remove("is-active");
    }
    previousScrollPosition = currentScrolledPosition;
  };

  function throttle(callback, delay) {
    let waiting = false;
    return function () {
      if (waiting) return;
      waiting = true;
      callback();
      setTimeout(() => {
        waiting = false;
      }, delay);
    };
  }

  const updateFavoritesLink = () => {
    try {
      const linkEl = document.getElementById("favoritesLink");
      const countEl = document.getElementById("favoritesCount");
      const mobileLinkEl = document.getElementById("mobileFavoritesLink");
      const mobileCountEl = document.getElementById("mobileFavoritesCount");

      const bookmarksString = localStorage.getItem("rom_bookmarks");
      const count = bookmarksString ? JSON.parse(bookmarksString).length : 0;

      if (linkEl && countEl) {
        if (count > 0) {
          linkEl.style.display = "inline-flex";
          countEl.textContent = count;
        } else {
          linkEl.style.display = "none";
          countEl.textContent = "";
        }
      }
      if (mobileLinkEl && mobileCountEl) {
        if (count > 0) {
          mobileLinkEl.style.display = "block";
          mobileCountEl.textContent = count;
        } else {
          mobileLinkEl.style.display = "none";
          mobileCountEl.textContent = "";
        }
      }
    } catch (e) {}
  };

  // Create throttled scroll handler once
  const throttledNavScroll = throttle(handleNavScroll, 80);

  // Core Initialization (Runs on every page load including initial)
  const init = () => {
    // Handle Nav & CTA positions
    const nav = document.querySelector(".floating-nav");
    const pageCTA = document.querySelector(".floating-nav .submit-btn");
    if (pageCTA) {
      pageCTAPosition = pageCTA.getBoundingClientRect().bottom;
    }

    // New Tools Filter Toggle - Idempotent listener
    const newFilterToggle = document.querySelector("#new-filter-toggle");
    if (newFilterToggle) {
      if (!newFilterToggle._hasFilterListener) {
        newFilterToggle.addEventListener("click", () => {
          const isPressed =
            newFilterToggle.getAttribute("aria-pressed") === "true";
          newFilterToggle.setAttribute("aria-pressed", !isPressed);
          window.dispatchEvent(
            new CustomEvent("tools:filter-new", {
              detail: { filterNew: !isPressed },
            }),
          );
        });
        newFilterToggle._hasFilterListener = true;
      }
    }

    // Path-specific attributes
    if (window.location.pathname.startsWith("/tools/")) {
      document.documentElement.setAttribute("data-tool-page", "true");
      // Ensure body is ready before setting attribute
      if (document.body) {
        document.body.setAttribute("data-modal-open", "true");
      }
    } else {
      document.documentElement.removeAttribute("data-tool-page");
      if (document.body) {
        document.body.removeAttribute("data-modal-open");
      }
    }

    // Highlight active category in mega menu
    const path = window.location.pathname;
    let activeCategory = "all";
    if (
      path.startsWith("/") &&
      path !== "/" &&
      !path.startsWith("/tools/") &&
      !path.startsWith("/saved") &&
      !path.startsWith("/privacy") &&
      !path.startsWith("/terms")
    ) {
      activeCategory = path.replace(/^\//, "").split("/")[0];
    }
    document.querySelectorAll(".category-grid-item").forEach((item) => {
      if (item.dataset.category === activeCategory) {
        item.classList.add("active");
      }
    });

    updateFavoritesLink();

    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const mobileDropdown = document.getElementById("mobileDropdown");
    if (hamburgerBtn && mobileDropdown && !hamburgerBtn._hasListener) {
      hamburgerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = mobileDropdown.classList.contains("opacity-100");
        mobileDropdown.classList.toggle("opacity-0");
        mobileDropdown.classList.toggle("invisible");
        mobileDropdown.classList.toggle("-translate-y-1");
        mobileDropdown.classList.toggle("opacity-100");
        mobileDropdown.classList.toggle("visible");
        mobileDropdown.classList.toggle("translate-y-0");
        hamburgerBtn.setAttribute("aria-expanded", !isOpen);
      });
      hamburgerBtn._hasListener = true;
    }

    // Mobile Search Toggle
    const mobileSearchBtn = document.getElementById("mobileSearchBtn");
    const mobileSearchPanel = document.getElementById("mobileSearchPanel");
    if (mobileSearchBtn && mobileSearchPanel && !mobileSearchBtn._hasListener) {
      mobileSearchBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = mobileSearchPanel.classList.contains("max-h-[200px]");
        if (isOpen) {
          mobileSearchPanel.classList.remove("max-h-[200px]", "overflow-visible");
          mobileSearchPanel.classList.add("max-h-0", "overflow-hidden");
        } else {
          mobileSearchPanel.classList.remove("max-h-0", "overflow-hidden");
          mobileSearchPanel.classList.add("max-h-[200px]", "overflow-visible");
        }
      });
      mobileSearchBtn._hasListener = true;
    }

    const mobileNewFilter = document.getElementById("mobileNewFilterToggle");
    if (mobileNewFilter && !mobileNewFilter._hasListener) {
      mobileNewFilter.addEventListener("click", () => {
        const isPressed =
          mobileNewFilter.getAttribute("aria-pressed") === "true";
        mobileNewFilter.setAttribute("aria-pressed", !isPressed);
        const desktopToggle = document.getElementById("new-filter-toggle");
        if (desktopToggle)
          desktopToggle.setAttribute("aria-pressed", !isPressed);
        window.dispatchEvent(
          new CustomEvent("tools:filter-new", {
            detail: { filterNew: !isPressed },
          }),
        );
        mobileDropdown.classList.remove(
          "opacity-100",
          "visible",
          "translate-y-0",
        );
        mobileDropdown.classList.add(
          "opacity-0",
          "invisible",
          "-translate-y-1",
        );
        hamburgerBtn.setAttribute("aria-expanded", "false");
      });
      mobileNewFilter._hasListener = true;
    }

    document.addEventListener("click", (e) => {
      const target = e.target;
      const inMobileDropdown = mobileDropdown && mobileDropdown.contains(target);
      const inMobileBtns = target.closest && target.closest("#hamburgerBtn, #mobileSearchBtn") !== null;
      const inSearchPanel = mobileSearchPanel && mobileSearchPanel.contains(target);

      // Close mobile dropdown when clicking outside the hamburger area
      if (!inMobileDropdown && !inMobileBtns) {
        if (mobileDropdown && mobileDropdown.classList.contains("opacity-100")) {
          mobileDropdown.classList.remove(
            "opacity-100",
            "visible",
            "translate-y-0",
          );
          mobileDropdown.classList.add(
            "opacity-0",
            "invisible",
            "-translate-y-1",
          );
          hamburgerBtn.setAttribute("aria-expanded", "false");
        }
      }

      // Close mobile search when clicking outside search panel and buttons
      if (!inSearchPanel && !inMobileBtns) {
        if (mobileSearchPanel && mobileSearchPanel.classList.contains("max-h-[200px]")) {
          mobileSearchPanel.classList.remove("max-h-[200px]", "overflow-visible");
          mobileSearchPanel.classList.add("max-h-0", "overflow-hidden");
        }
      }
    });
  };

  // Scroll Restoration
  history.scrollRestoration = "manual";
  window.onbeforeunload = () => window.scrollTo(0, 0);

  // Global Event Listeners (ensure single attachment)
  if (!window.__rom_initialized) {
    window.addEventListener("scroll", throttledNavScroll);
    window.addEventListener("bookmarks:changed", updateFavoritesLink);
    window.addEventListener("pageshow", updateFavoritesLink);
    document.addEventListener("astro:page-load", () => {
      init();
    });
    window.__rom_initialized = true;
  }

  // Initial run for the current page
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }
})();
