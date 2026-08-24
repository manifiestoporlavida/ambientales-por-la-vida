# Brief de proyecto — Landing Red Ambientales por la Vida UTP

Documento de planificación para construir la landing en Claude Code. El backend de transparencia (Google Sheets + Apps Script + Web App) ya está construido, probado de punta a punta y en producción. Este documento cubre todo lo necesario para construir el frontend: contexto, assets, contrato de datos, plan de construcción, seguridad, visibilidad (SEO) e integración con redes.

**Estado general:** listo para arrancar. Los únicos pendientes bloqueantes están en el checklist final (§10) — el resto puede desarrollarse con lo que hay.

---

## Índice

1. Contexto y objetivo
2. Assets de marca (paleta, contenido, roster de responsables)
3. Especificación técnica — integración con el backend
4. Estructura de secciones de la landing
5. Lineamientos de diseño
6. Plan de construcción (stack, fases, cómo levantarlo en Claude Code)
7. Seguridad
8. Visibilidad / SEO / rendimiento
9. Integración con redes sociales
10. Checklist antes de empezar a codear

---

## 1. Contexto y objetivo

- **Organización:** Red Ambientales por la Vida UTP — red de voluntariado de graduados de la Universidad Tecnológica de Pereira (ciencias ambientales), Colombia.
- **Causa:** recolección de fondos y recursos para damnificados por el terremoto del 10 de agosto de 2026 en Colombia.
- **Objetivo de la landing:** doble —
  1. **Recaudar** donaciones (dinero y en especie).
  2. **Convocar** voluntarios.
- **Diferencial clave:** transparencia verificable. La landing no promete transparencia en abstracto — muestra en vivo cuánto se recaudó, cuánto se usó, en qué, y qué se verificó, alimentado directamente desde el sistema administrativo real (Sheets + Forms), no datos estáticos hardcodeados.
- **Hosting:** GitHub Pages (sitio estático, sin backend propio — todo el dinamismo viene del fetch a la API pública).
- **Audiencia:** donantes potenciales (individuos y aliados institucionales), voluntarios potenciales, y la propia comunidad de la Red. Tráfico esperado mayormente desde redes sociales (Instagram/Facebook) y mensajería (WhatsApp), es decir **mayoría mobile** — el diseño es mobile-first, no un desktop adaptado.

---

## 2. Assets de marca

| Asset | Estado |
|---|---|
| Logo definitivo | ✅ Recibido (PNG con fondo transparente) — árbol/raíz entrelazada con figuras humanas naranja/marrón/verde arriba, nudo celta oscuro abajo, wordmark "AMBIENTALES POR LA VIDA UTP" |
| Paleta de colores oficial | ✅ Extraída con precisión de píxeles del logo y el brochure — ver §2.1 |
| Brochure diseñado | ✅ Recibido (PDF, 16 páginas) — funciona además como fuente principal de texto/contenido, ver §2.2 |
| Texto / copy definitivo | ✅ Cubierto en gran parte por el brochure — falta solo copy específico de landing (hero, CTAs cortos) que no existe en un documento de este tipo, ver §2.2 nota final |

### 2.1 Paleta de colores (extraída, no estimada)

Sampleada directamente de los píxeles del logo y de los fondos planos del brochure — no son colores aproximados a ojo.

| Color | Hex | Uso observado en el brochure |
|---|---|---|
| Verde musgo | `#6B944F` | Color primario — portada, fondos de sección principales, figuras del logo |
| Verde oscuro | `#203D2C` | Texto de encabezados, fondos de sección oscuros, tronco/raíz del logo |
| Naranja | `#DF8A2C` | Acento cálido — sección "Líneas estratégicas", links de redes sociales, una de las figuras del logo |
| Marrón | `#663514` | Acento cálido secundario — sección "Línea 3", otra figura del logo |
| Gris | `#575656` | Neutro secundario — paneles de contraste junto al verde musgo |
| Menta claro | `#E2EADD` | Fondo de tarjetas/círculos de íconos sobre blanco |
| Blanco | `#FFFFFF` | Fondos de página, texto sobre fondos oscuros |

**Patrón de uso que conviene repetir en la landing:** el brochure alterna paneling de dos colores (ej. musgo + gris, o oscuro + foto) por sección, con texto en blanco sobre los fondos de color y texto oscuro sobre blanco. Los íconos son siempre monocromáticos en verde oscuro sobre círculos menta. Esto da un lenguaje visual claro y replicable.

### 2.2 Contenido extraído del brochure

El PDF es en rigor una **propuesta de intervención integral** (documento institucional/técnico), no copy de landing — pero contiene toda la sustancia real: quiénes son, qué hacen, y por qué confiar. Lo transcribo acá organizado, para que en Claude Code se pueda decidir qué va textual y qué se resume.

**Título:** Propuesta de Intervención Integral — Red Ambientales por la Vida UTP frente al terremoto de Colombia 2026

**Quiénes son (texto "sobre nosotros"):**
> Somos un colectivo independiente de egresadas y egresados de Administración Ambiental de la Universidad Tecnológica de Pereira que nos organizamos a partir del *Manifiesto por la Vida* ([manifiestoporlavida.ar](https://manifiestoporlavida.ar/)).
>
> Pereira está ubicada en el corazón del eje cafetero colombiano, en el centro occidente del país.

**Objetivo general:**
> Estructurar e implementar una intervención situada, solidaria, integral, con perspectiva de género y derechos humanos en el marco del proceso de Manejo de Desastres, orientada a la atención de la emergencia y el acompañamiento en la reconstrucción del tejido social y territorial en Pereira y zonas aledañas, tras el evento sísmico del 10 de agosto de 2026.

**Enfoque y alcance:**
> La intervención se fundamenta en los principios de participación, diversidad cultural y coordinación del Sistema Nacional de Gestión del Riesgo de Desastres (SNGRD) de Colombia, organizando esfuerzos comunitarios y profesionales para acompañar las fases de respuesta, rehabilitación y recuperación posdesastre, resguardando la integridad y derechos humanos de las voluntarias y voluntarios.

**Las 3 líneas estratégicas (estructura útil para una sección "Qué hacemos" en la landing):**

1. **Manejo de Desastres — Fase de Respuesta** (Asistencia Humanitaria de Emergencia): salvaguardar la vida y necesidades básicas inmediatas, con perspectiva de género priorizando mujeres, infancias y diversidades. Incluye 4 sub-áreas: logística de asistencia y albergue, salud pública, salud mental y apoyo psicosocial (SMAPS, con articulación Colombia-Argentina), y sistematización de proveedores locales.
2. **Manejo de Desastres — Fase de Rehabilitación Temprana**: restablecimiento de condiciones de vida para poblaciones específicas. Incluye evaluación de daños (EDAN), soporte a mediano plazo y trazabilidad de la asistencia (evitar duplicidad de esfuerzos).
3. **Soberanía territorial y reconstrucción comunitaria — Fase de Reconstrucción y Reflexión**: defensa del patrimonio socioecológico, evitando que la reconstrucción se use para desplazar comunidades en beneficio de proyectos inmobiliarios privados. Incluye análisis técnico, sistematización de la experiencia, "Reconstrucción mejor" (*build back better*) y atención a la movilidad humana por desastres (marco de la Ley 2577).

**Ejes transversales de soporte:**
- Sostenibilidad financiera y transparencia operativa — *"mecanismos de veeduría y rendición de cuentas, garantizando la total trazabilidad de las donaciones... y documentando públicamente el destino de los fondos"* → esto es literalmente la promesa que tu sistema de Sheets+API ya cumple. Vale la pena citarlo casi textual en la sección de transparencia de la landing.
- Comunicación del riesgo y relaciones públicas.
- Protección de derechos humanos a voluntarias y voluntarios (mencionan explícitamente el contexto político colombiano).
- Criterios de compra: priorizan proveedores y comercio local; grandes cadenas solo como último recurso.

**Contacto (ya pensado para difusión pública):**
- Facebook: Ambientales por la vida
- Instagram: Ambientales por la vida
- Tel: +54 9 2241 566369

### 2.3 Sección "Responsables" — especificación del carrusel

- **Datos:** el roster de la tabla de arriba (11 personas). Es contenido estático propio de la landing, no viene del endpoint de transparencia — no hay que mezclarlo con el `fetch()` del backend.
- **Falta:** una foto de cada una de las 11 personas. Formato sugerido: cuadrada o retrato, mismo recorte/tratamiento para las 11 (consistencia visual > calidad individual de cada foto). Sin foto real, usar un placeholder con iniciales sobre uno de los colores de la paleta (§2.1) — nunca fotos de stock genéricas, rompen la honestidad del resto de la landing.
- **Comportamiento:** carrusel deslizable (touch/swipe en mobile, flechas o autoplay lento en desktop), una tarjeta por persona con foto + nombre + rol (+ ciudad, opcional, en texto más chico).
- **Volumen:** 11 tarjetas es poco para un carrusel infinito con autoplay agresivo — puede andar mejor como un scroll horizontal simple con snap, sin necesidad de loop.

**✅ Decisión editorial tomada:** los puntos focales SÍ van en la landing — pero no como texto operativo incrustado (como aparecen en el brochure), sino como una **sección de "Responsables"**: un carrusel con foto, nombre y rol de cada persona. Reemplaza cualquier mención de "punto focal" en el copy de las líneas estratégicas — ese detalle queda solo en este carrusel.

Roster compilado del brochure, listo para usar como datos del carrusel (falta la foto de cada persona — ver checklist):

| Nombre | Rol | Ubicación |
|---|---|---|
| Johan Toro | Coordinación general — Logística de Asistencia y Albergue | México |
| Margarita Noreña | Coordinación de Logística / Salud Pública y Asistencia Integral | Pereira |
| Sara Arenas | Coordinación de Logística / Nodo Chocó y Risaralda | Pereira |
| Stefanía Giraldo | Coordinación de Logística | Pereira |
| Luciana González | Nodo Pereira — Olla Comunitaria Las Weras | Pereira |
| Andrés Cardona | Nodo Norte del Valle y Pereira | Cartago |
| Marta Ochoa | Articulación interinstitucional y comunitaria / EDAN | Bogotá |
| Paula Ramírez | Salud Mental y Apoyo Psicosocial (SMAPS) | Argentina |
| Mario Arenas | Sistematización de proveedores locales | — |
| Juan Sierra | Sistematización de proveedores locales | — |
| Jenny Velázquez | Evaluación de Daños y Análisis de Necesidades (EDAN) | Cali |

**Nota breve, no bloqueante:** el propio brochure incluye un eje de "Protección de derechos humanos a voluntarias y voluntarios... por el contexto político colombiano". Vale la pena que cada persona de la lista confirme que está cómoda con que su foto, nombre, rol y ciudad queden expuestos en una landing pública de alto tráfico — es un paso más de exposición que aparecer en un documento dirigido a aliados institucionales. Simple chequeo puntual con cada uno, no algo que deba frenar el desarrollo.



---

## 3. Especificación técnica — integración con el backend

Esto ya está construido, probado y funcionando (Sheets + Apps Script). La landing es puramente consumidora: un `fetch()` a una URL pública, sin autenticación.

### 3.1 Endpoint

```
GET https://script.google.com/macros/s/AKfycbz79t3kdux3fb3PeDjAhWaDCIgs1ZnwAewKLc2MKH3H_7OGZAUqY4tvyGJLMEbG5mIRtA/exec
```

✅ **Confirmada funcionando** — probada en navegación de incógnito (sin sesión de Google) el 19/08/2026, devuelve el JSON directo sin pantallas de login intermedias. Esta es la URL que va en el `fetch()` de la landing.

Soporta además `?callback=nombreFuncion` (JSONP) como salida de emergencia si el `fetch()` directo tuviera problemas de CORS en algún navegador — no debería hacer falta, pero está disponible.

**Sobre la estabilidad de esta URL:** la URL `/exec` se mantiene igual mientras se edite la *misma* implementación del Apps Script. Si en algún momento el equipo crea una implementación *nueva* (en vez de editar la existente), Google genera una URL distinta y habría que actualizar `js/config.js`. Por eso conviene tener la URL en un solo archivo aislado (§6.2). Regla para el equipo: para cambios al backend, siempre "editar implementación existente", nunca "nueva implementación".

### 3.2 Forma exacta de la respuesta

Capturada de una ejecución real del sistema (los tres últimos registros de `operaciones` son datos de prueba a limpiar antes de ir a producción — ver §3.5):

```json
{
  "recaudado": 6963287,
  "utilizado": 1064622,
  "saldo": 5898665,
  "donaciones": 7,
  "gastos": 6,
  "entregas": 0,
  "beneficiarios": 0,
  "ultima_actualizacion": "2026-08-19",
  "generado": "2026-08-19T21:59:40.368Z",
  "operaciones": [
    {
      "id": "ING-0001",
      "fecha": "2026-08-10",
      "tipo": "INGRESO",
      "categoria": "-",
      "concepto": "Donación colecta comunitaria - Red Ambientales",
      "importe": 1095000,
      "comprobante": "https://drive.google.com/comprobante-ing-01"
    },
    {
      "id": "EGR-0001",
      "fecha": "2026-08-11",
      "tipo": "EGRESO",
      "categoria": "COMUNICACION",
      "concepto": "Difusión y diseño de piezas de campaña",
      "importe": 14000,
      "comprobante": "https://drive.google.com/comprobante-egr-01"
    }
  ],
  "entregas_detalle": []
}
```

**Notas de implementación importantes:**

- `operaciones` mezcla INGRESOS y EGRESOS en un solo array — distinguir por `tipo`. `categoria` es `"-"` (literal) para ingresos, porque esa hoja no clasifica por categoría.
- `comprobante` puede venir como **string vacío** (`""`) — pasó en las pruebas reales de Forms (campo opcional). El diseño de la landing no debería asumir que siempre hay un link para mostrar.
- `entregas_detalle` puede venir como **array vacío** — la campaña recién arranca y todavía no hay entregas registradas. La UI tiene que verse bien con 0 entregas, no solo con datos de ejemplo.
- `ultima_actualizacion` y las fechas dentro de `operaciones`/`entregas_detalle` vienen en formato `YYYY-MM-DD` (string), no como objeto Date.
- `generado` es el timestamp exacto de cuándo se ejecutó el endpoint (ISO 8601 UTC) — útil para mostrar algo tipo "Datos actualizados al [fecha]" o para invalidar caché.
- No hay paginación ni límite documentado en `operaciones`/`entregas_detalle` — hoy son pocos registros, pero el sistema soporta crecer.
- Los importes vienen en pesos colombianos como número entero (sin decimales, sin formato) — el formateo de moneda ($ y separadores de miles) es responsabilidad del frontend.

### 3.3 Comportamiento esperado del fetch

- Sin autenticación, sin headers especiales — `fetch(URL).then(r => r.json())` debería alcanzar.
- Contemplar estado de carga (skeleton/spinner) y estado de error (el endpoint podría estar caído puntualmente — Apps Script tiene cuotas de ejecución).
- No hay push/websocket — si se quiere que los indicadores se sientan "en vivo", la opción realista es refrescar el fetch cada N minutos o al volver a foco la pestaña, no un simple fetch único al cargar.

### 3.4 Gráficos y números — qué mostrar y con qué datos

La landing tiene que dar cuenta de la actividad real del grupo, no solo el saldo. Todo esto se puede armar client-side con lo que ya devuelve el endpoint — no hace falta pedirle nada nuevo al backend.

**Números destacados (stat cards, arriba de todo en la sección de transparencia):**
- Recaudado (`recaudado`), Utilizado (`utilizado`), Saldo disponible (`saldo`) — los tres juntos, saldo como el más prominente.
- Donaciones (`donaciones`), Gastos (`gastos`), Entregas (`entregas`), Personas alcanzadas (`beneficiarios`) — grilla secundaria de contadores.
- "Actualizado el `ultima_actualizacion`" — visible pero discreto, para que se note que no son datos estáticos.

**Gráfico 1 — Egresos por categoría (dona o barras horizontales):**
Agrupar `operaciones` donde `tipo === "EGRESO"` por `categoria`, sumando `importe`. Con los datos actuales da: ALIMENTOS, COMUNICACION, INSUMOS, LOGISTICA, TRANSPORTE. Es el gráfico que más responde a "¿en qué se gastó la plata?" — el que ya construimos en 04_RESUMEN de la planilla, ahora en la web.

**Gráfico 2 — Recaudación acumulada en el tiempo (línea o área):**
Ordenar `operaciones` donde `tipo === "INGRESO"` por `fecha`, sumar `importe` en acumulado. Muestra la curva de crecimiento de la campaña. Con pocos puntos de datos (como ahora) se ve poco pero escala bien a medida que entren más donaciones.

**Gráfico 3 — Recaudado vs. Utilizado (barra comparativa simple o gauge):**
Dos barras (`recaudado` vs `utilizado`) o una barra de progreso mostrando `saldo` como remanente. Da una lectura instantánea sin tener que leer números.

**Feed de operaciones verificadas:**
Lista/tabla de `operaciones` (más recientes primero por `fecha`), con badge de color por `tipo` (verde para INGRESO, el acento que se defina para EGRESO), mostrando `concepto`, `importe` formateado en pesos colombianos, y link a `comprobante` solo si no viene vacío.

**Estados vacíos a contemplar:**
- `entregas_detalle: []` — hoy no hay ninguna. La sección de entregas tiene que verse bien vacía (ej. "Todavía no se registraron entregas — apenas haya, van a aparecer acá"), no como un error.
- Si `operaciones` tuviera muy pocos registros, el Gráfico 2 (línea temporal) puede verse pobre con 1-2 puntos — contemplar un mensaje tipo "la campaña recién arranca" en vez de forzar un gráfico vacío de sentido.

### 3.5 Antes de ir a producción

Hay 3 filas de prueba cargadas en el sistema real (`ING-0031`, `ING-0032`, `ING-0033` — "donacion", "harina", "aporte solidario" por $4.000.000) marcadas como verificadas y públicas. **Hay que volver a la hoja 01_INGRESOS y pasarlas a Publicar=NO (o borrarlas) antes de anunciar la landing**, para no arrancar la campaña con datos ficticios en el contador de recaudación.

---

## 4. Estructura de secciones de la landing

Orden vertical de scroll, de arriba hacia abajo.

1. **Hero** — logo, título de campaña, una línea de misión (adaptar de "Somos un colectivo independiente de egresadas y egresados de Administración Ambiental de la UTP..."), CTA doble (Donar / Sumarme como voluntario).
2. **El contexto** — breve, sobrio: terremoto del 10 de agosto de 2026, Pereira y eje cafetero, sin explotar la tragedia.
3. **Transparencia en vivo** — los indicadores del endpoint: recaudado, utilizado, saldo, donaciones, gastos, entregas, beneficiarios, con fecha de última actualización visible. Es el corazón diferencial de la landing, y además es una promesa que la propia Red ya se hizo por escrito en el brochure (eje "Sostenibilidad financiera y transparencia operativa" — citar o parafrasear esa línea da coherencia entre lo prometido y lo mostrado).
4. **Qué hacemos** — las 3 líneas estratégicas del brochure (Respuesta / Rehabilitación Temprana / Reconstrucción y Reflexión), resumidas — no hace falta bajar al nivel de sub-áreas A/B/C/D, eso es demasiado detalle operativo para una landing de donantes.
5. **Cómo ayudar** — separado en dos caminos claros: donar (medios de pago/datos) vs. sumarse como voluntario (contacto/formulario).
6. **Operaciones verificadas** — tabla o feed con `operaciones` (filtrable por tipo Ingreso/Egreso), y `entregas_detalle` cuando empiece a haber datos. Maneja bien el caso de arrays vacíos.
7. **Sobre la red** — quiénes son (graduados UTP ciencias ambientales, organizados a partir del *Manifiesto por la Vida*), por qué confiar (perspectiva de género y DDHH, priorización de mujeres/infancias/diversidades, compra a proveedores locales).
8. **Responsables (carrusel)** — foto + nombre + rol de cada punto focal, deslizable. Ver §2.3 para el roster completo y la nota técnica. Es la sección que le pone cara humana a la Red, en reemplazo de listar coordinadores dentro del texto de "Qué hacemos".
9. **Footer** — logo, Facebook/Instagram/Tel de contacto (ya son públicos en el brochure). Sin links a los Forms de carga: quedan como herramienta interna del equipo, no se exponen en la landing pública.

---

## 5. Lineamientos de diseño

- **Paleta:** ver §2.1 — usar el patrón real del brochure (paneles de dos colores por sección, íconos monocromáticos en verde oscuro sobre círculos menta).
- **Tipografía:** el brochure usa una tipografía de titulares condensada y en mayúsculas, muy bold, tipo "poster" (ver captura de páginas de sección) — conviene buscar una geométrica condensada similar (ej. Anton, Archivo Black, Oswald Bold) para títulos, y una sans neutra para cuerpo de texto.
- Tono: serio, transmite transparencia y organización — no genérico de landing corporativa, tampoco explotador de la tragedia. El brochure ya define bien este tono (perspectiva de género, DDHH, sostenibilidad) — mantenerlo.
- El logo tiene mucho detalle (nudo celta, figuras humanas superpuestas) — pensar tamaños mínimos de uso.
- **Dos versiones según el fondo (confirmado con una comparación visual):** el logo a color (`assets/logo.png`) tiene dos verdes propios (`#203D2C` del tronco/nudo, `#6C9450` de las figuras) casi idénticos a los verdes de la paleta — sobre un panel de fondo verde (musgo u oscuro), esas partes del logo se funden y se pierde la silueta, sobre todo en musgo. Para cualquier fondo verde usar la versión monocromática blanca ya generada (`assets/logo-blanco.png`) — es el mismo tratamiento que el propio brochure usa en su portada. El logo a color queda reservado para fondo blanco/claro, o en tamaño chico como acento (ej. footer).

---

## 6. Plan de construcción

### 6.1 Stack recomendado

Para GitHub Pages lo más robusto es **HTML + CSS + JavaScript vanilla**, sin build step. Razones concretas para este proyecto:

- GitHub Pages sirve archivos estáticos directamente; sin build no hay nada que pueda romperse entre el `git push` y lo que ve el usuario.
- La landing es de una sola página con secciones — no justifica un framework con router ni bundler.
- Un solo `index.html` + `styles.css` + `app.js` es algo que cualquier miembro de la Red puede mantener a futuro sin saber de toolchains.
- Para los gráficos (§3.4), usar una librería liviana cargada por CDN. Recomendación: **Chart.js** (una sola etiqueta `<script>`, API simple, se ve bien con poca configuración). Alternativa aún más liviana si se quieren gráficos muy simples: dibujar las barras con CSS puro y reservar Chart.js solo para la dona de categorías.

Si Claude Code propusiera un stack con build (Vite, React, etc.), es viable pero **hay que configurar GitHub Actions o el output a `/docs`** — más partes móviles. Para este caso, vanilla es la elección de menor riesgo. Documentar la decisión y no cambiarla a mitad de camino.

### 6.2 Estructura de archivos sugerida

```
/ (raíz del repo)
├── index.html          # toda la estructura de la página
├── css/
│   └── styles.css      # estilos, variables CSS con la paleta de §2.1
├── js/
│   ├── config.js       # la URL del endpoint y constantes, separada para no tocar app.js
│   ├── api.js          # fetch al endpoint, manejo de carga/error, formateo
│   ├── charts.js       # armado de los gráficos con los datos ya procesados
│   └── app.js          # orquesta todo: al cargar, fetch → render números → render gráficos → render feed
├── assets/
│   ├── logo.png        # el logo definitivo (ya disponible)
│   ├── og-image.jpg    # imagen para compartir en redes (ver §9)
│   └── responsables/   # las 11 fotos cuando lleguen; placeholders mientras tanto
├── favicon.ico         # derivado del logo
├── robots.txt          # (ver §8)
├── sitemap.xml         # (ver §8)
├── 404.html            # GitHub Pages lo usa automáticamente
└── README.md           # cómo actualizar la URL del endpoint, cómo se despliega
```

Poner la URL del endpoint en `js/config.js` y no incrustada en medio de `app.js` es importante: si en algún momento hay que redesplegar la Web App y cambia la URL (§7 explica cuándo pasa eso), se toca un solo archivo de una sola línea.

### 6.3 Fases de trabajo en Claude Code

Conviene construir en este orden, probando cada fase antes de seguir:

1. **Esqueleto estático completo** — todas las secciones (§4) con contenido y estilos definitivos, pero con los números y gráficos de transparencia usando **datos de ejemplo hardcodeados**. Objetivo: que la página se vea terminada y linda sin depender aún de la red. Así se valida todo el diseño primero.
2. **Capa de datos** — `api.js`: fetch real al endpoint, con estados de carga (skeletons) y de error bien resueltos. Reemplazar los datos de ejemplo por los reales. Probar con la pestaña de red abierta que efectivamente pega al endpoint y parsea.
3. **Gráficos** — `charts.js`: conectar los tres gráficos y el feed a los datos ya procesados. Probar los estados vacíos (§3.4).
4. **Pulido responsive** — revisar en viewport de teléfono (mayoría del tráfico), el carrusel de responsables, y que los gráficos no rompan en pantallas chicas.
5. **Meta tags, SEO, Open Graph** (§8 y §9) — lo último antes de desplegar, cuando el contenido ya no cambia.
6. **Deploy a GitHub Pages** y prueba en la URL real, en un teléfono real, compartiendo el link por WhatsApp para ver la preview.

### 6.4 Deploy en GitHub Pages

- Repo público (GitHub Pages gratis requiere repo público, salvo cuenta de pago). Ojo: **el repo público significa que todo el código es visible** — no poner nada sensible ahí (ver §7).
- Activar Pages desde Settings > Pages, sirviendo desde la rama `main` (o `/docs` si se prefiere separar).
- GitHub da una URL tipo `usuario.github.io/repo`. Si la Red tiene un dominio propio (o consigue uno), se puede apuntar con un `CNAME` — mejor para credibilidad ante donantes que una URL de github.io. **Nota:** ya existe el dominio `manifiestoporlavida.ar` vinculado a la Red; evaluar si la landing va como subdominio o path de ahí, lo que además concentra reputación SEO.
- El caché de GitHub Pages puede tardar unos minutos en reflejar cambios; no es instantáneo.

---

## 7. Seguridad

La arquitectura elegida es intrínsecamente segura en varios aspectos (sitio estático, sin backend propio que hackear, sin base de datos expuesta), pero hay puntos concretos a cuidar:

### 7.1 Lo que NO debe pasar nunca

- **Ninguna credencial en el repo.** El repo es público. No debe haber tokens, claves de API, ni la URL de *edición* de la spreadsheet (la que termina en `/edit`) — solo la URL pública `/exec`, que está diseñada para ser pública y no da acceso de escritura a nada.
- **La landing es de solo lectura.** No tiene ningún formulario que escriba en el backend. Los 3 Google Forms de carga quedan fuera de la landing (decisión ya tomada) — esto elimina toda una clase de riesgos (inyección de datos falsos, spam de donaciones ficticias).
- **El endpoint `/exec` solo expone `05_PUBLICO`.** Por diseño del Apps Script, nunca devuelve nombres de donantes, montos individuales sin verificar, ni datos administrativos. Aunque alguien inspeccione el tráfico de red del navegador, solo ve lo que ya es público.

### 7.2 Exposición de datos personales (responsables)

- El carrusel de responsables expone nombres, roles, ciudades y fotos de 11 personas. Esto es una decisión consciente de la Red, pero conlleva responsabilidad: confirmar consentimiento de cada persona (ya anotado en §2.3) — sobre todo dado el eje de "protección de derechos humanos a voluntarios por el contexto político colombiano" que el propio brochure menciona.
- Las fotos y nombres van hardcodeados en el sitio estático, no vienen de ninguna API — o sea que quitar a alguien del carrusel requiere editar el código y re-desplegar. Preverlo: que sea fácil de editar (un array de objetos en un solo archivo).

### 7.3 Headers y hardening del frontend

- **Subresource Integrity (SRI)** en las librerías de CDN (Chart.js): agregar el atributo `integrity` a la etiqueta `<script>` para que el navegador rechace el archivo si fue manipulado en el CDN. Claude Code puede generar el hash.
- **`rel="noopener noreferrer"`** en todos los links externos que abran en pestaña nueva (redes sociales, comprobantes de Drive) — evita que la página destino pueda manipular la pestaña de origen.
- GitHub Pages sirve todo por **HTTPS** por defecto; asegurarse de que ningún recurso se cargue por `http://` (mixed content), o el navegador lo bloquea.
- **Content Security Policy (CSP):** se puede declarar por `<meta http-equiv>` ya que GitHub Pages no permite headers HTTP custom. Una CSP restrictiva que permita solo: self, el dominio de `script.google.com` (para el fetch), el CDN de Chart.js, y el dominio de Google Fonts si se usa. Reduce el riesgo de XSS si alguna vez se colara contenido no confiable.

### 7.4 Integridad del dato mostrado

- Los `comprobante` que vienen del endpoint son URLs de Google Drive cargadas por el equipo. Al renderizarlas como links, **validar que empiecen con `https://`** antes de crear el `<a href>`, para no crear links con esquemas raros (`javascript:`, etc.) si algún día se carga basura en esa celda. Es una validación de una línea, pero cierra un vector.
- Al inyectar cualquier texto del endpoint (`concepto`, `categoria`) en el DOM, usar `textContent` y no `innerHTML`, para que un concepto con caracteres HTML no pueda ejecutar nada. Regla simple: **nada del endpoint se inserta como HTML crudo.**

---

## 8. Visibilidad / SEO / rendimiento

El objetivo no es rankear en Google por keywords competitivas — es que **cuando alguien comparta el link, se vea bien, cargue rápido y sea encontrable por el nombre de la Red**.

### 8.1 Meta tags esenciales

- `<title>` claro: algo como "Red Ambientales por la Vida UTP — Transparencia y ayuda | Terremoto Colombia 2026".
- `<meta name="description">` de ~150 caracteres que resuma la causa y mencione "transparencia" y "donaciones", porque es lo que aparece en los resultados de búsqueda y en algunas previews.
- `<html lang="es">` — importante para accesibilidad y para que los navegadores no ofrezcan traducir.
- Etiquetas de idioma y región: el contenido es español de Colombia; declararlo ayuda.

### 8.2 Open Graph y Twitter Cards (crítico — es cómo se ve al compartir)

Como el tráfico va a venir principalmente de compartir el link en redes y WhatsApp, esto **importa más que el SEO tradicional**:

- `og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`.
- `og:image` debe ser una imagen de 1200×630px diseñada para compartir (logo + nombre + una frase, sobre fondo verde de la paleta). **Esta imagen es lo primero que ve la gente en su feed antes de hacer clic** — vale la pena que sea buena. Es un asset a crear (§10 checklist).
- Twitter Cards (`twitter:card=summary_large_image`, etc.) para que se vea bien también en X.
- Probar la preview con las herramientas de debug de Facebook (Sharing Debugger) y de X antes de difundir, porque estas plataformas cachean la preview y conviene que la primera vez que la levanten sea la versión correcta.

### 8.3 Archivos de indexación

- `robots.txt` permitiendo indexación (`Allow: /`) — no hay nada que ocultar en una landing pública.
- `sitemap.xml` mínimo (una sola URL) — ayuda a que Google la indexe más rápido cuando recién se publica.
- Considerar dar de alta el sitio en **Google Search Console** una vez desplegado, para verificar que se indexa y ver si hay errores.

### 8.4 Rendimiento

- **Optimizar imágenes:** las 11 fotos de responsables y la og-image son el peso principal. Servirlas en tamaño razonable (no fotos de 4000px escaladas por CSS) y en formato moderno (WebP con fallback si hace falta). Lazy-load en las imágenes que están más abajo del fold.
- **El fetch al endpoint no debe bloquear el render:** la página tiene que pintar su estructura y contenido estático de inmediato, y los números/gráficos aparecen cuando llega la respuesta (con skeleton mientras tanto). Nunca una pantalla en blanco esperando a Google.
- **Caché del endpoint:** Apps Script puede tardar 1-3 segundos en responder. Considerar cachear la última respuesta en `localStorage` y mostrarla instantáneamente al volver a entrar, mientras se pide la actualizada en segundo plano ("stale-while-revalidate" a mano). Mejora mucho la percepción de velocidad para visitantes recurrentes.
- Apuntar a un peso total de página inicial bajo — es una landing, no una app.

### 8.5 Accesibilidad (también ayuda al SEO y es lo correcto)

- Contraste suficiente entre texto y fondo (el verde musgo `#6B944F` con texto blanco hay que verificarlo — puede quedar justo; el verde oscuro `#203D2C` con blanco es seguro).
- `alt` en todas las imágenes (logo, fotos de responsables, íconos).
- Estructura de headings jerárquica (`h1` único, `h2` por sección).
- El carrusel debe ser operable por teclado, no solo por swipe.

---

## 9. Integración con redes sociales

### 9.1 Salida — desde la landing hacia las redes

- **Links a los perfiles** en el footer: Facebook e Instagram ("Ambientales por la vida"). Confirmar las URLs exactas de cada perfil (el brochure da el nombre, no el link directo — ver checklist).
- **Botones de compartir:** dado que el objetivo es difusión, incluir botones para compartir la propia landing en WhatsApp, Facebook y X. Se hacen con links `share` estándar, sin SDKs pesados de terceros (que además tienen implicancias de privacidad/tracking). Un botón de "Compartir" nativo (`navigator.share`) en mobile es lo más limpio y cubre todos los canales de una.
- **Link al Manifiesto por la Vida** (`manifiestoporlavida.ar`) — es el origen declarado de la Red, da contexto y credibilidad.

### 9.2 Entrada — desde las redes hacia la landing

- Lo ya cubierto en §8.2 (Open Graph) es lo que hace que el link se vea bien cuando la Red lo postea. Es la integración de entrada más importante.
- Si la Red tiene un feed de Instagram activo con novedades de la campaña, se podría **embeber el feed** en una sección, pero con cuidado: los embeds oficiales de Instagram/Facebook cargan scripts de terceros que ralentizan la página y trackean al visitante. Recomendación: **no embeber el feed en v1**; en su lugar, un simple link/botón "Seguinos en Instagram". Si más adelante se quiere el feed en vivo, evaluar un widget liviano o una solución que no cargue el SDK completo de Meta.
- No incluir píxeles de tracking de Meta ni Google Analytics invasivo por defecto. Si la Red quiere medir visitas, preferir una alternativa respetuosa de privacidad (ej. analytics sin cookies) — coherente con el tono de derechos humanos del proyecto. Decisión de la Red, no default técnico.

### 9.3 Consistencia de marca

- La og-image (§8.2), el favicon, el logo de la landing y las fotos de perfil de las redes deberían compartir el mismo lenguaje visual (paleta §2.1, el logo). Da sensación de organización seria y confiable — justo lo que necesita una campaña que pide plata.

---

## 10. Checklist antes de empezar a codear en Claude Code

**Bloqueantes (resolver antes de difundir la landing):**
- [ ] Filas de prueba (ING-0031/32/33, los $4.000.000 ficticios) despublicadas o borradas en `01_INGRESOS` — **lo más urgente**, ya que el endpoint está en vivo
- [ ] Confirmar consentimiento de las 11 personas del roster para aparecer con foto/nombre/rol/ciudad (§7.2)

**Listos:**
- [x] URL `/exec` confirmada funcionando en incógnito (§3.1)
- [x] Paleta de colores oficial (extraída con precisión, §2.1)
- [x] Brochure recibido — fuente de contenido (§2.2)
- [x] Logo definitivo (PNG transparente)
- [x] Roster de responsables compilado (§2.2)
- [x] Decisión: responsables van como carrusel (§2.3); Forms de carga quedan internos, no se linkean

**Assets que faltan (no bloquean el desarrollo, se puede arrancar con placeholders):**
- [ ] Fotos de las 11 personas del roster (§2.3) — mientras tanto, placeholders con iniciales
- [ ] og-image 1200×630 para compartir en redes (§8.2) — se puede diseñar con logo + nombre + frase sobre verde de la paleta
- [ ] favicon derivado del logo (§6.2)
- [ ] URLs exactas de los perfiles de Facebook e Instagram (§9.1) — el brochure da el nombre, falta el link directo
- [ ] Copy corto específico de landing: título del hero, frase de misión, textos de los 2 CTAs (§4)

**Decisiones pendientes de la Red (no técnicas):**
- [ ] ¿Dominio propio o subdominio de `manifiestoporlavida.ar`, o URL de github.io? (§6.4) — afecta credibilidad y SEO
- [ ] ¿Medios de pago concretos para donar? (datos bancarios, link de donación, etc.) — la sección "Cómo ayudar" los necesita
- [ ] ¿Se quiere medición de visitas? Si sí, definir herramienta respetuosa de privacidad (§9.2)
