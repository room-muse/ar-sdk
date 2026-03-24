(function () {
  var API = "https://ar-backend-563656133641.us-central1.run.app";
  var script = document.currentScript;
  var API_KEY = script ? script.getAttribute("data-api-key") : null;

  // ── Device detection ──────────────────────────────────────────────────────
  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  // ── QR modal (desktop) ────────────────────────────────────────────────────
  function loadQRLib(cb) {
    if (typeof QRCode !== "undefined") return cb();
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }
  function buildLink(id) {
    var params = new URLSearchParams(window.location.search);
    var parentUrl = params.get("rm_parentUrl");
    var u = new URL(parentUrl ? decodeURIComponent(parentUrl) : window.location.href);
    u.hash = "";
    u.searchParams.set("rm_arId", id);
    return u.toString();
  }
  function openModal(id) {
    loadQRLib(function () {
      var ov = document.createElement("div");
      ov.style.cssText =
        "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);";
      ov.innerHTML =
        '<div style="background:#fff;border-radius:16px;padding:32px;text-align:center;max-width:360px;width:100%;">' +
        '<div id="_rm_qr" style="display:flex;justify-content:center;"></div>' +
        '<p style="margin:16px 0 0;font-size:13px;color:#666;">Scan to view in AR</p>' +
        '<button id="_rm_close" style="margin-top:16px;padding:8px 20px;border:none;border-radius:8px;background:#233B3D;color:#fff;cursor:pointer;">Close</button>' +
        "</div>";
      document.body.appendChild(ov);
      new QRCode(document.getElementById("_rm_qr"), {
        text: buildLink(id),
        width: 240,
        height: 240,
        colorDark: "#233B3D",
        colorLight: "#ffffff",
      });
      function close() { document.body.removeChild(ov); }
      document.getElementById("_rm_close").onclick = close;
      ov.onclick = function (e) { if (e.target === ov) close(); };
    });
  }

  // ── Model fetching ────────────────────────────────────────────────────────
  function fetchModel(id, format) {
    var form = new FormData();
    form.append("api_key", API_KEY);
    form.append("product_id", id);
    form.append("format", format || "usdz");
    return fetch(API + "/model", { method: "POST", body: form })
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to fetch model: " + r.status);
        return r.json();
      });
  }

  // ── iOS AR (USDZ + rel=ar) ────────────────────────────────────────────────
  function launchARiOS(id) {
    fetchModel(id, "usdz").then(function (data) {
      if (!data.url) return;
      var a = document.createElement("a");
      a.setAttribute("rel", "ar");
      a.href = data.url + "#allowsContentScaling=0";
      a.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      var img = document.createElement("img");
      img.src = "";
      a.appendChild(img);
      document.body.appendChild(a);
      a.click();
    });
  }

  // ── Android AR (GLB + Scene Viewer intent) ────────────────────────────────
  function launchARAndroid(id) {
    fetchModel(id, "glb").then(function (data) {
      if (!data.url) return;
  
      var sceneViewerUrl =
        "intent://arvr.google.com/scene-viewer/1.0" +
        "?file=" + encodeURIComponent(data.url) +
        "&mode=ar_preferred" +
        "&resizable=false" +
        "#Intent" +
        ";scheme=https" +
        ";package=com.google.android.googlequicksearchbox" +
        ";action=android.intent.action.VIEW" +
        ";S.browser_fallback_url=" + encodeURIComponent(window.location.href) +
        ";end;";
  
      window.location.href = sceneViewerUrl;
    });
  }

  // ── Unified launcher ──────────────────────────────────────────────────────
  function launchAR(id) {
    if (isIOS()) {
      launchARiOS(id);
    } else if (isAndroid()) {
      launchARAndroid(id);
    } else {
      openModal(id); // Shouldn't reach here from click handler, but safe fallback
    }
  }

  // ── Deep-link handler (QR scan lands here) ────────────────────────────────
  function handleDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("rm_arId");
    if (!id) return;
    launchAR(id);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  function init() {
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-rm-id]");
      if (!btn) return;
      var id = btn.getAttribute("data-rm-id");
      if (isIOS() || isAndroid()) {
        launchAR(id);
      } else {
        openModal(id);
      }
    });
    handleDeepLink();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.RoomMuse = { open: openModal };
})();