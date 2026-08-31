/*******************************************************
 * REFORMA DEL SISTEMA — corre UNA sola vez, PASO 1 de 2
 * =====================================================
 * (paso 2 es ReformaFormularios.gs — correr ese DESPUÉS
 * de este, y después reemplazar TransparenciaHumanitaria.gs)
 *
 * Implementa:
 *
 * 01_INGRESOS
 *  - Medio: lista AMPLIADA (se agregan Billetera virtual y Vaki;
 *    se mantienen Transferencia bancaria, Mercado Pago, Efectivo,
 *    Donación en especie y Otro)
 *  - Se agrega Tipo_Recurso (MONETARIO/ESPECIE, automático
 *    según el Medio elegido)
 *  - Se elimina Referencia
 *
 * 02_EGRESOS
 *  - Categoría: lista ampliada, fusionando duplicados obvios
 *    (INSUMOS→INSUMOS/EQUIPAMIENTO, ALOJAMIENTO→ALOJAMIENTO
 *    TEMPORAL) y agregando AYUDA ECONOMICA DIRECTA
 *  - La columna "Beneficiarios" original pasa a llamarse
 *    "Beneficiarios_legacy" (histórico, no se usa más)
 *  - Se agregan 6 columnas al final: Benef_Mujeres,
 *    Benef_Infancias, Benef_Diversidades, Benef_Varones,
 *    Benef_Animales, Total_Personas (calculada)
 *
 * 03_ENTREGAS
 *  - Tipo_de_ayuda: misma lógica de ampliación, + PAP Apoyo
 *    emocional y Logística
 *  - Mismo tratamiento de Beneficiarios → legacy + 6 columnas
 *    nuevas al final
 *
 * 04_RESUMEN y 05_PUBLICO
 *  - Se reconstruyen completos (son 100% fórmulas, no hay
 *    datos manuales que perder)
 *  - "Recursos recibidos" ahora excluye ESPECIE
 *  - Nuevo indicador "Recibido en especie"
 *  - Nuevos indicadores de desglose demográfico + animales
 *    beneficiados, sumando Egresos + Entregas
 *
 * Requiere que RepararEscala.gs siga en el proyecto (reutiliza
 * sus funciones aplicarListaDesplegable_ y
 * aplicarFormatoCondicionalEstado_).
 *******************************************************/

const CAPACIDAD_FILAS_REFORMA = 500;


function ejecutarReformaSistema() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  actualizarListas06Config_(ss);
  reformarIngresos_(ss);
  reformarEgresos_(ss);
  reformarEntregas_(ss);
  reformar04Resumen_(ss);
  reconstruirPublicoReforma_(ss, CAPACIDAD_FILAS_REFORMA);

  SpreadsheetApp.flush();

  Logger.log(
    'Paso 1 aplicado. Revisá 01_INGRESOS, 02_EGRESOS, 03_ENTREGAS, ' +
    '04_RESUMEN y 05_PUBLICO. Cuando esté todo verificado, corré ' +
    'ReformaFormularios.gs (paso 2) y después reemplazá ' +
    'TransparenciaHumanitaria.gs por la versión actualizada.'
  );

}


/* =====================================================
   1. LISTAS EN 06_CONFIG (+ migración de valores viejos)
   ===================================================== */

function actualizarListas06Config_(ss) {

  const cfg = ss.getSheetByName('06_CONFIG');

  const medios = ['Transferencia bancaria', 'Mercado Pago', 'Efectivo', 'Billetera virtual', 'Vaki', 'Donación en especie', 'Otro'];
  cfg.getRange('A2:A20').clearContent();
  cfg.getRange(2, 1, medios.length, 1).setValues(medios.map(v => [v]));

  const categorias = [
    'ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'TRANSPORTE',
    'LOGISTICA', 'ALOJAMIENTO TEMPORAL', 'COMUNICACION', 'AYUDA ECONOMICA DIRECTA', 'OTROS'
  ];
  cfg.getRange('D2:D20').clearContent();
  cfg.getRange(2, 4, categorias.length, 1).setValues(categorias.map(v => [v]));

  const tipoAyuda = [
    'ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'ROPA',
    'ALOJAMIENTO TEMPORAL', 'PAP APOYO EMOCIONAL', 'AYUDA ECONOMICA DIRECTA', 'LOGISTICA', 'OTROS'
  ];
  cfg.getRange('E2:E20').clearContent();
  cfg.getRange(2, 5, tipoAyuda.length, 1).setValues(tipoAyuda.map(v => [v]));

  // Migrar valores ya cargados que quedaron obsoletos (solo aplica a
  // Categoría/Tipo_de_ayuda, donde sí fusionamos nombres; "Medio" se
  // amplió sin sacar nada, no necesita migración).
  migrarValorAntiguo_(ss.getSheetByName('02_EGRESOS'), 4, 'INSUMOS', 'INSUMOS/EQUIPAMIENTO');
  migrarValorAntiguo_(ss.getSheetByName('02_EGRESOS'), 4, 'ALOJAMIENTO', 'ALOJAMIENTO TEMPORAL');
  migrarValorAntiguo_(ss.getSheetByName('03_ENTREGAS'), 4, 'ALOJAMIENTO', 'ALOJAMIENTO TEMPORAL');
  migrarValorAntiguo_(ss.getSheetByName('03_ENTREGAS'), 4, 'INSUMOS', 'INSUMOS/EQUIPAMIENTO');

}

function migrarValorAntiguo_(hoja, columna, valorViejo, valorNuevo) {
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;
  const rango = hoja.getRange(2, columna, ultimaFila - 1, 1);
  const valores = rango.getValues();
  let cambios = 0;
  for (let i = 0; i < valores.length; i++) {
    if (valores[i][0] === valorViejo) { valores[i][0] = valorNuevo; cambios++; }
  }
  if (cambios > 0) rango.setValues(valores);
  Logger.log(hoja.getName() + ': ' + cambios + ' valor(es) "' + valorViejo + '" → "' + valorNuevo + '"');
}


/* =====================================================
   2. 01_INGRESOS
   ===================================================== */

function reformarIngresos_(ss) {

  const ing = ss.getSheetByName('01_INGRESOS');
  const cap = CAPACIDAD_FILAS_REFORMA;
  const ultimaFila = cap + 1;

  // Insertar Tipo_Recurso antes de "Concepto" (queda en la columna E)
  ing.insertColumnBefore(5);
  ing.getRange(1, 5).setValue('Tipo_Recurso')
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  // Ahora "Referencia" quedó en la columna G — se elimina
  ing.deleteColumn(7);

  // Fórmula de Tipo_Recurso para todas las filas
  const formulas = [];
  for (let r = 2; r <= ultimaFila; r++) {
    formulas.push([`=IF($D${r}="","",IF($D${r}="Donación en especie","ESPECIE","MONETARIO"))`]);
  }
  ing.getRange(2, 5, formulas.length, 1).setFormulas(formulas)
    .setFontFamily('Arial').setFontSize(10)
    .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

  ing.setColumnWidth(5, 110);

  // IMPORTANTE: la validación de "Medio" que dejó RepararEscala.gs apuntaba
  // a un rango fijo de 5 filas en 06_CONFIG (A2:A6). Ahora la lista tiene 7
  // ítems (se amplió, no se reemplazó) — si no se reaplica el rango acá,
  // "Donación en especie" y "Otro" quedan fuera del rango válido y Sheets
  // los rechazaría al tipear a mano (setAllowInvalid está en false).
  aplicarListaDesplegable_(ing, `D2:D${ultimaFila}`, "'06_CONFIG'!A2:A8");

  Logger.log('01_INGRESOS: A ID, B Fecha, C Importe, D Medio, E Tipo_Recurso, F Concepto, G Comprobante, H Estado, I Publicar, J Observaciones');

}


/* =====================================================
   3. 02_EGRESOS
   ===================================================== */

function reformarEgresos_(ss) {

  const egr = ss.getSheetByName('02_EGRESOS');
  const cap = CAPACIDAD_FILAS_REFORMA;
  const ultimaFila = cap + 1;
  const startCol = 13; // M

  egr.getRange(1, 10).setValue('Beneficiarios_legacy');

  const headers = ['Benef_Mujeres', 'Benef_Infancias', 'Benef_Diversidades', 'Benef_Varones', 'Benef_Animales', 'Total_Personas'];
  egr.getRange(1, startCol, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const formulasTotal = [];
  for (let r = 2; r <= ultimaFila; r++) {
    formulasTotal.push([`=IF(COUNTBLANK(M${r}:P${r})=4,"",SUM(M${r}:P${r}))`]);
  }
  egr.getRange(2, startCol + 5, formulasTotal.length, 1).setFormulas(formulasTotal);

  const dv = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(true).build();
  egr.getRange(2, startCol, cap, 5).setDataValidation(dv);

  egr.getRange(2, startCol, cap, 6).setFontFamily('Arial').setFontSize(10)
    .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

  aplicarListaDesplegable_(egr, `D2:D${ultimaFila}`, "'06_CONFIG'!D2:D11");

  for (let c = startCol; c < startCol + headers.length; c++) egr.setColumnWidth(c, 110);

  Logger.log('02_EGRESOS: J renombrada a Beneficiarios_legacy; agregadas M(13) a R(18).');

}


/* =====================================================
   4. 03_ENTREGAS
   ===================================================== */

function reformarEntregas_(ss) {

  const ent = ss.getSheetByName('03_ENTREGAS');
  const cap = CAPACIDAD_FILAS_REFORMA;
  const ultimaFila = cap + 1;
  const startCol = 13; // M

  ent.getRange(1, 8).setValue('Beneficiarios_legacy');

  const headers = ['Benef_Mujeres', 'Benef_Infancias', 'Benef_Diversidades', 'Benef_Varones', 'Benef_Animales', 'Total_Personas'];
  ent.getRange(1, startCol, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const formulasTotal = [];
  for (let r = 2; r <= ultimaFila; r++) {
    formulasTotal.push([`=IF(COUNTBLANK(M${r}:P${r})=4,"",SUM(M${r}:P${r}))`]);
  }
  ent.getRange(2, startCol + 5, formulasTotal.length, 1).setFormulas(formulasTotal);

  const dv = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(true).build();
  ent.getRange(2, startCol, cap, 5).setDataValidation(dv);

  ent.getRange(2, startCol, cap, 6).setFontFamily('Arial').setFontSize(10)
    .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

  aplicarListaDesplegable_(ent, `D2:D${ultimaFila}`, "'06_CONFIG'!E2:E11");

  for (let c = startCol; c < startCol + headers.length; c++) ent.setColumnWidth(c, 110);

  Logger.log('03_ENTREGAS: H renombrada a Beneficiarios_legacy; agregadas M(13) a R(18). Estado/Publicar SIN cambios (siguen en K/L).');

}


/* =====================================================
   5. 04_RESUMEN (reconstrucción completa)
   ===================================================== */

function reformar04Resumen_(ss) {

  const res = ss.getSheetByName('04_RESUMEN');
  res.getCharts().forEach(c => res.removeChart(c));
  res.clear();
  res.clearFormats();

  res.getRange('A1').setValue('RESUMEN FINANCIERO').setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');
  res.getRange('A1:C1').merge();

  const filas = [
    ['Recursos recibidos (dinero)', `=SUMIFS('01_INGRESOS'!C:C,'01_INGRESOS'!H:H,"VERIFICADO",'01_INGRESOS'!E:E,"MONETARIO")`, '$#,##0'],
    ['Recibido en especie (valorizado)', `=SUMIFS('01_INGRESOS'!C:C,'01_INGRESOS'!H:H,"VERIFICADO",'01_INGRESOS'!E:E,"ESPECIE")`, '$#,##0'],
    ['Recursos utilizados', `=SUMIF('02_EGRESOS'!H:H,"VERIFICADO",'02_EGRESOS'!C:C)`, '$#,##0'],
    ['Saldo disponible', `=B2-B4`, '$#,##0'],
    ['Donaciones verificadas', `=COUNTIF('01_INGRESOS'!H:H,"VERIFICADO")`, '0'],
    ['Gastos verificados', `=COUNTIF('02_EGRESOS'!H:H,"VERIFICADO")`, '0'],
    ['Entregas realizadas', `=COUNTIF('03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Personas alcanzadas', `=SUMIFS('02_EGRESOS'!R:R,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!R:R,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Mujeres beneficiadas', `=SUMIFS('02_EGRESOS'!M:M,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!M:M,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Infancias beneficiadas', `=SUMIFS('02_EGRESOS'!N:N,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!N:N,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Diversidades beneficiadas', `=SUMIFS('02_EGRESOS'!O:O,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!O:O,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Varones beneficiados', `=SUMIFS('02_EGRESOS'!P:P,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!P:P,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Animales beneficiados', `=SUMIFS('02_EGRESOS'!Q:Q,'02_EGRESOS'!H:H,"VERIFICADO")+SUMIFS('03_ENTREGAS'!Q:Q,'03_ENTREGAS'!K:K,"VERIFICADO")`, '0'],
    ['Última fecha de movimiento', `=MAX('01_INGRESOS'!B:B,'02_EGRESOS'!B:B,'03_ENTREGAS'!B:B)`, 'DD/MM/YYYY']
  ];

  let row = 2;
  filas.forEach(([label, formula, fmt]) => {
    res.getRange(row, 1).setValue(label).setFontFamily('Arial').setFontSize(10)
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    res.getRange(row, 2).setFormula(formula).setNumberFormat(fmt).setFontWeight('bold')
      .setHorizontalAlignment('right').setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    row++;
  });

  res.setColumnWidth(1, 220);
  res.setColumnWidth(2, 140);

  // --- Distribución de egresos por categoría ---
  const distTitleRow = row + 2;
  res.getRange(distTitleRow, 1, 1, 3).merge();
  res.getRange(distTitleRow, 1).setValue('DISTRIBUCIÓN DE LOS RECURSOS UTILIZADOS')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  const hRow = distTitleRow + 1;
  res.getRange(hRow, 1, 1, 3).setValues([['Categoría', 'Importe utilizado', '% del total']])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const categorias = ['ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'TRANSPORTE', 'LOGISTICA', 'ALOJAMIENTO TEMPORAL', 'COMUNICACION', 'AYUDA ECONOMICA DIRECTA', 'OTROS'];
  const firstCatRow = hRow + 1;
  categorias.forEach((cat, i) => {
    const r = firstCatRow + i;
    res.getRange(r, 1).setValue(cat).setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    res.getRange(r, 2).setFormula(`=SUMIFS('02_EGRESOS'!C:C,'02_EGRESOS'!D:D,"${cat}",'02_EGRESOS'!H:H,"VERIFICADO")`)
      .setNumberFormat('$#,##0').setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    res.getRange(r, 3).setFormula(`=IFERROR(B${r}/$B$4,0)`).setNumberFormat('0.0%')
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
  });
  const lastCatRow = firstCatRow + categorias.length - 1;

  const totalRow = lastCatRow + 1;
  res.getRange(totalRow, 1).setValue('TOTAL').setFontWeight('bold');
  res.getRange(totalRow, 2).setFormula(`=SUM(B${firstCatRow}:B${lastCatRow})`).setNumberFormat('$#,##0').setFontWeight('bold');
  res.getRange(totalRow, 3).setFormula(`=SUM(C${firstCatRow}:C${lastCatRow})`).setNumberFormat('0.0%').setFontWeight('bold');

  const chart = res.newChart().asColumnChart()
    .addRange(res.getRange(hRow, 1, 1 + categorias.length, 1))
    .addRange(res.getRange(hRow, 2, 1 + categorias.length, 1))
    .setPosition(hRow, 5, 0, 0)
    .setOption('title', 'Egresos verificados por categoría')
    .setOption('legend', { position: 'none' })
    .build();
  res.insertChart(chart);

  Logger.log('04_RESUMEN reconstruido: ' + filas.length + ' indicadores (filas 2-' + (row - 1) + '), ' + categorias.length + ' categorías.');

}


/* =====================================================
   6. 05_PUBLICO (reconstrucción completa, mismo patrón
      que RepararEscala.gs pero con 14 indicadores y el
      Concepto de Ingresos leído de la columna F, no E)
   ===================================================== */

function reconstruirPublicoReforma_(ss, capacidad) {

  const pub = ss.getSheetByName('05_PUBLICO');

  // Filas totales que vamos a necesitar: 14 indicadores + títulos/notas/
  // encabezados de las 2 secciones + 2 bloques de "capacidad" (ingresos y
  // egresos) + 1 bloque más de "capacidad" (entregas). Con margen.
  const filasNecesarias = 16 + (3 * capacidad) + 10;
  if (pub.getMaxRows() < filasNecesarias) {
    pub.insertRowsAfter(pub.getMaxRows(), filasNecesarias - pub.getMaxRows());
  }

  pub.clear();
  pub.clearFormats();

  // --- INDICADORES (14 filas) ---
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

  // --- OPERACIONES PÚBLICAS ---
  const opsTitleRow = r + 2;
  pub.getRange(opsTitleRow, 1, 1, 7).merge();
  pub.getRange(opsTitleRow, 1).setValue('OPERACIONES PÚBLICAS (INGRESOS Y EGRESOS)')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  pub.getRange(opsTitleRow + 1, 1).setValue(
    'Solo se muestran registros con Estado=VERIFICADO y Publicar=SI. Las filas sin coincidencia quedan en blanco.'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);

  const opsHeaderRow = opsTitleRow + 2;
  pub.getRange(opsHeaderRow, 1, 1, 7).setValues([['ID', 'Fecha', 'Tipo', 'Categoría', 'Concepto', 'Importe', 'Comprobante']])
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
      `=IF($A${destRow}="","",'01_INGRESOS'!$F${src})`,   // Concepto ahora en F (antes E)
      `=IF($A${destRow}="","",'01_INGRESOS'!$C${src})`,
      `=IF($A${destRow}="","",'01_INGRESOS'!$G${src})`
    ]);
  }
  pub.getRange(inicioDatosOps, 1, capacidad, 7).setFormulas(bloqueIngresos);
  formatearBloqueDatos_(pub, inicioDatosOps, capacidad, 7, 2, 6);

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
      `=IF($A${destRow}="","",'02_EGRESOS'!$G${src})`
    ]);
  }
  pub.getRange(inicioDatosEgr, 1, capacidad, 7).setFormulas(bloqueEgresos);
  formatearBloqueDatos_(pub, inicioDatosEgr, capacidad, 7, 2, 6);

  // --- ENTREGAS PÚBLICAS ---
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
      `=IF($A${destRow}="","",'03_ENTREGAS'!$R${src})`,   // Total_Personas calculado (antes: Beneficiarios en H)
      `=IF($A${destRow}="","",'03_ENTREGAS'!$J${src})`
    ]);
  }
  pub.getRange(inicioDatosEnt, 1, capacidad, 9).setFormulas(bloqueEntregas);
  formatearBloqueDatos_(pub, inicioDatosEnt, capacidad, 9, 2, null);

  pub.setFrozenRows(1);

  const filaFinalNecesaria = pub.getMaxRows();
  Logger.log('05_PUBLICO reconstruido hasta la fila ' + filaFinalNecesaria + '.');

}

function formatearBloqueDatos_(hoja, filaInicio, cantidadFilas, cantidadCols, colFecha, colImporte) {
  hoja.getRange(filaInicio, 1, cantidadFilas, cantidadCols)
    .setFontFamily('Arial').setFontSize(10)
    .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
  if (colFecha) hoja.getRange(filaInicio, colFecha, cantidadFilas, 1).setNumberFormat('dd/MM/yyyy');
  if (colImporte) hoja.getRange(filaInicio, colImporte, cantidadFilas, 1).setNumberFormat('$ #,##0');
}