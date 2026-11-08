(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const shopify = typeof window.Shopify !== "undefined";

  const cartCountEls = $$("[data-cart-count]");
  const setCount = (n) => cartCountEls.forEach((el) => { el.textContent = String(n); el.hidden = n < 1; });

  const overlaySel = ".drawer, .nav-drawer, .search-drawer, .account-pop";

  const toggle = (el, on) => {
    if (!el) return;
    el.classList.toggle("is-open", on);
    document.body.style.overflow = on ? "hidden" : "";
    $$(`[data-open="#${el.id}"]`).forEach((btn) => {
      btn.setAttribute("aria-expanded", on ? "true" : "false");
    });
    if (on && el.id === "search-drawer") {
      const input = el.querySelector("input[type='search']");
      window.setTimeout(() => input && input.focus(), 40);
    }
  };

  document.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (closer) {
      toggle(closer.closest(overlaySel) || $(closer.dataset.close), false);
      return;
    }
    const bg = e.target.closest(".drawer__bg, .nav-drawer__bg, .search-drawer__bg, .account-pop__bg");
    if (bg) {
      toggle(bg.parentElement, false);
      return;
    }
    const opener = e.target.closest("[data-open]");
    if (!opener) return;
    const box = $(opener.dataset.open);
    const open = !box?.classList.contains("is-open");
    $$(overlaySel.split(", ").map((s) => `${s}.is-open`).join(", ")).forEach((el) => {
      if (el !== box) toggle(el, false);
    });
    toggle(box, open);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    $$(overlaySel.split(", ").map((s) => `${s}.is-open`).join(", ")).forEach((el) => toggle(el, false));
  });

  const previewCart = {
    key: "otpc-cart",
    read() {
      try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch { return []; }
    },
    write(items) { localStorage.setItem(this.key, JSON.stringify(items)); },
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const parseChf = (value) => {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };
  const formatChf = (n) => "CHF " + Math.round(n).toLocaleString("de-CH");
  const shopRoot = () => {
    const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || "/";
    return root.endsWith("/") ? root : root + "/";
  };
  const checkoutHref = () => (shopify ? shopRoot() + "checkout" : "checkout.html");
  const cartHref = () => (shopify ? (window.Shopify.routes && (Shopify.routes.cart_url || Shopify.routes.cart)) || shopRoot() + "cart" : "cart.html");

  function drawerActions(hasItems) {
    if (!hasItems) return "";
    if (shopify) {
      return `<form class="cart-actions" action="${esc(cartHref())}" method="post">
        <button class="btn btn--solid" type="submit" name="checkout">Zur Kasse</button>
        <a class="btn btn--ghost" href="${esc(cartHref())}">Warenkorb</a>
      </form>`;
    }
    return `<div class="cart-actions">
      <a class="btn btn--solid" href="checkout.html">Zur Kasse</a>
      <a class="btn btn--ghost" href="cart.html">Warenkorb</a>
    </div>`;
  }

  function renderPreviewDrawer(items) {
    const note = $("#cart-note");
    const panel = $("#cart-drawer .drawer__panel");
    if (!panel) return;
    let list = panel.querySelector("[data-cart-list]");
    if (!list) {
      list = document.createElement("div");
      list.setAttribute("data-cart-list", "");
      panel.appendChild(list);
    }
    const count = items.reduce((n, i) => n + i.qty, 0);
    const total = items.reduce((n, i) => n + parseChf(i.price) * i.qty, 0);
    if (!items.length) {
      if (note) note.textContent = "Leer";
      list.innerHTML = '<p style="color:var(--mute);">Warenkorb ist leer.</p>';
      return;
    }
    if (note) note.textContent = count + " Artikel";
    list.innerHTML = items.map((i) => (
      `<div class="cart-item" style="grid-template-columns:1fr auto;">
        <div>
          <strong>${esc(i.title)}</strong>
          ${i.spec ? `<div style="color:var(--mute);font-size:0.8rem;margin-top:.35rem;line-height:1.45;">${esc(i.spec)}</div>` : ""}
          <div class="eyebrow" style="margin-top:.4rem;">× ${i.qty} <button type="button" data-cart-remove="${esc(i.id)}">Entfernen</button></div>
        </div>
        <div>${formatChf(parseChf(i.price) * i.qty)}</div>
      </div>`
    )).join("")
      + `<div class="line total"><span>Summe</span><span>${formatChf(total)}</span></div>`
      + drawerActions(true);
  }

  function renderShopifyDrawer(cart) {
    const note = $("#cart-note");
    const list = $("#cart-drawer [data-cart-list]");
    if (!list) return;
    const items = cart.items || [];
    if (note) note.textContent = cart.item_count ? cart.item_count + " Artikel" : "Leer";
    if (!items.length) {
      list.innerHTML = '<p style="color:var(--mute);">Warenkorb ist leer.</p>';
      return;
    }
    const money = (cents) => "CHF " + (cents / 100).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    list.innerHTML = items.map((i) => (
      `<div class="cart-item" style="grid-template-columns:1fr auto;">
        <div>
          <strong>${esc(i.product_title || i.title)}</strong>
          <div class="eyebrow" style="margin-top:.4rem;">× ${i.quantity} <button type="button" data-line-key="${esc(i.key)}">Entfernen</button></div>
        </div>
        <div>${money(i.final_line_price)}</div>
      </div>`
    )).join("")
      + `<div class="line total"><span>Summe</span><span>${money(cart.total_price)}</span></div>`
      + drawerActions(true);
  }

  async function refreshCart() {
    if (shopify) {
      try {
        const cart = await fetch("/cart.js", { headers: { Accept: "application/json" } }).then((r) => {
          if (!r.ok) throw new Error("cart");
          return r.json();
        });
        setCount(cart.item_count);
        renderShopifyDrawer(cart);
        return cart;
      } catch {
        return null;
      }
    }
    const items = previewCart.read();
    setCount(items.reduce((n, i) => n + i.qty, 0));
    renderPreviewDrawer(items);
    paintCartPage(items);
    return items;
  }

  async function addLine(form) {
    const id = form.querySelector("[name='id']")?.value;
    const qty = Number(form.querySelector("[name='quantity']")?.value || 1);
    if (shopify) {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: Number(id), quantity: qty }] }),
      });
      if (!res.ok) throw new Error("add");
      return;
    }
    const items = previewCart.read();
    const title = form.dataset.title || "OTPC Build";
    const price = form.dataset.price || "CHF 0";
    const found = items.find((i) => i.id === id);
    if (found) found.qty += qty;
    else items.push({ id, title, price, qty });
    previewCart.write(items);
  }

  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) feedbackForm.setAttribute("data-feedback", "");

  const feedbackKey = "otpc-feedback";
  const readFeedback = () => {
    try { return JSON.parse(localStorage.getItem(feedbackKey) || "[]"); } catch { return []; }
  };
  const starsText = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  const paintFeedback = () => {
    const box = $("[data-feedback-list]");
    if (!box) return;
    const items = readFeedback();
    box.innerHTML = items.length ? items.map((item) => `
      <article class="feedback-card">
        ${item.image && String(item.image).startsWith("data:image/") ? `<img src="${item.image}" alt="">` : `<div class="feedback-card__ph"></div>`}
        <div>
          <p class="eyebrow">${esc(item.order)} · ${starsText(item.stars)}</p>
          <p>${esc(item.text)}</p>
        </div>
      </article>
    `).join("") : `<p class="feedback-empty">Noch kein Feedback.</p>`;
  };
  const fileToData = (file) => new Promise((resolve) => {
    if (!file) { resolve(""); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });

  document.addEventListener("click", (e) => {
    const star = e.target.closest("[data-star]");
    if (!star) return;
    const wrap = star.closest("[data-stars]");
    const n = Number(star.dataset.star);
    wrap.dataset.value = String(n);
    const input = $("input", wrap);
    if (input) input.value = String(n);
    $$("[data-star]", wrap).forEach((btn) => btn.classList.toggle("is-on", Number(btn.dataset.star) <= n));
  });
  document.addEventListener("change", (e) => {
    const input = e.target.closest("[data-feedback] input[type='file']");
    if (!input) return;
    const preview = $("[data-feedback-preview]", input.form);
    const file = input.files && input.files[0];
    if (!preview || !file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.hidden = false;
  });
  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("[data-feedback], #feedback-form");
    if (!form || !form.querySelector("[data-stars], [name='stars']")) return;
    e.preventDefault();
    const order = (form.querySelector("[name='order']")?.value || "").trim();
    const stars = Number(form.querySelector("[name='stars']")?.value || 0);
    const text = (form.querySelector("[name='message']")?.value || "").trim();
    const note = $("[data-feedback-note]", form);
    if (!order || !text || stars < 1) {
      if (note) note.textContent = stars < 1 ? "Bitte Sterne wählen." : "Bestellung und Text fehlen.";
      return;
    }
    const file = form.querySelector("[name='photo']")?.files?.[0];
    const image = await fileToData(file);
    const items = readFeedback();
    items.unshift({ order, stars, text, image, at: Date.now() });
    try { localStorage.setItem(feedbackKey, JSON.stringify(items.slice(0, 30))); } catch {}
    const body = form.querySelector("[data-feedback-body]");
    if (body) body.value = `Bestellung: ${order}\nSterne: ${stars}/5\n\n${text}`;
    const photo = form.querySelector("input[type='file']");
    if (photo) photo.removeAttribute("name");
    if (shopify && form.querySelector("[name='contact[body]']")) {
      form.submit();
      return;
    }
    form.reset();
    $$("[data-star]", form).forEach((btn) => btn.classList.remove("is-on"));
    const preview = $("[data-feedback-preview]", form);
    if (preview) { preview.hidden = true; preview.removeAttribute("src"); }
    if (note) note.textContent = "Gepostet.";
    paintFeedback();
  });
  paintFeedback();

  $$("[data-add]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const note = $("#cart-note");
      try {
        await addLine(form);
      } catch {
        if (note) note.textContent = "Konnte nicht in den Warenkorb.";
        toggle($("#cart-drawer"), true);
        return;
      }
      await refreshCart();
      toggle($("#cart-drawer"), true);
      if (note) note.textContent = "Im Warenkorb.";
    });
  });

  document.addEventListener("click", async (e) => {
    const buy = e.target.closest("[data-buy]");
    if (buy) {
      const form = buy.closest("form");
      if (!form) return;
      buy.disabled = true;
      try {
        await addLine(form);
        location.href = checkoutHref();
      } catch {
        buy.disabled = false;
        const note = $("#cart-note");
        if (note) note.textContent = "Konnte nicht in den Warenkorb.";
        toggle($("#cart-drawer"), true);
      }
      return;
    }
    const line = e.target.closest("[data-line-key]");
    if (line && shopify) {
      fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: line.getAttribute("data-line-key"), quantity: 0 }),
      }).then(() => refreshCart());
      return;
    }
    const remove = e.target.closest("[data-cart-remove]");
    if (!remove || shopify) return;
    const id = remove.getAttribute("data-cart-remove");
    previewCart.write(previewCart.read().filter((i) => i.id !== id));
    refreshCart();
  });

  function paintCartPage(items) {
    const page = $("[data-cart-page]");
    if (!page) return;
    const list = $("[data-cart-page-list]", page);
    const sum = $("[data-cart-page-sum]", page);
    const pay = $("[data-cart-checkout]", page);
    if (!list || !sum) return;
    if (!items.length) {
      list.innerHTML = '<p style="color:var(--mute);">Warenkorb ist leer.</p><a class="btn btn--solid" href="shop.html" style="margin-top:1rem;">Zum Shop</a>';
      sum.innerHTML = "";
      if (pay) pay.hidden = true;
      return;
    }
    const total = items.reduce((n, i) => n + parseChf(i.price) * i.qty, 0);
    list.innerHTML = items.map((i) => (
      `<div class="cart-item" style="grid-template-columns:1fr auto;">
        <div>
          <strong>${esc(i.title)}</strong>
          ${i.spec ? `<div style="color:var(--mute);font-size:0.8rem;margin-top:.35rem;">${esc(i.spec)}</div>` : ""}
          <div class="eyebrow" style="margin-top:.4rem;">× ${i.qty} <button type="button" data-cart-remove="${esc(i.id)}">Entfernen</button></div>
        </div>
        <div>${formatChf(parseChf(i.price) * i.qty)}</div>
      </div>`
    )).join("");
    sum.innerHTML = `<div class="line"><span>Artikel</span><span>${items.reduce((n, i) => n + i.qty, 0)}</span></div>
      <div class="line"><span>Versand</span><span>an der Kasse</span></div>
      <div class="line total"><span>Summe</span><span>${formatChf(total)}</span></div>`;
    if (pay) pay.hidden = false;
  }

  const checkout = $("[data-checkout]");
  if (checkout) {
    const items = shopify ? [] : previewCart.read();
    const summary = $("[data-checkout-summary]", checkout);
    const form = $("[data-checkout-form]", checkout);
    const thanks = $("[data-checkout-thanks]", checkout);
    const done = /(?:^|[?&])done=1(?:&|$)/.test(location.search);
    const total = items.reduce((n, i) => n + parseChf(i.price) * i.qty, 0);
    if (shopify) location.replace(checkoutHref());
    if (done) {
      let order = null;
      try { order = JSON.parse(sessionStorage.getItem("otpc-last-order") || "null"); } catch { order = null; }
      if (form) form.hidden = true;
      if (summary) summary.hidden = true;
      if (thanks) {
        thanks.hidden = false;
        const payName = { card: "Karte", twint: "TWINT", rechnung: "Rechnung" };
        const id = $("[data-order-id]", thanks);
        const method = $("[data-order-pay]", thanks);
        if (id && order) id.textContent = order.id;
        if (method && order) method.textContent = payName[order.pay] || "";
      }
    } else if (!items.length) {
      if (form) form.hidden = true;
      if (summary) summary.innerHTML = '<p style="color:var(--mute);">Warenkorb ist leer.</p><a class="btn btn--solid" href="shop.html" style="margin-top:1rem;">Zum Shop</a>';
    } else if (summary) {
      summary.innerHTML = items.map((i) => (
        `<div class="line"><span>${esc(i.title)} × ${i.qty}</span><span>${formatChf(parseChf(i.price) * i.qty)}</span></div>`
      )).join("")
        + `<div class="line"><span>Versand Schweiz</span><span>CHF 0</span></div>
           <div class="line total"><span>Summe</span><span>${formatChf(total)}</span></div>
           <p class="eyebrow">inkl. MwSt.</p>`;
    }
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const email = String(data.get("email") || "").trim();
      const name = String(data.get("name") || "").trim();
      const street = String(data.get("street") || "").trim();
      const zip = String(data.get("zip") || "").trim();
      const city = String(data.get("city") || "").trim();
      const pay = String(data.get("pay") || "");
      const note = $("[data-checkout-note]", form);
      if (!email || !name || !street || !zip || !city || !pay) {
        if (note) note.textContent = "Bitte alle Felder ausfüllen.";
        return;
      }
      const order = {
        id: "OTPC-" + String(Date.now()).slice(-6),
        email, name, street, zip, city, pay,
        items: items.map((i) => ({ title: i.title, qty: i.qty, price: i.price })),
        total: formatChf(total),
      };
      try { sessionStorage.setItem("otpc-last-order", JSON.stringify(order)); } catch {}
      if (note) note.textContent = "Bestellung wird gesendet…";
      const goThanks = () => {
        previewCart.write([]);
        location.href = "checkout.html?done=1";
      };
      if (typeof window.otpcSendOrder === "function") {
        window.otpcSendOrder(order).then(goThanks).catch(goThanks);
      } else {
        goThanks();
      }
    });
  }

  document.addEventListener("change", (e) => {
    const select = e.target.closest("[data-add] select");
    if (!select) return;
    const form = select.closest("form");
    const raw = form.querySelector("[data-product-json]");
    if (!raw) return;
    let variants = [];
    try { variants = JSON.parse(raw.textContent); } catch { return; }
    const picked = $$("select", form).map((s) => s.value);
    const match = variants.find((v) => picked.every((val, i) => v.options[i] === val));
    const id = form.querySelector("[name='id']");
    if (match && id) id.value = String(match.id);
  });

  const searchInput = $("#search-drawer input[type='search']");
  if (searchInput && shopify) {
    let timer;
    searchInput.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        let box = $("[data-search-hits]");
        if (!box) {
          box = document.createElement("div");
          box.className = "search-drawer__quick";
          box.setAttribute("data-search-hits", "");
          searchInput.form.after(box);
        }
        const q = searchInput.value.trim();
        if (q.length < 2) { box.innerHTML = ""; return; }
        try {
          const data = await fetch(shopRoot() + "search/suggest.json?q=" + encodeURIComponent(q) + "&resources[type]=product&resources[limit]=6", {
            headers: { Accept: "application/json" },
          }).then((r) => r.json());
          const products = (data.resources && data.resources.results && data.resources.results.products) || [];
          box.innerHTML = products.length
            ? products.map((p) => `<a href="${esc(p.url)}">${esc(p.title)}</a>`).join("")
            : '<p style="color:var(--mute)">Nichts gefunden.</p>';
        } catch {
          box.innerHTML = "";
        }
      }, 180);
    });
  }

  $$("[data-qty]").forEach((wrap) => {
    const input = $("input", wrap);
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !input) return;
      const next = Math.max(1, Number(input.value || 1) + Number(btn.dataset.d));
      input.value = next;
      wrap.querySelector("[data-qty-val]")?.replaceChildren(document.createTextNode(String(next)));
    });
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const key = btn.dataset.filter;
    $$("[data-filter]").forEach((b) => b.classList.toggle("is-on", b === btn));
    $$("[data-cat]").forEach((card) => {
      card.style.display = key === "all" || card.dataset.cat === key ? "" : "none";
    });
  });

  window.addEventListener("otpc-cart-change", refreshCart);
  refreshCart();

  const intro = document.querySelector("[data-shop-intro]");
  if (intro) {
    const force = /(?:^|[?&])intro=1(?:&|$)/.test(location.search);
    const seen = () => {
      try { return !force && sessionStorage.getItem("otpc-shop-intro") === "1"; } catch { return false; }
    };
    const finish = () => {
      try { sessionStorage.setItem("otpc-shop-intro", "1"); } catch {}
      intro.classList.remove("is-play");
      intro.classList.add("is-out");
      document.body.classList.remove("is-intro");
      window.setTimeout(() => intro.remove(), 700);
    };
    if (!force && intro.hidden) {
      intro.remove();
    } else if (seen() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      intro.remove();
    } else {
      document.body.classList.add("is-intro");
      requestAnimationFrame(() => intro.classList.add("is-play"));
      intro.querySelector("[data-intro-skip]")?.addEventListener("click", finish);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && intro.classList.contains("is-play")) finish();
      });
      if (!force) window.setTimeout(finish, 6400);
    }
  }
})();
