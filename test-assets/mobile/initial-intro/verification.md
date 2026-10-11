# Primera carga de la intro

Verificado en Chromium (Edge), emulación táctil, escala 3, caché vacío, Fast 3G (150 ms, 200 KB/s de bajada) y CPU 4×.

La primera carga usaba una cortina HTML distinta de la intro de regreso. Un cierre de `div` extra dejaba la cortina fuera de su contenedor y detrás del fondo blanco. Además, el reloj de 1,5 s arrancaba en el `head`, antes de la primera pintura.

Se corrigió el anidado y el reloj ahora arranca después de pintar la cortina. React espera ese inicio antes de retirar el contenedor. La recarga de sesión y la preferencia de movimiento reducido ocultan la cortina al saltarse la intro.

| Comprobación | Resultado |
| --- | --- |
| 390×844: cortina azul visible sin interrupción | Pasa: 1.775 ms (incluye comienzo de salida); reloj mínimo de 1.500 ms |
| 360×740: cortina azul visible sin interrupción | Pasa: 1.668 ms (incluye comienzo de salida); reloj mínimo de 1.500 ms |
| Recarga en la misma sesión, ambos tamaños | Pasa: 0 cuadros de intro o cortina azul |
| Regreso desde el portal, 390×844 | Pasa: intro → logo → transición → bienvenida |
| Movimiento reducido, 390×844 | Pasa: 0 cuadros de intro o cortina azul |
| Bienvenida final | Pasa: opacidad 1, sin cortina huérfana ni desbordamiento horizontal |
| Errores de página | Ninguno |
| Tipos y compilación | Pasa: `npm run lint` y `npm run build` |

Las capturas `intro-360.png`, `intro-390.png`, `welcome-360.png` y `welcome-390.png` acompañan la medición detallada en `verification.json`. Los cuadros y los datos completos de antes/después se conservaron fuera del repositorio, en la carpeta temporal de verificación.
