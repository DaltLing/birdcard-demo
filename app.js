/* birdcard Phase 1 demo — mock identify + localStorage collection */
(function () {
  "use strict";

  const SPECIES = window.BIRDCARD_SPECIES || [];

  const REGION_BIAS = {
    northeast: ["american-robin","blue-jay","black-capped-chickadee","northern-cardinal","tufted-titmouse","baltimore-oriole","white-breasted-nuthatch"],
    southeast: ["northern-cardinal","carolina-wren","northern-mockingbird","ruby-throated-hummingbird","indigo-bunting","mourning-dove","blue-jay"],
    midwest: ["american-robin","red-winged-blackbird","american-goldfinch","downy-woodpecker","house-finch","song-sparrow","american-crow"],
    southwest: ["house-finch","mourning-dove","northern-mockingbird","great-horned-owl","red-tailed-hawk","house-sparrow","canada-goose"],
    west: ["house-finch","american-crow","red-tailed-hawk","great-blue-heron","mallard","dark-eyed-junco","cedar-waxwing"],
    "pacific-nw": ["american-robin","dark-eyed-junco","bald-eagle","great-blue-heron","black-capped-chickadee","pileated-woodpecker","canada-goose"],
    rockies: ["dark-eyed-junco","american-robin","black-capped-chickadee","red-tailed-hawk","bald-eagle","mallard","northern-flicker"],
    "canada-north": ["canada-goose","black-capped-chickadee","dark-eyed-junco","bald-eagle","american-crow","great-horned-owl","mallard"]
  };

  const STORAGE_KEY = "birdcard-demo-collection-v1";
  const REGION_KEY = "birdcard-demo-region-v1";

  const state = {
    screen: "landing",
    region: localStorage.getItem(REGION_KEY) || "",
    photoDataUrl: null,
    candidates: [],
    selectedId: null,
    detailId: null
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function loadCollection() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveCollection(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function speciesById(id) {
    return SPECIES.find((s) => s.id === id);
  }

  function regionLabel(value) {
    const opt = [...$("#region").options].find((o) => o.value === value);
    return opt ? opt.textContent : "—";
  }

  function showScreen(name) {
    state.screen = name;
    $$(".screen").forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
    $$(".nav button").forEach((b) => {
      const map = { landing: "nav-home", capture: "nav-spot", identify: "nav-spot", region: "nav-spot", collection: "nav-deck", detail: "nav-deck" };
      b.classList.toggle("active", b.id === map[name]);
    });
    if (name === "collection") renderCollection();
    if (name === "capture") {
      $("#region-label").textContent = regionLabel(state.region);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mockIdentify() {
    const bias = (REGION_BIAS[state.region] || []).filter((id) => speciesById(id));
    const pool = bias.length ? bias : SPECIES.map((s) => s.id);
    const top = pool[Math.floor(Math.random() * pool.length)];
    const others = shuffle(SPECIES.map((s) => s.id).filter((id) => id !== top)).slice(0, 3);
    const confs = [0.72 + Math.random() * 0.22, 0.35 + Math.random() * 0.25, 0.18 + Math.random() * 0.15, 0.08 + Math.random() * 0.1]
      .map((n) => Math.round(n * 100) / 100)
      .sort((a, b) => b - a);
    const ids = [top, ...others];
    return ids.map((id, i) => ({ id, confidence: confs[i], species: speciesById(id) }));
  }

  function renderGuess() {
    const top = state.candidates.find((c) => c.id === state.selectedId) || state.candidates[0];
    if (!top) return;
    $("#guess-img").src = top.species.reference_image_url;
    $("#guess-img").alt = top.species.common_name;
    $("#guess-name").textContent = top.species.common_name;
    $("#guess-sci").textContent = top.species.scientific_name;
    $("#guess-conf").textContent = Math.round(top.confidence * 100) + "%";

    const box = $("#candidates");
    box.innerHTML = "";
    state.candidates.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cand" + (c.id === state.selectedId ? " selected" : "");
      btn.innerHTML = `<img src="${c.species.reference_image_url}" alt="" /><div><strong>${c.species.common_name}</strong><div class="muted" style="font-size:.8rem">${c.species.scientific_name}</div></div><div class="pct">${Math.round(c.confidence * 100)}%</div>`;
      btn.addEventListener("click", () => {
        state.selectedId = c.id;
        renderGuess();
      });
      box.appendChild(btn);
    });
  }

  function renderCollection() {
    const items = loadCollection();
    $("#collection-count").textContent = String(items.length);
    const empty = $("#collection-empty");
    const grid = $("#collection-grid");
    if (!items.length) {
      empty.hidden = false;
      grid.hidden = true;
      grid.innerHTML = "";
      return;
    }
    empty.hidden = true;
    grid.hidden = false;
    grid.innerHTML = "";
    items.forEach((card) => {
      const sp = speciesById(card.speciesId) || { common_name: "Unknown", reference_image_url: "" };
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      const imgSrc = card.photoDataUrl || sp.reference_image_url;
      btn.innerHTML = `<img src="${imgSrc}" alt="" /><div class="meta"><strong>${sp.common_name}</strong><span>${Math.round((card.confidence || 0) * 100)}% · ${regionLabel(card.region)}</span></div>`;
      btn.addEventListener("click", () => openDetail(card.id));
      grid.appendChild(btn);
    });
  }

  function openDetail(cardId) {
    const card = loadCollection().find((c) => c.id === cardId);
    if (!card) return;
    const sp = speciesById(card.speciesId);
    if (!sp) return;
    state.detailId = cardId;
    $("#detail-photo").src = card.photoDataUrl || sp.reference_image_url;
    $("#detail-name").textContent = sp.common_name;
    $("#detail-sci").textContent = sp.scientific_name;
    $("#detail-when").textContent = new Date(card.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    $("#detail-region").textContent = regionLabel(card.region);
    $("#detail-habitat").textContent = sp.habitat;
    $("#detail-appearance").textContent = sp.appearance;
    $("#detail-range").textContent = sp.range_summary;
    showScreen("detail");
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  $("#btn-start").addEventListener("click", () => {
    if (state.region) $("#region").value = state.region;
    $("#btn-region-next").disabled = !$("#region").value;
    showScreen("region");
  });
  $("#btn-skip-collection").addEventListener("click", () => showScreen("collection"));

  $("#region").addEventListener("change", (e) => {
    state.region = e.target.value;
    localStorage.setItem(REGION_KEY, state.region);
    $("#btn-region-next").disabled = !state.region;
  });
  $("#btn-region-next").addEventListener("click", () => {
    if (!state.region) return;
    showScreen("capture");
  });

  $("#photo-input").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      state.photoDataUrl = dataUrl;
      const img = $("#preview-img");
      img.src = dataUrl;
      img.hidden = false;
      $("#preview-placeholder").hidden = true;
      $("#btn-identify").disabled = false;
    } catch {
      toast("Could not read that image");
    }
  });

  $("#btn-identify").addEventListener("click", async () => {
    if (!state.photoDataUrl) return;
    showScreen("identify");
    $("#identify-loading").hidden = false;
    $("#identify-result").hidden = true;
    await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));
    state.candidates = mockIdentify();
    state.selectedId = state.candidates[0].id;
    $("#identify-loading").hidden = true;
    $("#identify-result").hidden = false;
    renderGuess();
  });

  $("#btn-retake").addEventListener("click", () => showScreen("capture"));

  $("#btn-confirm").addEventListener("click", () => {
    const pick = state.candidates.find((c) => c.id === state.selectedId);
    if (!pick) return;
    const items = loadCollection();
    const card = {
      id: "card-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      speciesId: pick.id,
      confidence: pick.confidence,
      region: state.region,
      photoDataUrl: state.photoDataUrl,
      createdAt: new Date().toISOString()
    };
    items.unshift(card);
    saveCollection(items);
    toast("Card added to your collection! 🍃");
    state.photoDataUrl = null;
    $("#preview-img").hidden = true;
    $("#preview-img").removeAttribute("src");
    $("#preview-placeholder").hidden = false;
    $("#btn-identify").disabled = true;
    $("#photo-input").value = "";
    openDetail(card.id);
  });

  $("#btn-delete-card").addEventListener("click", () => {
    if (!state.detailId) return;
    const next = loadCollection().filter((c) => c.id !== state.detailId);
    saveCollection(next);
    state.detailId = null;
    toast("Card removed");
    showScreen("collection");
  });

  $$("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => {
      const dest = el.getAttribute("data-nav");
      if (dest === "capture" && !state.region) {
        showScreen("region");
        toast("Pick a region first");
        return;
      }
      if (dest === "spot") return;
      showScreen(dest);
    });
  });

  if (state.region) {
    $("#region").value = state.region;
    $("#btn-region-next").disabled = false;
  }
  showScreen("landing");
})();
