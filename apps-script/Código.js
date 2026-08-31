/*******************************************************
 * SISTEMA DE TRANSPARENCIA HUMANITARIA
 *
 * Estructura:
 * 01_INGRESOS  (10 cols: ID,Fecha,Importe,Medio,Tipo_Recurso,
 *               Concepto,Comprobante,Estado,Publicar,Observaciones)
 * 02_EGRESOS   (18 cols: ...,Beneficiarios_legacy,Entrega_ID,
 *               Observaciones,Benef_Mujeres..Animales,Total_Personas)
 * 03_ENTREGAS  (18 cols: ...,Beneficiarios_legacy,Responsable,
 *               Evidencia,Estado,Publicar,Benef_Mujeres..Animales,
 *               Total_Personas)
 * 04_RESUMEN
 * 05_PUBLICO
 * 06_CONFIG
 *
 * Compatible con Google Sheets + Google Forms
 * Incluye Web App (doGet) para exponer 05_PUBLICO como JSON
 *
 * NOTA: reemplaza por completo el contenido anterior de este
 * archivo en el editor de Apps Script. Requiere que
 * RepararEscala.gs siga en el proyecto (funciones reutilizadas).
 * Debe correrse DESPUÉS de ReformaSistema.gs y
 * ReformaFormularios.gs.
 *******************************************************/


/* =====================================================
   CONFIGURACIÓN GENERAL
   ===================================================== */

const CONFIG = {
  hojas: {
    ingresos: '01_INGRESOS',
    egresos: '02_EGRESOS',
    entregas: '03_ENTREGAS',
    resumen: '04_RESUMEN',
    publico: '05_PUBLICO',
    config: '06_CONFIG'
  },

  respuestas: {
    ingresos: 'RESP_INGRESOS',
    egresos: 'RESP_EGRESOS',
    entregas: 'RESP_ENTREGAS'
  },

  prefijos: {
    ingresos: 'ING-',
    egresos: 'EGR-',
    entregas: 'ENT-'
  },

  estadoInicial: 'PENDIENTE',
  publicarInicial: 'NO'
};


/* =====================================================
   MENÚ PERSONALIZADO
   ===================================================== */

function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu('TRANSPARENCIA')
    .addItem('Inicializar sistema', 'inicializarSistema')
    .addItem('Completar registros nuevos', 'completarRegistros')
    .addItem('Regenerar IDs', 'regenerarIds')
    .addItem('Actualizar resumen', 'actualizarResumen')
    .addItem('Validar estructura', 'validarEstructura')
    .addSeparator()
    .addItem('Ampliar capacidad del sistema (una vez)', 'repararSistemaParaEscala')
    .addItem('Configurar disparador de formularios', 'configurarTriggerFormulario')
    .addItem('Migrar respuestas pendientes de Forms', 'migrarRespuestasPendientes')
    .addItem('Probar API pública (ver registro)', 'probarApiPublica')
    .addSeparator()
    .addItem('Actualizar todo', 'actualizarTodo')
    .addToUi();

}


/* =====================================================
   INICIALIZACIÓN
   ===================================================== */

function inicializarSistema() {

  validarHojas();
  configurarFormatos();
  completarRegistros();
  actualizarResumen();

  SpreadsheetApp.getUi().alert('Sistema inicializado correctamente.');

}


function validarHojas() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = Object.values(CONFIG.hojas);

  hojas.forEach(nombre => {
    if (!ss.getSheetByName(nombre)) {
      throw new Error('No existe la hoja: ' + nombre);
    }
  });

}


/* =====================================================
   COMPLETAR REGISTROS NUEVOS
   =====================================================
   Red de seguridad manual / vía onEdit: completa ID,
   Estado y Publicar en cualquier fila que tenga datos
   cargados a mano pero le falte alguno de esos tres
   campos. También aplica las columnas-fórmula
   (Tipo_Recurso / Total_Personas) a esas filas nuevas.
   ===================================================== */

function completarRegistros() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  completarHoja(ss.getSheetByName(CONFIG.hojas.ingresos), CONFIG.prefijos.ingresos, 8, 9);
  completarHoja(ss.getSheetByName(CONFIG.hojas.egresos), CONFIG.prefijos.egresos, 8, 9);
  completarHoja(ss.getSheetByName(CONFIG.hojas.entregas), CONFIG.prefijos.entregas, 11, 12);

}


function completarHoja(sheet, prefijo, columnaEstado, columnaPublicar) {

  const ultimaFila = sheet.getLastRow();
  if (ultimaFila < 2) return;

  const datos = sheet.getRange(2, 1, ultimaFila - 1, sheet.getLastColumn()).getValues();

  datos.forEach((fila, index) => {

    const filaReal = index + 2;
    const idActual = fila[0];
    const tieneDatos = fila.some(valor => valor !== '' && valor !== null);

    if (tieneDatos && !idActual) {
      const id = generarId(sheet, prefijo);
      sheet.getRange(filaReal, 1).setValue(id);
      aplicarFormulasDerivadas_(sheet, sheet.getName(), filaReal);
    }

    const estado = sheet.getRange(filaReal, columnaEstado).getValue();
    if (tieneDatos && !estado) {
      sheet.getRange(filaReal, columnaEstado).setValue(CONFIG.estadoInicial);
    }

    const publicar = sheet.getRange(filaReal, columnaPublicar).getValue();
    if (tieneDatos && !publicar) {
      sheet.getRange(filaReal, columnaPublicar).setValue(CONFIG.publicarInicial);
    }

  });

}


/* =====================================================
   GENERAR ID PERMANENTE
   ===================================================== */

function generarId(sheet, prefijo) {

  const ultimaFila = sheet.getLastRow();
  if (ultimaFila < 2) return prefijo + '0001';

  const ids = sheet.getRange(2, 1, ultimaFila - 1, 1).getValues().flat();
  let maximo = 0;

  ids.forEach(id => {
    if (typeof id === 'string' && id.indexOf(prefijo) === 0) {
      const numero = parseInt(id.replace(prefijo, ''), 10);
      if (!isNaN(numero)) maximo = Math.max(maximo, numero);
    }
  });

  return prefijo + String(maximo + 1).padStart(4, '0');

}


/* =====================================================
   REGENERAR IDs
   ===================================================== */

function regenerarIds() {

  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.alert('ATENCIÓN', 'Esta función reemplazará los IDs actuales. ¿Continuar?', ui.ButtonSet.YES_NO);
  if (respuesta !== ui.Button.YES) return;

  regenerarIdsHoja(CONFIG.hojas.ingresos, CONFIG.prefijos.ingresos);
  regenerarIdsHoja(CONFIG.hojas.egresos, CONFIG.prefijos.egresos);
  regenerarIdsHoja(CONFIG.hojas.entregas, CONFIG.prefijos.entregas);

  ui.alert('IDs regenerados correctamente.');

}


function regenerarIdsHoja(nombreHoja, prefijo) {

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  const ultimaFila = sheet.getLastRow();
  if (ultimaFila < 2) return;

  const datos = sheet.getRange(2, 1, ultimaFila - 1, sheet.getLastColumn()).getValues();
  let contador = 1;

  datos.forEach((fila, index) => {
    const tieneDatos = fila.some(valor => valor !== '' && valor !== null);
    if (tieneDatos) {
      sheet.getRange(index + 2, 1).setValue(prefijo + String(contador).padStart(4, '0'));
      contador++;
    }
  });

}


/* =====================================================
   ACTUALIZAR RESUMEN / ACTUALIZAR TODO
   ===================================================== */

function actualizarResumen() {
  SpreadsheetApp.flush();
}

function actualizarTodo() {
  validarHojas();
  completarRegistros();
  actualizarResumen();
  Logger.log('Sistema actualizado correctamente.');
}

function eliminarTriggerActualizarTodo() {
  const triggers = ScriptApp.getProjectTriggers();
  let eliminados = 0;
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'actualizarTodo') {
      ScriptApp.deleteTrigger(t);
      eliminados++;
    }
  });
  Logger.log('Triggers de actualizarTodo eliminados: ' + eliminados);
}


/* =====================================================
   CONFIGURAR FORMATOS
   ===================================================== */

function configurarFormatos() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ingresos = ss.getSheetByName(CONFIG.hojas.ingresos);
  const egresos = ss.getSheetByName(CONFIG.hojas.egresos);
  const entregas = ss.getSheetByName(CONFIG.hojas.entregas);

  ingresos.getRange('B2:B').setNumberFormat('dd/MM/yyyy');
  ingresos.getRange('C2:C').setNumberFormat('$ #,##0');

  egresos.getRange('B2:B').setNumberFormat('dd/MM/yyyy');
  egresos.getRange('C2:C').setNumberFormat('$ #,##0');

  entregas.getRange('B2:B').setNumberFormat('dd/MM/yyyy');

  ingresos.setFrozenRows(1);
  egresos.setFrozenRows(1);
  entregas.setFrozenRows(1);

}


/* =====================================================
   VALIDACIÓN DE ESTRUCTURA
   ===================================================== */

function validarEstructura() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let mensaje = '';

  Object.entries(CONFIG.hojas).forEach(([clave, nombre]) => {
    const hoja = ss.getSheetByName(nombre);
    mensaje += (hoja ? 'OK: ' : 'FALTA: ') + nombre + '\n';
  });

  SpreadsheetApp.getUi().alert('VALIDACIÓN DE ESTRUCTURA\n\n' + mensaje);

}


/* =====================================================
   TRIGGER SIMPLE (onEdit)
   ===================================================== */

function onEdit(e) {

  if (!e || !e.range) return;
  const nombre = e.range.getSheet().getName();

  if (nombre === CONFIG.hojas.ingresos || nombre === CONFIG.hojas.egresos || nombre === CONFIG.hojas.entregas) {
    completarRegistros();
  }

}


/* =====================================================
   MAPEO DE FORMULARIOS
   =====================================================
   Actualizado tras la reforma:
   - Ingresos: "Concepto" ahora en la columna 6 (antes 5,
     porque se insertó Tipo_Recurso en la 5); "Referencia"
     ya no existe.
   - Egresos / Entregas: se quitó "Beneficiarios" (columna
     legacy, ya no se completa desde el Form) y se agregaron
     los 5 campos de desglose demográfico, columnas 13 a 17.
   ===================================================== */

const FORM_MAPPING = {

  ingresos: {
    'Fecha':        { columna: 2,  tipo: 'fecha' },
    'Importe':      { columna: 3,  tipo: 'numero' },
    'Medio':        { columna: 4,  tipo: 'texto' },
    'Concepto':     { columna: 6,  tipo: 'texto' },
    'Comprobante':  { columna: 7,  tipo: 'texto' },
    'Observaciones':{ columna: 10, tipo: 'texto' }
  },

  egresos: {
    'Fecha':        { columna: 2,  tipo: 'fecha' },
    'Importe':      { columna: 3,  tipo: 'numero' },
    'Categoría':    { columna: 4,  tipo: 'texto' },
    'Concepto':     { columna: 5,  tipo: 'texto' },
    'Proveedor':    { columna: 6,  tipo: 'texto' },
    'Comprobante':  { columna: 7,  tipo: 'texto' },
    'Entrega_ID':   { columna: 11, tipo: 'texto' },
    'Observaciones':{ columna: 12, tipo: 'texto' },
    'Cantidad mujeres beneficiadas':      { columna: 13, tipo: 'numero' },
    'Cantidad infancias beneficiadas':    { columna: 14, tipo: 'numero' },
    'Cantidad diversidades beneficiadas': { columna: 15, tipo: 'numero' },
    'Cantidad varones beneficiados':      { columna: 16, tipo: 'numero' },
    'Cantidad de animales beneficiados':  { columna: 17, tipo: 'numero' }
  },

  entregas: {
    'Fecha':          { columna: 2,  tipo: 'fecha' },
    'Localidad':      { columna: 3,  tipo: 'texto' },
    'Tipo_de_ayuda':  { columna: 4,  tipo: 'texto' },
    'Descripción':    { columna: 5,  tipo: 'texto' },
    'Cantidad':       { columna: 6,  tipo: 'numero' },
    'Unidad':         { columna: 7,  tipo: 'texto' },
    'Responsable':    { columna: 9,  tipo: 'texto' },
    'Evidencia':      { columna: 10, tipo: 'texto' },
    'Cantidad mujeres beneficiadas':      { columna: 13, tipo: 'numero' },
    'Cantidad infancias beneficiadas':    { columna: 14, tipo: 'numero' },
    'Cantidad diversidades beneficiadas': { columna: 15, tipo: 'numero' },
    'Cantidad varones beneficiados':      { columna: 16, tipo: 'numero' },
    'Cantidad de animales beneficiados':  { columna: 17, tipo: 'numero' }
  }

};


function configurarTriggerFormulario() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'manejarEnvioFormulario') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('manejarEnvioFormulario').forSpreadsheet(ss).onFormSubmit().create();

  SpreadsheetApp.getUi().alert(
    'Disparador configurado. A partir de ahora, cualquier respuesta de los 3 ' +
    'formularios vinculados se vuelca automáticamente en la hoja correspondiente.'
  );

}


/* =====================================================
   MANEJAR ENVÍO DE FORMULARIO
   ===================================================== */

function manejarEnvioFormulario(e) {

  if (!e || !e.namedValues || !e.range) return;
  procesarRespuestaFormulario(e.range.getSheet().getName(), e.namedValues);

}


function procesarRespuestaFormulario(hojaRespuestas, namedValues) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let destino, mapping, prefijo, colEstado, colPublicar, totalCols;

  if (hojaRespuestas === CONFIG.respuestas.ingresos) {
    destino = CONFIG.hojas.ingresos;
    mapping = FORM_MAPPING.ingresos;
    prefijo = CONFIG.prefijos.ingresos;
    colEstado = 8; colPublicar = 9; totalCols = 10;

  } else if (hojaRespuestas === CONFIG.respuestas.egresos) {
    destino = CONFIG.hojas.egresos;
    mapping = FORM_MAPPING.egresos;
    prefijo = CONFIG.prefijos.egresos;
    colEstado = 8; colPublicar = 9; totalCols = 18;

  } else if (hojaRespuestas === CONFIG.respuestas.entregas) {
    destino = CONFIG.hojas.entregas;
    mapping = FORM_MAPPING.entregas;
    prefijo = CONFIG.prefijos.entregas;
    colEstado = 11; colPublicar = 12; totalCols = 18;

  } else {
    return false;
  }

  const hojaDestino = ss.getSheetByName(destino);
  const fila = construirFilaDesdeFormulario(namedValues, mapping, totalCols);

  fila[0] = generarId(hojaDestino, prefijo);
  fila[colEstado - 1] = CONFIG.estadoInicial;
  fila[colPublicar - 1] = CONFIG.publicarInicial;

  const nuevaFila = hojaDestino.getLastRow() + 1;
  hojaDestino.getRange(nuevaFila, 1, 1, fila.length).setValues([fila]);

  // Tipo_Recurso (Ingresos) y Total_Personas (Egresos/Entregas) son
  // columnas-fórmula: el write posicional de arriba las deja vacías,
  // así que se fijan acá aparte.
  aplicarFormulasDerivadas_(hojaDestino, destino, nuevaFila);

  return true;

}


// Aplica las fórmulas que NO vienen del formulario ni de la carga manual,
// sino que se calculan solas. Se llama tanto para altas por Forms como
// para altas manuales detectadas por completarHoja/onEdit.
function aplicarFormulasDerivadas_(hoja, destino, fila) {

  if (destino === CONFIG.hojas.ingresos) {
    hoja.getRange(fila, 5).setFormula(
      `=IF($D${fila}="","",IF($D${fila}="Donación en especie","ESPECIE","MONETARIO"))`
    );
  }

  if (destino === CONFIG.hojas.egresos || destino === CONFIG.hojas.entregas) {
    hoja.getRange(fila, 18).setFormula(
      `=IF(COUNTBLANK(M${fila}:P${fila})=4,"",SUM(M${fila}:P${fila}))`
    );
  }

}


function construirFilaDesdeFormulario(namedValues, mapping, totalCols) {

  const fila = new Array(totalCols).fill('');

  Object.keys(mapping).forEach(pregunta => {

    const { columna, tipo } = mapping[pregunta];
    const respuesta = namedValues[pregunta];

    if (!respuesta || !respuesta.length || respuesta[0] === '') return;

    const valorCrudo = respuesta[0];

    if (tipo === 'numero') {
      const numero = parseFloat(String(valorCrudo).replace(',', '.'));
      fila[columna - 1] = isNaN(numero) ? '' : numero;

    } else if (tipo === 'fecha') {
      const fecha = new Date(valorCrudo);
      fila[columna - 1] = isNaN(fecha.getTime()) ? valorCrudo : fecha;

    } else {
      fila[columna - 1] = valorCrudo;
    }

  });

  return fila;

}


/* =====================================================
   MIGRAR RESPUESTAS PENDIENTES
   ===================================================== */

const COLUMNA_MARCA_PROCESADO = 50;

function migrarRespuestasPendientes() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let total = 0;

  Object.values(CONFIG.respuestas).forEach(nombreHoja => {

    const hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) return;

    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return;

    const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    const datos = hoja.getRange(2, 1, ultimaFila - 1, hoja.getLastColumn()).getValues();

    datos.forEach((fila, index) => {

      const filaReal = index + 2;
      const marca = hoja.getRange(filaReal, COLUMNA_MARCA_PROCESADO).getValue();
      if (marca === 'PROCESADO') return;

      const namedValues = {};
      encabezados.forEach((titulo, i) => {
        if (!titulo) return;
        const valor = fila[i];
        namedValues[titulo] = [(valor === '' || valor === null) ? '' : valor];
      });

      const ok = procesarRespuestaFormulario(nombreHoja, namedValues);
      if (ok) {
        hoja.getRange(filaReal, COLUMNA_MARCA_PROCESADO).setValue('PROCESADO');
        total++;
      }

    });

  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Se migraron ' + total + ' respuesta(s) pendiente(s) a las hojas de carga.');

}


/* =====================================================
   WEB APP — API PÚBLICA (doGet)
   =====================================================
   Expone exclusivamente 05_PUBLICO como JSON. Deploy:
   Implementar > Nueva implementación > Aplicación web >
   Ejecutar como: Tú > Quién tiene acceso: Cualquier usuario.
   ===================================================== */

function doGet(e) {

  const payload = obtenerDatosPublicos();
  const json = JSON.stringify(payload);

  if (e && e.parameter && e.parameter.callback) {
    return ContentService
      .createTextOutput(e.parameter.callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);

}


function obtenerDatosPublicos() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(CONFIG.hojas.publico);

  // Bloque de indicadores: ahora 14 filas (B2:B15), no 8.
  const indicadores = hoja.getRange('B2:B15').getValues().flat();

  const payload = {
    recaudado: Number(indicadores[0]) || 0,
    recibido_en_especie: Number(indicadores[1]) || 0,
    utilizado: Number(indicadores[2]) || 0,
    saldo: Number(indicadores[3]) || 0,
    donaciones: Number(indicadores[4]) || 0,
    gastos: Number(indicadores[5]) || 0,
    entregas: Number(indicadores[6]) || 0,
    beneficiarios: Number(indicadores[7]) || 0,
    beneficiarios_mujeres: Number(indicadores[8]) || 0,
    beneficiarios_infancias: Number(indicadores[9]) || 0,
    beneficiarios_diversidades: Number(indicadores[10]) || 0,
    beneficiarios_varones: Number(indicadores[11]) || 0,
    animales_beneficiados: Number(indicadores[12]) || 0,
    ultima_actualizacion: formatearFecha(indicadores[13]),
    generado: new Date().toISOString(),
    operaciones: leerSeccionOperaciones(hoja),
    entregas_detalle: leerSeccionEntregas(hoja),
    impacto_por_categoria: leerImpactoPorCategoria(hoja)
  };

  return payload;

}


// Requiere que ImpactoPorCategoria.gs siga en el proyecto (CATEGORIAS_IMPACTO).
function leerImpactoPorCategoria(hoja) {

  const filaTitulo = ubicarFilaSeccion(hoja, 'IMPACTO POR CATEGORÍA');
  // Esta sección es título → encabezado → datos (sin fila de nota como
  // las otras), por eso el offset es +2 y no +3.
  const filaInicio = filaTitulo + 2;
  const cantidad = CATEGORIAS_IMPACTO.length;

  const datos = hoja.getRange(filaInicio, 1, cantidad, 7).getValues();

  return datos.map(fila => ({
    categoria: fila[0],
    mujeres: Number(fila[1]) || 0,
    infancias: Number(fila[2]) || 0,
    diversidades: Number(fila[3]) || 0,
    varones: Number(fila[4]) || 0,
    animales: Number(fila[5]) || 0,
    total_personas: Number(fila[6]) || 0
  }));

}


function ubicarFilaSeccion(hoja, texto) {
  const encontrado = hoja.createTextFinder(texto).matchEntireCell(false).findNext();
  if (!encontrado) throw new Error('No se encontró la sección "' + texto + '" en 05_PUBLICO.');
  return encontrado.getRow();
}

// Igual que ubicarFilaSeccion pero no falla si no encuentra nada — para
// secciones opcionales que pueden no existir todavía (compatibilidad
// hacia atrás con versiones de 05_PUBLICO sin "Impacto por categoría").
function ubicarFilaSeccionOpcional_(hoja, texto) {
  const encontrado = hoja.createTextFinder(texto).matchEntireCell(false).findNext();
  return encontrado ? encontrado.getRow() : null;
}


function leerSeccionOperaciones(hoja) {

  const filaTitulo = ubicarFilaSeccion(hoja, 'OPERACIONES PÚBLICAS');
  const filaTituloEntregas = ubicarFilaSeccion(hoja, 'ENTREGAS PÚBLICAS');

  const filaInicio = filaTitulo + 3;
  const filaFin = filaTituloEntregas - 2;
  if (filaFin < filaInicio) return [];

  const datos = hoja.getRange(filaInicio, 1, filaFin - filaInicio + 1, 8).getValues();

  return datos
    .filter(fila => fila[0] !== '')
    .map(fila => ({
      id: fila[0], fecha: formatearFecha(fila[1]), tipo: fila[2], categoria: fila[3],
      concepto: fila[4], importe: Number(fila[5]) || 0, comprobante: fila[6],
      tipo_recurso: fila[7] || '-'
    }));

}


function leerSeccionEntregas(hoja) {

  const filaTitulo = ubicarFilaSeccion(hoja, 'ENTREGAS PÚBLICAS');
  const filaInicio = filaTitulo + 3;

  // Límite superior: si existe una sección posterior (hoy, "Impacto por
  // categoría"), Entregas termina justo antes de ella. Si no existe
  // (versiones anteriores de 05_PUBLICO), se sigue usando el final de
  // la hoja como antes.
  const filaImpacto = ubicarFilaSeccionOpcional_(hoja, 'IMPACTO POR CATEGORÍA');
  const filaFin = filaImpacto ? filaImpacto - 2 : hoja.getLastRow();

  if (filaFin < filaInicio) return [];

  const datos = hoja.getRange(filaInicio, 1, filaFin - filaInicio + 1, 9).getValues();

  return datos
    .filter(fila => fila[0] !== '')
    .map(fila => ({
      id: fila[0], fecha: formatearFecha(fila[1]), localidad: fila[2], tipo_de_ayuda: fila[3],
      descripcion: fila[4], cantidad: Number(fila[5]) || 0, unidad: fila[6],
      beneficiarios: Number(fila[7]) || 0, evidencia: fila[8]
    }));

}


function formatearFecha(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  return valor || '';
}


function probarApiPublica() {
  const payload = obtenerDatosPublicos();
  Logger.log(JSON.stringify(payload, null, 2));
}