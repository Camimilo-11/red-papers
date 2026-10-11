# Verificación de tipografía

**Causa:** el commit `c3302bc` quitó `@import "tailwindcss"` de `src/index.css`; Preflight dejó de aportar la fuente sans global y `--font-sans` quedó sin aplicarse al texto normal.

En las capturas «antes» se retiraron solo las dos reglas globales nuevas del HTML; todas las demás reglas y el contenido son los mismos. Las capturas «después» muestran el cambio tipográfico.

| Viewport | Bienvenida | ECAA | ECBI | Fast 3G, caché vacía |
|---|---|---|---|---|
| 360 × 740 | [antes](360-welcome-before.png) · [después](360-welcome-after.png) | [antes](360-ecaa-before.png) · [después](360-ecaa-after.png) | [antes](360-ecbi-before.png) · [después](360-ecbi-after.png) | [captura](fast3g-360-initial.png) |
| 390 × 844 | [antes](390-welcome-before.png) · [después](390-welcome-after.png) | [antes](390-ecaa-before.png) · [después](390-ecaa-after.png) | [antes](390-ecbi-before.png) · [después](390-ecbi-after.png) | [captura](fast3g-390-initial.png) |
| 430 × 932 | [antes](430-welcome-before.png) · [después](430-welcome-after.png) | [antes](430-ecaa-before.png) · [después](430-ecaa-after.png) | [antes](430-ecbi-before.png) · [después](430-ecbi-after.png) | [captura](fast3g-430-initial.png) |
| 1366 × 768 | [antes](1366-welcome-before.png) · [después](1366-welcome-after.png) | [antes](1366-ecaa-before.png) · [después](1366-ecaa-after.png) | [antes](1366-ecbi-before.png) · [después](1366-ecbi-after.png) | [captura](fast3g-1366-initial.png) |

Fast 3G: caché deshabilitada, 1.6 Mbps de descarga y 150 ms de latencia. En el primer pintado, el texto de bienvenida computó como sans en los cuatro tamaños; hubo cero solicitudes de fuentes web. Build y chequeo de tipos completados sin errores.
