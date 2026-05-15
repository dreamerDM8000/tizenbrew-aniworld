import "./spatial_navigation.js";

(function () {
  window.SCRIPT_VERSION = "1.0.6";
  console.log(SCRIPT_VERSION);

  if (window.__ANIWORLD_NAV_INITIALIZED__) {
    console.log("Navigation bereits initialisiert");
    return;
  }

  window.__ANIWORLD_NAV_INITIALIZED__ = true;

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
    #searchAutocomplete > li > a:focus {
    outline-offset: -4px !important;
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
          SN.uninit();
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
    SN.init();
    SN.clear();
    document.querySelector(".menuSearchButton")?.setAttribute("tabindex", "0");
    document
      .querySelector(".liveNewsFeedButton")
      ?.setAttribute("tabindex", "0");
    document.querySelector(".dd > p > a")?.setAttribute("tabindex", "0");

    document.querySelectorAll("a[target='_blank']").forEach((a) => {
      a.removeAttribute("target");
    });

    // "mehr" Dropdown
    const mehrStrong = document.querySelector(
      ".primary-navigation > ul > li > strong",
    );

    if (mehrStrong) {
      const mehrLi = mehrStrong.parentElement;
      const mehrUl = mehrLi.querySelector("ul");

      mehrStrong.addEventListener("focus", function () {
        Object.assign(mehrUl.style, {
          display: "block",
          position: "absolute",
          width: "150px",
          borderRadius: "5px",
          paddingTop: "15px",
          zIndex: "99999",
          left: "-25px",
        });

        SN.remove("mehr-dropdown");
        SN.add({
          id: "mehr-dropdown",
          selector: ".primary-navigation > ul > li > ul > li > a",
          tabIndexIgnoreList: "",
        });
        SN.makeFocusable("mehr-dropdown");
      });

      mehrLi.addEventListener("focusout", function () {
        setTimeout(() => {
          if (!mehrLi.contains(document.activeElement)) {
            mehrUl.removeAttribute("style");
            SN.remove("mehr-dropdown");
          }
        }, 50);
      });
    }
    //=======================

    // menuSearchButton
    const menuSearchButton = document.querySelector(".menuSearchButton");
    if (menuSearchButton) {
      menuSearchButton.addEventListener("keydown", function (e) {
        if (e.keyCode !== 13) return;

        document.addEventListener(
          "submit",
          function b(ev) {
            ev.preventDefault();
            document.removeEventListener("submit", b, true);
          },
          true,
        );

        menuSearchButton.click();

        setTimeout(() => {
          if (!document.querySelector("#inputSearch")) return;
          SN.remove("search-area");
          SN.add({
            id: "search-area",
            selector:
              "#inputSearch, .searchContainer button, #searchAutocomplete > li > a",
            tabIndexIgnoreList: "",
          });
          SN.makeFocusable("search-area");
          SN.focus("search-area");
        }, 100);
      });
    }
    // =======================

    // liveNewsFeed
    const liveNewsFeed = document.querySelector(".liveNewsFeed");
    if (liveNewsFeed) {
      const button = liveNewsFeed.querySelector(".liveNewsFeedButton");

      button.addEventListener("keydown", function (e) {
        if (e.keyCode !== 13) return;
        button.click();

        setTimeout(() => {
          const section = liveNewsFeed.querySelector(".liveNewsFeedSection");
          if (!section) return;

          const items = [
            ...section.querySelectorAll(".liveNewsFeedContent > li > a"),
            section.querySelector("[href='/account/notifications']"),
          ].filter(Boolean);

          items.forEach((a) => a.setAttribute("tabindex", "-1"));
          let i = 0;

          function cleanup(reenter = false) {
            section.removeEventListener("keydown", nav);
            items.forEach((a) => a.setAttribute("tabindex", "-1"));
            if (reenter) button.addEventListener("keydown", enterBox);
            button.focus();
          }

          function nav(e) {
            if (e.keyCode === 40) {
              if (i < items.length - 1) {
                e.preventDefault();
                items[++i].focus();
              } else cleanup();
            } else if (e.keyCode === 38) {
              if (i <= 0) cleanup(true);
              else {
                e.preventDefault();
                items[--i].focus();
              }
            } else if (e.keyCode === 37 || e.keyCode === 39) {
              cleanup();
            } else if (e.keyCode === 10009 || e.keyCode === 27) {
              cleanup(true);
            }
          }

          function enterBox(e) {
            if (e.keyCode !== 40) return;
            e.preventDefault();
            e.stopPropagation();
            i = 0;
            items.forEach((a) => a.setAttribute("tabindex", "0"));
            items[0].focus();
            button.removeEventListener("keydown", enterBox);
            section.addEventListener("keydown", nav);
          }

          button.addEventListener("keydown", enterBox);
        }, 300);
      });

      liveNewsFeed.addEventListener("focusout", function () {
        setTimeout(() => {
          if (!liveNewsFeed.contains(document.activeElement)) {
            const section = liveNewsFeed.querySelector(".liveNewsFeedSection");
            if (section) {
              section.style.display = "none";
              section.dataset.activeStatus = "0";
            }
          }
        }, 80);
      });
    }
    // =======================

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
    //=======================

    // Avatar <-> Profil Navigation Fix
    const avatar = document.querySelector(".avatar > a");
    const profile = document.querySelector(".dd > p > a");

    if (avatar && profile) {
      avatar.setAttribute("data-sn-right", ".dd > p > a");
      profile.setAttribute("data-sn-left", ".avatar > a");
    }

    // User Dropdown
    const dd = document.querySelector(".dd");
    if (dd) {
      const trigger = dd.querySelector("p > a");
      const modal = dd.querySelector(".modal");

      trigger.addEventListener("focus", function () {
        modal.style.display = "block";

        const items = [...modal.querySelectorAll("ul > li > a")];
        items.forEach((a) => a.setAttribute("tabindex", "-1"));
        let i = 0;

        function cleanup(reenter = false) {
          modal.removeEventListener("keydown", nav);
          items.forEach((a) => a.setAttribute("tabindex", "-1"));
          if (reenter) trigger.addEventListener("keydown", enterBox);
          trigger.focus();
        }

        function nav(e) {
          if (e.keyCode === 40) {
            if (i < items.length - 1) {
              e.preventDefault();
              items[++i].focus();
            } else cleanup();
          } else if (e.keyCode === 38) {
            if (i <= 0) cleanup(true);
            else {
              e.preventDefault();
              items[--i].focus();
            }
          } else if (e.keyCode === 37 || e.keyCode === 39) {
            cleanup();
          } else if (e.keyCode === 10009 || e.keyCode === 27) {
            cleanup(true);
          }
        }

        function enterBox(e) {
          if (e.keyCode !== 40) return;

          e.preventDefault();
          e.stopPropagation();

          i = 0;

          items.forEach((a) => a.setAttribute("tabindex", "0"));

          items[0].focus();

          trigger.removeEventListener("keydown", enterBox);

          modal.addEventListener("keydown", nav);
        }

        trigger.removeEventListener("keydown", enterBox);
        trigger.addEventListener("keydown", enterBox);
      });

      dd.addEventListener("focusout", function () {
        setTimeout(() => {
          if (!dd.contains(document.activeElement)) {
            modal.style.display = "none";
          }
        }, 80);
      });
    }
    // =======================

    // Header (alle Seiten)
    SN.add({
      id: "header",
      selector: [
        ".primary-navigation > ul > li > a",
        ".primary-navigation > ul > li > strong",

        ".offset-navigation.extraPadding > a",
        ".menuSearchButton",
        ".liveNewsFeedButton",
        ".avatar > a",
        ".dd > p > a",
      ].join(", "),
      restrict: "none",
      tabIndexIgnoreList: "",
    });
    // =======================

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
          tabIndexIgnoreList: "",
        });
      }
    } else if (path === "/account") {
      SN.add({
        id: "account",
        selector: [".close a", ".reviewList.row > li > a"].join(", "),
        tabIndexIgnoreList: "",
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
        tabIndexIgnoreList: "",
      });
    } else if (path.startsWith("/anime/stream/")) {
      const hasEpisode = parts.some((p) => p.startsWith("episode-"));
      const hasFilm = parts.some((p) => p.startsWith("film-"));

      if (hasEpisode || hasFilm) {
        SN.add({
          id: "player",
          selector: ".cf.breadCrumbMenu.dark > li > a",
          tabIndexIgnoreList: "",
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
          tabIndexIgnoreList: "",
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
    } else if (path.startsWith("/search?"));

    SN.add({
      id: "footer",
      selector: ".footer-container > div > ul > li > a",
      tabIndexIgnoreList: "",
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
