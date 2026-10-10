# SIMAPC · Sistema de Información, Monitoreo y Administración de la Producción Científica

## Abrir el proyecto

1. Extraiga este ZIP en una carpeta nueva para conservar su versión anterior.
2. Abra la carpeta del proyecto SIMAPC en Visual Studio Code.
3. Abra Terminal > Nueva terminal y ejecute:

```powershell
npm.cmd install
npm.cmd run dev
```

4. Abra el enlace Local que aparezca en la terminal. Mantenga la terminal abierta mientras usa la página.

Necesita Node.js instalado. Se ajustó esbuild a una versión compatible con Vite y se fijaron las versiones directas. Se omiten los archivos de bloqueo antiguos de Bun y pnpm; npm generará su propio package-lock.json.

## Cómo usarlo

- Inicio: acciones principales y tablero visible con el ranking de docentes, la evolución semestral y los productos por línea de investigación. Debajo aparecen el Top 3, las métricas de la escuela y el directorio docente con índice h, sin desplegables.
- Docentes: el perfil presenta la línea de investigación y la gráfica anual en dos columnas; debajo, la descripción ocupa todo el ancho. Contacto e indicadores aparecen al final.
- Mis registros: consultar los trabajos asociados a su cuenta.
- Registrar: completar datos básicos, autores y detalles, y revisar antes de guardar.
- Más filtros: desplegar las opciones avanzadas del catálogo.
- Otras herramientas: acceder a trazabilidad y comité revisor.
- Perfil del menú lateral (profesor): hacer clic en su nombre para editar datos académicos, línea de investigación, descripción, enlaces ORCID/GitHub/Google Scholar y contraseña.
- Cerrar sesión: volver a la pantalla de acceso.

La plataforma conserva el almacenamiento y la autenticación de demostración del proyecto original. Los cambios de perfil y contraseña se guardan en este navegador; use las cuentas de prueba en «Probar con una cuenta de demostración» en el acceso. No es una conexión a una base de datos institucional.

## Verificación

TypeScript y compilación de producción correctos con las dependencias disponibles. Se probaron acceso de demostración, navegación, búsqueda, registro de proyecto en tres pasos, regreso entre pasos y cierre de sesión, además del diseño móvil. La instalación limpia por npm no pudo completarse durante la comprobación por la demora del registro de paquetes; no se incluye un bloqueo npm sin verificar.
