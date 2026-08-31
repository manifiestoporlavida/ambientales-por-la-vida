/*******************************************************
 * IMPACTO POR CATEGORÍA — corre UNA sola vez
 * =====================================================
 * Agrega una tabla nueva (12 categorías × 5 dimensiones
 * demográficas + total) a 04_RESUMEN y su espejo en
 * 05_PUBLICO, combinando 02_EGRESOS (columna Categoría) y
 * 03_ENTREGAS (columna Tipo_de_ayuda) — se tratan como el
 * mismo eje conceptual de "tipo de ayuda", aunque viven en
 * columnas con nombre distinto en cada hoja.
 *
 * No reemplaza los indicadores agregados que ya existían
 * (beneficiarios_mujeres, etc. en el nivel superior del
 * JSON) — los complementa con el desglose por categoría.
 *
 * Requiere que ReformaSistema.gs y AjustesPostReforma.gs
 * sigan en el proyecto (se reutiliza formatearBloqueDatos_
 * indirectamente vía el mismo estilo de bordes).
 *******************************************************/

const CATEGORIAS_IMPACTO = [
  'ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'TRANSPORTE',
  'LOGISTICA', 'ALOJAMIENTO TEMPORAL', 'COMUNICACION', 'AYUDA ECONOMICA DIRECTA',
  'ROPA', 'PAP APOYO EMOCIONAL', 'OTROS'
];


function ejecutarAgregarImpactoPorCategoria() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const filaTituloResumen = agregarImpactoA04Resumen_(ss);
  agregarImpactoA05Publico_(ss, filaTituloResumen);

  SpreadsheetApp.flush();

  Logger.log(
    'Impacto por categoría agregado a 04_RESUMEN y 05_PUBLICO. ' +
    'Falta reemplazar TransparenciaHumanitaria.gs por la versión que ' +
    'agrega "impacto_por_categoria" a la API (doGet).'
  );

}


/* =====================================================
   1. TABLA EN 04_RESUMEN
   ===================================================== */

function agregarImpactoA04Resumen_(ss) {

  const res = ss.getSheetByName('04_RESUMEN');

  // Si ya existe de una corrida anterior, se borra para reconstruir limpio
  const existente = res.createTextFinder('IMPACTO POR CATEGORÍA Y POBLACIÓN').matchEntireCell(false).findNext();
  if (existente) {
    const filaVieja = existente.getRow();
    const ultimaFila = res.getLastRow();
    if (ultimaFila >= filaVieja) res.deleteRows(filaVieja, ultimaFila - filaVieja + 1);
  }

  const distTitulo = res.createTextFinder('DISTRIBUCIÓN DE LOS RECURSOS UTILIZADOS').matchEntireCell(false).findNext();
  if (!distTitulo) throw new Error('No se encontró la sección de distribución en 04_RESUMEN.');
  const distTitleRow = distTitulo.getRow();
  const hRowDist = distTitleRow + 1;
  const firstCatRowDist = hRowDist + 1;
  const numCategoriasDist = 10; // categorías de egreso construidas en ReformaSistema.gs
  const totalRowDist = firstCatRowDist + numCategoriasDist;

  // Margen generoso para no superponerse con el gráfico flotante de la sección anterior
  const titleRow = totalRowDist + 20;

  res.getRange(titleRow, 1, 1, 7).merge();
  res.getRange(titleRow, 1).setValue('IMPACTO POR CATEGORÍA Y POBLACIÓN')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  res.getRange(titleRow + 1, 1).setValue(
    'Combina Egresos (Categoría) y Entregas (Tipo_de_ayuda) verificados. Una categoría puede existir en una sola de las dos hojas — es normal.'
  ).setFontStyle('italic').setFontColor('#7F7F7F').setFontSize(9);

  const hRow = titleRow + 2;
  const headers = ['Categoría', 'Mujeres', 'Infancias', 'Diversidades', 'Varones', 'Animales', 'Total personas'];
  res.getRange(hRow, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  const firstRow = hRow + 1;
  const colsOrigen = { 2: 'M', 3: 'N', 4: 'O', 5: 'P', 6: 'Q' }; // col destino -> letra fuente (Mujeres..Animales)

  CATEGORIAS_IMPACTO.forEach((cat, i) => {
    const r = firstRow + i;
    res.getRange(r, 1).setValue(cat)
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

    Object.keys(colsOrigen).forEach(destCol => {
      const letra = colsOrigen[destCol];
      const formula =
        `=SUMIFS('02_EGRESOS'!${letra}:${letra},'02_EGRESOS'!D:D,"${cat}",'02_EGRESOS'!H:H,"VERIFICADO")` +
        `+SUMIFS('03_ENTREGAS'!${letra}:${letra},'03_ENTREGAS'!D:D,"${cat}",'03_ENTREGAS'!K:K,"VERIFICADO")`;
      res.getRange(r, Number(destCol)).setFormula(formula).setNumberFormat('0')
        .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    });

    res.getRange(r, 7).setFormula(`=SUM(B${r}:E${r})`).setNumberFormat('0').setFontWeight('bold')
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
  });

  res.getRange(firstRow, 1, CATEGORIAS_IMPACTO.length, 7).setFontFamily('Arial').setFontSize(10);
  res.setColumnWidths(2, 6, 100);

  Logger.log('04_RESUMEN: sección IMPACTO POR CATEGORÍA Y POBLACIÓN agregada desde la fila ' + titleRow + '.');

  return titleRow;

}


/* =====================================================
   2. ESPEJO EN 05_PUBLICO (simple referencia a 04_RESUMEN,
      no repite las fórmulas SUMIFS)
   ===================================================== */

function agregarImpactoA05Publico_(ss, filaTituloResumen) {

  const pub = ss.getSheetByName('05_PUBLICO');

  const existente = pub.createTextFinder('IMPACTO POR CATEGORÍA').matchEntireCell(false).findNext();
  if (existente) {
    const filaVieja = existente.getRow();
    const ultimaFila = pub.getLastRow();
    if (ultimaFila >= filaVieja) pub.deleteRows(filaVieja, ultimaFila - filaVieja + 1);
  }

  const ultimaFilaActual = pub.getLastRow();
  const titleRow = ultimaFilaActual + 3;

  const filasNecesarias = titleRow + CATEGORIAS_IMPACTO.length + 10;
  if (pub.getMaxRows() < filasNecesarias) {
    pub.insertRowsAfter(pub.getMaxRows(), filasNecesarias - pub.getMaxRows());
  }

  pub.getRange(titleRow, 1, 1, 7).merge();
  pub.getRange(titleRow, 1).setValue('IMPACTO POR CATEGORÍA')
    .setFontWeight('bold').setFontSize(13).setFontColor('#1F4E5F');

  const hRow = titleRow + 1;
  const headers = ['Categoría', 'Mujeres', 'Infancias', 'Diversidades', 'Varones', 'Animales', 'Total personas'];
  pub.getRange(hRow, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1F4E5F').setHorizontalAlignment('center');

  // La tabla real en 04_RESUMEN arranca 3 filas después de su título (título, nota, encabezado)
  const filaDatosResumen = filaTituloResumen + 3;
  const firstRow = hRow + 1;

  CATEGORIAS_IMPACTO.forEach((cat, i) => {
    const rSrc = filaDatosResumen + i;
    const rDst = firstRow + i;

    pub.getRange(rDst, 1).setFormula(`='04_RESUMEN'!A${rSrc}`)
      .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

    for (let c = 2; c <= 7; c++) {
      const colLetra = String.fromCharCode(64 + c); // B..G
      pub.getRange(rDst, c).setFormula(`='04_RESUMEN'!${colLetra}${rSrc}`)
        .setNumberFormat('0')   // clave: sin esto hereda el formato de fecha del bloque de Entregas de arriba
        .setBorder(true, true, true, true, true, true, '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);
    }
  });

  pub.getRange(firstRow, 1, CATEGORIAS_IMPACTO.length, 7).setFontFamily('Arial').setFontSize(10);
  pub.setColumnWidths(2, 6, 100);

  Logger.log('05_PUBLICO: sección IMPACTO POR CATEGORÍA agregada desde la fila ' + titleRow + '.');

}