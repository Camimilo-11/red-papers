# Cambios aplicados

## Ajustes de dashboard y registros — 8 de octubre de 2026

- Se retiraron los mensajes al pie de las gráficas y la sección Top 3 de Inicio.
- En el total semestral, publicaciones y proyectos se muestran en barras agrupadas con colores y leyenda.
- El estado y la decisión sobre cada producto se muestran en Mis registros; se retiró el filtro de estado del catálogo público.
- Se retiró el escalafón del formulario de creación de cuenta. El perfil nuevo recibe la etiqueta inicial «Profesor».
- Verificados TypeScript y compilación de producción.

## Muestra v39 — navegación y botones

- Se quitó el signo «+» duplicado del botón «Registrar» y se conservó su ícono.
- Al cambiar de pestaña, el contenido vuelve al inicio sin que el foco lo desplace debajo de la barra superior.
- Comprobé que Docentes y Publicaciones y proyectos muestran su título al abrirse, junto con la opción de descarga en el catálogo.
- Verificados TypeScript y compilación.

## Muestra v38 — ajuste del perfil docente

- La línea de investigación y la gráfica anual ahora forman las dos columnas superiores del perfil.
- La descripción del docente aparece debajo, en una sola columna a todo lo ancho.
- En pantallas estrechas se apilan los elementos para mantener la lectura.
- Verificados TypeScript, compilación y la distribución en escritorio y móvil.

## Muestra v37 — perfil docente en dos columnas

- Se elevó la gráfica anual del perfil para que aparezca junto a la descripción, debajo de la línea de investigación.
- La línea de investigación ocupa su propia fila y la descripción y la gráfica comparten dos columnas.
- Contacto e indicadores del docente quedan debajo de ese bloque; en pantallas estrechas, descripción y gráfica se apilan.
- Comprobados TypeScript, compilación y distribución de escritorio y móvil.

## Muestra v36 — tablero principal de investigación

- Se incorporó el tablero debajo de las acciones de inicio y antes del Top 3.
- El primer gráfico compara el Top 5 de docentes y permite ordenar por citas, publicaciones o índice h.
- La evolución semestral existente pasó a ser el segundo gráfico del tablero; sus filtros de productos, publicaciones y proyectos se mantienen.
- Se añadió un gráfico de barras horizontales para los productos verificados por línea de investigación.
- El Top 3, las métricas escolares y el directorio docente con índice h quedan a la vista, sin acordeones.
- Verificados TypeScript, compilación y vista adaptable; el filtro de índice h también se probó en la interfaz.

## Configuración del perfil docente

- Se puede abrir «Configuración del perfil» al hacer clic en el bloque de identidad del profesor al pie del menú lateral.
- Permite actualizar nombre, escalafón, biografía, ORCID, perfil de GitHub e identificador de Google Scholar.
- Los enlaces guardados aparecen en el directorio público del docente.
- El perfil público separa la línea de investigación de la descripción y presenta una gráfica anual de publicaciones y proyectos del docente.
- Incluye cambio de contraseña con verificación de la contraseña actual.
- La versión de muestra guarda los cambios en el navegador; la versión de integración deja estas operaciones pendientes de la API institucional.

## Muestra v3 — pruebas de funcionalidad

- Avisos se cierra al pulsar fuera o Escape; pulsar dentro mantiene abierto el panel.
- Eliminadas las flechas decorativas de las tres acciones de inicio.
- Registrar publicación/proyecto conserva el tipo elegido sin repetir el selector. El registro genérico del catálogo sí permite elegir.
- Historial del navegador para las pantallas y los modales globales: Atrás y Adelante recorren la navegación interna. Al agotar el historial interno, el navegador conserva su comportamiento normal.
- Otras herramientas y todos los datos de demostración se conservan.
- Comprobados TypeScript, compilación y los flujos anteriores en navegador.

- Corrección del menú lateral: desplazamiento vertical independiente al desplegar Otras herramientas, incluyendo pantallas bajas y zoom ampliado; los elementos mantienen su tamaño legible.

## Rediseño para una navegación más clara

- Menú lateral con Inicio, Publicaciones y proyectos, Docentes y Mis registros.
- Inicio con tres acciones principales y detalles estadísticos desplegables.
- Tipografía más grande, mayor separación y botones con texto explícito.
- Catálogo en filas breves, con detalles completos al abrir un registro.
- Filtros avanzados agrupados en «Más filtros».
- Registro guiado en tres pasos con revisión antes de guardar.
- Pantalla de acceso rediseñada en rojo y blanco.
- Adaptación a móvil, foco visible y navegación por teclado.
- Se mantienen los módulos existentes de revisión, trazabilidad y exportación.
- Dependencias directas fijadas y esbuild actualizado a 0.28.2 para compatibilidad con Vite.

La compilación y TypeScript pasan. Se verificó el flujo principal en navegador y la vista móvil; no se ha realizado todavía una prueba de usabilidad con profesores.

## Cambios anteriores conservados

- Cerrar sesión elimina la sesión activa y vuelve a la pantalla de acceso.
- Se cierran los modales y se restablece la navegación al salir.
- El menú muestra «Cerrar sesión».
- El banner sustituye la marca de agua ECMC por el logo institucional existente en su variante blanca.

## Verificación

- Compilación de producción: correcta.
- TypeScript: sin errores.
- Navegador: acceso de demostración, cierre de sesión y recarga comprobados.
- Logo blanco revisado visualmente en el banner.

La autenticación conserva el modo de demostración del proyecto original.
