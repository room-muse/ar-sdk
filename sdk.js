/**
 * RoomMuse AR Overlay — QR modal for 3D/AR
 *
 * How to use:
 * 1. Add the script tag to your HTML (e.g. after main.js):
 *    <script src="roommuse-ar-overlay.js"></script>
 * 2. On the button that should open the AR/QR flow, add the attribute data-rm-id
 *    and set its value to the product's id:
 *    <button data-rm-id="${product.id}">3D/AR</button>
 */
(function () {
  var API = "https://ar-backend-563656133641.us-central1.run.app";

  function loadQRLib(cb) {
    if (typeof QRCode !== "undefined") return cb();
    var s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function buildLink(id) {
    var u = new URL(window.location.href);
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

      function close() {
        document.body.removeChild(ov);
      }
      document.getElementById("_rm_close").onclick = close;
      ov.onclick = function (e) {
        if (e.target === ov) close();
      };
    });
  }

  // ── Deep link handler ──
  function handleDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("rm_arId");
    if (!id) return;

    fetch(API + "/items/" + encodeURIComponent(id))
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to fetch item: " + r.status);
        return r.json();
      })
      .then(function (item) {
        console.log("[RoomMuse] item fetched:", item);
        if (!item.usdzUrl) return;

        var a = document.createElement("a");
        a.setAttribute("rel", "ar");
        a.href = item.usdzUrl;
        a.style.cssText = "position:fixed;left:-9999px;top:-9999px;";

        var img = document.createElement("img");
        img.src = item.imageUrl || "";
        a.appendChild(img);

        document.body.appendChild(a);
        a.click();
      })
      .catch(function (e) {
        console.warn("[RoomMuse] deep link fetch failed:", e);
      });
  }

  function init() {
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-rm-id]");
      if (!btn) return;
      openModal(btn.getAttribute("data-rm-id"));
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
