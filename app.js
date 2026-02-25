/* out-gallery (Shop / Inventory UI)
   - Mobile-first list view
   - Filters + Saved (localStorage, no login)
   - VDP / listing profile view (full-screen) with swipe gallery + thumbnails
   - Images + Video tabs (video placeholder)
   - "Check availability / Chat / Text" opens a single no-login lead-capture modal
*/

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Demo media (placeholders) ----------
  const IMG_DARK = "assets/tesla-placeholder.png";
  const IMG_WHITE = "assets/tesla-model-Y.png";

  function demoImages(count = 10) {
    // Alternate between 2 placeholders so the gallery shows real behavior.
    const arr = [];
    for (let i = 0; i < count; i++) arr.push(i % 2 === 0 ? IMG_DARK : IMG_WHITE);
    return arr;
  }

  // ---------- Sample inventory (placeholders) ----------
  const INVENTORY = [
    {
      id: "out-001",
      year: 2022,
      make: "Tesla",
      model: "Model Y",
      trim: "Long Range",
      price: 38900,
      miles: 41250,
      autopilot: { level: "fsd", label: "Full Self‑Driving (Supervised)" },
      apSoftware: "2025.4 (placeholder)",
      apHardware: "HW4 (placeholder)",
      sellerType: "private",
      sellerName: "Private Seller",
      fleetVerified: true,
      historyReportUrl: "#",
      location: { city: "Austin", state: "TX" },
      vin: "5YJYGDEE9MF123456",
      images: demoImages(10),
      description: "Fleet‑verified private seller listing. Ask about service records and included accessories.",
      postedAt: "2026-02-20"
    },
    {
      id: "out-002",
      year: 2021,
      make: "Tesla",
      model: "Model 3",
      trim: "Performance",
      price: 34900,
      miles: 29800,
      autopilot: { level: "basic", label: "Autopilot (Basic)" },
      apSoftware: "Unknown",
      apHardware: "Unknown",
      sellerType: "dealer",
      sellerName: "Dealer Ad",
      fleetVerified: false,
      historyReportUrl: "#",
      location: { city: "San Diego", state: "CA" },
      vin: "5YJ3E1EC7MF234567",
      images: demoImages(10),
      description: "Dealer inventory feed (placeholder). Features may be dealer-supplied unless Fleet Verified.",
      postedAt: "2026-02-22"
    },
    {
      id: "out-003",
      year: 2020,
      make: "Tesla",
      model: "Model S",
      trim: "Long Range",
      price: 42900,
      miles: 61200,
      autopilot: { level: "fsd", label: "FSD Capability (Installed)" },
      apSoftware: "2025.4 (placeholder)",
      apHardware: "HW3 (placeholder)",
      sellerType: "private",
      sellerName: "Private Seller",
      fleetVerified: false,
      historyReportUrl: "",
      location: { city: "Scottsdale", state: "AZ" },
      vin: "5YJSA1E2XLF345678",
      images: demoImages(10),
      description: "",
      postedAt: "2026-02-18"
    },
    {
      id: "out-004",
      year: 2023,
      make: "Tesla",
      model: "Model X",
      trim: "Plaid",
      price: 79900,
      miles: 15500,
      autopilot: { level: "fsd", label: "Full Self‑Driving (Supervised)" },
      apSoftware: "Unknown",
      apHardware: "HW4 (placeholder)",
      sellerType: "dealer",
      sellerName: "Dealer Ad",
      fleetVerified: false,
      historyReportUrl: "#",
      location: { city: "Miami", state: "FL" },
      vin: "7SAXCBEF3PF456789",
      images: demoImages(10),
      description: "High-performance Plaid listing (placeholder). Tap to view photos and message the seller.",
      postedAt: "2026-02-23"
    },
    {
      id: "out-005",
      year: 2024,
      make: "Tesla",
      model: "Cybertruck",
      trim: "AWD",
      price: 89900,
      miles: 4200,
      autopilot: { level: "basic", label: "Autopilot (Basic)" },
      apSoftware: "2025.4 (placeholder)",
      apHardware: "HW4 (placeholder)",
      sellerType: "private",
      sellerName: "Private Seller",
      fleetVerified: true,
      historyReportUrl: "#",
      location: { city: "Nashville", state: "TN" },
      vin: "7SAXCDEG1RF567890",
      images: demoImages(10),
      description: "Connected seller (Fleet Verified). Ask for OUT‑CHECK if you want a shareable report link.",
      postedAt: "2026-02-21"
    }
  ];

  // ---------- State ----------
  const STORAGE_KEY = "out_gallery_saved";
  const state = {
    query: "",
    savedOnly: false,
    sort: "newest",
    filters: {
      sellerType: "any",
      models: [],
      yearMin: null,
      yearMax: null,
      priceMax: null,
      milesMax: null,
      autopilot: "any",
      fleetVerified: false,
      hasHistory: false,
      location: ""
    },
    savedIds: new Set(loadSavedIds()),
    activeListing: null,
    carouselIndex: 0,
    modalMode: "availability", // availability | chat | text
    activeTab: "images" // images | video
  };

  function loadSavedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persistSavedIds() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.savedIds)));
    } catch {}
  }

  // ---------- Helpers ----------
  function money(n) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  }

  function miles(n) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " mi";
  }

  function norm(s) {
    return String(s || "").toLowerCase().trim();
  }

  function includesLoose(haystack, needle) {
    return norm(haystack).includes(norm(needle));
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }

  function setView(view) {
    // view: "list" | "vdp"
    document.body.dataset.view = view;
    if (view === "vdp") {
      $("#listView").classList.remove("view-active");
      $("#vdpView").classList.add("view-active");
      $("#vdpView").setAttribute("aria-hidden", "false");
      $("#listView").setAttribute("aria-hidden", "true");
      // Make page feel like a new "screen" on mobile
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      $("#vdpView").classList.remove("view-active");
      $("#listView").classList.add("view-active");
      $("#vdpView").setAttribute("aria-hidden", "true");
      $("#listView").setAttribute("aria-hidden", "false");
    }
  }

  // ---------- Rendering (List) ----------
  function render() {
    $("#yearNow").textContent = new Date().getFullYear();
    updateSavedCount();

    const listEl = $("#list");
    listEl.innerHTML = "";

    const filtered = getFilteredInventory();

    $("#resultsCount").textContent = `${filtered.length} Tesla${filtered.length === 1 ? "" : "s"}`;
    $("#resultsSub").textContent = filtered.length
      ? "Tap a listing to view photos and contact the seller."
      : "No matches. Try clearing filters.";

    const empty = $("#emptyState");
    empty.hidden = filtered.length !== 0;

    filtered.forEach((car) => {
      listEl.appendChild(renderCard(car));
    });
  }

  function renderCard(car) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${car.year} ${car.make} ${car.model} ${car.trim}. ${money(car.price)}. ${miles(car.miles)}.`);

    const isSaved = state.savedIds.has(car.id);

    card.innerHTML = `
      <div class="card-media">
        <img src="${car.images[0]}" alt="${car.year} ${car.make} ${car.model}" loading="lazy"/>
        <div class="badge-row">
          <span class="badge ${car.sellerType === "dealer" ? "dark" : ""}">
            ${car.sellerType === "dealer" ? "Dealer Ad" : "Private Seller"}
          </span>
          ${car.fleetVerified ? `<span class="badge">Fleet Verified</span>` : ``}
          ${car.historyReportUrl ? `<span class="badge">History report</span>` : ``}
        </div>

        <button class="card-save ${isSaved ? "saved" : ""}" type="button" aria-label="${isSaved ? "Unsave" : "Save"} this Tesla">
          <span class="heart" aria-hidden="true">${isSaved ? "♥" : "♡"}</span>
        </button>
      </div>

      <div class="card-body">
        <div class="card-title">${car.year} ${car.make} ${car.model} — ${car.trim}</div>
        <div class="card-sub">${car.location.city}, ${car.location.state} • VIN ${car.vin.slice(-6)}</div>

        <div class="stat-row">
          <div class="price">${money(car.price)}</div>
          <div class="miles">${miles(car.miles)}</div>
        </div>

        <div class="kv" aria-label="Key details">
          <div class="line"><span class="key">Autopilot</span><span class="val">${car.autopilot.label}</span></div>
          <div class="line"><span class="key">Software / HW</span><span class="val">${car.apSoftware} • ${car.apHardware}</span></div>
        </div>

        <div class="card-actions" aria-label="Quick actions">
          <button class="cta" type="button">View</button>
          <button class="mini" type="button" aria-label="Chat"><span aria-hidden="true">💬</span></button>
        </div>
      </div>
    `;

    // Open VDP (profile view)
    card.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest(".card-save")) return;
      if (t.closest(".cta")) return;
      if (t.closest(".mini")) return;
      openVDP(car.id);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openVDP(car.id);
      }
    });

    // Save (no login)
    const saveBtn = $(".card-save", card);
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSave(car.id);
      saveBtn.classList.toggle("saved", state.savedIds.has(car.id));
      saveBtn.querySelector(".heart").textContent = state.savedIds.has(car.id) ? "♥" : "♡";
      saveBtn.setAttribute("aria-label", `${state.savedIds.has(car.id) ? "Unsave" : "Save"} this Tesla`);
      updateSavedCount();
      toast(state.savedIds.has(car.id) ? "Saved" : "Removed");
    });

    // View listing (from card primary CTA)
    $(".cta", card).addEventListener("click", (e) => {
      e.stopPropagation();
      openVDP(car.id);

      // Subtle nudge: highlight the "Check availability" button in the VDP (no auto-modal).
      requestAnimationFrame(() => {
        const btn = $("#availabilityBtn2");
        if (!btn) return;
        btn.classList.add("pulse");
        setTimeout(() => btn.classList.remove("pulse"), 1400);
      });
    });

    // Chat (from card)
    $(".mini", card).addEventListener("click", (e) => {
      e.stopPropagation();
      openVDP(car.id);
      openContactModal("chat");
    });

    return card;
  }

  function updateSavedCount() {
    $("#savedCountPill").textContent = String(state.savedIds.size);
  }

  // ---------- Filtering ----------
  function getFilteredInventory() {
    let arr = INVENTORY.slice();

    // Saved-only toggle
    if (state.savedOnly) {
      arr = arr.filter((c) => state.savedIds.has(c.id));
    }

    // Query
    if (state.query) {
      const q = norm(state.query);
      arr = arr.filter((c) => {
        return (
          includesLoose(`${c.year} ${c.make} ${c.model} ${c.trim}`, q) ||
          includesLoose(`${c.location.city} ${c.location.state}`, q) ||
          includesLoose(c.vin, q)
        );
      });
    }

    // Seller type
    const st = state.filters.sellerType;
    if (st !== "any") arr = arr.filter((c) => c.sellerType === st);

    // Model(s)
    if (state.filters.models.length) {
      arr = arr.filter((c) => state.filters.models.includes(c.model));
    }

    // Year range
    if (state.filters.yearMin != null) arr = arr.filter((c) => c.year >= state.filters.yearMin);
    if (state.filters.yearMax != null) arr = arr.filter((c) => c.year <= state.filters.yearMax);

    // Price + miles
    if (state.filters.priceMax != null) arr = arr.filter((c) => c.price <= state.filters.priceMax);
    if (state.filters.milesMax != null) arr = arr.filter((c) => c.miles <= state.filters.milesMax);

    // Autopilot
    if (state.filters.autopilot === "basic") arr = arr.filter((c) => c.autopilot.level === "basic");
    if (state.filters.autopilot === "fsd") arr = arr.filter((c) => c.autopilot.level === "fsd" || c.autopilot.level === "FSD");

    // Fleet verified
    if (state.filters.fleetVerified) arr = arr.filter((c) => c.fleetVerified);

    // History
    if (state.filters.hasHistory) arr = arr.filter((c) => !!c.historyReportUrl);

    // Location text
    if (state.filters.location) {
      const loc = norm(state.filters.location);
      arr = arr.filter((c) => includesLoose(`${c.location.city} ${c.location.state}`, loc));
    }

    // Sort
    arr.sort((a, b) => {
      if (state.sort === "newest") return new Date(b.postedAt) - new Date(a.postedAt);
      if (state.sort === "price-asc") return a.price - b.price;
      if (state.sort === "price-desc") return b.price - a.price;
      if (state.sort === "miles-asc") return a.miles - b.miles;
      if (state.sort === "miles-desc") return b.miles - a.miles;
      return 0;
    });

    return arr;
  }

  function toggleSave(id) {
    if (state.savedIds.has(id)) state.savedIds.delete(id);
    else state.savedIds.add(id);
    persistSavedIds();
  }

  // ---------- VDP / Listing Profile View ----------
  const carouselTrack = () => $("#carouselTrack");
  const thumbsEl = () => $("#thumbs");

  function makeBadge(text, dark) {
    const span = document.createElement("span");
    span.className = `badge ${dark ? "dark" : ""}`;
    span.textContent = text;
    return span;
  }

  function openVDP(id) {
    const car = INVENTORY.find((c) => c.id === id);
    if (!car) return;

    state.activeListing = car;
    state.carouselIndex = 0;
    state.activeTab = "images";

    // Update hash for share/deeplink
    const nextHash = `vdp=${encodeURIComponent(id)}`;
    if (location.hash.replace("#", "") !== nextHash) {
      location.hash = nextHash;
    }

    renderVDP(car);
    setView("vdp");
  }

  function closeVDP() {
    state.activeListing = null;
    setView("list");
    // Clear hash if we're currently on a vdp hash
    if (location.hash.startsWith("#vdp=")) {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  function renderVDP(car) {
    // Title + pricing
    $("#vdpTitle").textContent = `${car.year} ${car.make} ${car.model} — ${car.trim}`;
    $("#vdpPrice").textContent = money(car.price);
    $("#vdpMeta").textContent = `${miles(car.miles)} • ${car.location.city}, ${car.location.state}`;

    // Facts (quick scan)
    const facts = $("#vdpFacts");
    facts.innerHTML = "";
    facts.appendChild(fact("VIN", car.vin));
    facts.appendChild(fact("Seller", car.sellerType === "dealer" ? "Dealer Ad" : "Private Seller"));
    facts.appendChild(fact("Posted", prettyDate(car.postedAt)));

    // Autopilot section
    $("#vdpAutopilot").textContent = car.autopilot.label;
    const sw = car.apSoftware || "Unknown";
    const hw = car.apHardware || "Unknown";
    $("#vdpAutopilotSub").textContent = `Software: ${sw} • Hardware: ${hw}`;

    // Badges (over media)
    const badges = $("#vdpBadges");
    badges.innerHTML = "";
    badges.appendChild(makeBadge(car.sellerType === "dealer" ? "Dealer Ad" : "Private Seller", car.sellerType === "dealer"));
    if (car.fleetVerified) badges.appendChild(makeBadge("Fleet Verified", false));
    if (car.historyReportUrl) badges.appendChild(makeBadge("History report", false));

    // History link
    const link = $("#vdpHistoryLink");
    const none = $("#vdpHistoryNone");
    if (car.historyReportUrl) {
      link.hidden = false;
      none.hidden = true;
      link.href = car.historyReportUrl;
    } else {
      link.hidden = true;
      none.hidden = false;
    }

    // Seller card (profile-ish, minimal)
    const seller = $("#vdpSellerCard");
    const sellerTypeLabel = car.sellerType === "dealer" ? "Dealer" : "Private seller";
    const sellerNote =
      car.sellerType === "dealer"
        ? "Inventory feed listing. Features may be dealer‑supplied unless Fleet Verified."
        : car.fleetVerified
          ? "Connected seller — key features verified via Tesla Fleet API."
          : "Private seller listing. Ask for Fleet Verified / OUT‑CHECK if you want verified feature data.";
    seller.innerHTML = `
      <div class="seller-left">
        <div class="avatar" aria-hidden="true">${sellerTypeLabel === "Dealer" ? "D" : "P"}</div>
        <div>
          <div class="seller-name">${sellerTypeLabel}</div>
          <div class="seller-sub">${car.location.city}, ${car.location.state}</div>
        </div>
      </div>
      <div class="seller-right">
        <div class="seller-chip">${car.fleetVerified ? "Fleet Verified" : "Standard"}</div>
      </div>
      <div class="seller-note">${escapeHtml(sellerNote)}</div>
    `;

    // Description
    const desc = car.description ? car.description : "No description yet. Ask the seller for details.";
    $("#vdpDescription").textContent = desc;

    // Save button state on VDP
    syncVDPSaveButton();

    // Tabs default
    setMediaTab("images");

    // Gallery
    buildGallery(car);
  }

  function fact(label, value) {
    const div = document.createElement("div");
    div.className = "fact";
    div.innerHTML = `<div class="fact-k">${escapeHtml(label)}</div><div class="fact-v">${escapeHtml(value)}</div>`;
    return div;
  }

  function prettyDate(iso) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "—";
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildGallery(car) {
    const imgs = Array.isArray(car.images) && car.images.length ? car.images : [IMG_DARK];

    // Build slides
    const track = carouselTrack();
    track.innerHTML = "";
    imgs.forEach((src, i) => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `<img src="${src}" alt="${car.year} ${car.make} ${car.model} photo ${i + 1}" loading="lazy" />`;
      track.appendChild(slide);
    });

    // Build thumbnails
    const thumbs = thumbsEl();
    thumbs.innerHTML = "";
    imgs.forEach((src, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.setAttribute("aria-label", `View photo ${i + 1}`);
      b.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
      b.addEventListener("click", () => scrollToIndex(i));
      thumbs.appendChild(b);
    });

    // Reset index + scroll
    state.carouselIndex = 0;
    requestAnimationFrame(() => {
      track.scrollTo({ left: 0, behavior: "auto" });
      syncCarouselUI();
    });

    // Attach once: scroll listener
    track.onscroll = () => {
      const w = track.clientWidth || 1;
      const idx = Math.round(track.scrollLeft / w);
      if (idx !== state.carouselIndex) {
        state.carouselIndex = clamp(idx, 0, imgs.length - 1);
        syncCarouselUI();
      }
    };

    // Prev/next
    $("#carouselPrev").onclick = () => {
      scrollToIndex((state.carouselIndex - 1 + imgs.length) % imgs.length);
    };
    $("#carouselNext").onclick = () => {
      scrollToIndex((state.carouselIndex + 1) % imgs.length);
    };

    function scrollToIndex(i) {
      const idx = clamp(i, 0, imgs.length - 1);
      const w = track.clientWidth || 1;
      state.carouselIndex = idx;
      track.scrollTo({ left: idx * w, behavior: "smooth" });
      syncCarouselUI();
    }

    function syncCarouselUI() {
      $("#carouselCount").textContent = `${state.carouselIndex + 1} / ${imgs.length}`;
      $$(".thumb", thumbs).forEach((el, i) => el.classList.toggle("active", i === state.carouselIndex));

      // Keep active thumb in view on mobile
      const active = $(".thumb.active", thumbs);
      if (active) {
        active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    }
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // VDP top actions
  $("#vdpBack").addEventListener("click", () => {
    // Prefer browser back if hash exists
    if (location.hash.startsWith("#vdp=")) history.back();
    else closeVDP();
  });

  $("#vdpSave").addEventListener("click", () => {
    const car = state.activeListing;
    if (!car) return;
    toggleSave(car.id);
    syncVDPSaveButton();
    updateSavedCount();
    toast(state.savedIds.has(car.id) ? "Saved" : "Removed");
    render(); // keep list view cards in sync
  });

  function syncVDPSaveButton() {
    const car = state.activeListing;
    const btn = $("#vdpSave");
    const icon = $("#vdpSaveIcon");
    if (!car) return;
    const saved = state.savedIds.has(car.id);
    icon.textContent = saved ? "♥" : "♡";
    btn.setAttribute("aria-label", saved ? "Unsave this Tesla" : "Save this Tesla");
  }

  $("#vdpShare").addEventListener("click", async () => {
    const car = state.activeListing;
    if (!car) return;
    const url = window.location.href;
    const title = `${car.year} ${car.make} ${car.model} — ${car.trim}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        toast("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      // ignore
      toast("Copied (placeholder)");
    }
  });

  // Media tabs
  const tabImagesBtn = $("#tabImagesBtn");
  const tabVideoBtn = $("#tabVideoBtn");

  tabImagesBtn.addEventListener("click", () => setMediaTab("images"));
  tabVideoBtn.addEventListener("click", () => setMediaTab("video"));

  function setMediaTab(tab) {
    state.activeTab = tab;

    const isImages = tab === "images";
    tabImagesBtn.classList.toggle("active", isImages);
    tabVideoBtn.classList.toggle("active", !isImages);
    tabImagesBtn.setAttribute("aria-selected", isImages ? "true" : "false");
    tabVideoBtn.setAttribute("aria-selected", !isImages ? "true" : "false");

    $("#tabImages").classList.toggle("active", isImages);
    $("#tabVideo").classList.toggle("active", !isImages);
    $("#tabVideo").hidden = isImages;
  }

  // ---------- Sort Menu ----------
  const sortBtn = $("#sortBtn");
  const sortMenu = $("#sortMenu");
  const menuBackdrop = $("#menuBackdrop");

  function openSortMenu() {
    menuBackdrop.hidden = false;
    sortMenu.hidden = false;
    sortBtn.setAttribute("aria-expanded", "true");
    sortMenu.focus();
  }
  function closeSortMenu() {
    menuBackdrop.hidden = true;
    sortMenu.hidden = true;
    sortBtn.setAttribute("aria-expanded", "false");
  }

  sortBtn.addEventListener("click", () => {
    if (sortMenu.hidden) openSortMenu();
    else closeSortMenu();
  });
  menuBackdrop.addEventListener("click", closeSortMenu);

  $$(".menu-item", sortMenu).forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sort = btn.dataset.sort;
      toast(`Sort: ${btn.textContent}`);
      closeSortMenu();
      render();
    });
  });

  // ---------- Filters Drawer ----------
  const filtersBtn = $("#filtersBtn");
  const filtersDrawer = $("#filtersDrawer");
  const filtersBackdrop = $("#filtersBackdrop");
  const closeFiltersBtn = $("#closeFilters");
  const filtersForm = $("#filtersForm");

  function openFilters() {
    filtersBackdrop.hidden = false;
    filtersDrawer.classList.add("open");
    filtersDrawer.setAttribute("aria-hidden", "false");
    setTimeout(() => {
      const first = filtersDrawer.querySelector("input, select, button, textarea");
      if (first) first.focus();
    }, 0);
  }

  function closeFilters() {
    filtersBackdrop.hidden = true;
    filtersDrawer.classList.remove("open");
    filtersDrawer.setAttribute("aria-hidden", "true");
  }

  filtersBtn.addEventListener("click", openFilters);
  closeFiltersBtn.addEventListener("click", closeFilters);
  filtersBackdrop.addEventListener("click", closeFilters);

  // Populate years
  const yearMinSel = $("#yearMin");
  const yearMaxSel = $("#yearMax");
  const years = [];
  const nowY = new Date().getFullYear();
  for (let y = nowY; y >= 2012; y--) years.push(y);

  function addYearOptions(selectEl) {
    years.forEach((y) => {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      selectEl.appendChild(opt);
    });
  }
  addYearOptions(yearMinSel);
  addYearOptions(yearMaxSel);

  $("#resetFilters").addEventListener("click", () => {
    filtersForm.reset();
    state.filters = {
      sellerType: "any",
      models: [],
      yearMin: null,
      yearMax: null,
      priceMax: null,
      milesMax: null,
      autopilot: "any",
      fleetVerified: false,
      hasHistory: false,
      location: ""
    };
    toast("Filters reset");
    render();
  });

  $("#clearAllBtn").addEventListener("click", () => {
    $("#searchInput").value = "";
    state.query = "";
    filtersForm.reset();
    state.savedOnly = false;
    $("#toggleSavedOnly").textContent = "Show saved";
    state.filters = {
      sellerType: "any",
      models: [],
      yearMin: null,
      yearMax: null,
      priceMax: null,
      milesMax: null,
      autopilot: "any",
      fleetVerified: false,
      hasHistory: false,
      location: ""
    };
    closeFilters();
    toast("Cleared");
    render();
  });

  filtersForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(filtersForm);
    const sellerType = fd.get("sellerType") || "any";
    const models = fd.getAll("model");

    const yearMin = fd.get("yearMin") ? Number(fd.get("yearMin")) : null;
    const yearMax = fd.get("yearMax") ? Number(fd.get("yearMax")) : null;

    const priceMax = fd.get("priceMax") ? Number(fd.get("priceMax")) : null;
    const milesMax = fd.get("milesMax") ? Number(fd.get("milesMax")) : null;

    const autopilot = fd.get("autopilot") || "any";
    const fleetVerified = fd.get("fleetVerified") === "on";
    const hasHistory = fd.get("hasHistory") === "on";
    const location = String(fd.get("location") || "");

    state.filters = {
      sellerType,
      models,
      yearMin,
      yearMax,
      priceMax,
      milesMax,
      autopilot,
      fleetVerified,
      hasHistory,
      location
    };

    closeFilters();
    toast("Filters applied");
    render();
  });

  // Search
  const searchInput = $("#searchInput");
  let searchT = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      state.query = searchInput.value || "";
      render();
    }, 80);
  });

  // Saved toggle
  const toggleSavedOnly = $("#toggleSavedOnly");
  toggleSavedOnly.addEventListener("click", () => {
    state.savedOnly = !state.savedOnly;
    toggleSavedOnly.textContent = state.savedOnly ? "Show all" : "Show saved";
    render();
  });

  // Saved button also toggles saved-only
  $("#savedBtn").addEventListener("click", () => {
    state.savedOnly = true;
    toggleSavedOnly.textContent = "Show all";
    render();
    toast("Showing saved");
  });

  // ---------- Contact Modal (no login) ----------
  const modalBackdrop = $("#modalBackdrop");
  const modal = $("#availabilityModal");
  const closeModalBtn = $("#closeModal");
  const availabilityForm = $("#availabilityForm");

  function openContactModal(mode) {
    if (!state.activeListing) return;

    state.modalMode = mode || "availability";
    $("#modalTitle").textContent =
      mode === "chat" ? "Chat with seller" : mode === "text" ? "Text the seller" : "Check availability";
    $("#modalSub").textContent =
      mode === "chat"
        ? "We’ll start a chat thread and notify the seller."
        : mode === "text"
          ? "We’ll send your text message to the seller."
          : "We’ll send your message to the seller.";

    // Prefill message
    const car = state.activeListing;
    const msg =
      mode === "chat"
        ? `Hi — I’m interested in the ${car.year} ${car.model} (${car.trim}). Is it still available?`
        : mode === "text"
          ? `Hi — is the ${car.year} ${car.model} (${car.trim}) still available?`
          : `Hi — is this Tesla still available?`;
    $("#leadMessage").value = msg;

    // reset errors
    $("#emailError").hidden = true;
    $("#phoneError").hidden = true;

    modalBackdrop.hidden = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => $("#leadEmail").focus(), 0);
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  // VDP action buttons
  $("#availabilityBtn2").addEventListener("click", () => openContactModal("availability"));
  $("#chatBtn2").addEventListener("click", () => openContactModal("chat"));
  $("#textBtn2").addEventListener("click", () => openContactModal("text"));

  closeModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  function validateEmail(v) {
    const s = String(v || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }
  function normalizePhone(v) {
    return String(v || "").replace(/[^\d]/g, "");
  }
  function validatePhone(v) {
    const digits = normalizePhone(v);
    return digits.length >= 10 && digits.length <= 15;
  }

  availabilityForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = $("#leadEmail").value;
    const phone = $("#leadPhone").value;
    const message = $("#leadMessage").value;

    const okEmail = validateEmail(email);
    const okPhone = validatePhone(phone);

    $("#emailError").hidden = okEmail;
    $("#phoneError").hidden = okPhone;

    if (!okEmail || !okPhone) {
      toast("Fix the form to continue");
      return;
    }

    // Placeholder submit (replace with your backend / webhook)
    const car = state.activeListing;
    const payload = {
      listingId: car?.id,
      mode: state.modalMode,
      email,
      phone: normalizePhone(phone),
      consentSms: $("#smsConsent").checked,
      message,
      timestamp: new Date().toISOString()
    };

    console.log("LEAD (placeholder):", payload);

    closeModal();
    toast("Sent — seller notified (placeholder)");
  });

  // ---------- Yo‑Yo (UI placeholder) ----------
  const yoyoBtn = $("#yoyoBtn");
  const yoyoPanel = $("#yoyoPanel");
  const closeYoyo = $("#closeYoyo");
  const yoyoForm = $("#yoyoForm");
  const yoyoInput = $("#yoyoInput");
  const yoyoBody = $("#yoyoBody");

  function openYoyo() {
    yoyoPanel.classList.add("open");
    yoyoPanel.setAttribute("aria-hidden", "false");
    setTimeout(() => yoyoInput.focus(), 0);
  }
  function closeYoyoPanel() {
    yoyoPanel.classList.remove("open");
    yoyoPanel.setAttribute("aria-hidden", "true");
  }

  yoyoBtn.addEventListener("click", () => {
    if (yoyoPanel.classList.contains("open")) closeYoyoPanel();
    else openYoyo();
  });
  closeYoyo.addEventListener("click", closeYoyoPanel);

  yoyoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = yoyoInput.value.trim();
    if (!txt) return;

    const you = document.createElement("div");
    you.className = "chat-bubble user";
    you.textContent = txt;
    yoyoBody.appendChild(you);

    const bot = document.createElement("div");
    bot.className = "chat-bubble bot";
    bot.textContent = "Yo‑Yo (placeholder): I can help filter listings and connect you to sellers fast.";
    yoyoBody.appendChild(bot);

    yoyoInput.value = "";
    yoyoBody.scrollTop = yoyoBody.scrollHeight;
  });

  // ---------- Routing (hash) ----------
  function handleHash() {
    const h = location.hash || "";
    if (h.startsWith("#vdp=")) {
      const id = decodeURIComponent(h.replace("#vdp=", ""));
      const car = INVENTORY.find((c) => c.id === id);
      if (car) {
        state.activeListing = car;
        renderVDP(car);
        setView("vdp");
        return;
      }
    }
    // default
    setView("list");
  }

  window.addEventListener("hashchange", handleHash);

  // ---------- Global keys ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSortMenu();
      closeFilters();
      closeModal();
      if (document.body.dataset.view === "vdp") closeVDP();
    }
  });

  // ---------- Init ----------
  document.body.dataset.view = "list";
  render();
  handleHash();
})();
