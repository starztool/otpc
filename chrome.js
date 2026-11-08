(() => {
  const here = (location.pathname.split("/").pop() || "index.html").replace(/^\s+/, "") || "index.html";
  const closeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg>`;
  let session = null;
  try { session = JSON.parse(localStorage.getItem("otpc-session") || "null"); } catch (e) { session = null; }
  document.write(`
    <header class="header">
      <div class="header__inner">
        <div class="header__brand">
          <button class="menu-btn" type="button" data-open="#nav-drawer" aria-expanded="false" aria-controls="nav-drawer" aria-label="Produkte">
            <span></span><span></span><span></span>
          </button>
          <a class="logo" href="index.html">OTPC</a>
        </div>
        <div class="header__tools">
          <button class="header__link" type="button" data-open="#search-drawer" aria-expanded="false" aria-controls="search-drawer">Suchen</button>
          <button class="header__link" type="button" data-open="#account-pop" aria-expanded="false" aria-controls="account-pop">Konto</button>
          <button class="header__link" type="button" data-open="#cart-drawer" aria-expanded="false" aria-controls="cart-drawer">
            Warenkorb
            <span class="cart-count" data-cart-count hidden>0</span>
          </button>
        </div>
      </div>
    </header>
    <div class="nav-drawer" id="nav-drawer">
      <div class="nav-drawer__bg"></div>
      <div class="nav-drawer__panel">
        <div class="drawer__head">
          <span class="logo">OTPC</span>
          <button type="button" class="icon-btn" data-close aria-label="Schließen">${closeSvg}</button>
        </div>
        <nav class="menu-panel" aria-label="Seiten">
          <div class="menu-group">
            <a href="shop.html"${["shop.html", "produkt-1.html", "produkt-2.html", "produkt-3.html"].indexOf(here) >= 0 ? ' class="is-active"' : ""}>Produkte</a>
          </div>
          <div class="menu-group">
            <h3>Bauen</h3>
            <a href="konfigurator.html"${here === "konfigurator.html" ? ' class="is-active"' : ""}>Konfiguration</a>
          </div>
          <div class="menu-group">
            <h3>Feedback</h3>
            <a href="feedback.html"${here === "feedback.html" ? ' class="is-active"' : ""}>Bewertung posten</a>
          </div>
          <div class="menu-group">
            <h3>OTPC</h3>
            <a href="about.html"${here === "about.html" ? ' class="is-active"' : ""}>Über uns</a>
            <a href="contact.html"${here === "contact.html" ? ' class="is-active"' : ""}>Kontakt</a>
            <a href="${session ? "account.html" : "login.html"}"${here === "login.html" || here === "account.html" || here === "register.html" ? ' class="is-active"' : ""}>${session ? "Konto" : "Anmelden"}</a>
          </div>
        </nav>
      </div>
    </div>
    <div class="search-drawer" id="search-drawer">
      <div class="search-drawer__bg" data-close></div>
      <div class="search-drawer__panel">
        <div class="drawer__head">
          <span>Produkt suchen</span>
          <button type="button" class="icon-btn" data-close aria-label="Schließen">${closeSvg}</button>
        </div>
        <form class="search-drawer__form" action="search.html" method="get" role="search">
          <input class="field" type="search" name="q" placeholder="Produkt 1, Prebuild…" aria-label="Suchbegriff">
          <button class="btn btn--solid" type="submit">Suchen</button>
        </form>
      </div>
    </div>
    <div class="account-pop" id="account-pop">
      <div class="account-pop__bg" data-close></div>
      <div class="account-pop__panel" role="dialog" aria-label="Konto">
        <div class="account-pop__head">
          <h2>${session ? "Konto" : "Anmelden"}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Schließen">${closeSvg}</button>
        </div>
        ${session ? `<p class="account-pop__who">${session.email}</p>
        <nav class="account-pop__links" aria-label="Konto">
          <a href="account.html">Bestellungen</a>
          <a href="account.html#profil">Profil</a>
          <a href="login.html?out=1">Abmelden</a>
        </nav>` : `<form class="form" action="login.html" method="get">
          <label class="field-lab">E-Mail
            <input class="field" type="email" name="email" placeholder="Email" autocomplete="email" required>
          </label>
          <a class="btn btn--solid" href="login.html" style="display:block;text-align:center;">Anmelden</a>
        </form>
        <nav class="account-pop__links" aria-label="Konto">
          <a href="register.html">Konto erstellen</a>
          <a href="login.html">Passwort vergessen</a>
        </nav>`}
      </div>
    </div>
    <div class="drawer" id="cart-drawer">
      <div class="drawer__bg"></div>
      <div class="drawer__panel">
        <div class="drawer__head">Warenkorb<button type="button" class="icon-btn" data-close aria-label="Schließen">${closeSvg}</button></div>
        <p id="cart-note" class="eyebrow">Leer</p>
        <div data-cart-list><p style="color:var(--mute);">Warenkorb ist leer.</p></div>
      </div>
    </div>
  `);
})();
