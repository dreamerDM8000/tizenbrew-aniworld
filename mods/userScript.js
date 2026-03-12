/**
 * AniWorld TizenBrew Module
 * Injiziert in https://aniworld.to
 */

(function () {
  "use strict";

  // --- Tastencodes Samsung Tizen Fernbedienung ---
  const KEYS = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13,
    BACK: 10009,
    RETURN: 10182,
    PLAY: 415,
    PAUSE: 19,
    PLAY_PAUSE: 10252,
    STOP: 413,
    FF: 417,
    RW: 412,
  };

  // Tizen Tasten registrieren
  if (window.tizen && window.tizen.tvinputdevice) {
    try {
      tizen.tvinputdevice.registerKeyBatch([
        "MediaPlayPause",
        "MediaPlay",
        "MediaPause",
        "MediaStop",
        "MediaFastForward",
        "MediaRewind",
      ]);
    } catch (e) {
      console.warn(
        "[AniWorld] Tizen Tasten konnten nicht registriert werden:",
        e,
      );
    }
  }

  // --- Ad / Redirect Blocker ---

  const ALLOWED_HOSTS = ["aniworld.to", "www.aniworld.to"];

  function isExternalLink(url) {
    if (!url || url.startsWith("#") || url.startsWith("javascript:"))
      return false;
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        return false;
      return !ALLOWED_HOSTS.includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  // Klick-Weiterleitungen blockieren (capture phase = vor allem anderen)
  document.addEventListener(
    "click",
    function (e) {
      let target = e.target;
      while (target && target !== document) {
        if (target.tagName === "A" && target.href) {
          if (isExternalLink(target.href)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("[AniWorld] Blockiert:", target.href);
            return;
          }
        }
        target = target.parentElement;
      }
    },
    true,
  );

  // Popup-Ads blockieren
  window.open = function (url) {
    if (url && isExternalLink(url)) {
      console.log("[AniWorld] window.open blockiert:", url);
      return null;
    }
  };

  // location.replace Manipulationen blockieren
  try {
    const _replace = location.replace.bind(location);
    location.replace = function (url) {
      if (isExternalLink(url)) {
        console.log("[AniWorld] location.replace blockiert:", url);
        return;
      }
      return _replace(url);
    };
  } catch (e) {}

  // history.pushState Weiterleitungen blockieren
  const _pushState = history.pushState.bind(history);
  history.pushState = function (state, title, url) {
    if (url && isExternalLink(String(url))) {
      console.log("[AniWorld] pushState blockiert:", url);
      return;
    }
    return _pushState(state, title, url);
  };

  // --- Fokus-Navigation ---

  const FOCUSABLE_SELECTORS = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[tabindex]:not([tabindex="-1"])',
    ".hosterSiteVideo",
    ".hosterSite",
    ".episode-item",
    ".seriesImg",
    ".seasonEpisodesList a",
    ".hostTable a",
  ].join(", ");

  let focusableElements = [];
  let currentIndex = 0;

  function refreshFocusable() {
    focusableElements = Array.from(
      document.querySelectorAll(FOCUSABLE_SELECTORS),
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function applyFocus(index) {
    document.querySelectorAll(".__aw_focused").forEach((el) => {
      el.classList.remove("__aw_focused");
    });

    if (!focusableElements[index]) return;

    currentIndex = index;
    const el = focusableElements[index];
    el.classList.add("__aw_focused");
    el.focus({ preventScroll: false });
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  function findNearest(direction) {
    const current = focusableElements[currentIndex];
    if (!current) return currentIndex;

    const curRect = current.getBoundingClientRect();
    const curCX = curRect.left + curRect.width / 2;
    const curCY = curRect.top + curRect.height / 2;

    let bestIndex = -1;
    let bestScore = Infinity;

    focusableElements.forEach((el, i) => {
      if (i === currentIndex) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - curCX;
      const dy = cy - curCY;

      let isCandidate = false;
      switch (direction) {
        case "UP":
          isCandidate = dy < -5;
          break;
        case "DOWN":
          isCandidate = dy > 5;
          break;
        case "LEFT":
          isCandidate = dx < -5;
          break;
        case "RIGHT":
          isCandidate = dx > 5;
          break;
      }

      if (!isCandidate) return;

      const primary =
        direction === "UP" || direction === "DOWN"
          ? Math.abs(dy)
          : Math.abs(dx);
      const secondary =
        direction === "UP" || direction === "DOWN"
          ? Math.abs(dx)
          : Math.abs(dy);
      const score = primary + secondary * 2;

      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    // Fallback: wenn nichts in der Richtung gefunden, einfach weiter/zurück in der Liste
    if (bestIndex === -1) {
      if (direction === "DOWN" || direction === "RIGHT") {
        return Math.min(currentIndex + 1, focusableElements.length - 1);
      } else {
        return Math.max(currentIndex - 1, 0);
      }
    }

    return bestIndex;
  }

  function getVideo() {
    return document.querySelector("video");
  }

  function seekVideo(seconds) {
    const v = getVideo();
    if (v) v.currentTime = Math.max(0, v.currentTime + seconds);
  }

  document.addEventListener(
    "keydown",
    function (e) {
      refreshFocusable();

      switch (e.keyCode) {
        case KEYS.UP:
          e.preventDefault();
          applyFocus(findNearest("UP"));
          break;
        case KEYS.DOWN:
          e.preventDefault();
          applyFocus(findNearest("DOWN"));
          break;
        case KEYS.LEFT:
          e.preventDefault();
          if (getVideo() && !getVideo().paused) {
            seekVideo(-10);
          } else {
            applyFocus(findNearest("LEFT"));
          }
          break;
        case KEYS.RIGHT:
          e.preventDefault();
          if (getVideo() && !getVideo().paused) {
            seekVideo(10);
          } else {
            applyFocus(findNearest("RIGHT"));
          }
          break;
        case KEYS.ENTER:
          if (focusableElements[currentIndex]) {
            e.preventDefault();
            focusableElements[currentIndex].click();
          }
          break;
        case KEYS.BACK:
        case KEYS.RETURN: {
          e.preventDefault();
          const video = getVideo();
          if (video && !video.paused) {
            video.pause();
          } else {
            history.back();
          }
          break;
        }
        case KEYS.PLAY:
        case KEYS.PAUSE:
        case KEYS.PLAY_PAUSE: {
          const v = getVideo();
          if (v) {
            e.preventDefault();
            v.paused ? v.play() : v.pause();
          }
          break;
        }
        case KEYS.STOP: {
          const v = getVideo();
          if (v) {
            e.preventDefault();
            v.pause();
            v.currentTime = 0;
          }
          break;
        }
        case KEYS.FF:
          e.preventDefault();
          seekVideo(30);
          break;
        case KEYS.RW:
          e.preventDefault();
          seekVideo(-10);
          break;
      }
    },
    true,
  );

  // --- CSS ---

  const style = document.createElement("style");
  style.textContent = `
    * { cursor: none !important; }

    .__aw_focused {
      outline: 2px solid rgba(100, 180, 255, 0.8) !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 8px rgba(100, 180, 255, 0.35) !important;
      transition: outline 0.1s ease, box-shadow 0.1s ease !important;
      border-radius: 4px !important;
    }
  `;
  document.head.appendChild(style);

  // --- Init ---

  function init() {
    refreshFocusable();
    if (focusableElements.length > 0) applyFocus(0);
    console.log("[AniWorld TizenBrew] Geladen ✅");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  const observer = new MutationObserver(() => {
    setTimeout(refreshFocusable, 500);
  });

  const observeBody = () =>
    observer.observe(document.body, { childList: true, subtree: true });
  document.body
    ? observeBody()
    : document.addEventListener("DOMContentLoaded", observeBody);
})();
