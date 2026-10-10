# RED PAPERS — Portal Web de Producción Científica (ECMC - Yachay Tech)

**Portal Web para la Visualización y Gestión de la Producción Científica de los Docentes de la Escuela de Ciencias Matemáticas y Computacionales (ECMC) de la Universidad de Investigación de Tecnología Experimental Yachay Tech.**

---

## 1. Identidad Visual y Lineamientos de Marca
- **Color Principal Institucional:** Rojo `#EF4035`, con variantes `#D02B20` (hover/acciones) y `#991B1B` (contraste de texto accesible).
- **Fondos de selección y sutilezas:** `#FEF2F2` / `#FDF2F2` (fondos de selección y avisos institucionales).
- **Logotipo Institucional ECMC:** Vector SVG exacto con la Sigma segmentada (`Σ`) y columna de bloques cromáticos en proporción original (Screenshot 01/04).
- **Esquema de color:** Blanco, gris muy claro (`#F8FAFC`), texto carbón (`#111827`), y bordes tenues (`#E5E7EB`). Se removió totalmente el azul marino y degradado burdeos de identidades preliminares.

---

## 2. Líneas de Investigación Oficiales y Centralizadas (ECMC)
De conformidad con las directrices institucionales, se configuró una lista única e inmutable de 6 líneas oficiales:
1. `Ecuaciones diferenciales, análisis matemático, modelamiento y optimización`
2. `Ciencia de datos`
3. `Computación científica`
4. `Inteligencia artificial`
5. `Tecnologías de la información`
6. `Ciencia, Tecnología y Sociedad`

---

## 3. Matriz Principal de Trazabilidad Ágil (RF → Épica → HU)

| RF | Épica | Historia de Usuario (HU) | Actor | Prioridad / SP | Criterios | Pruebas |
|---|---|---|---|---|---|---|
| **RF01** | EP01 | **HU01**: Registrar una cuenta de profesor | Profesor de la ECMC | Must / 5 SP | CA01, CA02, CA03 | PR-HU01-01, PR-HU01-02 |
| **RF02** | EP01 | **HU02**: Iniciar y cerrar sesión | Profesor registrado | Must / 5 SP | CA04, CA05, CA06 | PR-HU02-01, PR-HU02-02 |
| **RF03** | EP02 | **HU03**: Registrar producto con autocompletado por identificador | Profesor autenticado | Must / 8 SP | CA07, CA08, CA09 | PR-HU03-01, PR-HU03-02 |
| **RF03** | EP02 | **HU04**: Autocompletar proyecto de investigación desde PDF | Profesor autenticado | Could / 8 SP | CA10, CA11, CA12 | PR-HU04-01, PR-HU04-02 |
| **RF04** | EP03 | **HU05**: Visualizar la producción científica | Usuario (Visitante/Docente) | Must / 5 SP | CA13, CA14, CA15 | PR-HU05-01, PR-HU05-02 |
| **RF04** | EP03 | **HU06**: Filtrar la producción científica | Usuario (Visitante/Docente) | Must / 3 SP | CA16, CA17, CA18 | PR-HU06-01, PR-HU06-02 |
| **RF05** | EP02 | **HU07**: Validar existencia antes de agregar | Profesor autenticado | Must / 5 SP | CA19, CA20, CA21 | PR-HU07-01, PR-HU07-02 |
| **RF06** | EP02 | **HU08**: Recibir notificaciones del estado de un producto | Profesor autenticado | Should / 5 SP | CA22, CA23, CA24 | PR-HU08-01, PR-HU08-02 |
| **RF07** | — | *Sin historia: especificación de base de datos pendiente en requisitos oficiales.* |
| **RF08** | EP04 | **HU09**: Consultar métricas por profesor en el dashboard | Usuario (Visitante/Docente) | Should / 8 SP | CA25, CA26, CA27 | PR-HU09-01, PR-HU09-02 |
| **RF08** | EP04 | **HU10**: Consultar producción total de la Escuela en el tiempo | Usuario (Visitante/Docente) | Should / 5 SP | CA28, CA29, CA30 | PR-HU10-01, PR-HU10-02 |
| **RF09** | EP03 | **HU11**: Descargar información filtrada (CSV, Excel, PDF) | Usuario (Visitante/Docente) | Should / 5 SP | CA31, CA32, CA33 | PR-HU11-01, PR-HU11-02 |

*Nota metodológica:* HU02 corresponde a RF02 y HU03 a RF03 (corrigiendo las erratas presentes en capturas preliminares).

---

## 4. Arquitectura de Módulos del Sistema

```
src/
├── assets/
│   └── EcmcLogo.tsx               # Logotipo vectorial SVG institucional oficial
├── constants/
│   ├── researchLines.ts           # 6 líneas oficiales y semestres 2021-1 a 2026-2
│   ├── seedData.ts                # Dataset base calibrado (14 productos, 6 docentes)
│   └── traceabilityData.ts        # Matriz completa de historias, tareas y pruebas
├── types/
│   └── index.ts                   # Interfaces TypeScript tipadas estrictamente
├── services/
│   ├── storage.ts                 # Adaptador de persistencia local y reseteo
│   ├── authService.ts             # Registro (@yachaytech.edu.ec), login, hash
│   ├── productService.ts          # CRUD, validación unicidad DOI/Código, transiciones
│   ├── doiService.ts              # Normalización DOI, Crossref API, búsqueda ORCID
│   ├── pdfExtractorService.ts     # Validación (tipo, tamaño <= 10MB) y extracción básica
│   ├── metricsService.ts          # Cálculo de índice h escuela, citas, evolución
│   └── exportService.ts           # Descargas auténticas CSV (BOM), Excel XLSX y PDF
├── components/
│   ├── auth/                      # Pantalla de acceso roja (Boceto 03) y registro docente
│   ├── layout/                    # Header horizontal, Footer institucional, Notificaciones
│   ├── dashboard/                 # Banner ECMC, 5 tarjetas KPI, Gráfico semestral, Tabla
│   ├── catalog/                   # Buscador, filtros agrupados, rejilla 2 columnas, modal
│   ├── directory/                 # Lista y perfil de investigador con biografía y export
│   ├── register/                  # Modal de registro (DOI, PDF, Manual)
│   ├── reviewer/                  # Consola de comité revisor (Flujo de auditoría propuesto)
│   └── traceability/              # Módulo de trazabilidad y ejecutor de pruebas en vivo
├── App.tsx                        # Orquestador principal de estado y vistas
└── index.css                      # Variables CSS y tokens de diseño institucional
```

---

## 5. Decisiones de Diseño, Cálculos Bibliométricos y Coherencia Matemática

1. **Conjunto Semilla Calibrado:**
   - Total Productos: 14 (11 Publicaciones + 3 Proyectos).
   - Verificados: 11 productos = **79% de verificación institucional**.
   - Citas Totales: **182 citas** en publicaciones verificadas.
   - Índice h Institucional ECMC: **h = 8** (publicaciones con citas: 42, 35, 30, 22, 17, 12, 9, 8, 4, 3, donde exactamente 8 artículos tienen ≥ 8 citas).
   - Coautorías: los artículos con coautores docentes de la ECMC computan una sola vez a nivel Escuela.
   - Docentes sin publicaciones (ej. Dr. Andrés Villacís): muestran cero (0) publicaciones, cero citas y cero índice h sin generar excepciones.

2. **Estados Oficiales del Producto:**
   - `cargado`: Estado inicial al registrar cualquier producto por parte de un docente.
   - `verificado`: Estado posterior a la revisión y certificación del comité institucional.
   - `rechazado`: Requiere motivo justificado obligatorio y genera notificación al autor.

3. **Política de Consulta Pública:**
   - La pantalla de acceso (Boceto 03) incluye la acción visible **"Explorar como visitante"**, lo que permite acceder al dashboard, catálogo, directorio y descargas sin autenticación.
   - Por defecto, los visitantes visualizan únicamente productos en estado `verificado`. Los docentes autenticados visualizan además todos los productos de su autoría (cargados o rechazados).

4. **Exportaciones (HU11):**
   - **CSV:** Formato plano delimitado por comas con codificación UTF-8 y marca BOM (`\uFEFF`) para compatibilidad directa con Microsoft Excel y preservación de tildes.
   - **Excel:** Generación de archivo binario nativo `.xlsx` mediante la librería `xlsx`.
   - **PDF:** Documento formateado con membrete institucional de la ECMC y estilos de impresión.

---

## 6. Resultados de Verificación y Pruebas (CA01 - CA33)
Se incorporó una suite de validación técnica ejecutable en vivo desde la pestaña de **Trazabilidad Ágil**:
- **PR-HU01-01 / PR-HU01-02:** Verificación de dominio institucional `@yachaytech.edu.ec`, rechazo de correos duplicados y hash de credenciales.
- **PR-HU02-01 / PR-HU02-02:** Control de sesión segura y disponibilidad de consulta pública.
- **PR-HU03-01 / PR-HU03-02:** Autocompletado de metadatos DOI y resiliencia ante caídas de red conservando datos ingresados.
- **PR-HU04-01 / PR-HU04-02:** Validación de PDF (máx. 10 MB, formato `%PDF`) y extracción preliminar editable.
- **PR-HU05-01 / PR-HU06-01:** Consulta pública sin login y combinación de filtros por intersección estricta (AND).
- **PR-HU07-01 / PR-HU07-02:** Detección de DOI duplicado con normalización (`https://doi.org/...` vs minúsculas) y aviso cuando no hay identificador.
- **PR-HU08-01 / PR-HU08-02:** Notificaciones dirigidas exclusivamente al propietario tras cambio de estado o rechazo justificado.
- **PR-HU09-01 / PR-HU10-01:** Cálculo exacto de métricas institucionales y visualización temporal semestral con valores en cero.
- **PR-HU11-01 / PR-HU11-02:** Exportaciones completas de todos los registros filtrados en los tres formatos y aviso ante filtros sin resultados.

---

## 7. Alcances Pendientes para Fase II (Producción con Backend)
- **Persistencia en Servidor:** Implementación de base de datos relacional (PostgreSQL / MySQL) según el esquema definido en `types/index.ts`.
- **Servicio SMTP:** Conexión con el servidor de correo institucional para restablecimiento de contraseñas.
- **Definición Organizacional del Rol Revisor:** Aprobación del reglamento de asignación y miembros del Comité Revisor Institucional (tarea técnica `T-HU08-02`).

