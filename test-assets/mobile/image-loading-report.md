# Informe de carga prioritaria de imágenes

Prueba en Chromium 151, 390×844, emulación móvil táctil (device scale 3), CPU 4× más lenta, Fast 3G (latencia 562 ms y descarga 200 KB/s) y caché desactivada. Se recorrieron las siete escuelas en el build de producción servido por el puerto 3004.

| Medición | Antes | Después |
|---|---:|---:|
| Bienvenida visible con los siete logos decodificados | 12,60 s | 2,47 s |
| Primera vista de escuelas utilizable | 17,43 s | 6,28 s |
| Mascotas descargadas | 1.025.306 bytes al inicio | 502.988 bytes, bajo demanda |

La bienvenida aparece un 80 % antes y la vista de escuelas un 64 % antes. Los siete logos críticos suman 59.662 bytes. Las ocho mascotas optimizadas son WebP de 768×768, calidad 82, pesan entre 55.430 y 69.772 bytes y reducen el total un 50,9 %; los originales siguen conservados.

En la ruta raíz de Vite en desarrollo (`http://192.168.2.17:3004/`), la bienvenida apareció a los 2,34 s, pero el stage de React tardó 36,6 s en esa emulación. Repetí el recorrido con el build de producción, servido desde una ruta temporal en el mismo puerto: el stage estuvo listo a los 6,28 s. La cifra de producción es la relevante para la versión desplegada; Vite en desarrollo descarga y transforma módulos separados.

Base y ECAA se solicitaron a los 3,23 y 3,30 s. Las demás mascotas comenzaron en segundo plano al quedar listo el selector; al entrar a cada escuela, título, grafo y botón estaban presentes aunque la mascota aún cargara. El recorrido terminó con las siete mascotas decodificadas y sin solicitudes del chunk del portal.

| Escuela | Captura |
|---|---|
| Intro | [priority-intro-390.png](priority-intro-390.png) |
| Bienvenida | [priority-welcome-390.png](priority-welcome-390.png) |
| ECAA | [priority-eciaa-390.png](priority-eciaa-390.png) |
| ECBI | [priority-ecbi-390.png](priority-ecbi-390.png) |
| ECFN | [priority-ecfn-390.png](priority-ecfn-390.png) |
| ECTEA | [priority-ectea-390.png](priority-ectea-390.png) |
| ECMC | [priority-ecmc-390.png](priority-ecmc-390.png) |
| ECQI | [priority-ecqi-390.png](priority-ecqi-390.png) |
| YTLC | [priority-ytlc-390.png](priority-ytlc-390.png) |

`npm run lint` y `npm run build` pasan. Vite emite una advertencia de tamaño para `PortalApp` (611,89 KB minificado; 182,66 KB gzip); el chunk sigue separado y no se solicita durante la bienvenida ni el recorrido de escuelas.
