/*******************************************************
 * REPARAR ESCALA — corre UNA sola vez
 * =====================================================
 * Arregla el problema de fondo: las hojas de carga (01/02/03)
 * solo tenían desplegables, formato condicional y espejo hacia
 * 05_PUBLICO en sus primeras 30 filas. Cualquier respuesta de
 * Forms que cayera más allá de esa fila 31 quedaba invisible
 * para la API pública y sin desplegable para editar a mano.
 *
 * Este script:
 * 1. Extiende los desplegables (Estado, Publicar, Medio,
 *    Categoría, etc.), el formato condicional por color y los
 *    formatos de fecha/moneda hasta la fila 501 en las 3 hojas
 *    de carga.
 * 2. Reconstruye por completo las secciones "OPERACIONES
 *    PÚBLICAS" y "ENTREGAS PÚBLICAS" de 05_PUBLICO para que
 *    reflejen ese mismo rango (antes: 30 filas espejo por
 *    hoja: ahora: 500).
 *
 * No toca ni borra ningún dato cargado en 01_INGRESOS,
 * 02_EGRESOS ni 03_ENTREGAS. Sí borra y recrea por completo el
 * bloque de tablas de 05_PUBLICO — es seguro porque ese bloque
 * es 100% fórmulas autogeneradas, nadie edita ahí a mano.
 *
 * CÓMO USAR:
 * 1. Archivo > Nuevo > Script dentro del mismo proyecto (el
 *    que ya tiene TransparenciaHumanitaria.gs y
 *    CrearFormularios.gs). Llamalo "RepararEscala".
 * 2. Pegá TODO este código.
 * 3. Guardá. Elegí "repararSistemaParaEscala" en el
 *    desplegable de funciones y ejecutá.
 * 4. Puede tardar unos segundos (está escribiendo miles de
 *    celdas) — es normal, esperá a que termine.
 * 5. Después: correé de nuevo "Probar API pública" y
 *    confirmá que las filas que antes no aparecían ahora sí
 *    están. Y probá editar Estado/Publicar en una fila que
 *    haya llegado por Forms — debería mostrarte el desplegable.
 *******************************************************/

const CAPACIDAD_FILAS = 500; // margen por hoja de carga — de sobra para toda la campaña


function repararSistemaParaEscala() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  extenderValidacionesYFormato_(ss, CAPACIDAD_FILAS);
  reconstruirSeccionesPublicas_(ss, CAPACIDAD_FILAS);

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Listo. Los desplegables, el formato condicional y la API pública ahora cubren ' +
    CAPACIDAD_FILAS + ' filas por hoja (antes eran 30). Probá de nuevo "Probar API ' +
    'pública" para confirmar que ya ve todo lo que cargaste.'
  );

}


/* =====================================================
   PARTE 1 — Extender desplegables, formato condicional
   y formatos de fecha/moneda en las 3 hojas de carga
   ===================================================== */

function extenderValidacionesYFormato_(ss, capacidad) {

  const ultimaFila = capacidad + 1; // los datos arrancan en la fila 2

  // Mismos rangos de listas que en 06_CONFIG desde el armado original
  const RNG_MEDIO = "'06_CONFIG'!A2:A6";
  const RNG_ESTADO = "'06_CONFIG'!B2:B5";
  const RNG_PUBLICAR = "'06_CONFIG'!C2:C3";
  const RNG_CATEGORIA = "'06_CONFIG'!D2:D10";
  const RNG_TIPOAYUDA = "'06_CONFIG'!E2:E8";
  const RNG_UNIDAD = "'06_CONFIG'!F2:F9";

  const coloresEstado = {
    PENDIENTE: '#fff2cc',
    VERIFICADO: '#c6e0b4',
    RECHAZADO: '#f8cbad',
    ANULADO: '#d9d9d9'
  };

  // ---- 01_INGRESOS ----
  const ing = ss.getSheetByName(CONFIG.hojas.ingresos);
  aplicarListaDesplegable_(ing, 'D2:D' + ultimaFila, RNG_MEDIO);
  aplicarListaDesplegable_(ing, 'H2:H' + ultimaFila, RNG_ESTADO);
  aplicarListaDesplegable_(ing, 'I2:I' + ultimaFila, RNG_PUBLICAR);
  ing.getRange('B2:B' + ultimaFila).setNumberFormat('dd/MM/yyyy');
  ing.getRange('C2:C' + ultimaFila).setNumberFormat('$ #,##0');
  aplicarFormatoCondicionalEstado_(ing, 'A2:J' + ultimaFila, 'H', coloresEstado);

  // ---- 02_EGRESOS ----
  const egr = ss.getSheetByName(CONFIG.hojas.egresos);
  aplicarListaDesplegable_(egr, 'D2:D' + ultimaFila, RNG_CATEGORIA);
  aplicarListaDesplegable_(egr, 'H2:H' + ultimaFila, RNG_ESTADO);
  aplicarListaDesplegable_(egr, 'I2:I' + ultimaFila, RNG_PUBLICAR);
  egr.getRange('B2:B' + ultimaFila).setNumberFormat('dd/MM/yyyy');
  egr.getRange('C2:C' + ultimaFila).setNumberFormat('$ #,##0');
  aplicarFormatoCondicionalEstado_(egr, 'A2:L' + ultimaFila, 'H', coloresEstado);

  // ---- 03_ENTREGAS ----
  const ent = ss.getSheetByName(CONFIG.hojas.entregas);
  aplicarListaDesplegable_(ent, 'D2:D' + ultimaFila, RNG_TIPOAYUDA);
  aplicarListaDesplegable_(ent, 'G2:G' + ultimaFila, RNG_UNIDAD);
  aplicarListaDesplegable_(ent, 'K2:K' + ultimaFila, RNG_ESTADO);
  aplicarListaDesplegable_(ent, 'L2:L' + ultimaFila, RNG_PUBLICAR);
  ent.getRange('B2:B' + ultimaFila).setNumberFormat('dd/MM/yyyy');
  aplicarFormatoCondicionalEstado_(ent, 'A2:L' + ultimaFila, 'K', coloresEstado);

}


function aplicarListaDesplegable_(hojaDestino, a1RangoDestino, rangoOrigenA1) {

  const ss = hojaDestino.getParent();
  const origen = ss.getRange(rangoOrigenA1);

  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInRange(origen, true)
    .setAllowInvalid(false)
    .build();

  hojaDestino.getRange(a1RangoDestino).setDataValidation(regla);

}


function aplicarFormatoCondicionalEstado_(hoja, a1RangoCompleto, columnaEstadoLetra, colores) {

  const rango = hoja.getRange(a1RangoCompleto);

  const reglas = Object.keys(colores).map(estado =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + columnaEstadoLetra + '2="' + estado + '"')
      .setBackground(colores[estado])
      .setRanges([rango])
      .build()
  );

  // Reemplaza TODAS las reglas de formato condicional de la hoja.
  // Es seguro: estas 3 hojas nunca tuvieron otro tipo de regla.
  hoja.setConditionalFormatRules(reglas);

}


/* =====================================================
   PARTE 2 — Reconstruir 05_PUBLICO con el rango ampliado
   ===================================================== */

function reconstruirSeccionesPublicas_(ss, capacidad) {

  const pub = ss.getSheetByName(CONFIG.hojas.publico);

  const encontrado = pub.createTextFinder('OPERACIONES PÚBLICAS').matchEntireCell(false).findNext();
  if (!encontrado) throw new Error('No se encontró la sección "OPERACIONES PÚBLICAS" en 05_PUBLICO.');
  const filaTituloOps = encontrado.getRow();

  // Borra todo desde ese título hasta el final de la hoja —
  // es exactamente el bloque autogenerado que vamos a recrear.
  const ultimaFilaActual = pub.getLastRow();
  if (ultimaFilaActual >= filaTituloOps) {
    pub.deleteRows(filaTituloOps, ultimaFilaActual - filaTituloOps + 1);
  }

  let fila = filaTituloOps;

  // La hoja importada desde el Excel original solo tiene la cantidad
  // mínima de filas que ocupaba el contenido de entonces. Antes de
  // escribir hay que asegurarse de que la grilla tenga lugar para
  // todo el bloque nuevo (título+nota+encabezado x2 secciones, +1
  // fila en blanco de separador, + 3 bloques de "capacidad" filas).
  const filaFinalNecesaria = filaTituloOps + (3 * capacidad) + 7 - 1;
  if (pub.getMaxRows() < filaFinalNecesaria) {
    pub.insertRowsAfter(pub.getMaxRows(), filaFinalNecesaria - pub.getMaxRows());
  }

  // --- OPERACIONES PÚBLICAS: título, nota, encabezado ---
  pub.getRange(fila, 1, 1, 7).merge();
  pub.getRange(fila, 1).setValue('OPERACIONES PÚBLICAS (INGRESOS Y EGRESOS)')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');
  fila++;

  pub.getRange(fila, 1).setValue(
    'Solo se muestran registros con Estado=VERIFICADO y Publicar=SI. Las filas sin coincidencia quedan en blanco.'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);
  fila++;

  const headersOps = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Concepto', 'Importe', 'Comprobante'];
  pub.getRange(fila, 1, 1, 7).setValues([headersOps])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');
  fila++;

  // --- Bloque INGRESOS (capacidad filas) ---
  const inicioDatosOps = fila;
  const bloqueIngresos = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosOps + i;
    const cond = "AND('01_INGRESOS'!$H" + src + '="VERIFICADO",\'01_INGRESOS\'!$I' + src + '="SI")';
    bloqueIngresos.push([
      '=IF(' + cond + ",'01_INGRESOS'!$A" + src + ',"")',
      '=IF($A' + destRow + '="","",\'01_INGRESOS\'!$B' + src + ')',
      '=IF($A' + destRow + '="","","INGRESO")',
      '=IF($A' + destRow + '="","","-")',
      '=IF($A' + destRow + '="","",\'01_INGRESOS\'!$E' + src + ')',
      '=IF($A' + destRow + '="","",\'01_INGRESOS\'!$C' + src + ')',
      '=IF($A' + destRow + '="","",\'01_INGRESOS\'!$G' + src + ')'
    ]);
  }
  pub.getRange(inicioDatosOps, 1, capacidad, 7).setFormulas(bloqueIngresos);
  aplicarFormatoFilasDatos_(pub, inicioDatosOps, capacidad, 7, 2, 6);

  // --- Bloque EGRESOS (capacidad filas) ---
  const inicioDatosEgr = inicioDatosOps + capacidad;
  const bloqueEgresos = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosEgr + i;
    const cond = "AND('02_EGRESOS'!$H" + src + '="VERIFICADO",\'02_EGRESOS\'!$I' + src + '="SI")';
    bloqueEgresos.push([
      '=IF(' + cond + ",'02_EGRESOS'!$A" + src + ',"")',
      '=IF($A' + destRow + '="","",\'02_EGRESOS\'!$B' + src + ')',
      '=IF($A' + destRow + '="","","EGRESO")',
      '=IF($A' + destRow + '="","",\'02_EGRESOS\'!$D' + src + ')',
      '=IF($A' + destRow + '="","",\'02_EGRESOS\'!$E' + src + ')',
      '=IF($A' + destRow + '="","",\'02_EGRESOS\'!$C' + src + ')',
      '=IF($A' + destRow + '="","",\'02_EGRESOS\'!$G' + src + ')'
    ]);
  }
  pub.getRange(inicioDatosEgr, 1, capacidad, 7).setFormulas(bloqueEgresos);
  aplicarFormatoFilasDatos_(pub, inicioDatosEgr, capacidad, 7, 2, 6);

  // --- ENTREGAS PÚBLICAS: separador, título, nota, encabezado ---
  fila = inicioDatosEgr + capacidad + 1; // +1 = fila en blanco de separación
  pub.getRange(fila, 1, 1, 9).merge();
  pub.getRange(fila, 1).setValue('ENTREGAS PÚBLICAS')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');
  fila++;

  pub.getRange(fila, 1).setValue(
    'Solo Estado=VERIFICADO y Publicar=SI. No incluye el campo Responsable (uso interno).'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);
  fila++;

  const headersEnt = ['ID', 'Fecha', 'Localidad', 'Tipo de ayuda', 'Descripción', 'Cantidad', 'Unidad', 'Beneficiarios', 'Evidencia'];
  pub.getRange(fila, 1, 1, 9).setValues([headersEnt])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');
  fila++;

  // --- Bloque ENTREGAS (capacidad filas) ---
  const inicioDatosEnt = fila;
  const bloqueEntregas = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosEnt + i;
    const cond = "AND('03_ENTREGAS'!$K" + src + '="VERIFICADO",\'03_ENTREGAS\'!$L' + src + '="SI")';
    bloqueEntregas.push([
      '=IF(' + cond + ",'03_ENTREGAS'!$A" + src + ',"")',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$B' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$C' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$D' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$E' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$F' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$G' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$H' + src + ')',
      '=IF($A' + destRow + '="","",\'03_ENTREGAS\'!$J' + src + ')'
    ]);
  }
  pub.getRange(inicioDatosEnt, 1, capacidad, 9).setFormulas(bloqueEntregas);
  aplicarFormatoFilasDatos_(pub, inicioDatosEnt, capacidad, 9, 2, null);

  pub.setFrozenRows(1);

}


function aplicarFormatoFilasDatos_(hoja, filaInicio, cantidadFilas, cantidadCols, colFecha, colImporte) {

  hoja.getRange(filaInicio, 1, cantidadFilas, cantidadCols)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

  if (colFecha) hoja.getRange(filaInicio, colFecha, cantidadFilas, 1).setNumberFormat('dd/MM/yyyy');
  if (colImporte) hoja.getRange(filaInicio, colImporte, cantidadFilas, 1).setNumberFormat('$ #,##0');

}