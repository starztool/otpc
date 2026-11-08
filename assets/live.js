(() => {
  const MAIL = "https://formsubmit.co/ajax/overtimepcs.support@gmail.com";
  const $ = (s, r) => (r || document).querySelector(s);

  function users() {
    try { return JSON.parse(localStorage.getItem("otpc-users") || "[]"); } catch (e) { return []; }
  }
  function saveUsers(list) { localStorage.setItem("otpc-users", JSON.stringify(list)); }
  function session() {
    try { return JSON.parse(localStorage.getItem("otpc-session") || "null"); } catch (e) { return null; }
  }
  function setSession(user) {
    if (user) localStorage.setItem("otpc-session", JSON.stringify({ email: user.email, name: user.name || "" }));
    else localStorage.removeItem("otpc-session");
  }
  function orders() {
    try { return JSON.parse(localStorage.getItem("otpc-orders") || "[]"); } catch (e) { return []; }
  }
  function saveOrders(list) { localStorage.setItem("otpc-orders", JSON.stringify(list.slice(0, 40))); }

  async function sendMail(payload) {
    const body = Object.assign({
      _subject: payload._subject || "OTPC",
      _template: "table",
      _captcha: "false"
    }, payload);
    const res = await fetch(MAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("mail");
    return res.json();
  }

  if (/[?&]out=1(?:&|$)/.test(location.search)) {
    setSession(null);
    location.replace("index.html");
    return;
  }

  const contact = $("#ContactForm");
  if (contact) {
    contact.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(contact);
      const btn = contact.querySelector("[type=submit]");
      if (btn) btn.disabled = true;
      try {
        await sendMail({
          _subject: "OTPC Kontakt",
          name: fd.get("contact[name]"),
          email: fd.get("contact[email]"),
          phone: fd.get("contact[phone]") || "",
          betreff: fd.get("contact[Betreff]"),
          nachricht: fd.get("contact[body]")
        });
        contact.innerHTML = '<p class="form-status form-status--ok">Danke. Die Nachricht ist raus, wir antworten auf die Mail.</p>';
      } catch (err) {
        location.href = "mailto:overtimepcs.support@gmail.com?subject=" + encodeURIComponent(fd.get("contact[Betreff]") || "OTPC") + "&body=" + encodeURIComponent(fd.get("contact[body]") || "");
      }
    });
  }

  const login = $("#login-form");
  if (login) {
    login.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (login.querySelector("[name='customer[email]']") || {}).value || "";
      const pass = (login.querySelector("[name='customer[password]']") || {}).value || "";
      const list = users();
      const found = list.filter((u) => u.email.toLowerCase() === email.trim().toLowerCase())[0];
      const box = login.querySelector(".form-status") || login.insertBefore(document.createElement("div"), login.firstChild);
      box.className = "form-status form-status--err";
      if (!found || found.pass !== pass) {
        box.textContent = "E-Mail oder Passwort stimmt nicht.";
        return;
      }
      setSession(found);
      location.href = "account.html";
    });
  }

  const register = document.querySelector("form.form[data-register], .page-narrow form.form");
  if (register && $("[name='customer[first_name]']")) {
    register.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = ($("[name='customer[email]']") || {}).value || "";
      const pass = ($("[name='customer[password]']") || {}).value || "";
      const first = ($("[name='customer[first_name]']") || {}).value || "";
      const last = ($("[name='customer[last_name]']") || {}).value || "";
      if (!email || !pass) return;
      const list = users();
      if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        alert("Diese E-Mail hat schon ein Konto.");
        return;
      }
      const user = { email: email.trim(), pass, name: (first + " " + last).trim() };
      list.push(user);
      saveUsers(list);
      setSession(user);
      location.href = "account.html";
    });
  }

  const acc = $("[data-account-orders]");
  if (acc) {
    const me = session();
    if (!me) {
      location.replace("login.html");
      return;
    }
    const who = $("[data-account-who]");
    if (who) who.textContent = me.name ? me.name + " · " + me.email : me.email;
    const mine = orders().filter((o) => o.email && o.email.toLowerCase() === me.email.toLowerCase());
    if (!mine.length) {
      acc.innerHTML = '<p style="color:var(--mute)">Noch keine Bestellung mit diesem Konto.</p>';
    } else {
      acc.innerHTML = mine.map((o) => (
        `<article class="order-list__row" style="display:block">
          <a href="order.html?id=${encodeURIComponent(o.id)}"><strong>${o.id}</strong></a> · ${o.total} · ${o.pay}<br>
          <span style="color:var(--mute)">${o.street}, ${o.zip} ${o.city}</span>
        </article>`
      )).join("");
    }
  }

  const recoverForm = $("#recover-form");
  if (recoverForm) {
    recoverForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = ((recoverForm.querySelector("[name='email']") || {}).value || "").trim();
      const btn = recoverForm.querySelector("[type=submit]");
      if (btn) btn.disabled = true;
      try {
        await sendMail({
          _subject: "OTPC Passwort",
          email,
          nachricht: "Passwort-Anfrage für " + email
        });
      } catch (err) {}
      recoverForm.innerHTML = '<p class="form-status form-status--ok">Schreib uns an overtimepcs.support@gmail.com, dann setzen wir das Konto zurück.</p>';
    });
  }

  const orderView = $("[data-order-view]");
  if (orderView) {
    const me = session();
    if (!me) {
      location.replace("login.html");
      return;
    }
    const id = new URLSearchParams(location.search).get("id") || "";
    const o = orders().filter((x) => x.id === id)[0];
    if (!o || (o.email || "").toLowerCase() !== (me.email || "").toLowerCase()) {
      orderView.innerHTML = '<p class="eyebrow">Konto</p><h1 class="display">Bestellung</h1><p>Bestellung nicht gefunden.</p><p><a href="account.html">Zurück zum Konto</a></p>';
    } else {
      const payName = { card: "Karte · Zahlungslink", twint: "TWINT", rechnung: "Rechnung" };
      const lines = (o.items || []).map((i) =>
        `<div class="order-line"><div><strong>${i.title}</strong></div><div class="order-line__meta"><span>× ${i.qty}</span><strong>${i.price}</strong></div></div>`
      ).join("");
      orderView.innerHTML = `
        <p class="eyebrow">Bestellung</p>
        <div class="account-head">
          <h1 class="display">${o.id}</h1>
          <a class="btn btn--ghost" href="account.html">Alle Bestellungen</a>
        </div>
        <p>Zahlung: ${payName[o.pay] || o.pay} · ${o.total}</p>
        <div class="order-box">
          ${lines}
          <div class="order-totals">
            <div class="line"><span>Versand Schweiz</span><span>CHF 0</span></div>
            <div class="line total"><span>Summe</span><span>${o.total}</span></div>
          </div>
        </div>
        <div class="address-grid" style="margin-top:2rem;">
          <div>
            <h2 class="cfg-title">Lieferung</h2>
            <p>${o.name}<br>${o.street}<br>${o.zip} ${o.city}<br>Schweiz</p>
          </div>
          <div>
            <h2 class="cfg-title">Kontakt</h2>
            <p>${o.email}${o.phone ? "<br>" + o.phone : ""}</p>
          </div>
        </div>`;
    }
  }

  window.otpcSendFeedback = async function (item) {
    await sendMail({
      _subject: "OTPC Feedback " + (item.order || ""),
      bestellung: item.order || "",
      sterne: String(item.stars || ""),
      text: item.text || ""
    });
  };

  window.otpcSendOrder = async function (order) {
    const lines = (order.items || []).map((i) => i.title + " × " + i.qty + " · " + i.price).join("\n");
    await sendMail({
      _subject: "OTPC Bestellung " + order.id,
      name: order.name,
      email: order.email,
      bestellung: order.id,
      telefon: order.phone || "",
      adresse: order.street + ", " + order.zip + " " + order.city,
      zahlung: order.pay,
      summe: order.total,
      artikel: lines,
      status: order.status || "open"
    });
    const all = orders();
    if (!order.status) order.status = "open";
    if (!order.at) order.at = Date.now();
    all.unshift(order);
    saveOrders(all);
  };
})();
