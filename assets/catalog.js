(() => {
  const KEY = "otpc-shop";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const chf = (n) => "CHF " + Math.round(Number(n) || 0).toLocaleString("de-CH");
  const hrefOf = (p) => "produkt.html?id=" + encodeURIComponent(p.id);

  const FALLBACK = {
    updated: 0,
    products: [
      { id: "produkt-1", title: "Produkt 1", price: 4490, image: "assets/produkt-1.jpg", text: "Weisses Dual-Chamber Prebuild.", search: "weisses dual-chamber prebuild", specs: [["Gehäuse", "White Dual-Chamber Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" },
      { id: "produkt-2", title: "Produkt 2", price: 3890, image: "assets/produkt-2.jpg", text: "Schwarzes Panorama-Prebuild.", search: "schwarzes panorama prebuild", specs: [["Gehäuse", "Black Panorama Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" },
      { id: "produkt-3", title: "Produkt 3", price: 3590, image: "assets/produkt-3.jpg", text: "Weisser Mid-Tower Prebuild.", search: "weisser mid-tower prebuild", specs: [["Gehäuse", "White Mid-Tower Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" }
    ],
    payments: {
      twint: { on: true, number: "", hint: "TWINT per E-Mail." },
      card: { on: true, link: "", hint: "Zahlungslink per E-Mail." },
      rechnung: { on: true, iban: "", name: "OTPC", bank: "", hint: "Rechnung per E-Mail." }
    },
    shipping: { label: "Die Post, versichert", cost: 0, note: "Nur Schweiz." }
  };

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }

  async function loadShop() {
    let file = null;
    try {
      const res = await fetch("data/shop.json", { cache: "no-store" });
      if (res.ok) file = await res.json();
    } catch (e) {}
    const local = readLocal();
    const base = file || FALLBACK;
    if (local && (local.updated || 0) >= (base.updated || 0)) return local;
    return base;
  }

  function visible(shop, featuredOnly) {
    return (shop.products || []).filter((p) => p.active !== false && (featuredOnly ? p.featured !== false : true));
  }

  function card(p) {
    return `<article class="build-card">
      <a href="${esc(hrefOf(p))}">
        <div class="build-card__top"><span>OTPC</span><span>Prebuild</span></div>
        <div class="build-card__media"><img src="${esc(p.image)}" alt="${esc(p.title)}"></div>
        <div class="build-card__foot"><span class="build-card__name">${esc(p.title)}</span><span class="build-card__price">${chf(p.price)}</span></div>
      </a>
    </article>`;
  }

  function paintGrids(shop) {
    document.querySelectorAll("[data-pc-grid]").forEach((el) => {
      const home = el.getAttribute("data-pc-grid") === "home";
      const list = visible(shop, home);
      const n = Math.max(1, Math.min(3, list.length || 1));
      el.style.setProperty("--pc-cols", String(n));
      el.innerHTML = list.length ? list.map(card).join("") : "<p class=\"eyebrow\" style=\"padding:2rem\">Keine Produkte.</p>";
    });
  }

  function productHTML(p, shop, others) {
    const sold = p.stock === "out";
    const specs = (p.specs || []).map((row) => `<tr><th>${esc(row[0])}</th><td>${esc(row[1])}</td></tr>`).join("");
    const also = (others || []).filter((x) => x.id !== p.id).slice(0, 2);
    const pay = shop.payments || {};
    const pays = [];
    if (pay.twint && pay.twint.on !== false) pays.push("TWINT");
    if (pay.card && pay.card.on !== false) pays.push("Zahlungslink");
    if (pay.rechnung && pay.rechnung.on !== false) pays.push("Rechnung");
    return `
      <section class="product">
        <div class="product__media"><img src="${esc(p.image)}" alt="${esc(p.title)}"></div>
        <div class="product__info">
          <p class="eyebrow">OTPC · Swiss Made</p>
          <h1 class="display">${esc(p.title)}</h1>
          <div class="product__price">${chf(p.price)}</div>
          <p class="product__text">${esc(p.text || "")}</p>
          ${sold ? "<p class=\"eyebrow\">Aktuell nicht verfügbar.</p>" : `
          <form data-add data-title="${esc(p.title)}" data-price="${chf(p.price)}">
            <input type="hidden" name="id" value="${esc(p.id)}">
            <div class="qty" data-qty>
              <button type="button" data-d="-1">−</button>
              <span data-qty-val>1</span>
              <input type="hidden" name="quantity" value="1">
              <button type="button" data-d="1">+</button>
            </div>
            <div class="product__buy">
              <button class="btn btn--solid" type="submit">In den Warenkorb</button>
              <button class="btn btn--ghost" type="button" data-buy>Jetzt kaufen</button>
            </div>
          </form>`}
          ${specs ? `<table class="spec-table">${specs}</table>` : ""}
          <div class="product__notes">
            <p>${esc((shop.shipping && shop.shipping.note) || "Versand Schweiz, Die Post, versichert.")}</p>
            <p>Zahlung: ${esc(pays.join(", ") || "nach Absprache")}.</p>
            <p>Fragen: <a href="contact.html">Kontakt</a></p>
          </div>
        </div>
      </section>
      ${also.length ? `<section class="also"><div class="wrap"><h2>Weitere Prebuilds</h2><div class="builds">${also.map(card).join("")}</div></div></section>` : ""}`;
  }

  function paintProduct(shop) {
    const el = document.querySelector("[data-product-page]");
    if (!el) return;
    const id = el.getAttribute("data-product-page") || new URLSearchParams(location.search).get("id") || "";
    const list = visible(shop, false);
    const p = (shop.products || []).find((x) => x.id === id);
    if (!p || p.active === false) {
      el.innerHTML = '<div class="page-narrow"><p class="eyebrow">Shop</p><h1 class="display">Produkt</h1><p>Nicht gefunden.</p><p><a href="shop.html">Zu den Produkten</a></p></div>';
      return;
    }
    document.title = p.title + " · " + chf(p.price) + " | OTPC";
    el.innerHTML = productHTML(p, shop, list);
  }

  function paintSearch(shop) {
    const box = document.querySelector("[data-products]");
    if (!box) return;
    const q = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase();
    document.querySelectorAll("main input[name='q']").forEach((input) => { input.value = q; });
    const hits = visible(shop, false).filter((p) => !q || (p.title + " " + (p.search || "") + " " + (p.text || "")).toLowerCase().indexOf(q) >= 0);
    box.innerHTML = hits.length ? hits.map(card).join("") : '<p style="color:var(--mute);padding:1.2rem;">Nichts gefunden.</p>';
  }

  function paintPay(shop) {
    const box = document.querySelector("[data-pay-methods]");
    if (!box) return;
    const pay = shop.payments || {};
    const opts = [];
    if (pay.twint && pay.twint.on !== false) opts.push(['twint', 'TWINT']);
    if (pay.card && pay.card.on !== false) opts.push(['card', 'Karte · Zahlungslink per E-Mail']);
    if (pay.rechnung && pay.rechnung.on !== false) opts.push(['rechnung', 'Rechnung / Überweisung']);
    if (!opts.length) opts.push(['twint', 'TWINT']);
    box.innerHTML = opts.map((o, i) => `<label class="pay-option"><input type="radio" name="pay" value="${o[0]}" ${i === 0 ? "required" : ""}><span>${esc(o[1])}</span></label>`).join("");
    const ship = document.querySelector("[data-ship-label]");
    if (ship && shop.shipping) {
      const cost = shop.shipping.cost ? chf(shop.shipping.cost) : "CHF 0";
      ship.textContent = (shop.shipping.label || "Die Post") + " · " + cost;
    }
  }

  function paintThanks(shop) {
    const box = document.querySelector("[data-pay-next]");
    if (!box) return;
    let order = null;
    try { order = JSON.parse(sessionStorage.getItem("otpc-last-order") || "null"); } catch (e) {}
    if (!order) return;
    const pay = (shop.payments || {})[order.pay] || {};
    const bits = [];
    if (order.pay === "twint") {
      bits.push(pay.hint || "TWINT-Zahlungsaufforderung kommt per E-Mail.");
      if (pay.number) bits.push("TWINT: " + pay.number);
    } else if (order.pay === "card") {
      bits.push(pay.hint || "Zahlungslink kommt per E-Mail.");
      if (pay.link) bits.push('<a href="' + esc(pay.link) + '">Jetzt zahlen</a>');
    } else if (order.pay === "rechnung") {
      bits.push(pay.hint || "Rechnung kommt per E-Mail.");
      if (pay.iban) bits.push("IBAN " + pay.iban + (pay.name ? " · " + pay.name : ""));
    }
    box.innerHTML = bits.map((b) => "<p>" + b + "</p>").join("");
  }

  function wireSearch(shop) {
    const input = document.querySelector("#search-drawer input[type='search']");
    const hits = document.querySelector("[data-search-hits]");
    if (!input || !hits) return;
    const paint = () => {
      const q = (input.value || "").trim().toLowerCase();
      if (q.length < 1) { hits.innerHTML = ""; return; }
      const list = visible(shop, false).filter((p) => (p.title + " " + (p.search || "") + " " + (p.text || "")).toLowerCase().indexOf(q) >= 0);
      hits.innerHTML = list.length
        ? list.map((p) => `<a href="${esc(hrefOf(p))}">${esc(p.title)} · ${chf(p.price)}</a>`).join("")
        : '<p style="color:var(--mute)">Nichts gefunden.</p>';
    };
    input.addEventListener("input", paint);
  }

  window.otpcHref = hrefOf;
  window.otpcChf = chf;
  window.otpcReady = loadShop().then((shop) => {
    window.__otpcShop = shop;
    paintGrids(shop);
    paintProduct(shop);
    paintSearch(shop);
    paintPay(shop);
    paintThanks(shop);
    wireSearch(shop);
    return shop;
  }).catch(() => {
    window.__otpcShop = FALLBACK;
    return FALLBACK;
  });
})();
