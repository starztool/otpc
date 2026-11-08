(() => {
  const root = document.querySelector("#otpc-config");
  if (!root) return;

  const eur = (n) =>
    n.toLocaleString("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 });

  const CATALOG = {
    case: [
      { id: "void", name: "VOID Mid-Tower", form: "atx", price: 129, note: "ATX / mATX / ITX" },
      { id: "phantom", name: "PHANTOM Mini-ITX", form: "itx", price: 169, note: "nur ITX" },
      { id: "obsidian", name: "OBSIDIAN Workstation", form: "atx", price: 189, note: "ATX, viel Luft" },
      { id: "silent", name: "SILENT Dämmgehäuse", form: "atx", price: 149, note: "gedämmt, leise" },
    ],
    cpu: [
      { id: "r5-7600", name: "Ryzen 5 7600", socket: "am5", price: 189 },
      { id: "r7-7800x3d", name: "Ryzen 7 7800X3D", socket: "am5", price: 359 },
      { id: "r7-9800x3d", name: "Ryzen 7 9800X3D", socket: "am5", price: 479 },
      { id: "r9-9950x", name: "Ryzen 9 9950X", socket: "am5", price: 589 },
      { id: "i5-14600k", name: "Core i5-14600K", socket: "lga1700", price: 289 },
      { id: "i7-14700k", name: "Core i7-14700K", socket: "lga1700", price: 389 },
    ],
    mobo: [
      { id: "b650-atx", name: "B650 ATX", socket: "am5", form: "atx", price: 179 },
      { id: "x670-atx", name: "X670 ATX", socket: "am5", form: "atx", price: 289 },
      { id: "b650-itx", name: "B650 Mini-ITX", socket: "am5", form: "itx", price: 219 },
      { id: "z790-atx", name: "Z790 ATX", socket: "lga1700", form: "atx", price: 249 },
      { id: "b760-itx", name: "B760 Mini-ITX", socket: "lga1700", form: "itx", price: 199 },
    ],
    gpu: [
      { id: "4060ti", name: "RTX 4060 Ti 16GB", tdp: 165, price: 439 },
      { id: "4070s", name: "RTX 4070 Super", tdp: 220, price: 589 },
      { id: "4070tis", name: "RTX 4070 Ti Super", tdp: 285, price: 789 },
      { id: "4080s", name: "RTX 4080 Super", tdp: 320, price: 1099 },
      { id: "4090", name: "RTX 4090", tdp: 450, price: 1799 },
    ],
    ram: [
      { id: "32", name: "32 GB DDR5-6000", price: 119 },
      { id: "64", name: "64 GB DDR5-6000", price: 219 },
    ],
    storage: [
      { id: "1tb", name: "1 TB NVMe Gen4", price: 89 },
      { id: "2tb", name: "2 TB NVMe Gen4", price: 149 },
      { id: "4tb", name: "4 TB NVMe Gen4", price: 279 },
    ],
    psu: [
      { id: "750", name: "750 W Gold", watt: 750, price: 109 },
      { id: "850", name: "850 W Gold", watt: 850, price: 139 },
      { id: "1000", name: "1000 W Gold", watt: 1000, price: 179 },
    ],
    cooler: [
      { id: "air", name: "Luftkühler Dual-Tower", price: 59 },
      { id: "240", name: "240 mm AIO", price: 99 },
      { id: "360", name: "360 mm AIO", price: 139 },
    ],
  };

  const LABELS = {
    case: "Gehäuse",
    cpu: "Prozessor",
    mobo: "Mainboard",
    gpu: "Grafikkarte",
    ram: "Arbeitsspeicher",
    storage: "Speicher",
    psu: "Netzteil",
    cooler: "Kühlung",
  };

  const ORDER = ["case", "cpu", "mobo", "gpu", "ram", "storage", "psu", "cooler"];
  const ASSEMBLY = 89;

  const PRESETS = {
    gaming: { case: "void", cpu: "r7-7800x3d", mobo: "b650-atx", gpu: "4070tis", ram: "32", storage: "2tb", psu: "850", cooler: "240" },
    itx: { case: "phantom", cpu: "r5-7600", mobo: "b650-itx", gpu: "4070s", ram: "32", storage: "1tb", psu: "750", cooler: "240" },
    work: { case: "obsidian", cpu: "r9-9950x", mobo: "x670-atx", gpu: "4080s", ram: "64", storage: "4tb", psu: "1000", cooler: "360" },
    silent: { case: "silent", cpu: "r5-7600", mobo: "b650-atx", gpu: "4060ti", ram: "32", storage: "1tb", psu: "750", cooler: "air" },
  };

  const find = (cat, id) => CATALOG[cat].find((x) => x.id === id);
  const state = { ...PRESETS.gaming };

  function formOk(box, board) {
    if (!box || !board) return true;
    if (box.form === "itx") return board.form === "itx";
    return true;
  }

  function options(cat) {
    const cpu = find("cpu", state.cpu);
    const box = find("case", state.case);
    return CATALOG[cat].filter((item) => {
      if (cat === "mobo") {
        if (cpu && item.socket !== cpu.socket) return false;
        if (!formOk(box, item)) return false;
      }
      return true;
    });
  }

  function fixCompat() {
    const mobos = options("mobo");
    if (!mobos.some((m) => m.id === state.mobo)) state.mobo = mobos[0]?.id || state.mobo;
  }

  function warnings() {
    const gpu = find("gpu", state.gpu);
    const psu = find("psu", state.psu);
    const box = find("case", state.case);
    const board = find("mobo", state.mobo);
    const cpu = find("cpu", state.cpu);
    const msgs = [];
    if (gpu && psu && psu.watt < gpu.tdp + 350) msgs.push("Netzteil eher knapp für diese GPU. Lieber eine Stufe höher.");
    if (cpu && board && cpu.socket !== board.socket) msgs.push("CPU und Mainboard passen nicht zusammen.");
    if (box && board && !formOk(box, board)) msgs.push("Mainboard passt nicht ins Gehäuse.");
    if (box?.form === "itx" && state.cooler === "360") msgs.push("360 mm AIO ist im Mini-ITX meist zu groß. 240 mm ist sicherer.");
    return msgs;
  }

  function total() {
    return ORDER.reduce((n, cat) => n + (find(cat, state[cat])?.price || 0), 0) + ASSEMBLY;
  }

  function summaryLines() {
    return ORDER.map((cat) => {
      const item = find(cat, state[cat]);
      return { cat, label: LABELS[cat], name: item?.name || "—", price: item?.price || 0 };
    });
  }

  function render() {
    fixCompat();
    const warn = warnings();
    const lines = summaryLines();
    const presetBtns = [
      ["gaming", "Gaming 1440p"],
      ["itx", "Mini-ITX"],
      ["work", "Workstation"],
      ["silent", "Leise"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" class="cfg-chip${JSON.stringify(PRESETS[id]) === JSON.stringify(state) ? " is-on" : ""}" data-preset="${id}">${label}</button>`
      )
      .join("");

    const rows = ORDER.map((cat) => {
      const opts = options(cat)
        .map((item) => {
          const extra = item.note ? ` · ${item.note}` : item.socket ? ` · ${item.socket.toUpperCase()}` : item.form ? ` · ${item.form.toUpperCase()}` : "";
          return `<option value="${item.id}" ${item.id === state[cat] ? "selected" : ""}>${item.name}${extra} — ${eur(item.price)}</option>`;
        })
        .join("");
      const item = find(cat, state[cat]);
      return `<label class="cfg-row">
        <span class="cfg-row__lab">${LABELS[cat]}</span>
        <select class="field cfg-row__sel" data-cat="${cat}">${opts}</select>
        <span class="cfg-row__price">${item ? eur(item.price) : "—"}</span>
      </label>`;
    }).join("");

    root.innerHTML = `
      <div class="cfg">
        <div class="cfg__top">
          <div>
            <p class="cfg-kicker">PC-Konfigurator</p>
            <h2 class="cfg-title">Dein Build</h2>
            <p class="cfg-sub">Komponenten wählen. Unpassende Teile filtert das Tool. Zusammenbau und Test in der Schweiz sind drin.</p>
          </div>
          <div class="cfg-presets">${presetBtns}</div>
        </div>
        <div class="cfg__grid">
          <div class="cfg-list">${rows}</div>
          <aside class="cfg-sum">
            <p class="cfg-kicker">Zusammenfassung</p>
            <ul class="cfg-sum__list">
              ${lines.map((l) => `<li><span>${l.label}</span><b>${l.name}</b><em>${eur(l.price)}</em></li>`).join("")}
              <li><span>Service</span><b>Zusammenbau + Test</b><em>${eur(ASSEMBLY)}</em></li>
            </ul>
            ${warn.length ? `<p class="cfg-warn">${warn.join("<br>")}</p>` : ""}
            <p class="cfg-total"><span>Gesamt</span><strong>${eur(total())}</strong></p>
            <button type="button" class="btn btn--solid" id="cfg-add" style="width:100%">In den Warenkorb</button>
            <button type="button" class="btn btn--ghost" id="cfg-buy" style="width:100%;margin-top:.5rem;">Zur Kasse</button>
            <p class="cfg-hint">Swiss Made. Fertig gebaut, getestet, verschickt. Kein Bausatz.</p>
          </aside>
        </div>
      </div>`;

    root.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Object.assign(state, PRESETS[btn.dataset.preset]);
        render();
      });
    });
    root.querySelectorAll("[data-cat]").forEach((sel) => {
      sel.addEventListener("change", () => {
        state[sel.dataset.cat] = sel.value;
        render();
      });
    });
    root.querySelector("#cfg-add")?.addEventListener("click", () => addToCart(false));
    root.querySelector("#cfg-buy")?.addEventListener("click", () => addToCart(true));
  }

  function checkoutPath() {
    if (typeof window.Shopify !== "undefined") {
      const root = (window.Shopify.routes && window.Shopify.routes.root) || "/";
      return (root.endsWith("/") ? root : root + "/") + "checkout";
    }
    return "checkout.html";
  }

  async function addToCart(goCheckout) {
    const lines = summaryLines();
    const title = "OTPC Custom PC";
    const price = eur(total());
    const props = Object.fromEntries(lines.map((l) => [l.label, l.name]));
    props["Zusammenbau"] = "ja";
    const variant = Number(root.dataset.variant || 0);
    const shopify = typeof window.Shopify !== "undefined" && variant;

    if (shopify) {
      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: variant, quantity: 1, properties: props }],
        }),
      });
      if (goCheckout) {
        location.href = checkoutPath();
        return;
      }
      document.querySelector("[data-open='#cart-drawer']")?.click();
      return;
    }

    const key = "otpc-cart";
    let items = [];
    try { items = JSON.parse(localStorage.getItem(key) || "[]"); } catch { items = []; }
    const spec = lines.map((l) => `${l.label}: ${l.name}`).join(" · ");
    items.push({ id: "cfg-" + Date.now(), title, price, qty: 1, spec });
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event("otpc-cart-change"));
    if (goCheckout) {
      location.href = checkoutPath();
      return;
    }
    document.querySelector("[data-open='#cart-drawer']")?.click();
  }

  const q = new URLSearchParams(location.search).get("preset");
  if (q && PRESETS[q]) Object.assign(state, PRESETS[q]);
  render();
})();
