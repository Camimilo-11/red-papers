# Inicio: cifras de la escuela

El inicio abre con un único bloque «La escuela en cifras», seguido por las publicaciones destacadas y los gráficos. Las cuatro métricas conservan sus datos; se presentan en tarjetas con números grandes, iconos y el acento de cada escuela. En móvil se ordenan en 2×2. Se retiraron los slogans del banner y del menú lateral, y se compactaron los accesos de los perfiles autenticados.

Verificación con Playwright/Chromium: **17/17 comprobaciones pasan**.

| Comprobación | Resultado |
| --- | --- |
| 360×740, 390×844, 430×932 | Pasa: tarjetas 2×2, textos completos, sin scroll horizontal |
| 768×1024 | Pasa: cuadrícula de dos columnas, sin solapamientos |
| 1366×768, 1920×1080 | Pasa: cuatro columnas, encabezado único, publicaciones debajo |
| Datos de las siete escuelas | Pasa: coinciden con los productos verificados |
| Acciones y menú de docentes | Pasa: registrar publicación/proyecto y Mis registros |
| Acciones y menú de estudiantes | Pasa: consulta y Mis colaboraciones |
| Acciones a 1050 y 1100 px | Pasa: iconos y textos sin solapamiento |
| Excepciones de página capturadas por Playwright | Ninguna |
| Tipos y compilación | Pasa: `npm run lint` y `npm run build` |

Capturas: `home-desktop-1366.png` y `home-mobile-390.png`. Datos detallados: `verification.json`.

La comprobación detectó que el botón X del encabezado móvil queda debajo del menú lateral abierto; es una condición previa fuera de este rediseño. El menú se cierra mediante navegación o el fondo.

El servidor de desarrollo registró avisos `ResizeObserver loop completed with undelivered notifications` durante los recorridos. Playwright no los recibió como excepciones de página. Los observadores del proyecto están en los componentes de selección de escuelas, fuera de los componentes de cifras y acciones modificados aquí.
