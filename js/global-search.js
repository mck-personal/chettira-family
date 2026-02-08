(function () {
  var trigger = document.querySelector(".search-trigger");
  if (!trigger) {
    return;
  }

  var overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Search site">' +
    '<button type="button" class="search-close" aria-label="Close search">x</button>' +
    '<label class="search-label" for="global-search-input">Search the site</label>' +
    '<input id="global-search-input" class="search-input" type="search" placeholder="Search all pages" autocomplete="off" />' +
    '<div class="search-status" aria-live="polite"></div>' +
    '<div class="search-results" role="list"></div>' +
    '</div>';

  var closeButton = overlay.querySelector(".search-close");
  var input = overlay.querySelector(".search-input");
  var status = overlay.querySelector(".search-status");
  var results = overlay.querySelector(".search-results");

  var pageIndex = null;
  var loading = false;

  var pages = [
    "family-tree.html",
    "history.html",
    "gurukaarana.html",
    "deities.html",
    "festivals.html",
    "gallery.html",
    "documents.html",
    "stories.html",
    "contact.html",
    "maithalappa.html",
    "bhadrakali.html",
    "bote-aiyappa.html",
    "karvale-bhagavathi.html",
    "vishnu-moorthy-meleri.html",
    "ajjappa-chaundi-kodpo.html",
    "thademotte-chaundi-kodpo.html",
    "festival-rituals.html"
  ];

  function setStatus(message) {
    status.textContent = message || "";
  }

  function openSearch() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("search-open");
    input.value = "";
    results.innerHTML = "";
    setStatus(loading ? "Loading pages..." : "");
    input.focus();

    if (!pageIndex && !loading) {
      loadIndex();
    }
  }

  function closeSearch() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("search-open");
  }

  function extractText(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var title = doc.querySelector("title") ? doc.querySelector("title").textContent : "";
    var bodyText = doc.body ? doc.body.textContent : "";
    return {
      title: title.trim(),
      text: bodyText.replace(/\s+/g, " ").trim()
    };
  }

  function loadIndex() {
    loading = true;
    setStatus("Loading pages...");

    Promise.all(
      pages.map(function (path) {
        return fetch(path)
          .then(function (res) {
            if (!res.ok) {
              return "";
            }
            return res.text();
          })
          .then(function (html) {
            var parsed = extractText(html || "");
            return {
              url: path,
              title: parsed.title || path,
              text: parsed.text
            };
          })
          .catch(function () {
            return {
              url: path,
              title: path,
              text: ""
            };
          });
      })
    )
      .then(function (data) {
        pageIndex = data;
      })
      .finally(function () {
        loading = false;
        setStatus("");
      });
  }

  function makeSnippet(text, index, length) {
    var start = Math.max(index - 40, 0);
    var end = Math.min(index + length + 80, text.length);
    var snippet = text.slice(start, end).trim();
    if (start > 0) {
      snippet = "..." + snippet;
    }
    if (end < text.length) {
      snippet = snippet + "...";
    }
    return snippet;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightSnippet(snippet, query) {
    if (!query) {
      return escapeHtml(snippet);
    }
    var escaped = escapeHtml(snippet);
    var pattern = new RegExp("(" + escapeRegExp(query) + ")", "ig");
    return escaped.replace(pattern, "<mark class=\"search-mark\">$1</mark>");
  }

  function renderResults(items, query) {
    results.innerHTML = "";

    if (!items.length) {
      setStatus("No matches found.");
      return;
    }

    setStatus("");

    items.forEach(function (item) {
      var link = document.createElement("a");
      link.className = "search-result";
      link.setAttribute("role", "listitem");
      link.href = item.url + "?q=" + encodeURIComponent(query || "");
      link.innerHTML =
        "<strong>" + item.title + "</strong>" +
        "<span>" + highlightSnippet(item.snippet, query) + "</span>";
      results.appendChild(link);
    });
  }

  function runSearch(query) {
    if (!query) {
      results.innerHTML = "";
      setStatus("");
      return;
    }

    if (!pageIndex) {
      setStatus("Loading pages...");
      return;
    }

    var normalized = query.toLowerCase();
    var matches = [];

    pageIndex.forEach(function (entry) {
      if (!entry.text) {
        return;
      }
      var haystack = (entry.title + " " + entry.text).toLowerCase();
      var index = haystack.indexOf(normalized);
      if (index === -1) {
        return;
      }
      matches.push({
        url: entry.url,
        title: entry.title,
        snippet: makeSnippet(entry.text, index, normalized.length)
      });
    });

    renderResults(matches, query);
  }

  function applyPageHighlight(query) {
    var main = document.querySelector("main");
    if (!main || !query) {
      return;
    }
    var normalized = query.toLowerCase();
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var node = walker.currentNode;
      if (node.nodeValue && node.nodeValue.toLowerCase().indexOf(normalized) !== -1) {
        nodes.push(node);
      }
    }
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var parts = text.split(new RegExp("(" + escapeRegExp(query) + ")", "ig"));
      if (parts.length < 2) {
        return;
      }
      var fragment = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) {
          return;
        }
        if (part.toLowerCase() === normalized) {
          var mark = document.createElement("mark");
          mark.className = "search-highlight";
          mark.textContent = part;
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    });
  }

  trigger.addEventListener("click", openSearch);
  closeButton.addEventListener("click", closeSearch);

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeSearch();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeSearch();
    }
  });

  input.addEventListener("input", function () {
    runSearch(input.value.trim());
  });

  document.body.appendChild(overlay);

  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get("q");
  if (initialQuery) {
    applyPageHighlight(initialQuery);
  }
})();
