/*******************************************************
 * QUITAR MERCADO PAGO — corre UNA sola vez
 * =====================================================
 * 1. Actualiza la lista "Medio" en 06_CONFIG (sin Mercado Pago).
 * 2. Reaplica la validación de Medio en 01_INGRESOS con el
 *    rango correcto (6 ítems en vez de 7).
 * 3. Recategoriza ING-0002 de "Mercado Pago" a "Billetera virtual".
 * 4. Actualiza la pregunta "Medio" en el Google Form de Ingresos.
 *
 * Requiere que RepararEscala.gs siga en el proyecto
 * (aplicarListaDesplegable_) y que CONFIG.respuestas.ingresos
 * siga apuntando a RESP_INGRESOS (TransparenciaHumanitaria.gs).
 *******************************************************/

const NUEVA_LISTA_MEDIO = ['Transferencia bancaria', 'Efectivo', 'Billetera virtual', 'Vaki', 'Donación en especie', 'Otro'];


function ejecutarQuitarMercadoPago() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  actualizarListaMedioEnConfig_(ss);
  reaplicarValidacionMedio_(ss);
  recategorizarIng0002_(ss);
  actualizarFormMedio_(ss);

  SpreadsheetApp.flush();

  Logger.log(
    'Listo: Mercado Pago sacado de la lista y del Form, rango de validación ' +
    'actualizado, e ING-0002 recategorizado a Billetera virtual. Recordá ' +
    'actualizar la implementación del Web App si esto afecta algo público ' +
    '(no debería, "Medio" no se expone en la API).'
  );

}


function actualizarListaMedioEnConfig_(ss) {

  const cfg = ss.getSheetByName('06_CONFIG');
  cfg.getRange('A2:A20').clearContent();
  cfg.getRange(2, 1, NUEVA_LISTA_MEDIO.length, 1).setValues(NUEVA_LISTA_MEDIO.map(v => [v]));

  Logger.log('06_CONFIG: lista Medio actualizada a ' + NUEVA_LISTA_MEDIO.length + ' ítems: ' + NUEVA_LISTA_MEDIO.join(', '));

}


function reaplicarValidacionMedio_(ss) {

  const ing = ss.getSheetByName('01_INGRESOS');
  const ultimaFila = CAPACIDAD_FILAS_REFORMA + 1; // 501, definida en ReformaSistema.gs

  aplicarListaDesplegable_(ing, `D2:D${ultimaFila}`, `'06_CONFIG'!A2:A${1 + NUEVA_LISTA_MEDIO.length}`);

  Logger.log('01_INGRESOS: validación de Medio reaplicada sobre D2:D' + ultimaFila + ', rango fuente A2:A' + (1 + NUEVA_LISTA_MEDIO.length) + '.');

}


function recategorizarIng0002_(ss) {

  const ing = ss.getSheetByName('01_INGRESOS');
  const ultimaFila = ing.getLastRow();
  const ids = ing.getRange(2, 1, ultimaFila - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === 'ING-0002') {
      const fila = i + 2;
      const medioAnterior = ing.getRange(fila, 4).getValue();
      ing.getRange(fila, 4).setValue('Billetera virtual');
      Logger.log('ING-0002 (fila ' + fila + '): Medio cambiado de "' + medioAnterior + '" a "Billetera virtual".');
      return;
    }
  }

  Logger.log('ADVERTENCIA: no se encontró ING-0002 en 01_INGRESOS.');

}


function actualizarFormMedio_(ss) {

  const hoja = ss.getSheetByName(CONFIG.respuestas.ingresos);
  if (!hoja) { Logger.log('ADVERTENCIA: no se encontró la hoja de respuestas de Ingresos.'); return; }

  const url = hoja.getFormUrl();
  if (!url) { Logger.log('ADVERTENCIA: esa hoja no está vinculada a un formulario.'); return; }

  const form = FormApp.openByUrl(url);
  const items = form.getItems();
  let encontrado = false;

  for (let i = 0; i < items.length; i++) {
    if (items[i].getTitle() === 'Medio') {
      items[i].asListItem().setChoiceValues(NUEVA_LISTA_MEDIO);
      encontrado = true;
      break;
    }
  }

  Logger.log(encontrado
    ? 'Form Ingresos: pregunta "Medio" actualizada sin Mercado Pago.'
    : 'ADVERTENCIA: no se encontró la pregunta "Medio" en el Form de Ingresos.');

}