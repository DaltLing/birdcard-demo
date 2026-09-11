/* birdcard Phase 1 demo — BirdWatcher identify + optional offline mock */
(function () {
  "use strict";

  const SPECIES = window.BIRDCARD_SPECIES || [];

  const IDENTIFY_URL = "https://sqemrtitkgrpfotzwjbf.supabase.co/functions/v1/identify";
  // BirdWatcher legacy anon (publishable) key — safe for public demo
  const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZW1ydGl0a2dycGZvdHp3amJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTA5NjksImV4cCI6MjEwNDA2Njk2OX0.jzEh0EmQjD6II6uQkLTdpYshfP_DEFNPoJVTlrHCK6Q";

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
  const MOCK_KEY = "birdcard-demo-use-mock-v1";

  const state = {
    screen: "landing",
    region: localStorage.getItem(REGION_KEY) || "",
    photoDataUrl: null,
    candidates: [],
    selectedId: null,
    detailId: null,
    provider: null,
    lowConfidence: false
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  function toast(msg, ms) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), ms || 2200);
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

  function useOfflineMock() {
    const el = $("#use-mock");
    return !!(el && el.checked);
  }

  function mimeFromDataUrl(dataUrl) {
    const m = /^data:([^;]+);/i.exec(dataUrl || "");
    return m ? m[1] : "image/jpeg";
  }

  function prettyProvider(name) {
    if (!name) return "AI";
    const n = String(name);
    if (/^mock$/i.test(n)) return "offline mock";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  const BIRD_FACTS = [
    "A hummingbird's heart can beat more than 1,200 times per minute in flight.",
    "Many songbirds sleep with one eye open — half their brain stays alert for predators.",
    "Crows can recognize individual human faces and remember who was kind (or not).",
    "Owls don't turn their heads all the way around, but they can rotate about 270°.",
    "Some penguins propose with a carefully chosen pebble — romance, Antarctic edition.",
    "Flamingos aren't born pink; their color comes from the carotenoids in their diet.",
    "Arctic terns migrate pole-to-pole — one of the longest journeys in the animal kingdom.",
    "Woodpeckers have shock-absorbing skulls that help them hammer without a headache.",
    "Pigeons can detect Earth's magnetic field and use it like a built-in compass.",
    "A group of flamingos is called a flamboyance — yes, really.",
    "Chickadees hide thousands of seeds and remember most of the stash locations.",
    "Albatrosses can glide for hours without flapping, riding ocean winds.",
    "Parrots can learn hundreds of words, but they also invent playful vocal games.",
    "Some ducks sleep while floating, with one hemisphere of the brain still online.",
    "Blue jays plant oaks by caching acorns — accidental forest gardeners.",
    "The bee hummingbird is the world's smallest bird — about the size of a large bumblebee.",
    "Ravens have been seen using tools and even planning for future snacks.",
    "Many migratory birds navigate by the stars on clear nights."
  ];

  let factTimer = null;
  let factFadeTimer = null;
  let factIndex = 0;

  function stopFactRotator() {
    if (factTimer) {
      clearTimeout(factTimer);
      factTimer = null;
    }
    if (factFadeTimer) {
      clearTimeout(factFadeTimer);
      factFadeTimer = null;
    }
  }

  function nextFactIntervalMs() {
    return 3500 + Math.floor(Math.random() * 1001);
  }

  function showFact(text, animate) {
    const el = $("#identify-fact");
    if (!el) return;
    if (!animate) {
      el.classList.remove("is-fading");
      el.textContent = text;
      return;
    }
    el.classList.add("is-fading");
    factFadeTimer = setTimeout(() => {
      el.textContent = text;
      el.classList.remove("is-fading");
      factFadeTimer = null;
    }, 280);
  }

  function startFactRotator() {
    stopFactRotator();
    const order = shuffle(BIRD_FACTS);
    factIndex = 0;
    showFact(order[0], false);
    const schedule = () => {
      factTimer = setTimeout(() => {
        factIndex = (factIndex + 1) % order.length;
        showFact(order[factIndex], true);
        schedule();
      }, nextFactIntervalMs());
    };
    schedule();
  }

  function setIdentifyLoading(active) {
    const screen = $("#screen-identify");
    const loading = $("#identify-loading");
    const result = $("#identify-result");
    if (screen) screen.classList.toggle("is-loading", !!active);
    if (loading) loading.hidden = !active;
    if (result && active) result.hidden = true;
    if (active) startFactRotator();
    else stopFactRotator();
  }

  function openLightbox(src, alt) {
    const box = $("#lightbox");
    const img = $("#lightbox-img");
    if (!box || !img || !src) return;
    img.src = src;
    img.alt = alt || "Expanded bird photo";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const box = $("#lightbox");
    const img = $("#lightbox-img");
    if (!box) return;
    box.hidden = true;
    if (img) {
      img.removeAttribute("src");
      img.alt = "";
    }
    document.body.style.overflow = "";
  }

  function showScreen(name) {
    state.screen = name;
    if (name !== "identify") setIdentifyLoading(false);
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

  function mapApiCandidates(apiCandidates) {
    return (apiCandidates || []).map((c) => {
      const id = c.speciesId || c.id || "";
      const local = id ? speciesById(id) : null;
      const species = {
        id: id || ("api-" + (c.commonName || "unknown").toLowerCase().replace(/\s+/g, "-")),
        common_name: c.commonName || (local && local.common_name) || "Unknown",
        scientific_name: c.scientificName || (local && local.scientific_name) || "",
        family: (local && local.family) || "",
        habitat: (local && local.habitat) || "—",
        appearance: (local && local.appearance) || "—",
        range_summary: (local && local.range_summary) || "—",
        reference_image_url:
          c.referenceImageUrl ||
          (local && local.reference_image_url) ||
          "https://placehold.co/400x300/1a3a2a/c8e6c9?text=" + encodeURIComponent(c.commonName || "Bird")
      };
      return {
        id: species.id,
        confidence: typeof c.confidence === "number" ? c.confidence : 0,
        species
      };
    }).filter((c) => c.id);
  }

  async function apiIdentify() {
    const res = await fetch(IDENTIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: "Bearer " + ANON_KEY
      },
      body: JSON.stringify({
        imageBase64: state.photoDataUrl,
        mimeType: mimeFromDataUrl(state.photoDataUrl),
        regionLabel: regionLabel(state.region)
      })
    });

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message || data.msg)) ||
        (text && text.slice(0, 200)) ||
        ("Identify failed (HTTP " + res.status + ")");
      const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data || {};
  }

  function renderGuess() {
    const top = state.candidates.find((c) => c.id === state.selectedId) || state.candidates[0];
    if (!top) return;
    $("#guess-img").src = top.species.reference_image_url;
    $("#guess-img").alt = top.species.common_name;
    $("#guess-name").textContent = top.species.common_name;
    $("#guess-sci").textContent = top.species.scientific_name;
    $("#guess-conf").textContent = Math.round(top.confidence * 100) + "%";

    const providerEl = $("#identify-provider");
    if (providerEl) {
      if (state.provider === "mock") {
        providerEl.textContent = "Offline mock ID · not a real vision model";
      } else {
        let line = "Identified via " + prettyProvider(state.provider);
        if (state.lowConfidence) line += " · low confidence";
        providerEl.textContent = line;
      }
    }

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
      const sp = speciesById(card.speciesId) || {
        common_name: card.commonName || "Unknown",
        reference_image_url: card.referenceImageUrl || ""
      };
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
    const sp = speciesById(card.speciesId) || {
      common_name: card.commonName || "Unknown",
      scientific_name: card.scientificName || "",
      habitat: card.habitat || "—",
      appearance: card.appearance || "—",
      range_summary: card.rangeSummary || "—",
      reference_image_url: card.referenceImageUrl || ""
    };
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

  function syncBadge() {
    const badge = $("#demo-badge");
    if (!badge) return;
    badge.textContent = useOfflineMock() ? "Phase 1 demo · mock ID" : "Phase 1 demo · AI ID";
  }

  $("#btn-start").addEventListener("click", () => {
    if (state.region) $("#region").value = state.region;
    $("#btn-region-next").disabled = !$("#region").value;
    showScreen("region");
  });
  $("#btn-skip-collection").addEventListener("click", () => showScreen("collection"));

  const mockToggle = $("#use-mock");
  if (mockToggle) {
    mockToggle.checked = localStorage.getItem(MOCK_KEY) === "1";
    mockToggle.addEventListener("change", () => {
      localStorage.setItem(MOCK_KEY, mockToggle.checked ? "1" : "0");
      syncBadge();
    });
  }
  syncBadge();

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
    const offline = useOfflineMock();
    showScreen("identify");
    setIdentifyLoading(true);
    const loadMsg = $("#identify-loading-msg");
    if (loadMsg) {
      loadMsg.textContent = offline
        ? "Mock AI is matching plumage vibes to our species deck."
        : "BirdWatcher is matching your photo…";
    }

    try {
      if (offline) {
        await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));
        state.candidates = mockIdentify();
        state.provider = "mock";
        state.lowConfidence = false;
      } else {
        const data = await apiIdentify();
        state.candidates = mapApiCandidates(data.candidates || []);
        state.provider = data.provider || "AI";
        state.lowConfidence = !!data.lowConfidence;
        if (!state.candidates.length) {
          throw new Error("No candidates returned from identify");
        }
      }
      state.selectedId = state.candidates[0].id;
      setIdentifyLoading(false);
      $("#identify-result").hidden = false;
      renderGuess();
    } catch (e) {
      setIdentifyLoading(false);
      const msg = (e && e.message) || "Identify failed";
      const isNoKeys =
        (e && e.status === 503) ||
        /No vision API keys configured/i.test(msg);
      if (isNoKeys) {
        toast("Vision API keys aren’t set yet. Add GEMINI_API_KEY (and optional OPENAI_API_KEY) in Supabase Edge Function secrets.", 5000);
      } else {
        toast(msg, 4000);
      }
      showScreen("capture");
    }
  });

  $("#btn-retake").addEventListener("click", () => showScreen("capture"));

  $("#btn-confirm").addEventListener("click", () => {
    const pick = state.candidates.find((c) => c.id === state.selectedId);
    if (!pick) return;
    const items = loadCollection();
    const card = {
      id: "card-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      speciesId: pick.id,
      commonName: pick.species.common_name,
      scientificName: pick.species.scientific_name,
      habitat: pick.species.habitat,
      appearance: pick.species.appearance,
      rangeSummary: pick.species.range_summary,
      referenceImageUrl: pick.species.reference_image_url,
      confidence: pick.confidence,
      region: state.region,
      photoDataUrl: state.photoDataUrl,
      provider: state.provider,
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

  const detailPhotoBtn = $("#detail-photo-btn");
  if (detailPhotoBtn) {
    detailPhotoBtn.addEventListener("click", () => {
      const img = $("#detail-photo");
      if (!img || !img.src) return;
      openLightbox(img.src, img.alt || "Expanded bird photo");
    });
  }
  const lightbox = $("#lightbox");
  const lightboxClose = $("#lightbox-close");
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (lightboxClose) {
    lightboxClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  if (state.region) {
    $("#region").value = state.region;
    $("#btn-region-next").disabled = false;
  }
  showScreen("landing");
})();
