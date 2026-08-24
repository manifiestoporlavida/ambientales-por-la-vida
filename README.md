# Kit de inicio — Landing Red Ambientales por la Vida UTP

Todo lo que necesita Claude Code para arrancar, en un solo lugar.

## Qué hay acá

```
kit/
├── BRIEF.md                          ← el documento de planificación completo. Es el contexto principal.
├── assets/
│   ├── logo.png                      ← logo definitivo, fondo transparente
│   ├── paleta-referencia.png         ← swatch visual de los 7 colores extraídos
│   ├── responsables.json             ← datos de los 11 responsables, listo para el carrusel
│   ├── responsables-placeholder/     ← 11 imágenes placeholder (iniciales sobre color), una por persona
│   └── brochure-referencia/
│       └── brochure-original.pdf     ← el PDF original, como referencia visual/tipográfica
```

## Cómo arrancar en Claude Code

1. Creá una carpeta para el proyecto (va a ser la raíz de tu repo de GitHub), por ejemplo:
   ```
   mkdir red-ambientales-landing
   cd red-ambientales-landing
   git init
   ```
2. Copiá todo el contenido de este kit adentro de esa carpeta.
3. Abrí Claude Code en esa carpeta (`claude` desde la terminal, parado en esa ruta — o abrí la carpeta desde la app de Claude Code).
4. Como primer mensaje, decile algo como:

   > "Leé BRIEF.md completo. Quiero que construyas la landing page descripta ahí, siguiendo el plan de construcción de la sección 6 (arrancando por el esqueleto estático con datos de ejemplo antes de conectar la API real). Usá los assets de la carpeta assets/ — el logo, la paleta, y responsables.json con sus placeholders para el carrusel."

   Claude Code va a leer el brief completo y tiene ahí toda la especificación: paleta exacta, contenido del brochure, contrato de datos del endpoint, estructura de secciones, seguridad, SEO y redes.

5. A medida que avance, andá dándole feedback iterativo (mostrale capturas, pedile ajustes) como harías en cualquier sesión de Claude Code.

## Cuando tengas las fotos reales de los responsables

Reemplazá los archivos en `assets/responsables-placeholder/` (o movelos a `assets/responsables/`, que es la ruta que ya usa `responsables.json`) manteniendo el mismo nombre de archivo, y no hace falta tocar código.

## Cuando estés listo para publicar

Repasá el checklist de la sección 10 del BRIEF.md — en particular, despublicar las filas de prueba en la spreadsheet antes de anunciar el link.
