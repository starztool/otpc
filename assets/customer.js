(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const login = $("#login");
  const recover = $("#recover");
  const showRecover = () => {
    if (!login || !recover) return;
    login.hidden = true;
    recover.hidden = false;
    recover.querySelector("input")?.focus();
  };
  const showLogin = () => {
    if (!login || !recover) return;
    recover.hidden = true;
    login.hidden = false;
    login.querySelector("input")?.focus();
  };

  $$("[data-show-recover]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showRecover();
      history.replaceState(null, "", "#recover");
    });
  });
  $$("[data-show-login]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showLogin();
      history.replaceState(null, "", window.location.pathname);
    });
  });
  if (window.location.hash === "#recover") showRecover();

  $$("[data-address-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = $(btn.dataset.addressToggle);
      if (!box) return;
      box.hidden = !box.hidden;
    });
  });

  $$("[data-address-country]").forEach((country) => {
    const id = country.dataset.addressCountry;
    const province = document.getElementById(`AddressProvince_${id}`);
    const wrap = document.getElementById(`AddressProvinceWrap_${id}`);
    if (window.Shopify && Shopify.CountryProvinceSelector && province) {
      new Shopify.CountryProvinceSelector(country.id, province.id, {
        hideElement: wrap ? wrap.id : null,
      });
    }
  });

  const shopify = typeof window.Shopify !== "undefined";
  if (!shopify) {
    $$("form.form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        if (form.querySelector("[name='id']")) return;
        e.preventDefault();
        if (form.id === "login-form" || form.querySelector("[name='customer[first_name]']")) {
          window.location.href = "account.html";
          return;
        }
        let note = form.querySelector("[data-preview-note]");
        if (!note) {
          note = document.createElement("div");
          note.className = "form-status form-status--ok";
          note.setAttribute("data-preview-note", "");
          form.prepend(note);
        }
        note.hidden = false;
        note.textContent = form.id === "ContactForm"
          ? "Danke, wir haben deine Nachricht und melden uns."
          : "Wenn ein Konto mit dieser E-Mail existiert, ist der Reset-Link unterwegs.";
      });
    });
  }
})();
