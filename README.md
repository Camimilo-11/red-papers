# SIMAPC · Red Papers

SIMAPC (Sistema de Información, Monitoreo y Administración de la Producción Científica) es un portal institucional para consultar y administrar publicaciones y proyectos de investigación de las escuelas de Yachay Tech. Esta entrega es una aplicación de demostración del lado del cliente: persiste sus datos en `localStorage` y no incluye un servidor ni una base de datos institucional.

## Requisitos e inicio

Se requiere Node.js 22.12 o posterior y npm. Si se abre desde un ZIP, extráigalo en una carpeta nueva para conservar la versión anterior; no combine `src` con carpetas de versiones previas.

En Visual Studio Code, abra la carpeta del proyecto y ejecute en la terminal:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra la dirección local que muestra la terminal y mantenga el servidor abierto mientras usa la página. En PowerShell, `npm.cmd` evita la restricción que puede impedir ejecutar `npm.ps1`. Para detener un servidor anterior, use `Ctrl+C`; después de actualizar la página, `Ctrl+F5` fuerza una recarga completa. La información de prueba se conserva en el almacenamiento local de cada navegador.

## Uso

- **Visitante:** puede consultar el inicio, el catálogo público, el directorio y las exportaciones sin iniciar sesión.
- **Docente:** puede registrar publicaciones y proyectos, consultar sus registros, actualizar su perfil y recibir avisos de estado.
- **Estudiante:** puede consultar sus colaboraciones y administrar su perfil de estudiante.
- **Comité revisor:** puede revisar los productos que requieren decisión.
- **Desarrollo:** dispone de herramientas de demostración, trazabilidad y asignación de roles.

El inicio presenta indicadores y producción destacada; el catálogo permite buscar y combinar filtros; el directorio muestra perfiles docentes; y la ficha de cada producto reúne sus metadatos y estado. El registro admite datos manuales, autocompletado de identificadores y extracción preliminar de PDF. Las sugerencias generadas por integraciones simuladas se identifican en la interfaz.

## Modo de demostración y persistencia

La variable `VITE_ENABLE_DEMO` controla las cuentas de demostración, el acceso con la contraseña por defecto `123456` y el cambio de usuario de prueba. Su valor predeterminado es `'true'` para conservar la demostración actual. En desarrollo, las cuentas demo permanecen habilitadas por `import.meta.env.DEV`, incluso si el flag está en `false`.

Para deshabilitar la demo en una compilación de producción, configure en `.env.local`:

```dotenv
VITE_ENABLE_DEMO=false
```

El valor se aplica al compilar; vuelva a ejecutar el build después de cambiarlo. Los datos, sesiones y cambios de perfil se guardan en el navegador y no se sincronizan entre dispositivos. El hash de contraseña actual es una simulación no criptográfica con sal fija; este prototipo no debe usarse para autenticar cuentas institucionales reales.

## Arquitectura y herramientas

La interfaz se organiza en componentes React y estilos CSS/Tailwind. Los servicios concentran acceso a datos locales, autenticación de demostración, permisos, métricas, exportaciones e integraciones externas. `App.tsx` y `PortalApp.tsx` coordinan las vistas; `constants` reúne escuelas, datos semilla y trazabilidad; `types` define los modelos TypeScript.

```text
src/
├── App.tsx, PortalApp.tsx, index.css, portal.css, mobile-portal.css
├── components/       # auth, catalog, dashboard, directory, layout, profile,
│                     # register, reviewer, roles, traceability e identidad
├── constants/        # escuelas, datos semilla, líneas y trazabilidad
├── services/         # storage, auth, productos, métricas, DOI/PDF y exportación
└── types/            # modelos de la aplicación
```

Herramientas principales: React, TypeScript, Vite, Tailwind CSS, Motion, Lucide, SheetJS (`xlsx`) y Vitest. El proyecto se publica como sitio estático en GitHub Pages; el flujo de CI instala desde `package-lock.json`, revisa tipos, ejecuta las pruebas y genera el sitio.

## Comprobaciones

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd audit --omit=dev
```

Las pruebas de Vitest cubren cuentas, permisos de roles, acceso de comité y registro docente. GitHub Actions ejecuta lint, pruebas y build antes de publicar en Pages.

## Trazabilidad de requisitos

La siguiente matriz relaciona los requisitos funcionales con las historias del prototipo. RF07 reproduce su especificación completa y lo vincula con HU12, de acuerdo con el documento de requisitos de la plataforma ECMC.

| RF | Épica | Historia de usuario / requisito | Actor | Prioridad | Criterios | Pruebas |
|---|---|---|---|---|---|---|
| **RF01** | EP01 | **HU01:** Registrar una cuenta de profesor | Profesor de la ECMC | Must / 5 SP | CA01–CA03 | PR-HU01-01, PR-HU01-02 |
| **RF02** | EP01 | **HU02:** Iniciar y cerrar sesión | Profesor registrado | Must / 5 SP | CA04–CA06 | PR-HU02-01, PR-HU02-02 |
| **RF03** | EP02 | **HU03:** Registrar producto con autocompletado por identificador; **HU04:** Autocompletar proyecto desde PDF | Profesor autenticado | Must / 8 SP; Could / 8 SP | CA07–CA12 | PR-HU03-01, PR-HU03-02; PR-HU04-01, PR-HU04-02 |
| **RF04** | EP03 | **HU05:** Visualizar producción científica; **HU06:** Filtrar producción | Visitante o docente | Must / 5 SP; Must / 3 SP | CA13–CA18 | PR-HU05-01, PR-HU05-02; PR-HU06-01, PR-HU06-02 |
| **RF05** | EP02 | **HU07:** Validar existencia antes de agregar | Profesor autenticado | Must / 5 SP | CA19–CA21 | PR-HU07-01, PR-HU07-02 |
| **RF06** | EP02 | **HU08:** Recibir notificaciones del estado de un producto | Profesor autenticado | Should / 5 SP | CA22–CA24 | PR-HU08-01, PR-HU08-02 |
| **RF07** | EP02 | **Diseño de la base de datos:** El sistema debe contar con una base de datos formada por las publicaciones registradas automáticamente desde ORCID y por las publicaciones registradas manualmente que pasaron por el consejo de revisión. **HU12:** Consolidar las publicaciones de ORCID y las manuales revisadas en una base común y trazable. | Profesor de la ECMC | Must / 8 (propuesta) | CA34–CA38 | PR-HU12-01–03 |
| **RF08** | EP04 | **HU09:** Consultar métricas por profesor; **HU10:** Consultar producción total de la Escuela a lo largo del tiempo | Visitante o docente | Should / 8 SP; Should / 5 SP | CA25–CA30 | PR-HU09-01, PR-HU09-02; PR-HU10-01, PR-HU10-02 |
| **RF09** | EP03 | **HU11:** Descargar información filtrada en CSV, PDF o Excel | Visitante o docente | Should / 5 SP | CA31–CA33 | PR-HU11-01, PR-HU11-02 |

RF07 se desglosa en HU12. La historia contempla publicaciones importadas desde ORCID y registros manuales aprobados por el consejo; las pendientes y rechazadas quedan separadas del catálogo consolidado. La frecuencia de importación y las reglas finales de aprobación requieren validación con el cliente. HU12 depende de HU02, HU03 y HU07 y se integra con las notificaciones de HU08. Su prioridad y estimación son propuestas en el documento fuente.

## Historial incorporado

- **8 de octubre de 2026:** se ajustaron los indicadores y gráficos del inicio, se retiró el Top 3 y los mensajes de pie de gráfico, se mostró el estado de los productos en Mis registros y se quitaron filtros de estado del catálogo público.
- **Muestras v36–v39:** se construyó el tablero con ranking, evolución semestral y productos por línea; se reorganizaron las métricas y el perfil docente; se mejoró el foco, la navegación entre pestañas y la distribución adaptable a móvil y escritorio.
- **Perfil docente:** se añadieron edición de datos académicos, líneas de investigación, biografía, enlaces ORCID/GitHub/Google Scholar y cambio de contraseña local; el perfil público muestra producción y datos de contacto.
- **Muestra v3 y ajustes posteriores:** los avisos se cierran al pulsar fuera o con Escape; el registro conserva el tipo elegido y guía al usuario en tres pasos; el historial del navegador recorre las vistas y modales internos; se mantuvieron revisión, trazabilidad y datos demo.
- **Rediseño y accesibilidad:** se simplificó el menú, se agruparon filtros avanzados, se adaptó la navegación a pantallas estrechas, se mantuvieron controles de teclado y foco visible, y el menú lateral recibió desplazamiento propio para pantallas bajas y zoom ampliado.

## Alcance y siguientes pasos

Este prototipo no sincroniza datos ni implementa autenticación segura, persistencia institucional, correo para restablecimiento de contraseña ni una API de producción. La siguiente fase requiere definir e implementar un backend con base de datos, autenticación y autorización del lado del servidor, servicio de correo y reglas institucionales para el consejo revisor. Los datos semilla son de demostración y no sustituyen registros institucionales.
