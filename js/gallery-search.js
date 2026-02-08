(function () {
  var searchInput = document.querySelector("#gallery-search");
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

  function applyFilter() {
    var query = searchInput.value.trim().toLowerCase();
    var hasResults = false;

    items.forEach(function (item) {
      var text = getItemText(item);
      var match = !query || text.indexOf(query) !== -1;
      item.style.display = match ? "" : "none";
      if (match) {
        hasResults = true;
      }
    });

    if (emptyState) {
      emptyState.hidden = hasResults;
    }
  }

  searchInput.addEventListener("input", applyFilter);
})();
