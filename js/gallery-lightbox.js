(function () {
  var overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close media">x</button>' +
    '<div class="lightbox-media">' +
    '<img class="lightbox-image" alt="" />' +
    '<video class="lightbox-video" controls playsinline controlslist="nodownload noplaybackrate noremoteplayback" disablepictureinpicture></video>' +
    '<p class="lightbox-caption" aria-live="polite"></p>' +
    '</div>';

  var closeButton = overlay.querySelector(".lightbox-close");
  var lightboxMedia = overlay.querySelector(".lightbox-media");
  var lightboxImage = overlay.querySelector(".lightbox-image");
  var lightboxVideo = overlay.querySelector(".lightbox-video");
  var lightboxCaption = overlay.querySelector(".lightbox-caption");

  function showImage(src, alt) {
    lightboxMedia.classList.remove("is-video");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.style.display = "none";
    lightboxImage.style.display = "block";
    lightboxImage.setAttribute("src", src);
    lightboxImage.setAttribute("alt", alt);
    lightboxCaption.textContent = alt;
  }

  function showVideo(src, label) {
    lightboxMedia.classList.add("is-video");
    lightboxImage.removeAttribute("src");
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "block";
    lightboxVideo.setAttribute("src", src);
    lightboxVideo.setAttribute("aria-label", label);
    lightboxVideo.load();
    lightboxCaption.textContent = label;
    var playPromise = lightboxVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // Autoplay may be blocked; user can press play.
      });
    }
  }

  function openLightbox(kind, src, label) {
    if (!src) {
      return;
    }
    if (kind === "video") {
      showVideo(src, label || "Gallery video");
    } else {
      showImage(src, label || "Gallery image");
    }
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton.focus();
  }

  function closeLightbox() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxMedia.classList.remove("is-video");
    lightboxImage.removeAttribute("src");
    lightboxImage.style.display = "none";
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.style.display = "none";
    lightboxCaption.textContent = "";
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.classList.contains("lightbox-close")) {
      closeLightbox();
      return;
    }
    if (target === overlay) {
      closeLightbox();
      return;
    }
    var img = target.closest(".gallery img");
    if (img) {
      event.preventDefault();
      openLightbox("image", img.getAttribute("src"), img.getAttribute("alt"));
      return;
    }

    var videoTile = target.closest(".gallery .media-tile");
    var video = target.closest(".gallery video") || (videoTile ? videoTile.querySelector("video") : null);
    if (video) {
      var source = video.querySelector("source");
      var videoSrc = source ? source.getAttribute("src") : video.getAttribute("src") || video.currentSrc;
      event.preventDefault();
      video.pause();
      openLightbox("video", videoSrc, video.getAttribute("aria-label"));
      return;
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  lightboxImage.style.display = "none";
  lightboxVideo.style.display = "none";
  document.body.appendChild(overlay);
})();
