import "./spatial_navigation.js";

(function () {
  "use strict";

  const FOCUS_STYLE = `
    :focus {
      outline: 4px solid #FF6600 !important;
      outline-offset: 3px;
      box-shadow: 0 0 12px rgba(255,102,0,0.8) !important;
      z-index: 9999;
    }
    .main-header,
    .header-container,
    .header-content,
    .logo-wrapper,
    .primary-navigation,
    .primary-navigation > ul,
    .primary-navigation > ul > li {
      overflow: visible !important;
      z-index: 9998 !important;
    }
    .avatar {
      overflow: visible !important;
    }
    .avatar a:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    .avatar img {
      border-radius: 50%;
    }
  `;

  function initNavigation() {
    const style = document.createElement("style");
    style.textContent = FOCUS_STYLE;
    document.head.appendChild(style);

    window.addEventListener("keydown", function (e) {
      if (e.keyCode === 10009) {
        if (window.history.length > 1) {
          window.history.back();
        } else if (typeof tizen !== "undefined") {
          tizen.application.getCurrentApplication().exit();
        }
      }
    });

    setupSections();
  }

  function setupSections() {
    const SN = window.SpatialNavigation;
    const path = window.location.pathname;
    const host = window.location.hostname;
    const parts = path.split("/");
    SN.init();

    // Avatar
    const avatarLink = document.querySelector(".avatar > a");
    if (avatarLink) {
      const img = avatarLink.querySelector("img");
      avatarLink.addEventListener("focus", function () {
        img.setAttribute("style", "box-shadow: 0 0 0 4px #FF6600;");
      });
      avatarLink.addEventListener("blur", function () {
        img.removeAttribute("style");
      });
    }

    //TODO: User Dropdown
    // =======================
    // User Dropdown FIX
    // =======================

    const dd = document.querySelector(".dd");

    if (dd) {
      const p = dd.querySelector("p");

      if (p) {
        const a = p.querySelector("a");
        if (a) {
          dd.insertBefore(a, p); // <a> vor <p> setzen
          p.remove(); // <p> löschen
        }
      }

      // Danach normal weitermachen
      const ddTrigger = dd.querySelector("a");
      const ddModal = dd.querySelector(".modal");

      if (ddTrigger && ddModal) {
        ddTrigger.setAttribute("tabindex", "-1");
        ddTrigger.setAttribute("href", "#");

        ddModal.querySelectorAll("a").forEach((link) => {
          link.setAttribute("tabindex", "-1");
        });

        ddModal.style.display = "none";

        dd.addEventListener("focusin", function () {
          ddModal.style.display = "block";
          ddModal.style.zIndex = "99999";
        });

        dd.addEventListener("focusout", function () {
          setTimeout(() => {
            if (!dd.contains(document.activeElement)) {
              ddModal.style.display = "none";
            }
          }, 50);
        });
      }
    }

    // "mehr" Dropdown
    const mehrLi = Array.from(
      document.querySelectorAll(".primary-navigation > ul > li"),
    ).find((li) => li.querySelector(":scope > strong"));

    if (mehrLi) {
      const strong = mehrLi.querySelector("strong");
      const mehrUl = mehrLi.querySelector("ul");
      strong.setAttribute("tabindex", "-1");

      mehrLi.addEventListener("focusin", function () {
        mehrUl.style.display = "block";
        mehrUl.style.zIndex = "99999";
      });

      mehrLi.addEventListener("focusout", function () {
        setTimeout(() => {
          if (!mehrLi.contains(document.activeElement)) {
            mehrUl.style.display = "";
            mehrUl.style.zIndex = "";
          }
        }, 50);
      });
    }

    // menuSearchButton
    const menuSearchButton = document.querySelector(".menuSearchButton");
    if (menuSearchButton) {
      menuSearchButton.setAttribute("tabindex", "-1");
      menuSearchButton.addEventListener("keydown", function (e) {
        if (e.keyCode === 13) menuSearchButton.click();
      });
    }

    // liveNewsFeed
    const liveNewsFeed = document.querySelector(".liveNewsFeed");
    if (liveNewsFeed) {
      const button = liveNewsFeed.querySelector(".liveNewsFeedButton");
      const section = liveNewsFeed.querySelector(".liveNewsFeedSection");
      button.setAttribute("tabindex", "-1");

      liveNewsFeed.addEventListener("focusin", function () {
        section.style.display = "block";
      });

      liveNewsFeed.addEventListener("focusout", function () {
        setTimeout(() => {
          if (!liveNewsFeed.contains(document.activeElement)) {
            section.style.display = "none";
          }
        }, 50);
      });
    }

    // Header (alle Seiten)
    SN.add({
      id: "header",
      selector: [
        // ".primary-navigation > ul > li > a",
        // ".primary-navigation > ul > li > strong",
        // ".primary-navigation > ul > li > ul > li > a",
        // ".offset-navigation.extraPadding > a",
        // ".menuSearchButton",
        // ".liveNewsFeedButton",
        // ".liveNewsFeedContent a",
        // "[href='/account/notifications']",
        ".avatar > a",
        ".dd > a",
        "a[href='#']",
        ".dd .modal > ul > li > a",
      ].join(", "),
      restrict: "none",
    });
    SN.makeFocusable();

    // direkt auf User gehen
    SN.focus(".dd > a");

    if (host !== "aniworld.to") {
      SN.makeFocusable();
      SN.focus();
      return;
    }

    if (path === "/") {
      const container = document.querySelector(".container");
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 80px 20px; color: #fff;">
            <h2 style="font-size: 28px; margin-bottom: 20px;">AniWorld</h2>
            <p style="font-size: 18px; color: #aaa;">
              Die Hauptseite ist vorerst nicht verfügbar.<br>
              Bitte navigiere über die Kopfzeile oder die Fußzeile oder über die WatchList.
            </p>
          </div>
        `;
      }
    } else if (path === "/registrierung") {
      const accountFeatures = document.querySelector(".accountFeatures");
      if (accountFeatures) {
        accountFeatures.innerHTML = `
          <div style="text-align: center; padding: 80px 20px; color: #fff;">
            <h2 style="font-size: 28px; margin-bottom: 20px;">Registrierung</h2>
            <p style="font-size: 18px; color: #aaa;">
              Bitte registriere dich über ein anderes Gerät<br>(PC, Smartphone oder Tablet).
            </p>
          </div>
        `;
      }
    } else if (path === "/login") {
      const icheckHelper = document.querySelector(".iCheck-helper");
      if (icheckHelper) {
        icheckHelper.setAttribute("tabindex", "-1");

        icheckHelper.addEventListener("keydown", function (e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            icheckHelper.click();
            setTimeout(() => icheckHelper.focus(), 50);
          }
        });

        icheckHelper.addEventListener("focus", function () {
          icheckHelper.closest(".icheckbox_square-blue").style.outline =
            "4px solid #FF6600";
        });

        icheckHelper.addEventListener("blur", function () {
          icheckHelper.closest(".icheckbox_square-blue").style.outline = "";
        });

        SN.add({
          id: "login",
          selector: [
            ".col-md-4 > form > input",
            ".iCheck-helper",
            ".col-md-4 > form > a",
          ].join(", "),
        });
      }
    } else if (path === "/account") {
      SN.add({
        id: "account",
        selector: [".close a", ".reviewList.row > li > a"].join(", "),
      });
    } else if (
      path === "/account/watchlist" ||
      path === "/account/watchlist/asc" ||
      path === "/account/watchlist/desc"
    ) {
      SN.add({
        id: "watchlist",
        selector: [
          ".breadCrumbMenu.cf > li > a",
          ".seriesListNavigation > a",
          ".seriesListContainer.row a",
        ].join(", "),
      });
    } else if (path.startsWith("/anime/stream/")) {
      const hasEpisode = parts.some((p) => p.startsWith("episode-"));
      const hasFilm = parts.some((p) => p.startsWith("film-"));

      if (hasEpisode || hasFilm) {
        SN.add({
          id: "player",
          selector: ".cf.breadCrumbMenu.dark > li > a",
        });
      } else {
        const snId = parts.length === 4 ? "anime-main" : "anime-season";

        SN.add({
          id: snId,
          selector: [
            ".cf.breadCrumbMenu.dark > li > a",
            ".hosterSiteDirectNav > ul > li > a",
            ".normalDropdownButton",
            "div > a[href='/']",
            ".normalDropdown > .clearAllEpisodesFromThisSeason",
            "tbody > tr > td > a",
            ".episodeMenu",
          ].join(", "),
        });

        // Staffel gesehen Dropdown
        const watched = document.querySelector(".normalDropdownButton");
        if (watched) {
          const watchedModal = document.querySelector(".normalDropdown");
          if (watchedModal) {
            const hideWatchedModal = () => {
              setTimeout(() => {
                if (
                  !watched.contains(document.activeElement) &&
                  !watchedModal.contains(document.activeElement)
                ) {
                  watchedModal.style.display = "none";
                }
              }, 50);
            };

            watched.addEventListener("focusin", () => {
              watchedModal.style.display = "block";
            });
            watched.addEventListener("focusout", hideWatchedModal);
            watchedModal.addEventListener("focusout", hideWatchedModal);

            watchedModal
              .querySelectorAll(".clearAllEpisodesFromThisSeason")
              .forEach((item) => {
                item.setAttribute("tabindex", "-1");
                item.addEventListener("keydown", (e) => {
                  if (e.keyCode === 13) item.click();
                });
              });
          }
        }

        // Episode gesehen Toggle
        document.querySelectorAll(".episodeMenu").forEach((seen) => {
          seen.setAttribute("tabindex", "-1");
          seen.addEventListener("keydown", (e) => {
            if (e.keyCode === 13) seen.click();
          });
        });
      }
    } else if (path.startsWith("/search?")) {
    }

    SN.add({
      id: "footer",
      selector: ".footer-container > div > ul > li > a",
    });

    SN.makeFocusable();
    SN.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavigation);
  } else {
    initNavigation();
  }
})();
