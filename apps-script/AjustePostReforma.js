/*******************************************************
 * AJUSTES POST-REFORMA — corre UNA sola vez
 * =====================================================
 * Arregla dos cosas encontradas después de aplicar
 * ReformaSistema.gs / ReformaFormularios.gs:
 *
 * 1. BUG: las fórmulas de Tipo_Recurso (Ingresos) y
 *    Total_Personas (Egresos/Entregas) se habían aplicado
 *    de entrada a las 500 filas de margen, no solo a las
 *    que tenían datos reales. Una fórmula cuenta como
 *    "contenido" para getLastRow(), aunque evalúe a "" —
 *    así que cada envío nuevo de formulario terminaba
 *    agregándose recién en la fila 502 en adelante: entra
 *    a la hoja, pero lejos de donde se mira, y fuera del
 *    rango que 05_PUBLICO espeja hacia la API.
 *    Este script limpia esas fórmulas en las filas que NO
 *    tienen ID real, dejándolas genuinamente vacías otra
 *    vez, y corrige la fila donde haya quedado algún envío
 *    de prueba mal ubicado.
 *
 * 2. MEJORA: agrega el campo tipo_recurso (MONETARIO/
 *    ESPECIE/"-") a cada línea de "operaciones" en la API
 *    pública, no solo al indicador agregado. Así la landing
 *    puede mostrar un badge "EN ESPECIE" en el ítem puntual.
 *
 * Requiere que ReformaSistema.gs siga en el proyecto
 * (usa CAPACIDAD_FILAS_REFORMA y formatearBloqueDatos_).
 *******************************************************/

function ejecutarAjustesPostReforma() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cap = CAPACIDAD_FILAS_REFORMA;

  limpiarPaddingFormulas_(ss, cap);
  reubicarFilasFueraDeRango_(ss, cap);
  reconstruirPublicoConTipoRecurso_(ss, cap);

  SpreadsheetApp.flush();

  Logger.log(
    'Ajustes aplicados: padding limpiado, filas fuera de rango reubicadas ' +
    '(revisá el registro de arriba para ver si hubo alguna), y 05_PUBLICO ' +
    'reconstruido con tipo_recurso por línea. Falta reemplazar ' +
    'TransparenciaHumanitaria.gs por la versión que agrega tipo_recurso ' +
    'a la lectura de la API (doGet).'
  );

}


/* =====================================================
   1. LIMPIAR EL PADDING DE FÓRMULAS
   ===================================================== */

function limpiarPaddingFormulas_(ss, capacidad) {

  limpiarPaddingColumna_(ss.getSheetByName('01_INGRESOS'), 1, 5, capacidad);
  limpiarPaddingColumna_(ss.getSheetByName('02_EGRESOS'), 1, 18, capacidad);
  limpiarPaddingColumna_(ss.getSheetByName('03_ENTREGAS'), 1, 18, capacidad);

}

// Para cada fila de 2 a capacidad+1: si la columna de ID (colId) está
// vacía, borra por completo lo que haya en colFormula. Si colId SÍ
// tiene datos, no toca nada.
function limpiarPaddingColumna_(hoja, colId, colFormula, capacidad) {

  const ids = hoja.getRange(2, colId, capacidad, 1).getValues();
  let limpiadas = 0;

  for (let i = 0; i < ids.length; i++) {
    const filaReal = 2 + i;
    const tieneId = ids[i][0] !== '' && ids[i][0] !== null;
    if (!tieneId) {
      hoja.getRange(filaReal, colFormula).clearContent();
      limpiadas++;
    }
  }

  Logger.log(hoja.getName() + ': ' + limpiadas + ' fila(s) de padding limpiadas en la columna ' + colFormula + '.');

}


/* =====================================================
   2. REUBICAR FILAS QUE HAYAN QUEDADO MÁS ALLÁ DE LA
      FILA "capacidad+1" POR EL BUG (envíos de prueba que
      cayeron en la fila 502 o más)
   ===================================================== */

function reubicarFilasFueraDeRango_(ss, capacidad) {

  reubicarHoja_(ss.getSheetByName('01_INGRESOS'), capacidad);
  reubicarHoja_(ss.getSheetByName('02_EGRESOS'), capacidad);
  reubicarHoja_(ss.getSheetByName('03_ENTREGAS'), capacidad);

}

function reubicarHoja_(hoja, capacidad) {

  const limiteFila = capacidad + 1;
  const ultimaFilaReal = hoja.getLastRow();
  if (ultimaFilaReal <= limiteFila) {
    Logger.log(hoja.getName() + ': sin filas fuera de rango.');
    return;
  }

  const numCols = hoja.getLastColumn();
  const filasAMover = hoja.getRange(limiteFila + 1, 1, ultimaFilaReal - limiteFila, numCols).getValues()
    .filter(fila => fila.some(v => v !== '' && v !== null));

  if (filasAMover.length === 0) {
    // No había datos reales ahí, solo fórmulas vacías remanentes: se limpia el rango y listo.
    hoja.deleteRows(limiteFila + 1, ultimaFilaReal - limiteFila);
    Logger.log(hoja.getName() + ': filas fuera de rango eran solo fórmulas vacías, eliminadas.');
    return;
  }

  // Buscar la primera fila realmente libre dentro del rango válido (2..limiteFila)
  const idsDentroDeRango = hoja.getRange(2, 1, capacidad, 1).getValues();
  let filaLibre = -1;
  for (let i = 0; i < idsDentroDeRango.length; i++) {
    if (idsDentroDeRango[i][0] === '' || idsDentroDeRango[i][0] === null) { filaLibre = 2 + i; break; }
  }

  if (filaLibre === -1) {
    Logger.log('ADVERTENCIA: ' + hoja.getName() + ' no tiene lugar libre dentro de las ' + capacidad + ' filas para reubicar ' + filasAMover.length + ' fila(s). Revisar manualmente.');
    return;
  }

  hoja.getRange(filaLibre, 1, filasAMover.length, numCols).setValues(filasAMover);
  hoja.deleteRows(limiteFila + 1, ultimaFilaReal - limiteFila);

  Logger.log(hoja.getName() + ': ' + filasAMover.length + ' fila(s) reubicadas desde fuera de rango hacia la fila ' + filaLibre + '.');

}


/* =====================================================
   3. RECONSTRUIR 05_PUBLICO CON tipo_recurso POR LÍNEA
   ===================================================== */

function reconstruirPublicoConTipoRecurso_(ss, capacidad) {

  const pub = ss.getSheetByName('05_PUBLICO');

  const filasNecesarias = 16 + (3 * capacidad) + 10;
  if (pub.getMaxRows() < filasNecesarias) {
    pub.insertRowsAfter(pub.getMaxRows(), filasNecesarias - pub.getMaxRows());
  }

  pub.clear();
  pub.clearFormats();

  pub.getRange('A1').setValue('INDICADORES').setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');
  pub.getRange('A1:B1').merge();

  const indicadores = [
    ['recaudado', "='04_RESUMEN'!B2", '$#,##0'],
    ['recibido_en_especie', "='04_RESUMEN'!B3", '$#,##0'],
    ['utilizado', "='04_RESUMEN'!B4", '$#,##0'],
    ['saldo', "='04_RESUMEN'!B5", '$#,##0'],
    ['donaciones', "='04_RESUMEN'!B6", '0'],
    ['gastos', "='04_RESUMEN'!B7", '0'],
    ['entregas', "='04_RESUMEN'!B8", '0'],
    ['beneficiarios', "='04_RESUMEN'!B9", '0'],
    ['beneficiarios_mujeres', "='04_RESUMEN'!B10", '0'],
    ['beneficiarios_infancias', "='04_RESUMEN'!B11", '0'],
    ['beneficiarios_diversidades', "='04_RESUMEN'!B12", '0'],
    ['beneficiarios_varones', "='04_RESUMEN'!B13", '0'],
    ['animales_beneficiados', "='04_RESUMEN'!B14", '0'],
    ['ultima_actualizacion', "='04_RESUMEN'!B15", 'DD/MM/YYYY']
  ];

  let r = 2;
  indicadores.forEach(([campo, formula, fmt]) => {
    pub.getRange(r, 1).setValue(campo).setFontFamily('Arial').setFontSize(10)
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    pub.getRange(r, 2).setFormula(formula).setNumberFormat(fmt).setFontWeight('bold')
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    r++;
  });

  pub.setColumnWidth(1, 220); pub.setColumnWidth(2, 130);
  for (let c = 3; c <= 9; c++) pub.setColumnWidth(c, 110);

  // --- OPERACIONES PÚBLICAS (ahora con 8 columnas: + Tipo_Recurso) ---
  const opsTitleRow = r + 2;
  pub.getRange(opsTitleRow, 1, 1, 8).merge();
  pub.getRange(opsTitleRow, 1).setValue('OPERACIONES PÚBLICAS (INGRESOS Y EGRESOS)')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  pub.getRange(opsTitleRow + 1, 1).setValue(
    'Solo se muestran registros con Estado=VERIFICADO y Publicar=SI. Las filas sin coincidencia quedan en blanco. ' +
    'Tipo_Recurso solo aplica a ingresos (MONETARIO/ESPECIE); en egresos queda en "-".'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);

  const opsHeaderRow = opsTitleRow + 2;
  pub.getRange(opsHeaderRow, 1, 1, 8).setValues([['ID', 'Fecha', 'Tipo', 'Categoría', 'Concepto', 'Importe', 'Comprobante', 'Tipo_Recurso']])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const inicioDatosOps = opsHeaderRow + 1;
  const bloqueIngresos = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosOps + i;
    const cond = `AND('01_INGRESOS'!$H${src}="VERIFICADO",'01_INGRESOS'!$I${src}="SI")`;
    bloqueIngresos.push([
      `=IF(${cond},'01_INGRESOS'!$A${src},"")`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$B${src})`,
      `=IF($A${destRow}="","","INGRESO")`,
      `=IF($A${destRow}="","","-")`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$F${src})`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$C${src})`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$G${src})`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$E${src})`   // Tipo_Recurso
    ]);
  }
  pub.getRange(inicioDatosOps, 1, capacidad, 8).setFormulas(bloqueIngresos);
  formatearBloqueDatos_(pub, inicioDatosOps, capacidad, 8, 2, 6);

  const inicioDatosEgr = inicioDatosOps + capacidad;
  const bloqueEgresos = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosEgr + i;
    const cond = `AND('02_EGRESOS'!$H${src}="VERIFICADO",'02_EGRESOS'!$I${src}="SI")`;
    bloqueEgresos.push([
      `=IF(${cond},'02_EGRESOS'!$A${src},"")`,
      `=IF($A${destRow}="","",'02_EGRESOS'!$B${src})`,
      `=IF($A${destRow}="","","EGRESO")`,
      `=IF($A${destRow}="","",'02_EGRESOS'!$D${src})`,
      `=IF($A${destRow}="","",'02_EGRESOS'!$E${src})`,
      `=IF($A${destRow}="","",'02_EGRESOS'!$C${src})`,
      `=IF($A${destRow}="","",'02_EGRESOS'!$G${src})`,
      `=IF($A${destRow}="","","-")`   // Tipo_Recurso no aplica a egresos
    ]);
  }
  pub.getRange(inicioDatosEgr, 1, capacidad, 8).setFormulas(bloqueEgresos);
  formatearBloqueDatos_(pub, inicioDatosEgr, capacidad, 8, 2, 6);

  // --- ENTREGAS PÚBLICAS (sin cambios de estructura) ---
  const entTitleRow = inicioDatosEgr + capacidad + 1;
  pub.getRange(entTitleRow, 1, 1, 9).merge();
  pub.getRange(entTitleRow, 1).setValue('ENTREGAS PÚBLICAS')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  pub.getRange(entTitleRow + 1, 1).setValue(
    'Solo Estado=VERIFICADO y Publicar=SI. No incluye el campo Responsable (uso interno).'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);

  const entHeaderRow = entTitleRow + 2;
  pub.getRange(entHeaderRow, 1, 1, 9).setValues([['ID', 'Fecha', 'Localidad', 'Tipo de ayuda', 'Descripción', 'Cantidad', 'Unidad', 'Beneficiarios', 'Evidencia']])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const inicioDatosEnt = entHeaderRow + 1;
  const bloqueEntregas = [];
  for (let i = 0; i < capacidad; i++) {
    const src = 2 + i;
    const destRow = inicioDatosEnt + i;
    const cond = `AND('03_ENTREGAS'!$K${src}="VERIFICADO",'03_ENTREGAS'!$L${src}="SI")`;
    bloqueEntregas.push([
      `=IF(${cond},'03_ENTREGAS'!$A${src},"")`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$B${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$C${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$D${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$E${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$F${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$G${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$R${src})`,
      `=IF($A${destRow}="","",'03_ENTREGAS'!$J${src})`
    ]);
  }
  pub.getRange(inicioDatosEnt, 1, capacidad, 9).setFormulas(bloqueEntregas);
  formatearBloqueDatos_(pub, inicioDatosEnt, capacidad, 9, 2, null);

  pub.setFrozenRows(1);

  Logger.log('05_PUBLICO reconstruido con tipo_recurso por línea en Operaciones Públicas.');

}