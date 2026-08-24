// Construye los gráficos y la barra recaudado/utilizado a partir de un objeto de datos
// con la forma exacta del endpoint (BRIEF §3.2). Recibe los datos ya procesados —
// no sabe de dónde vienen (fetch real vía js/api.js).

// Categorías de egreso vigentes tras la reforma de agosto 2026 (BRIEF §3.2).
const CATEGORY_COLORS = {
  ALIMENTOS: "#DF8A2C",
  AGUA: "#6B944F",
  MEDICAMENTOS: "#E2EADD",
  "INSUMOS/EQUIPAMIENTO": "#575656",
  TRANSPORTE: "#663514",
  LOGISTICA: "#203D2C",
  "ALOJAMIENTO TEMPORAL": "#8a5814",
  COMUNICACION: "#3f5c2c",
  "AYUDA ECONOMICA DIRECTA": "#F3F6F1",
  ROPA: "#a8763f",
  "PAP APOYO EMOCIONAL": "#4f7a94",
  OTROS: "#9c9c9c",
};

function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}

function destroyChartOn(canvas) {
  if (!canvas || typeof Chart === "undefined") return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
}

function renderCategoryChart(data) {
  const canvas = document.getElementById("chart-categorias");
  if (!canvas || typeof Chart === "undefined") return;
  destroyChartOn(canvas);

  const egresos = data.operaciones.filter((op) => op.tipo === "EGRESO");
  const porCategoria = {};
  egresos.forEach((op) => {
    porCategoria[op.categoria] = (porCategoria[op.categoria] || 0) + op.importe;
  });
  const labels = Object.keys(porCategoria);
  const values = Object.values(porCategoria);

  if (!labels.length) {
    canvas.replaceWith(Object.assign(document.createElement("p"), {
      className: "chart-empty-note",
      textContent: "Todavía no hay egresos registrados para agrupar por categoría.",
    }));
    return;
  }

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((l) => CATEGORY_COLORS[l] || "#6B944F"),
        borderColor: "#203D2C",
        borderWidth: 2,
      }],
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { color: "#F3F6F1", font: { family: "IBM Plex Mono", size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: $${formatCOP(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderTimelineChart(data) {
  const canvas = document.getElementById("chart-tiempo");
  const note = document.getElementById("chart-tiempo-note");
  if (!canvas) return;
  destroyChartOn(canvas);
  canvas.hidden = false;

  const ingresos = data.operaciones
    .filter((op) => op.tipo === "INGRESO" && op.tipo_recurso === "MONETARIO")
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (note) note.hidden = ingresos.length >= 3;
  if (!ingresos.length || typeof Chart === "undefined") {
    canvas.hidden = true;
    return;
  }

  let acumulado = 0;
  const points = ingresos.map((op) => {
    acumulado += op.importe;
    return acumulado;
  });
  const labels = ingresos.map((op) => op.fecha.slice(5).replace("-", "/"));

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: points,
        borderColor: "#DF8A2C",
        backgroundColor: "rgba(223,138,44,0.18)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#DF8A2C",
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#E2EADD", font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: "rgba(226,234,221,0.1)" } },
        y: { ticks: { color: "#E2EADD", font: { family: "IBM Plex Mono", size: 10 }, callback: (v) => "$" + formatCOP(v) }, grid: { color: "rgba(226,234,221,0.1)" } },
      },
    },
  });
}

function renderProgressBar(data) {
  const fill = document.getElementById("progress-fill");
  const pct = document.getElementById("progress-pct");
  if (!fill || !data.recaudado) return;
  const ratio = Math.min(100, Math.round((data.utilizado / data.recaudado) * 100));
  fill.style.width = ratio + "%";
  if (pct) pct.textContent = ratio + "%";
}

function renderEspecieStat(data) {
  const el = document.getElementById("stat-especie");
  if (!el) return;
  el.textContent = "$" + formatCOP(data.recibido_en_especie || 0);
}

function renderImpactGrid(data) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("stat-mujeres", data.beneficiarios_mujeres || 0);
  set("stat-infancias", data.beneficiarios_infancias || 0);
  set("stat-diversidades", data.beneficiarios_diversidades || 0);
  set("stat-varones", data.beneficiarios_varones || 0);
  set("stat-animales", data.animales_beneficiados || 0);

  const grid = document.getElementById("impact-grid");
  const note = document.getElementById("impact-empty-note");
  const todoCero = ["beneficiarios_mujeres", "beneficiarios_infancias", "beneficiarios_diversidades", "beneficiarios_varones", "animales_beneficiados"]
    .every((k) => !data[k]);
  if (grid) grid.hidden = todoCero;
  if (note) note.hidden = !todoCero;
}

function renderImpactTable(data) {
  const tbody = document.getElementById("impact-table-tbody");
  const wrap = document.querySelector(".impact-table-wrap");
  const collapsedNote = document.getElementById("impact-table-collapsed-note");
  if (!tbody) return;
  tbody.textContent = "";

  const filas = (data.impacto_por_categoria || []);
  const conDatos = filas.filter((f) => f.mujeres || f.infancias || f.diversidades || f.varones || f.animales);
  const sinDatos = filas.length - conDatos.length;

  if (!conDatos.length) {
    if (wrap) wrap.hidden = true;
    if (collapsedNote) {
      collapsedNote.hidden = false;
      collapsedNote.textContent = "Todavía no hay datos de impacto verificados por categoría.";
    }
    return;
  }

  if (wrap) wrap.hidden = false;
  conDatos.forEach((f) => {
    const tr = document.createElement("tr");
    [f.categoria, f.mujeres, f.infancias, f.diversidades, f.varones, f.animales].forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  if (collapsedNote) {
    if (sinDatos > 0) {
      collapsedNote.hidden = false;
      collapsedNote.textContent = `+ ${sinDatos} categorías sin datos todavía.`;
    } else {
      collapsedNote.hidden = true;
    }
  }
}

function renderCharts(data) {
  renderCategoryChart(data);
  renderTimelineChart(data);
  renderProgressBar(data);
  renderEspecieStat(data);
  renderImpactGrid(data);
  renderImpactTable(data);
}
