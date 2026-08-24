// Capa de datos — habla con el endpoint del sistema administrativo (CONFIG.ENDPOINT_URL)
// y con el cache local. No sabe nada de DOM ni de render.
const CACHE_KEY = "transparencia_cache_v1";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage puede no estar disponible (modo privado, cuota) — no es crítico.
  }
}

async function fetchTransparencyData() {
  const res = await fetch(CONFIG.ENDPOINT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Endpoint respondió ${res.status}`);
  const data = await res.json();
  writeCache(data);
  return data;
}
