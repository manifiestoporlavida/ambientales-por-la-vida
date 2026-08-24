// Orquesta la página. Los datos de transparencia vienen del fetch real al endpoint
// (js/api.js) con cache en localStorage para carga instantánea (stale-while-revalidate).

function clearLoadingState() {
  document.querySelectorAll(".is-loading").forEach((el) => el.classList.remove("is-loading"));
  const loadingRow = document.getElementById("ops-loading-row");
  if (loadingRow) loadingRow.remove();
}

function renderStats(data) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("stat-recaudado", "$" + formatCOP(data.recaudado));
  set("stat-utilizado", "$" + formatCOP(data.utilizado));
  set("stat-saldo", "$" + formatCOP(data.saldo));
  set("stat-donaciones", data.donaciones);
  set("stat-gastos", data.gastos);
  set("stat-entregas", data.entregas);
  set("stat-beneficiarios", data.beneficiarios);

  const fecha = document.getElementById("ultima-actualizacion");
  const badgeText = document.getElementById("updated-badge-text");
  const isoDate = resolveUltimaActualizacion(data);
  if (isoDate) {
    const [y, m, d] = isoDate.split("-");
    const formatted = `${d}/${m}/${y}`;
    if (badgeText) {
      badgeText.textContent = "";
      const label = document.createTextNode("Actualizado el ");
      const time = document.createElement("time");
      time.id = "ultima-actualizacion";
      time.textContent = formatted;
      time.setAttribute("datetime", data.ultima_actualizacion);
      badgeText.appendChild(label);
      badgeText.appendChild(time);
    } else if (fecha) {
      fecha.textContent = formatted;
      fecha.setAttribute("datetime", isoDate);
    }
  }
}

// El campo ultima_actualizacion a veces llega malformado desde el endpoint (ej. un
// número en vez de "YYYY-MM-DD"). Si pasa, caemos a la fecha de "generado" (ISO válido).
function resolveUltimaActualizacion(data) {
  if (typeof data.ultima_actualizacion === "string" && /^\d{4}-\d{2}-\d{2}/.test(data.ultima_actualizacion)) {
    return data.ultima_actualizacion.slice(0, 10);
  }
  if (typeof data.generado === "string" && /^\d{4}-\d{2}-\d{2}/.test(data.generado)) {
    return data.generado.slice(0, 10);
  }
  return null;
}

function showTransparencyError(show) {
  const el = document.getElementById("transparencia-error");
  if (el) el.hidden = !show;
}

function safeComprobanteHref(url) {
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

function renderOperationsTable(data, filter = "TODAS") {
  const tbody = document.getElementById("ops-tbody");
  if (!tbody) return;
  tbody.textContent = "";

  const ops = data.operaciones
    .filter((op) => filter === "TODAS" || op.tipo === filter)
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  ops.forEach((op) => {
    const tr = document.createElement("tr");

    const tdFecha = document.createElement("td");
    const [y, m, d] = op.fecha.split("-");
    tdFecha.textContent = `${d}/${m}/${y}`;
    tr.appendChild(tdFecha);

    const tdTipo = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge-tipo " + (op.tipo === "INGRESO" ? "badge-tipo--ingreso" : "badge-tipo--egreso");
    badge.textContent = op.tipo;
    tdTipo.appendChild(badge);
    tr.appendChild(tdTipo);

    const tdCat = document.createElement("td");
    tdCat.textContent = op.categoria;
    tr.appendChild(tdCat);

    const tdConcepto = document.createElement("td");
    tdConcepto.className = "concepto";
    tdConcepto.textContent = op.concepto; // nunca innerHTML con datos del endpoint
    if (op.tipo_recurso === "ESPECIE") {
      const badge = document.createElement("span");
      badge.className = "badge-especie";
      badge.textContent = "En especie";
      tdConcepto.appendChild(badge);
    }
    tr.appendChild(tdConcepto);

    const tdImporte = document.createElement("td");
    tdImporte.className = "importe";
    tdImporte.textContent = "$" + formatCOP(op.importe);
    tr.appendChild(tdImporte);

    const tdComp = document.createElement("td");
    const href = safeComprobanteHref(op.comprobante);
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "comprobante";
      a.textContent = "Ver";
      tdComp.appendChild(a);
    } else {
      tdComp.textContent = "—";
    }
    tr.appendChild(tdComp);

    tbody.appendChild(tr);
  });
}

function initOpsFilters(data) {
  const buttons = document.querySelectorAll(".ops-filter");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      renderOperationsTable(data, btn.dataset.filter);
    });
  });
}

function renderResponsables() {
  const track = document.getElementById("responsables-track");
  if (!track) return;
  track.textContent = "";

  RESPONSABLES.forEach((p) => {
    const li = document.createElement("li");
    li.className = "responsable-card";

    const photo = document.createElement("div");
    photo.className = "photo";
    const img = document.createElement("img");
    img.src = p.foto;
    img.alt = p.nombre;
    img.loading = "lazy";
    photo.appendChild(img);
    li.appendChild(photo);

    const h4 = document.createElement("h4");
    h4.textContent = p.nombre;
    li.appendChild(h4);

    const role = document.createElement("p");
    role.className = "role";
    role.textContent = p.rol;
    li.appendChild(role);

    if (p.ubicacion) {
      const loc = document.createElement("p");
      loc.className = "loc";
      loc.textContent = p.ubicacion;
      li.appendChild(loc);
    }

    if (p.bio) {
      const bio = document.createElement("p");
      bio.className = "bio";
      bio.textContent = p.bio;
      bio.hidden = true;
      li.appendChild(bio);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bio-toggle";
      toggle.textContent = "Ver trayectoria";
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        bio.hidden = expanded;
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? "Ver trayectoria" : "Ocultar trayectoria";
      });
      li.appendChild(toggle);
    }

    track.appendChild(li);
  });

  const prev = document.getElementById("carousel-prev");
  const next = document.getElementById("carousel-next");
  const scrollBy = () => track.clientWidth * 0.7;
  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -scrollBy(), behavior: "smooth" }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left: scrollBy(), behavior: "smooth" }));
}

function initRevealOnScroll() {
  const targets = document.querySelectorAll(".panel");
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  targets.forEach((t) => io.observe(t));
}

function renderDeliveries(data) {
  const empty = document.getElementById("deliveries-empty");
  const list = document.getElementById("deliveries-list");
  if (!empty || !list) return;

  const entregas = data.entregas_detalle || [];
  list.textContent = "";

  if (!entregas.length) {
    empty.hidden = false;
    list.hidden = true;
    return;
  }

  empty.hidden = true;
  list.hidden = false;
  entregas.forEach((entrega) => {
    const li = document.createElement("li");
    li.textContent = typeof entrega === "string" ? entrega : JSON.stringify(entrega);
    list.appendChild(li);
  });
}

function renderAll(data) {
  renderStats(data);
  renderOperationsTable(data);
  initOpsFilters(data);
  renderCharts(data);
  renderDeliveries(data);
  clearLoadingState();
  showTransparencyError(false);
}

async function loadTransparencyData() {
  const cached = readCache();
  if (cached) {
    renderAll(cached.data);
  }

  try {
    const fresh = await fetchTransparencyData();
    renderAll(fresh);
  } catch (err) {
    console.error("No se pudo obtener los datos de transparencia:", err);
    if (cached) {
      // Ya mostramos los datos cacheados — solo avisamos que no se pudo refrescar.
      clearLoadingState();
      const badgeText = document.getElementById("updated-badge-text");
      const badge = document.getElementById("updated-badge");
      if (badge) badge.classList.add("updated-badge--stale");
      if (badgeText) {
        const note = document.createElement("span");
        note.textContent = " (sin conexión con el sistema en vivo, mostrando la última copia guardada)";
        badgeText.appendChild(note);
      }
    } else {
      clearLoadingState();
      showTransparencyError(true);
    }
  }
}

function initNavMenu() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });
}

function initScrollSpy() {
  const links = document.querySelectorAll("#main-nav a[href^='#']");
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = Array.from(links)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((section) => io.observe(section));
}

document.addEventListener("DOMContentLoaded", () => {
  loadTransparencyData();
  const retryBtn = document.getElementById("transparencia-retry");
  if (retryBtn) retryBtn.addEventListener("click", loadTransparencyData);

  renderResponsables();
  initRevealOnScroll();
  initNavMenu();
  initScrollSpy();
});
