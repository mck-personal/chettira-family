(function () {
  var searchInput = document.querySelector("#gallery-search");
  var albumTabs = Array.prototype.slice.call(
    document.querySelectorAll(".album-tab")
  );
  var galleries = Array.prototype.slice.call(
    document.querySelectorAll("[data-gallery]")
  );
  var emptyState = document.querySelector(".gallery-empty");

  if (!searchInput || galleries.length === 0) {
    return;
  }

  var items = galleries.reduce(function (acc, gallery) {
    return acc.concat(Array.prototype.slice.call(
      gallery.querySelectorAll(".media-tile")
    ));
  }, []);

  function getItemText(item) {
    var caption = item.querySelector(".media-caption");
    var img = item.querySelector("img");
    var video = item.querySelector("video");
    var text = "";

    if (caption && caption.textContent) {
      text += caption.textContent + " ";
    }
    if (img && img.getAttribute("alt")) {
      text += img.getAttribute("alt") + " ";
    }
    if (video && video.getAttribute("aria-label")) {
      text += video.getAttribute("aria-label") + " ";
    }

    return text.trim().toLowerCase();
  }

  var activeAlbum = "all";

  function applyFilter() {
    var query = searchInput.value.trim().toLowerCase();
    var hasResults = false;

    items.forEach(function (item) {
      var text = getItemText(item);
      var album = item.getAttribute("data-album") || "all";
      var matchesAlbum = activeAlbum === "all" || album === activeAlbum;
      var match = matchesAlbum && (!query || text.indexOf(query) !== -1);
      item.style.display = match ? "" : "none";
      if (match) {
        hasResults = true;
      }
    });

    if (emptyState) {
      emptyState.hidden = hasResults;
    }
  }

  function setActiveAlbum(nextAlbum) {
    activeAlbum = nextAlbum || "all";
    albumTabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-album") === activeAlbum;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    applyFilter();
  }

  albumTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      setActiveAlbum(tab.getAttribute("data-album"));
    });
  });

  searchInput.addEventListener("input", applyFilter);
})();
