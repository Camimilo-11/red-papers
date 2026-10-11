# Verificación móvil — SIMAPC

11/10/2026. **Los nueve tamaños pasan la revisión final.** Se recorrieron las siete escuelas y sus vistas públicas en cada tamaño: 63 recorridos y 648 comprobaciones del flujo, sin fallas pendientes.

Playwright con Chromium **151.0.7922.34**, compilación de producción, contextos privados con caché vacía, `isMobile: true`, `hasTouch: true`, escala 3, CPU 4× y Fast 3G (1.6 Mbps de descarga, 750 kbps de subida, latencia 562.5 ms). Los deslizamientos se enviaron mediante CDP `Input.dispatchTouchEvent`; las pruebas no usaron `scrollTo` para avanzar.

| Punto | Resultado | Qué se corrigió o verificó |
|---|---|---|
| Intro y sesión | Pasa | Duración ≈1.5 s desde el primer fotograma; no se repite al recargar la misma visita. |
| Carga y bienvenida | Pasa | Decodificación previa, fondo blanco durante la espera y siete logos visibles sin recortes al revelar el contenido. |
| Logos → mascota | Pasa | Convergencia, destello y aparición de la mascota; imágenes listas antes de entrar. |
| Un gesto = una escuela | Pasa | Cambio al soltar, siete pantallas de 100svh y alineación superior exacta. También se probaron seis gestos de regreso. |
| Cinco gestos rápidos | Pasa | ECAA → ECQI, sin pasos adicionales ni pérdida de gestos. |
| Barra de escuelas | Pasa | Desplazamiento horizontal táctil, chip activo centrado y salto ECAA ↔ YTLC. Chips de 104×52 px; 104×46 px en horizontal. |
| Títulos y mascotas | Pasa | Títulos ≥28 px, columna propia y mascota contenida debajo o al lado. Sin títulos cortados ni cabezas tapadas. |
| Botón principal | Pasa | Visible, ≥52 px de alto y sin solapamientos. Se corrigieron la capa que bloqueaba el toque en horizontal y los márgenes estrechos a 16 px. |
| Márgenes seguros | Pasa | Encabezado corregido. Las siete escuelas pasan con 44 px arriba/34 abajo y, en horizontal, 44 px laterales/21 abajo. |
| Grafo y contraste | Pasa | Una instancia persistente, centrada detrás de la mascota, opacidad 0.45 y máscara. Contraste mínimo final del título: **5.46:1**. |
| Investigaciones y proyectos | Pasa | Los 63 accesos, paneles, catálogos, filtros y detalles funcionan por tacto. Se corrigió la distribución de controles; sin desbordamiento de página. |
| Zoom y áreas táctiles | Pasa | Viewport correcto, campos públicos de ≥16 px y botón comprobado mediante hit testing y toques reales. |
| Movimiento reducido | Pasa | Siete tarjetas estáticas, cero animaciones activas; probado al cambiar la preferencia y desde una visita nueva. |
| Rendimiento | Pasa | Se eliminaron montajes durante los gestos y lecturas repetidas de posición. El grafo reutiliza coordenadas serializadas, conservando sus formas y movimiento. |
| Tipos y compilación | Pasa | Chequeo de tipos y build final sin errores. |

Cada medición de rendimiento dura **3 segundos con cinco deslizamientos rápidos**. P95 del intervalo entre fotogramas: 16.7–16.8 ms.

| Tamaño | FPS | Tareas >50 ms durante gestos | CLS |
|---|---:|---:|---:|
| 360×740 | 60.0 | 0 | 0 |
| 375×667 | 60.0 | 0 | 0 |
| 390×844 | 60.0 | 0 | 0 |
| 412×915 | 60.0 | 0 | 0 |
| 430×932 | 60.0 | 0 | 0 |
| 768×1024 | 60.0 | 0 | 0 |
| 820×1180 | 60.0 | 0 | 0 |
| 844×390 | 60.0 | 0 | 0 |
| 915×412 | 60.0 | 0 | 0 |

Con caché vacía y Fast 3G, preparar todo el contenido tardó 16.1–18.9 s en la pasada completa; la intro conserva su duración y luego queda el fondo blanco hasta terminar la decodificación. Al llegar a cada escuela las imágenes aparecen completas. El contraste se calculó sobre capturas a escala 3, comparando los colores del título con los píxeles del fondo bajo sus palabras. Estas cifras corresponden a la emulación de Chromium, no a mediciones en teléfonos físicos.

No se modificaron login, permisos, datos, colores de las escuelas ni archivos de logos o mascotas. El build conserva avisos previos sobre el tamaño del paquete y la futura configuración de Vite; no son errores.

**Capturas** — también están guardadas las siete escuelas de los otros siete tamaños en `test-assets/mobile/`.

| Escuela | 360×740 | 390×844 |
|---|---|---|
| ECAA | [Captura](test-assets/mobile/360x740-ecaa.png) | [Captura](test-assets/mobile/390x844-ecaa.png) |
| ECBI | [Captura](test-assets/mobile/360x740-ecbi.png) | [Captura](test-assets/mobile/390x844-ecbi.png) |
| ECFN | [Captura](test-assets/mobile/360x740-ecfn.png) | [Captura](test-assets/mobile/390x844-ecfn.png) |
| ECTEA | [Captura](test-assets/mobile/360x740-ectea.png) | [Captura](test-assets/mobile/390x844-ectea.png) |
| ECMC | [Captura](test-assets/mobile/360x740-ecmc.png) | [Captura](test-assets/mobile/390x844-ecmc.png) |
| ECQI | [Captura](test-assets/mobile/360x740-ecqi.png) | [Captura](test-assets/mobile/390x844-ecqi.png) |
| YTLC | [Captura](test-assets/mobile/360x740-ytlc.png) | [Captura](test-assets/mobile/390x844-ytlc.png) |

[Intro](test-assets/mobile/intro.png) · [Bienvenida](test-assets/mobile/390x844-bienvenida.png) · [Catálogo](test-assets/mobile/390x844-catalogo.png) · [Movimiento reducido](test-assets/mobile/390x844-movimiento-reducido.png) · [Márgenes seguros](test-assets/mobile/390x844-safe-area.png) · [Mediciones](test-assets/mobile/measurements.json)

Para repetir: `npm run build`, iniciar `npm run preview -- --host 127.0.0.1 --port 4173` y ejecutar `node scripts/mobile-audit.cjs` y `node scripts/mobile-safe-area.cjs`. Las rutas de Playwright, Sharp y Chromium se pueden definir mediante `PLAYWRIGHT_MODULE`, `SHARP_MODULE` y `CHROMIUM_EXECUTABLE`.
