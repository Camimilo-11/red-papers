# Footer móvil: tipografía y espacio inferior

Rama: `mobile-polish`. Sin merge a `main`.

Causa: `.institutional-landing-footer-group h2` forzaba `Georgia, 'Times New Roman', serif` en `src/index.css`.

El ajuste se limita al footer con ancho inferior a 760 px. Sus encabezados heredan la misma familia del cuerpo, con peso 600 y tamaño 1.1rem. Se mantiene el resto de sus colores, márgenes y contenido. Se añade `padding-bottom: calc(24px + env(safe-area-inset-bottom))`, enlaces de al menos 44 px de alto, separación vertical de 12 px y logo al 85 % de su ancho anterior.

## Verificación en Chromium / Edge

Móvil: 390×844, emulación móvil y táctil, escala 3. Acceso al footer mediante gestos CDP desde YTLC.

| Comprobación | Resultado |
| --- | --- |
| Los tres encabezados coinciden con `getComputedStyle(document.body).fontFamily` | Pasa |
| Resto de textos del footer con la misma familia sans | Pasa |
| Encabezados con peso 600 y tamaño 17.6 px | Pasa |
| Enlaces: altura mínima / separación vertical | 44 px / 12 px |
| Logo: ancho antes → después | 190 → 161.5 px (85 %) |
| Padding inferior en emulación sin área segura adicional | 24 px |
| Última línea completamente visible tras el desplazamiento táctil | Pasa; borde inferior a 822.81 px de 844 px |
| Desbordamiento horizontal | Ninguno |
| CLS móvil antes → después | 0 → 0 |
| Comprobación adicional a 360×740 | Fuente correcta, enlaces ≥ 44 px, última línea visible, CLS 0 y sin desbordamiento |
| Footer escritorio 1366 px: diferencia de píxeles antes/después | 0 |
| Footer en el límite de 760 px: diferencia de píxeles | 0 |
| Chequeo de tipos y build | Sin errores |

La familia calculada del cuerpo y del footer es `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

`390-before.png` y `390-after.png` muestran el footer completo. Las capturas `390-*-bottom.png` muestran la última línea en el viewport después de gestos táctiles. `desktop-*.png` y `760-*.png` contienen las comparaciones fuera del alcance móvil.

Detalle de medición: el anclaje existente deja el desplazamiento móvil en 6700 px frente a un máximo geométrico de 6716 px; la última línea permanece completamente visible. No se modificó ese comportamiento. A 760 px se registra CLS previo de aproximadamente 0.0944 y posterior de 0.0947, originado en la bienvenida y sus logos, fuera del footer; sus fuentes están identificadas en `verification.json`. El footer de 760 px es pixel-idéntico y no recibe las reglas nuevas.

El servidor de desarrollo registró `ResizeObserver loop completed with undelivered notifications` antes y después del ajuste. El chequeo de tipos y el build terminaron correctamente; no se modificaron observadores ni transiciones.
