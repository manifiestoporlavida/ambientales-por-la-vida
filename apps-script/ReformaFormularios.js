/*******************************************************
 * REFORMA DE LOS FORMULARIOS — corre UNA sola vez, PASO 2 de 2
 * =====================================================
 * Correr DESPUÉS de ReformaSistema.gs (paso 1), y ANTES de
 * reemplazar TransparenciaHumanitaria.gs.
 *
 * Edita los 3 Google Forms YA EXISTENTES (no crea formularios
 * nuevos, no rompe los links que ya compartiste ni las hojas
 * de respuestas RESP_INGRESOS / RESP_EGRESOS / RESP_ENTREGAS):
 *
 *  - Ingresos: actualiza la lista de "Medio", elimina "Referencia"
 *  - Egresos: actualiza la lista de "Categoría", elimina la
 *    pregunta "Beneficiarios" y agrega las 5 preguntas nuevas
 *    de desglose demográfico
 *  - Entregas: actualiza la lista de "Tipo_de_ayuda", mismo
 *    reemplazo de "Beneficiarios" por las 5 preguntas nuevas
 *
 * Ubica cada formulario a partir de su hoja de respuestas
 * (sheet.getFormUrl()), así que no hace falta copiar IDs a mano.
 *******************************************************/

function ejecutarReformaFormularios() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  reformarFormIngresos_(ss);
  reformarFormEgresos_(ss);
  reformarFormEntregas_(ss);

  Logger.log(
    'Los 3 formularios fueron actualizados. Revisalos abriendo cada uno ' +
    '(desde Respuestas > ícono de Sheets > el link del form, o desde ' +
    'Drive) antes de reemplazar TransparenciaHumanitaria.gs.'
  );

}


function obtenerFormDesdeHojaRespuestas_(ss, nombreHoja) {
  const hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) throw new Error('No existe la hoja de respuestas: ' + nombreHoja);
  const url = hoja.getFormUrl();
  if (!url) throw new Error(nombreHoja + ' no está vinculada a ningún formulario.');
  return FormApp.openByUrl(url);
}

function encontrarItemPorTitulo_(form, titulo) {
  const items = form.getItems();
  for (let i = 0; i < items.length; i++) {
    if (items[i].getTitle() === titulo) return items[i];
  }
  return null;
}

function agregarPreguntaNumerica_(form, titulo) {
  const item = form.addTextItem().setTitle(titulo).setRequired(false);
  const val = FormApp.createTextValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setHelpText('Ingresá un número mayor o igual a 0 (podés dejarlo en 0 si no aplica).')
    .build();
  item.setValidation(val);
  return item;
}

function agregarPreguntasDemograficas_(form) {
  agregarPreguntaNumerica_(form, 'Cantidad mujeres beneficiadas');
  agregarPreguntaNumerica_(form, 'Cantidad infancias beneficiadas');
  agregarPreguntaNumerica_(form, 'Cantidad diversidades beneficiadas');
  agregarPreguntaNumerica_(form, 'Cantidad varones beneficiados');
  agregarPreguntaNumerica_(form, 'Cantidad de animales beneficiados');
}


function reformarFormIngresos_(ss) {

  const form = obtenerFormDesdeHojaRespuestas_(ss, CONFIG.respuestas.ingresos);

  const medioItem = encontrarItemPorTitulo_(form, 'Medio');
  if (medioItem) {
    medioItem.asListItem().setChoiceValues(['Transferencia bancaria', 'Mercado Pago', 'Efectivo', 'Billetera virtual', 'Vaki', 'Donación en especie', 'Otro']);
  } else {
    Logger.log('ADVERTENCIA: no se encontró la pregunta "Medio" en el Form de Ingresos.');
  }

  const refItem = encontrarItemPorTitulo_(form, 'Referencia');
  if (refItem) {
    form.deleteItem(refItem);
  } else {
    Logger.log('Aviso: no se encontró "Referencia" en el Form de Ingresos (puede que ya no exista).');
  }

  Logger.log('Form Ingresos actualizado: ' + form.getEditUrl());

}


function reformarFormEgresos_(ss) {

  const form = obtenerFormDesdeHojaRespuestas_(ss, CONFIG.respuestas.egresos);

  const catItem = encontrarItemPorTitulo_(form, 'Categoría');
  if (catItem) {
    catItem.asListItem().setChoiceValues([
      'ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'TRANSPORTE',
      'LOGISTICA', 'ALOJAMIENTO TEMPORAL', 'COMUNICACION', 'AYUDA ECONOMICA DIRECTA', 'OTROS'
    ]);
  } else {
    Logger.log('ADVERTENCIA: no se encontró la pregunta "Categoría" en el Form de Egresos.');
  }

  const benefItem = encontrarItemPorTitulo_(form, 'Beneficiarios');
  if (benefItem) form.deleteItem(benefItem);

  agregarPreguntasDemograficas_(form);

  Logger.log('Form Egresos actualizado: ' + form.getEditUrl());

}


function reformarFormEntregas_(ss) {

  const form = obtenerFormDesdeHojaRespuestas_(ss, CONFIG.respuestas.entregas);

  const tipoItem = encontrarItemPorTitulo_(form, 'Tipo_de_ayuda');
  if (tipoItem) {
    tipoItem.asListItem().setChoiceValues([
      'ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS/EQUIPAMIENTO', 'ROPA',
      'ALOJAMIENTO TEMPORAL', 'PAP APOYO EMOCIONAL', 'AYUDA ECONOMICA DIRECTA', 'LOGISTICA', 'OTROS'
    ]);
  } else {
    Logger.log('ADVERTENCIA: no se encontró la pregunta "Tipo_de_ayuda" en el Form de Entregas.');
  }

  const benefItem = encontrarItemPorTitulo_(form, 'Beneficiarios');
  if (benefItem) form.deleteItem(benefItem);

  agregarPreguntasDemograficas_(form);

  Logger.log('Form Entregas actualizado: ' + form.getEditUrl());

}