/*******************************************************
 * CREAR FORMULARIOS — Red Ambientales por la Vida UTP
 * =====================================================
 * Genera los 3 Google Forms (Ingresos / Egresos / Entregas),
 * los vincula como destino de respuestas a ESTA spreadsheet,
 * y renombra la hoja de respuestas que Forms crea automáticamente
 * a RESP_INGRESOS / RESP_EGRESOS / RESP_ENTREGAS — los mismos
 * nombres que espera manejarEnvioFormulario() en
 * TransparenciaHumanitaria.gs.
 *
 * CÓMO USAR:
 * 1. Abrí Extensiones > Apps Script (donde ya está pegado
 *    TransparenciaHumanitaria.gs).
 * 2. Archivo > Nuevo > Script. Llamalo "CrearFormularios".
 * 3. Borrá el contenido de ese archivo nuevo y pegá TODO
 *    este código ahí (no reemplaza al otro archivo — ambos
 *    conviven en el mismo proyecto).
 * 4. Guardá. En el desplegable de funciones (arriba) elegí
 *    "crearFormulariosTransparencia" y hacé clic en Ejecutar.
 * 5. Primera vez: te va a pedir autorizar permisos nuevos
 *    (Forms), porque esto es un alcance distinto al de Sheets.
 *    Aceptá.
 * 6. Mirá el Registro de ejecución: ahí quedan las 2 URLs de
 *    cada formulario (edición y la que se comparte para
 *    responder).
 * 7. Después de esto, correr igual "Configurar disparador de
 *    formularios" desde el menú TRANSPARENCIA — este script
 *    NO instala el trigger, solo crea y vincula los forms.
 *
 * Es seguro volver a ejecutarlo: si una hoja de respuestas ya
 * existe (RESP_INGRESOS, etc.), omite crear ese formulario de
 * nuevo para no duplicar.
 *******************************************************/


// NOTA: Google Forms NO permite crear preguntas de tipo "Subir
// archivo" por script (FormApp no expone addFileUploadItem para
// creación — es una limitación de la API, no de este código).
// Por eso "Comprobante" y "Evidencia" se generan siempre como
// campo de texto para pegar un link de Drive. Si más adelante
// querés carga de archivo real, hay que agregarla a mano desde
// la interfaz de Forms después de que el script cree el resto.

// Deben coincidir EXACTO con CONFIG.respuestas en
// TransparenciaHumanitaria.gs.
const NOMBRES_HOJAS_RESPUESTAS = {
  ingresos: 'RESP_INGRESOS',
  egresos: 'RESP_EGRESOS',
  entregas: 'RESP_ENTREGAS'
};

const PREFIJO_TITULO = 'Red Ambientales por la Vida UTP — ';


/* =====================================================
   DEFINICIÓN DE PREGUNTAS
   =====================================================
   Los "titulo" de cada campo son EXACTOS a las claves que
   lee FORM_MAPPING en TransparenciaHumanitaria.gs. Si cambiás
   uno acá, tenés que cambiarlo también allá.
   ===================================================== */

const DEFINICION_INGRESOS = [
  { titulo: 'Fecha', tipo: 'fecha', requerido: true },
  { titulo: 'Importe', tipo: 'numero', validacion: 'mayor0', requerido: true },
  { titulo: 'Medio', tipo: 'lista', requerido: true,
    opciones: ['Transferencia bancaria', 'Mercado Pago', 'Efectivo', 'Donación en especie', 'Otro'] },
  { titulo: 'Concepto', tipo: 'texto', requerido: true },
  { titulo: 'Referencia', tipo: 'texto', requerido: false },
  { titulo: 'Comprobante', tipo: 'archivo', requerido: false },
  { titulo: 'Observaciones', tipo: 'parrafo', requerido: false }
];

const DEFINICION_EGRESOS = [
  { titulo: 'Fecha', tipo: 'fecha', requerido: true },
  { titulo: 'Importe', tipo: 'numero', validacion: 'mayor0', requerido: true },
  { titulo: 'Categoría', tipo: 'lista', requerido: true,
    opciones: ['ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS', 'TRANSPORTE', 'LOGISTICA', 'ALOJAMIENTO', 'COMUNICACION', 'OTROS'] },
  { titulo: 'Concepto', tipo: 'texto', requerido: true },
  { titulo: 'Proveedor', tipo: 'texto', requerido: false },
  { titulo: 'Comprobante', tipo: 'archivo', requerido: false },
  { titulo: 'Beneficiarios', tipo: 'numero', validacion: 'mayorIgual0', requerido: false },
  { titulo: 'Entrega_ID', tipo: 'texto', requerido: false },
  { titulo: 'Observaciones', tipo: 'parrafo', requerido: false }
];

const DEFINICION_ENTREGAS = [
  { titulo: 'Fecha', tipo: 'fecha', requerido: true },
  { titulo: 'Localidad', tipo: 'texto', requerido: true },
  { titulo: 'Tipo_de_ayuda', tipo: 'lista', requerido: true,
    opciones: ['ALIMENTOS', 'AGUA', 'MEDICAMENTOS', 'INSUMOS', 'ROPA', 'ALOJAMIENTO', 'OTROS'] },
  { titulo: 'Descripción', tipo: 'parrafo', requerido: true },
  { titulo: 'Cantidad', tipo: 'numero', validacion: 'mayor0', requerido: true },
  { titulo: 'Unidad', tipo: 'lista', requerido: true,
    opciones: ['kits', 'unidades', 'litros', 'cajas', 'personas', 'familias', 'kg', 'otro'] },
  { titulo: 'Beneficiarios', tipo: 'numero', validacion: 'mayorIgual0', requerido: true },
  { titulo: 'Responsable', tipo: 'texto', requerido: true },
  { titulo: 'Evidencia', tipo: 'archivo', requerido: false }
];


/* =====================================================
   FUNCIÓN PRINCIPAL — correr esta desde el editor
   ===================================================== */

function crearFormulariosTransparencia() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const creados = [];

  const specs = [
    { titulo: PREFIJO_TITULO + 'Ingresos', definicion: DEFINICION_INGRESOS, hoja: NOMBRES_HOJAS_RESPUESTAS.ingresos,
      descripcion: 'Registrá una donación o ingreso recibido por la campaña. Un miembro del equipo lo va a verificar antes de que aparezca públicamente.' },
    { titulo: PREFIJO_TITULO + 'Egresos', definicion: DEFINICION_EGRESOS, hoja: NOMBRES_HOJAS_RESPUESTAS.egresos,
      descripcion: 'Registrá un gasto o egreso de la campaña. Un miembro del equipo lo va a verificar antes de que aparezca públicamente.' },
    { titulo: PREFIJO_TITULO + 'Entregas', definicion: DEFINICION_ENTREGAS, hoja: NOMBRES_HOJAS_RESPUESTAS.entregas,
      descripcion: 'Registrá una entrega de ayuda realizada. Un miembro del equipo lo va a verificar antes de que aparezca públicamente.' }
  ];

  specs.forEach(spec => {
    const resultado = crearFormularioSiNoExiste(spec.titulo, spec.descripcion, spec.definicion, ss, spec.hoja);
    if (resultado) creados.push(resultado);
  });

  if (creados.length === 0) {
    Logger.log('No se creó ningún formulario nuevo: las 3 hojas de respuestas ya existían.');
    SpreadsheetApp.getUi().alert(
      'No se creó nada nuevo: RESP_INGRESOS, RESP_EGRESOS y RESP_ENTREGAS ya existen. ' +
      'Si querés recrear alguno, primero borrá su hoja de respuestas correspondiente.'
    );
    return;
  }

  const resumen = creados.map(r =>
    r.titulo + '\n' +
    '  Compartir (para responder): ' + r.publishedUrl + '\n' +
    '  Editar diseño:               ' + r.editUrl + '\n' +
    '  Hoja de respuestas:          ' + r.hojaRespuestas
  ).join('\n\n');

  Logger.log(resumen);

  SpreadsheetApp.getUi().alert(
    'Se crearon ' + creados.length + ' formulario(s). Las URLs para compartir y editar ' +
    'quedaron en el Registro de ejecución (Ver el panel de abajo o el ícono de reloj).\n\n' +
    'Paso siguiente: correr "Configurar disparador de formularios" desde el menú TRANSPARENCIA.'
  );

}


/* =====================================================
   CREAR UN FORMULARIO (con chequeo de duplicado)
   ===================================================== */

function crearFormularioSiNoExiste(titulo, descripcion, definicion, ss, nombreHojaRespuestas) {

  if (ss.getSheetByName(nombreHojaRespuestas)) {
    Logger.log('Se omite "' + titulo + '": ya existe la hoja ' + nombreHojaRespuestas + '.');
    return null;
  }

  const form = FormApp.create(titulo);
  form.setDescription(descripcion);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setConfirmationMessage('¡Gracias! Tu registro va a ser revisado por el equipo antes de publicarse.');

  definicion.forEach(campo => agregarItemDeFormulario(form, campo));

  // Detectar la hoja nueva que Forms agrega al vincular el destino
  const hojasAntes = ss.getSheets().map(h => h.getName());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  const hojasDespues = ss.getSheets().map(h => h.getName());
  const nombreNuevo = hojasDespues.find(n => hojasAntes.indexOf(n) === -1);

  if (nombreNuevo) {
    ss.getSheetByName(nombreNuevo).setName(nombreHojaRespuestas);
  } else {
    Logger.log('ADVERTENCIA: no se pudo detectar automáticamente la hoja de respuestas de "' + titulo + '". Renombrala manualmente a ' + nombreHojaRespuestas + '.');
  }

  return {
    titulo: titulo,
    editUrl: form.getEditUrl(),
    publishedUrl: form.getPublishedUrl(),
    hojaRespuestas: nombreNuevo ? nombreHojaRespuestas : '(no detectada — renombrar a mano)'
  };

}


/* =====================================================
   AGREGAR UNA PREGUNTA AL FORMULARIO SEGÚN SU TIPO
   ===================================================== */

function agregarItemDeFormulario(form, campo) {

  let item;

  switch (campo.tipo) {

    case 'fecha':
      item = form.addDateItem().setTitle(campo.titulo);
      item.setRequired(!!campo.requerido);
      break;

    case 'texto':
      item = form.addTextItem().setTitle(campo.titulo);
      item.setRequired(!!campo.requerido);
      break;

    case 'parrafo':
      item = form.addParagraphTextItem().setTitle(campo.titulo);
      item.setRequired(!!campo.requerido);
      break;

    case 'numero': {
      item = form.addTextItem().setTitle(campo.titulo);
      item.setRequired(!!campo.requerido);
      const builder = FormApp.createTextValidation();
      if (campo.validacion === 'mayor0') {
        builder.requireNumberGreaterThan(0).setHelpText('Ingresá un número mayor a 0.');
      } else if (campo.validacion === 'mayorIgual0') {
        builder.requireNumberGreaterThanOrEqualTo(0).setHelpText('Ingresá un número mayor o igual a 0.');
      } else {
        builder.requireNumber().setHelpText('Ingresá un número.');
      }
      item.setValidation(builder.build());
      break;
    }

    case 'lista':
      item = form.addListItem().setTitle(campo.titulo).setChoiceValues(campo.opciones);
      item.setRequired(!!campo.requerido);
      break;

    case 'archivo':
      item = form.addTextItem().setTitle(campo.titulo)
        .setHelpText('Pegá un link de Drive al comprobante (compartido con acceso "Cualquier persona con el enlace, Lector").');
      item.setRequired(!!campo.requerido);
      break;

    default:
      throw new Error('Tipo de campo desconocido: ' + campo.tipo);

  }

  return item;

}