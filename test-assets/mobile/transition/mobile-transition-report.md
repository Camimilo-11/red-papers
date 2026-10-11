# Verificación de la transición móvil

Probé la transición en Playwright con Edge Chromium, `isMobile`, `hasTouch`, `deviceScaleFactor: 3` y CPU ralentizada 4×. Guardé los videos de ida y vuelta y ocho cuadros clave por tamaño en esta carpeta.

| Punto | Resultado | Medición / corrección |
|---|---|---|
| Bienvenida → ECAA | Pasa | Una sola progresión de Motion de 0 a 1; FLIP de logos, expansión circular del tinte, destello, grafo, texto y panel en fases. Duración nominal: 0,9 s. |
| Mascota y logos | Pasa | El fondo `base.webp` evita el hueco mientras llega la mascota; fundido al arte de ECAA. El fondo blanco de los logos desaparece durante el viaje móvil. Cuadros vacíos: 0; logos perdidos durante el viaje: 0. |
| Inversión e intención pendiente | Pasa | El regreso dura 0,6 s; se invalida el callback anterior al invertir. Un gesto adicional durante la entrada termina en ECBI en ambos tamaños. El regreso interrumpido termina en bienvenida completamente visible. |
| Títulos de escuelas | Pasa | Salida antes de entrada. Cuadros con dos títulos por encima de 40%: 0. |
| Pantalla y navegación | Pasa | Sin desbordamiento horizontal en las muestras; saltos directos a YTLC y ECAA verificados en ambos tamaños. |
| Movimiento reducido | Pasa | Fundido de 229 ms; sin `clip-path` circular. |
| Rendimiento con CPU 4× | Parcial | En varias corridas: 54,4–56,2 FPS en 390×844 y 56,3–56,9 FPS en 360×740. La vuelta promedió 60,1 FPS; el mayor intervalo registrado fue 116,5/83,3 ms. No hubo tareas largas (>50 ms). |
| Escritorio 1366×768 | Pasa | Welcome y ECAA comparados con HEAD: 0 píxeles distintos en capturas deterministas. Se pausó el movimiento CSS y se ocultó el motivo SVG animado durante la comparación. |
| Build y tipos | Pasa | `npm run build` y `npm run lint` terminan correctamente. |

La entrada no sostuvo 60 FPS en la simulación CPU 4×. El mayor salto coincide con el primer pintado del grafo y la mascota; no hubo tareas largas de JavaScript.
