const REGION_PRESETS = [
  { region: "Abruzzo", capitalCity: "L'Aquila", latitude: 42.3498, longitude: 13.3995 },
  { region: "Basilicata", capitalCity: "Potenza", latitude: 40.6404, longitude: 15.8056 },
  { region: "Calabria", capitalCity: "Catanzaro", latitude: 38.9059, longitude: 16.5944 },
  { region: "Campania", capitalCity: "Napoli", latitude: 40.8518, longitude: 14.2681 },
  { region: "Emilia-Romagna", capitalCity: "Bologna", latitude: 44.4949, longitude: 11.3426 },
  { region: "Friuli-Venezia Giulia", capitalCity: "Trieste", latitude: 45.6495, longitude: 13.7768 },
  { region: "Lazio", capitalCity: "Roma", latitude: 41.9028, longitude: 12.4964 },
  { region: "Liguria", capitalCity: "Genova", latitude: 44.4056, longitude: 8.9463 },
  { region: "Lombardia", capitalCity: "Milano", latitude: 45.4642, longitude: 9.19 },
  { region: "Marche", capitalCity: "Ancona", latitude: 43.6158, longitude: 13.5189 },
  { region: "Molise", capitalCity: "Campobasso", latitude: 41.5603, longitude: 14.6627 },
  { region: "Piemonte", capitalCity: "Torino", latitude: 45.0703, longitude: 7.6869 },
  { region: "Puglia", capitalCity: "Bari", latitude: 41.1171, longitude: 16.8719 },
  { region: "Sardegna", capitalCity: "Cagliari", latitude: 39.2238, longitude: 9.1217 },
  { region: "Sicilia", capitalCity: "Palermo", latitude: 38.1157, longitude: 13.3615 },
  { region: "Toscana", capitalCity: "Firenze", latitude: 43.7696, longitude: 11.2558 },
  { region: "Trentino-Alto Adige", capitalCity: "Trento", latitude: 46.0748, longitude: 11.1217 },
  { region: "Umbria", capitalCity: "Perugia", latitude: 43.1107, longitude: 12.3908 },
  { region: "Valle d'Aosta", capitalCity: "Aosta", latitude: 45.737, longitude: 7.3201 },
  { region: "Veneto", capitalCity: "Venezia", latitude: 45.4408, longitude: 12.3155 },
];

const FALLBACK_COLORS = {
  Abruzzo: { carta: "Bianco", multi: "Giallo", vetro: "Blu", umido: "Marrone", secco: "Verde" },
  Basilicata: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Calabria: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Campania: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  "Emilia-Romagna": { carta: "Blu / Azzurro", multi: "Giallo (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" },
  "Friuli-Venezia Giulia": { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" },
  Lazio: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" },
  Liguria: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Lombardia: { carta: "Blu", multi: "Sacco giallo trasparente", vetro: "Verde", umido: "Marrone", secco: "Sacco grigio/neutro trasparente" },
  Marche: { carta: "Blu", multi: "Giallo / metalli", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Molise: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Piemonte: { carta: "Giallo", multi: "Grigio - metalli", vetro: "Blu vetro + metalli", umido: "Marrone", secco: "Verde" },
  Puglia: { carta: "Blu / Azzurro", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Sardegna: { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + latta/lattine", umido: "Marrone", secco: "Grigio" },
  Sicilia: { carta: "Bianco", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Toscana: { carta: "Giallo / Blu", multi: "Azzurro / Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  "Trentino-Alto Adige": { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" },
  Umbria: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  "Valle d'Aosta": { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
  Veneto: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
};

const BIN_LABELS = {
  carta: "Carta",
  multi: "Multimateriale",
  vetro: "Vetro",
  umido: "Umido",
  secco: "Secco",
  rs: "Rifiuti speciali",
};

const $ = (id) => document.getElementById(id);

function setStatus(message, kind = "") {
  const node = $("status");
  node.textContent = message;
  node.className = `status ${kind}`.trim();
}

function apiBase() {
  return $("apiBase").value.replace(/\/+$/, "");
}

async function requestJson(path) {
  const response = await fetch(`${apiBase()}${path}`);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
  return data;
}

function nearestPreset(latitude, longitude) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const preset of REGION_PRESETS) {
    const distance = Math.hypot(latitude - preset.latitude, longitude - preset.longitude);
    if (distance < bestDistance) {
      best = preset;
      bestDistance = distance;
    }
  }

  if (!best || bestDistance > 4.5) return null;
  return best;
}

function renderArea(area, source) {
  $("areaResult").innerHTML = `
    <div class="card">
      <strong>${area.capitalCity || "Standard"} (${area.region || "UNI 11686"})</strong>
      <small>Fonte: ${source}</small>
      <small>Country: ${area.countryCode || "IT"}</small>
    </div>
  `;
}

function fallbackBins(area) {
  const colors = FALLBACK_COLORS[area.region] || {};
  return Object.entries(BIN_LABELS).map(([id, label]) => ({
    id,
    label,
    localColor: colors[id] || "UNI 11686",
    color: "#2f6f7f",
    textColor: "#ffffff",
  }));
}

function renderBins(items = []) {
  $("bins").innerHTML = items
    .map((bin) => `
      <div class="card">
        <strong>${bin.label || bin.labelFull || bin.id}</strong>
        <small>ID: ${bin.id}</small>
        <small>Colore locale: ${bin.localColor || bin.color || "n/d"}</small>
      </div>
    `)
    .join("");
}

function renderWastes(items = []) {
  const sample = items.slice(0, 60);
  $("wastes").innerHTML = sample
    .map((waste) => `
      <div class="waste">
        <span class="emoji">${waste.icon || "♻️"}</span>
        <div>
          <strong>${waste.name}</strong>
          <small>${waste.desc || waste.description || ""}</small>
        </div>
        <span class="pill">${waste.type || waste.typeCode || "?"}</span>
      </div>
    `)
    .join("");
}

async function loadCatalog(area) {
  const query = `?region=${encodeURIComponent(area.region)}&capitalCity=${encodeURIComponent(area.capitalCity)}`;
  const binsPayload = await requestJson(`/catalog/bins${query}`);
  const bins = binsPayload.items || [];
  renderBins(bins);

  const wastesPayload = await requestJson(`/catalog/wastes${query}`);
  renderWastes(wastesPayload.items || []);

  $("raw").textContent = JSON.stringify({ bins: binsPayload.ruleSet, wastesCount: wastesPayload.items?.length || 0 }, null, 2);
}

async function requestManualPosition() {
  const latitude = Number($("latitude").value.replace(",", "."));
  const longitude = Number($("longitude").value.replace(",", "."));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    setStatus("Inserisci coordinate numeriche valide.", "error");
    return;
  }

  setStatus("Richiesta posizione manuale in corso...");

  try {
    const area = await requestJson(`/geolocation/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&language=it`);

    if (!area?.region || area.outsideItaly) {
      throw new Error(area?.outsideItaly ? "Coordinate fuori Italia" : "Regione non riconosciuta");
    }

    renderArea(area, "backend /api/geolocation/reverse");
    await loadCatalog(area);
    setStatus(`Regole locali applicate: ${area.capitalCity} (${area.region}).`, "ok");
  } catch (error) {
    const fallback = nearestPreset(latitude, longitude);

    if (!fallback) {
      renderArea({ region: "UNI 11686", capitalCity: "Standard" }, "fallback standard");
      renderBins(fallbackBins({ region: "" }));
      renderWastes([]);
      setStatus(`${error.message}. Coordinate non associate a una regione italiana: uso standard UNI 11686.`, "error");
      return;
    }

    renderArea(fallback, "fallback manuale demo");
    renderBins(fallbackBins(fallback));
    $("wastes").innerHTML = "";
    $("raw").textContent = JSON.stringify({ warning: error.message, fallback }, null, 2);
    setStatus(`Backend geolocation non disponibile o non conclusivo. Fallback manuale: ${fallback.capitalCity} (${fallback.region}).`, "ok");
  }
}

function fillPreset() {
  const preset = REGION_PRESETS[$("preset").value];
  if (!preset) return;
  $("latitude").value = preset.latitude;
  $("longitude").value = preset.longitude;
}

function init() {
  $("preset").innerHTML = REGION_PRESETS
    .map((preset, index) => `<option value="${index}">${preset.capitalCity} - ${preset.region}</option>`)
    .join("");
  fillPreset();
  $("preset").addEventListener("change", fillPreset);
  $("requestManualPosition").addEventListener("click", requestManualPosition);
  $("reset").addEventListener("click", () => {
    $("apiBase").value = "http://localhost:4000/api";
    $("preset").value = "3";
    fillPreset();
    $("areaResult").innerHTML = "";
    $("bins").innerHTML = "";
    $("wastes").innerHTML = "";
    $("raw").textContent = "{}";
    setStatus("Pronta. Inserisci coordinate o scegli un preset.");
  });
  $("preset").value = "3";
  fillPreset();
}

init();
