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
          <strong>${o.id}</strong> · ${o.total} · ${o.pay}<br>
          <span style="color:var(--mute)">${o.street}, ${o.zip} ${o.city}</span>
        </article>`
      )).join("");
    }
  }

  window.otpcSendOrder = async function (order) {
    const lines = (order.items || []).map((i) => i.title + " × " + i.qty + " · " + i.price).join("\n");
    await sendMail({
      _subject: "OTPC Bestellung " + order.id,
      name: order.name,
      email: order.email,
      bestellung: order.id,
      adresse: order.street + ", " + order.zip + " " + order.city,
      zahlung: order.pay,
      summe: order.total,
      artikel: lines
    });
    const all = orders();
    all.unshift(order);
    saveOrders(all);
  };
})();
