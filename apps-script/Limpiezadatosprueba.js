/*******************************************************
 * LIMPIEZA DE DATOS DE PRUEBA — corre UNA sola vez
 * =====================================================
 * Vacía el CONTENIDO de las filas de prueba (no borra las
 * filas — eso correría todo lo de abajo hacia arriba y
 * rompería la correspondencia fija que usan las fórmulas
 * espejo de 05_PUBLICO). Cada fila queda genuinamente en
 * blanco en su lugar, exactamente como cualquier otra fila
 * de margen sin usar.
 *
 * Se limpian:
 *  - 01_INGRESOS: ING-0031, ING-0032, ING-0033, ING-0035
 *  - 02_EGRESOS:  EGR-0032
 *
 * Y se restaura:
 *  - 02_EGRESOS: EGR-0001 vuelve a Estado=VERIFICADO,
 *    Publicar=SI (asumiendo que pasó a Anulado sin querer
 *    durante las pruebas — si en realidad fue intencional,
 *    revertilo a mano después de correr esto).
 *******************************************************/

function ejecutarLimpiezaDatosPrueba() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ingresos = ss.getSheetByName('01_INGRESOS');
  const egresos = ss.getSheetByName('02_EGRESOS');

  ['ING-0031', 'ING-0032', 'ING-0033', 'ING-0035'].forEach(id => limpiarFilaPorId_(ingresos, id));
  limpiarFilaPorId_(egresos, 'EGR-0032');

  restaurarEgr0001_(egresos);

  SpreadsheetApp.flush();

  Logger.log(
    'Limpieza completa. Recordá: la implementación del Web App todavía ' +
    'necesita actualizarse (Implementar > Administrar implementaciones > ' +
    'Nueva versión) para que la URL /exec real refleje esto.'
  );

}


// Busca la fila cuyo ID (columna A) coincide, y vacía TODA esa fila.
function limpiarFilaPorId_(hoja, id) {

  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) {
    Logger.log('ADVERTENCIA: ' + hoja.getName() + ' no tiene filas de datos.');
    return;
  }

  const ids = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      const fila = i + 2;
      hoja.getRange(fila, 1, 1, hoja.getLastColumn()).clearContent();
      Logger.log(hoja.getName() + ': fila ' + fila + ' (' + id + ') vaciada.');
      return;
    }
  }

  Logger.log('ADVERTENCIA: no se encontró ' + id + ' en ' + hoja.getName() + ' (¿ya se había limpiado?).');

}


// EGR-0001: columnas H (Estado, col 8) e I (Publicar, col 9)
function restaurarEgr0001_(egresos) {

  const ultimaFila = egresos.getLastRow();
  const ids = egresos.getRange(2, 1, ultimaFila - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === 'EGR-0001') {
      const fila = i + 2;
      const estadoActual = egresos.getRange(fila, 8).getValue();
      egresos.getRange(fila, 8).setValue('VERIFICADO');
      egresos.getRange(fila, 9).setValue('SI');
      Logger.log('EGR-0001 (fila ' + fila + '): Estado restaurado de "' + estadoActual + '" a VERIFICADO, Publicar=SI.');
      return;
    }
  }

  Logger.log('ADVERTENCIA: no se encontró EGR-0001 en 02_EGRESOS.');

}