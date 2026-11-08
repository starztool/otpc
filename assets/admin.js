(() => {
  const SHOP_KEY = "otpc-shop";
  const PIN_KEY = "otpc-admin-pin";
  const AUTH_KEY = "otpc-admin-ok";
  const ORDERS_KEY = "otpc-orders";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const chf = (n) => "CHF " + Math.round(Number(n) || 0).toLocaleString("de-CH");
  const parseChf = (v) => {
    const d = String(v ?? "").replace(/[^\d]/g, "");
    return d ? Number(d) : 0;
  };

  const FALLBACK = {
    updated: 0,
    products: [
      { id: "produkt-1", title: "Produkt 1", price: 4490, image: "assets/produkt-1.jpg", text: "Weisses Dual-Chamber Prebuild.", search: "", specs: [["Gehäuse", "White Dual-Chamber Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" },
      { id: "produkt-2", title: "Produkt 2", price: 3890, image: "assets/produkt-2.jpg", text: "Schwarzes Panorama-Prebuild.", search: "", specs: [["Gehäuse", "Black Panorama Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" },
      { id: "produkt-3", title: "Produkt 3", price: 3590, image: "assets/produkt-3.jpg", text: "Weisser Mid-Tower Prebuild.", search: "", specs: [["Gehäuse", "White Mid-Tower Glas"], ["Herkunft", "Swiss Made"]], active: true, featured: true, stock: "in" }
    ],
    payments: {
      twint: { on: true, number: "", hint: "TWINT-Zahlungsaufforderung kommt per E-Mail." },
      card: { on: true, link: "", hint: "Zahlungslink kommt per E-Mail. Keine Kartendaten auf der Website." },
      rechnung: { on: true, iban: "", name: "OTPC", bank: "", hint: "Rechnung / Überweisung per E-Mail." }
    },
    shipping: { label: "Die Post, versichert", cost: 0, note: "Nur Schweiz." }
  };

  function pin() { return localStorage.getItem(PIN_KEY) || "otpc"; }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(SHOP_KEY) || "null"); } catch (e) { return null; }
  }
  function saveShop(shop) {
    shop.updated = Date.now();
    localStorage.setItem(SHOP_KEY, JSON.stringify(shop));
    return shop;
  }
  function orders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveOrders(list) { localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 80))); }

  let shop = FALLBACK;
  let route = { page: "home", id: "" };

  async function bootShop() {
    let file = null;
    try {
      const res = await fetch("data/shop.json", { cache: "no-store" });
      if (res.ok) file = await res.json();
    } catch (e) {}
    const local = readLocal();
    if (local && (!file || (local.updated || 0) >= (file.updated || 0))) shop = local;
    else shop = file || FALLBACK;
    if (!readLocal()) localStorage.setItem(SHOP_KEY, JSON.stringify(shop));
  }

  function parseHash() {
    const h = (location.hash || "#/").replace(/^#\/?/, "");
    const [page, id] = h.split("/");
    route = { page: page || "home", id: decodeURIComponent(id || "") };
  }
  function go(page, id) {
    location.hash = "#/" + page + (id ? "/" + encodeURIComponent(id) : "");
  }

  function statusLabel(s) {
    return ({ open: "Offen", paid: "Bezahlt", shipped: "Versendet", cancelled: "Storniert" }[s] || s || "Offen");
  }
  function payLabel(s) {
    return ({ twint: "TWINT", card: "Karte", rechnung: "Rechnung" }[s] || s || "—");
  }

  function paintNav() {
    $$(".side .nav").forEach((btn) => {
      const p = btn.getAttribute("data-go");
      btn.classList.toggle("is-on", p === route.page || (route.page === "product" && p === "products") || (route.page === "order" && p === "orders"));
    });
  }

  function viewHome() {
    const list = orders();
    const open = list.filter((o) => (o.status || "open") === "open").length;
    const paid = list.filter((o) => o.status === "paid" || o.status === "shipped");
    const sum = paid.reduce((n, o) => n + parseChf(o.total), 0);
    const recent = list.slice(0, 8);
    return `
      <div class="top"><h1>Übersicht</h1></div>
      <div class="stats">
        <div class="stat"><span>Produkte</span><b>${(shop.products || []).length}</b></div>
        <div class="stat"><span>Bestellungen</span><b>${list.length}</b></div>
        <div class="stat"><span>Offen</span><b>${open}</b></div>
        <div class="stat"><span>Bezahlt</span><b>${chf(sum)}</b></div>
      </div>
      <div class="card">
        <h2>Letzte Bestellungen</h2>
        ${recent.length ? `<table class="table"><thead><tr><th>Nr.</th><th>Kunde</th><th>Summe</th><th>Status</th></tr></thead><tbody>
          ${recent.map((o) => `<tr data-go="order/${esc(o.id)}"><td>${esc(o.id)}</td><td>${esc(o.name || o.email)}</td><td>${esc(o.total)}</td><td><span class="pill">${esc(statusLabel(o.status))}</span></td></tr>`).join("")}
        </tbody></table>` : "<p class=\"muted\">Noch keine Bestellung auf diesem Gerät. Kundenshop-Bestellungen kommen zusätzlich per Mail.</p>"}
      </div>`;
  }

  function viewOrders() {
    const list = orders();
    return `
      <div class="top">
        <h1>Bestellungen</h1>
        <div class="row">
          <button class="btn" type="button" data-go="order/new">Bestellung erfassen</button>
        </div>
      </div>
      ${list.length ? `<table class="table"><thead><tr><th>Nr.</th><th>Kunde</th><th>Zahlung</th><th>Summe</th><th>Status</th></tr></thead><tbody>
        ${list.map((o) => `<tr data-go="order/${esc(o.id)}"><td>${esc(o.id)}</td><td>${esc(o.name || "")}<br><span class="muted">${esc(o.email || "")}</span></td><td>${esc(payLabel(o.pay))}</td><td>${esc(o.total)}</td><td><span class="pill">${esc(statusLabel(o.status))}</span></td></tr>`).join("")}
      </tbody></table>` : "<p class=\"muted\">Keine Bestellungen in diesem Browser. Über „Bestellung erfassen“ oder sobald jemand hier bestellt.</p>"}`;
  }

  function viewOrder() {
    if (route.id === "new") {
      const opts = (shop.products || []).map((p) => `<option value="${esc(p.id)}">${esc(p.title)} · ${chf(p.price)}</option>`).join("");
      return `
        <div class="top"><h1>Bestellung erfassen</h1><button class="btn btn--ghost" type="button" data-go="orders">Zurück</button></div>
        <form class="card" id="draft-form" style="max-width:560px">
          <label class="field-lab">Name<input class="field" name="name" required></label>
          <label class="field-lab">E-Mail<input class="field" type="email" name="email" required></label>
          <label class="field-lab">Produkt<select class="field" name="pid">${opts}</select></label>
          <label class="field-lab">Zahlung
            <select class="field" name="pay">
              <option value="twint">TWINT</option>
              <option value="card">Karte</option>
              <option value="rechnung">Rechnung</option>
            </select>
          </label>
          <label class="field-lab">Status
            <select class="field" name="status">
              <option value="open">Offen</option>
              <option value="paid">Bezahlt</option>
            </select>
          </label>
          <button class="btn" type="submit">Speichern</button>
        </form>`;
    }
    const o = orders().filter((x) => x.id === route.id)[0];
    if (!o) return `<div class="top"><h1>Bestellung</h1></div><p class="muted">Nicht gefunden.</p>`;
    const lines = (o.items || []).map((i) => `<div>${esc(i.title)} × ${i.qty} · ${esc(i.price)}</div>`).join("");
    return `
      <div class="top">
        <h1>${esc(o.id)}</h1>
        <button class="btn btn--ghost" type="button" data-go="orders">Alle</button>
      </div>
      <div class="detail">
        <div class="card">
          <h2>Artikel</h2>
          ${lines || "<p class=\"muted\">—</p>"}
          <p style="margin-top:1rem"><strong>${esc(o.total)}</strong> · ${esc(payLabel(o.pay))}</p>
        </div>
        <div class="card">
          <h2>Kunde</h2>
          <p>${esc(o.name)}<br>${esc(o.email)}${o.phone ? "<br>" + esc(o.phone) : ""}</p>
          <p class="muted">${esc(o.street || "")}<br>${esc(o.zip || "")} ${esc(o.city || "")}</p>
          <form id="order-status">
            <label class="field-lab">Status
              <select class="field" name="status">
                ${["open", "paid", "shipped", "cancelled"].map((s) => `<option value="${s}" ${ (o.status || "open") === s ? "selected" : ""}>${statusLabel(s)}</option>`).join("")}
              </select>
            </label>
            <label class="field-lab">Notiz<textarea class="field" name="note">${esc(o.note || "")}</textarea></label>
            <button class="btn" type="submit">Aktualisieren</button>
            <p class="ok" data-ok></p>
          </form>
        </div>
      </div>`;
  }

  function viewProducts() {
    const list = shop.products || [];
    return `
      <div class="top">
        <h1>Produkte</h1>
        <button class="btn" type="button" data-go="product/new">Produkt hinzufügen</button>
      </div>
      <table class="table">
        <thead><tr><th></th><th>Titel</th><th>Preis</th><th>Shop</th><th>Start</th></tr></thead>
        <tbody>
          ${list.map((p) => `<tr data-go="product/${esc(p.id)}">
            <td><img src="${esc(p.image)}" alt=""></td>
            <td>${esc(p.title)}</td>
            <td>${chf(p.price)}</td>
            <td>${p.active === false ? "Aus" : "An"}</td>
            <td>${p.featured === false ? "—" : "Ja"}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;
  }

  function viewProduct() {
    const isNew = route.id === "new";
    const p = isNew ? {
      id: "", title: "", price: 0, image: "", text: "", search: "",
      specs: [["Gehäuse", ""], ["GPU", ""], ["Kühlung", ""], ["Herkunft", "Swiss Made"]],
      active: true, featured: true, stock: "in"
    } : (shop.products || []).filter((x) => x.id === route.id)[0];
    if (!p) return `<p class="muted">Produkt nicht gefunden.</p>`;
    const specs = (p.specs && p.specs.length ? p.specs : [["", ""]]).map((row, i) => `
      <div class="spec-row" data-spec>
        <input class="field" data-spec-k placeholder="z. B. GPU" value="${esc(row[0] || "")}">
        <input class="field" data-spec-v placeholder="Wert" value="${esc(row[1] || "")}">
        <button class="btn btn--ghost" type="button" data-spec-del="${i}">×</button>
      </div>`).join("");
    return `
      <div class="top">
        <h1>${isNew ? "Neues Produkt" : esc(p.title)}</h1>
        <div class="row">
          <button class="btn btn--ghost" type="button" data-go="products">Zurück</button>
          ${isNew ? "" : `<button class="btn btn--warn" type="button" id="del-product">Löschen</button>`}
        </div>
      </div>
      <form class="editor" id="product-form">
        <div class="card">
          <label class="field-lab">Name<input class="field" name="title" value="${esc(p.title)}" required></label>
          <label class="field-lab">Preis CHF<input class="field" name="price" type="number" min="0" step="1" value="${p.price || 0}" required></label>
          <label class="field-lab">Kurztext<textarea class="field" name="text">${esc(p.text || "")}</textarea></label>
          <label class="field-lab">Suche (optional)<input class="field" name="search" value="${esc(p.search || "")}"></label>
          <p class="muted">Specs</p>
          <div id="spec-list">${specs}</div>
          <button class="btn btn--ghost" type="button" id="add-spec">Zeile</button>
          <label class="check"><input type="checkbox" name="active" ${p.active === false ? "" : "checked"}> Im Shop sichtbar</label>
          <label class="check"><input type="checkbox" name="featured" ${p.featured === false ? "" : "checked"}> Auf der Startseite</label>
          <label class="check"><input type="checkbox" name="stock" ${p.stock === "out" ? "" : "checked"}> Auf Lager</label>
          <p style="margin-top:1rem"><button class="btn" type="submit">Speichern</button></p>
          <p class="ok" data-ok></p>
        </div>
        <div class="card preview">
          <h2>Bild</h2>
          <img id="img-preview" src="${esc(p.image || "assets/otpc-logo.png")}" alt="">
          <label class="field-lab" style="margin-top:0.8rem">Foto
            <input class="field" type="file" accept="image/*" id="img-file">
          </label>
          <input type="hidden" name="image" id="img-val" value="${esc(p.image || "")}">
          <p class="muted">JPG/PNG. Wird komprimiert. Kein Shopify-Upload, bleibt bei OTPC.</p>
        </div>
      </form>`;
  }

  function viewCustomers() {
    const map = {};
    orders().forEach((o) => {
      const k = (o.email || "").toLowerCase();
      if (!k) return;
      if (!map[k]) map[k] = { email: o.email, name: o.name || "", n: 0, total: 0 };
      map[k].n += 1;
      map[k].total += parseChf(o.total);
      if (o.name) map[k].name = o.name;
    });
    const list = Object.keys(map).map((k) => map[k]);
    return `
      <div class="top"><h1>Kunden</h1></div>
      ${list.length ? `<table class="table"><thead><tr><th>Name</th><th>E-Mail</th><th>Bestellungen</th><th>Summe</th></tr></thead><tbody>
        ${list.map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${c.n}</td><td>${chf(c.total)}</td></tr>`).join("")}
      </tbody></table>` : "<p class=\"muted\">Kunden erscheinen mit der ersten Bestellung.</p>"}`;
  }

  function viewPayments() {
    const p = shop.payments || FALLBACK.payments;
    return `
      <div class="top"><h1>Zahlungen</h1></div>
      <form class="card" id="pay-form" style="max-width:640px">
        <p class="muted">Wie Shopify Payments, nur ohne Karten auf der Website. TWINT, Link oder Rechnung. Kartendaten nie speichern.</p>
        <h2>TWINT</h2>
        <label class="check"><input type="checkbox" name="twint_on" ${p.twint && p.twint.on === false ? "" : "checked"}> Aktiv</label>
        <label class="field-lab">TWINT-Nummer / Empfänger<input class="field" name="twint_number" value="${esc(p.twint && p.twint.number || "")}"></label>
        <label class="field-lab">Hinweis an Kunden<input class="field" name="twint_hint" value="${esc(p.twint && p.twint.hint || "")}"></label>
        <h2>Karte · Zahlungslink</h2>
        <label class="check"><input type="checkbox" name="card_on" ${p.card && p.card.on === false ? "" : "checked"}> Aktiv</label>
        <label class="field-lab">Link (Payrexx, Stripe Payment Link, …)<input class="field" name="card_link" placeholder="https://…" value="${esc(p.card && p.card.link || "")}"></label>
        <label class="field-lab">Hinweis<input class="field" name="card_hint" value="${esc(p.card && p.card.hint || "")}"></label>
        <h2>Rechnung</h2>
        <label class="check"><input type="checkbox" name="rechnung_on" ${p.rechnung && p.rechnung.on === false ? "" : "checked"}> Aktiv</label>
        <label class="field-lab">IBAN<input class="field" name="iban" value="${esc(p.rechnung && p.rechnung.iban || "")}"></label>
        <label class="field-lab">Konto lautend auf<input class="field" name="payname" value="${esc(p.rechnung && p.rechnung.name || "OTPC")}"></label>
        <label class="field-lab">Bank<input class="field" name="bank" value="${esc(p.rechnung && p.rechnung.bank || "")}"></label>
        <button class="btn" type="submit">Speichern</button>
        <p class="ok" data-ok></p>
      </form>`;
  }

  function viewShipping() {
    const s = shop.shipping || FALLBACK.shipping;
    return `
      <div class="top"><h1>Versand</h1></div>
      <form class="card" id="ship-form" style="max-width:560px">
        <label class="field-lab">Methode<input class="field" name="label" value="${esc(s.label || "")}"></label>
        <label class="field-lab">Kosten CHF<input class="field" name="cost" type="number" min="0" step="1" value="${s.cost || 0}"></label>
        <label class="field-lab">Hinweis<input class="field" name="note" value="${esc(s.note || "")}"></label>
        <button class="btn" type="submit">Speichern</button>
        <p class="ok" data-ok></p>
      </form>`;
  }

  function viewSettings() {
    return `
      <div class="top"><h1>Einstellungen</h1></div>
      <div class="editor">
        <form class="card" id="pin-form">
          <h2>PIN</h2>
          <label class="field-lab">Neue PIN<input class="field" name="pin" type="password" minlength="4" required></label>
          <button class="btn" type="submit">PIN setzen</button>
          <p class="ok" data-ok></p>
        </form>
        <div class="card">
          <h2>Shop-Daten</h2>
          <p class="muted">Produkte und Zahlungen liegen in diesem Browser. Der Kundenshop auf demselben Gerät zeigt sie sofort. Datei speichern, wenn du eine Kopie willst.</p>
          <div class="row">
            <button class="btn" type="button" id="dl-shop">shop.json speichern</button>
            <label class="btn btn--ghost">Import<input type="file" accept="application/json" id="up-shop" hidden></label>
          </div>
          <p class="ok" data-ok2></p>
        </div>
      </div>`;
  }

  function render() {
    parseHash();
    paintNav();
    const view = $("#view");
    const pages = {
      home: viewHome,
      orders: viewOrders,
      order: viewOrder,
      products: viewProducts,
      product: viewProduct,
      customers: viewCustomers,
      payments: viewPayments,
      shipping: viewShipping,
      settings: viewSettings
    };
    view.innerHTML = (pages[route.page] || viewHome)();
  }

  function uniqueId(title) {
    let base = (title || "produkt").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produkt";
    let id = base;
    let n = 2;
    const ids = (shop.products || []).map((p) => p.id);
    while (ids.indexOf(id) >= 0) { id = base + "-" + n; n += 1; }
    return id;
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    });
  }

  function ok(sel, text) {
    const el = $(sel);
    if (el) el.textContent = text;
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-go]");
    if (nav && !nav.closest("form")) {
      e.preventDefault();
      const to = nav.getAttribute("data-go");
      const [page, id] = to.split("/");
      go(page, id);
    }
  });

  document.addEventListener("submit", async (e) => {
    if (e.target.id === "product-form") {
      e.preventDefault();
      const fd = new FormData(e.target);
      const isNew = route.id === "new";
      const prev = isNew ? {} : (shop.products || []).filter((x) => x.id === route.id)[0] || {};
      const specs = $$("[data-spec]").map((row) => [
        (row.querySelector("[data-spec-k]") || {}).value || "",
        (row.querySelector("[data-spec-v]") || {}).value || ""
      ]).filter((r) => r[0] || r[1]);
      const product = {
        id: prev.id || uniqueId(fd.get("title")),
        title: String(fd.get("title") || "").trim(),
        price: Number(fd.get("price") || 0),
        image: $("#img-val").value || prev.image || "assets/otpc-logo.png",
        text: String(fd.get("text") || "").trim(),
        search: String(fd.get("search") || "").trim(),
        specs,
        active: e.target.querySelector("[name=active]").checked,
        featured: e.target.querySelector("[name=featured]").checked,
        stock: e.target.querySelector("[name=stock]").checked ? "in" : "out"
      };
      if (!product.title) return;
      if (isNew) shop.products = (shop.products || []).concat([product]);
      else shop.products = (shop.products || []).map((p) => p.id === product.id ? product : p);
      saveShop(shop);
      ok("[data-ok]", "Im Shop auf diesem Gerät gespeichert.");
      if (isNew) go("product", product.id);
      return;
    }
    if (e.target.id === "pay-form") {
      e.preventDefault();
      const f = e.target;
      shop.payments = {
        twint: { on: f.twint_on.checked, number: f.twint_number.value.trim(), hint: f.twint_hint.value.trim() },
        card: { on: f.card_on.checked, link: f.card_link.value.trim(), hint: f.card_hint.value.trim() },
        rechnung: { on: f.rechnung_on.checked, iban: f.iban.value.trim(), name: f.payname.value.trim(), bank: f.bank.value.trim(), hint: (shop.payments.rechnung && shop.payments.rechnung.hint) || FALLBACK.payments.rechnung.hint }
      };
      saveShop(shop);
      ok("[data-ok]", "Zahlungen gespeichert. Kasse im Shop nutzt das ab sofort.");
      return;
    }
    if (e.target.id === "ship-form") {
      e.preventDefault();
      shop.shipping = {
        label: e.target.label.value.trim(),
        cost: Number(e.target.cost.value || 0),
        note: e.target.note.value.trim()
      };
      saveShop(shop);
      ok("[data-ok]", "Versand gespeichert.");
      return;
    }
    if (e.target.id === "pin-form") {
      e.preventDefault();
      const next = e.target.pin.value.trim();
      if (next.length < 4) return;
      localStorage.setItem(PIN_KEY, next);
      e.target.reset();
      ok("[data-ok]", "PIN geändert.");
      return;
    }
    if (e.target.id === "order-status") {
      e.preventDefault();
      const list = orders();
      const o = list.filter((x) => x.id === route.id)[0];
      if (!o) return;
      o.status = e.target.status.value;
      o.note = e.target.note.value;
      saveOrders(list);
      ok("[data-ok]", "Aktualisiert.");
      return;
    }
    if (e.target.id === "draft-form") {
      e.preventDefault();
      const fd = new FormData(e.target);
      const p = (shop.products || []).filter((x) => x.id === fd.get("pid"))[0];
      if (!p) return;
      const order = {
        id: "OTPC-" + String(Date.now()).slice(-6),
        email: String(fd.get("email") || "").trim(),
        name: String(fd.get("name") || "").trim(),
        phone: "",
        street: "", zip: "", city: "",
        pay: fd.get("pay"),
        status: fd.get("status") || "open",
        items: [{ title: p.title, qty: 1, price: chf(p.price) }],
        total: chf(p.price),
        at: Date.now(),
        source: "admin"
      };
      const list = orders();
      list.unshift(order);
      saveOrders(list);
      go("order", order.id);
    }
  });

  document.addEventListener("click", async (e) => {
    if (e.target.id === "add-spec") {
      const box = $("#spec-list");
      const row = document.createElement("div");
      row.className = "spec-row";
      row.setAttribute("data-spec", "");
      row.innerHTML = `<input class="field" data-spec-k placeholder="z. B. GPU"><input class="field" data-spec-v placeholder="Wert"><button class="btn btn--ghost" type="button" data-spec-del>×</button>`;
      box.appendChild(row);
    }
    if (e.target.closest("[data-spec-del]")) {
      e.target.closest("[data-spec]").remove();
    }
    if (e.target.id === "del-product") {
      if (!confirm("Produkt löschen?")) return;
      shop.products = (shop.products || []).filter((p) => p.id !== route.id);
      saveShop(shop);
      go("products");
    }
    if (e.target.id === "dl-shop") {
      const blob = new Blob([JSON.stringify(shop, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shop.json";
      a.click();
      ok("[data-ok2]", "Datei gespeichert. Liegt bei den Downloads.");
    }
  });

  document.addEventListener("change", async (e) => {
    if (e.target.id === "img-file" && e.target.files && e.target.files[0]) {
      try {
        const data = await compressImage(e.target.files[0]);
        $("#img-val").value = data;
        $("#img-preview").src = data;
      } catch (err) {
        ok("[data-ok]", "Bild ging nicht.");
      }
    }
    if (e.target.id === "up-shop" && e.target.files && e.target.files[0]) {
      const text = await e.target.files[0].text();
      try {
        const data = JSON.parse(text);
        if (!data.products) throw new Error("bad");
        shop = data;
        saveShop(shop);
        render();
        ok("[data-ok2]", "Import ok.");
      } catch (err) {
        ok("[data-ok2]", "Datei ungültig.");
      }
    }
  });

  window.addEventListener("hashchange", render);

  const openApp = async () => {
    sessionStorage.setItem(AUTH_KEY, "1");
    $("#gate").hidden = true;
    $("#app").hidden = false;
    await bootShop();
    if (!location.hash) location.hash = "#/home";
    render();
  };

  $("#gate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#pin").value === pin()) openApp();
    else $("#gate-note").textContent = "PIN stimmt nicht.";
  });

  if (sessionStorage.getItem(AUTH_KEY) === "1") openApp();
})();
