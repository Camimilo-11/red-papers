# Fuente bibliográfica de ECMC

`ecmc-orcid.json` procede exclusivamente del archivo `emcc_orcid.sql` proporcionado por el usuario. El volcado phpMyAdmin indica generación el 12 de octubre de 2026 a las 00:58:14 y contiene una sola tabla, `publicaciones`. No se ejecutó SQL: se extrajeron sus valores como datos.

La importación se limita a ECMC. Las demás escuelas conservan sus datos actuales. Los cuatro investigadores se identifican mediante el nombre y ORCID presentes en la fuente; no se les atribuyen correos, cargos, títulos académicos, fotos, biografías ni métricas externas que el archivo no proporciona.

## Recuentos y coautoría

- 140 filas originales y 135 trabajos bibliográficos únicos.
- 120 DOI distintos y 15 trabajos sin DOI.
- Cuatro DOI compartidos por varios investigadores generan cinco filas adicionales. Sus metadatos coinciden; se agrupan en un único trabajo y se conservan todas las asociaciones de investigadores y filas originales (`sourceRows`, posiciones desde 1 en el bloque `INSERT`).
- La suma institucional, sin contar repetidamente los trabajos compartidos, es de 1.388 citas conocidas. Las 140 filas originales suman 1.409 citas por repetir coautorías.
- Juan Astudillo León (`0000-0002-7291-3584`): 43 asociaciones, 296 citas conocidas.
- Manuel Eugenio Morocho-Cayamcela (`0000-0002-4705-7923`): 47 asociaciones, 955 citas conocidas.
- Rigoberto Fonseca-Delgado (`0000-0002-8890-3911`): 19 asociaciones, 130 citas conocidas.
- Jefferson Alexander Moreno-Guaicha (`0000-0002-0380-4739`): 31 asociaciones, 28 citas conocidas.

El campo `Investigador` indica una asociación bibliográfica con un ORCID, no la lista completa ni el orden de autores de cada publicación. `authors` y `authorIds` contienen solo estos investigadores vinculados. No se inventa un autor principal ni un propietario: `ownerId` usa el identificador técnico `ecmc-orcid-import`.

## Fidelidad y datos ausentes

- Se preservan los nueve tipos originales en `bibliographicSource.publicationType`: 63 artículos de revista, 33 capítulos, 29 artículos de congreso, una tesis, tres conjuntos de datos, un trabajo de tipo `other`, un software, dos libros editados y dos números de revista. Se presentan en el catálogo bibliográfico como `publicacion`; no se fabrican proyectos.
- Los años abarcan 2011–2027. Los dos capítulos de 2027 figuran así en el archivo y se conservan sin adelantar ni corregir su fecha.
- No hay fechas exactas de publicación ni semestres, líneas de investigación, resúmenes, proyectos o constancia de revisión institucional. Se dejan ausentes o vacíos según el contrato de datos. `createdAt` y `updatedAt` registran la ingesta, no la fecha de publicación.
- Hay 19 trabajos con citas `NULL`, dos medios de publicación vacíos, 15 DOI ausentes y 66 filas originales con SJR desconocido. Las citas desconocidas permanecen como `null` en `bibliographicSource.citations`; el campo numérico existente usa cero únicamente como valor neutro para agregación, sin convertir el dato desconocido en una medición de cero citas.
- Los valores SJR `Sin dato` y `-` se normalizan a `null`. Los cuartiles y puntuaciones existentes se mantienen sin estimaciones.
- Se decodifica `&amp;` a `&` (siete filas originales) y se convierte el espacio no separable a espacio normal (13 filas), sin modificar el contenido bibliográfico restante.
- Los identificadores de producto son estables: prefijo `ecmc-orcid-` más los primeros 24 caracteres hexadecimales de SHA-256 de `doi:{DOI normalizado}` o, cuando falta DOI, de `title:{año}:{título normalizado}`. Los identificadores de investigador se basan en su ORCID.

## Clasificación temática temporal

El SQL no relaciona publicaciones con líneas de investigación. Para hacer útil el contenido provisional se aplica un diccionario transparente en `src/services/ecmcResearchLineDictionary.ts`, solo a las 135 publicaciones de este archivo y solo a partir de sus títulos. Reconoce términos en inglés y español, compara puntajes entre las seis líneas oficiales de ECMC y deja sin asignar los casos con poca evidencia o empate. Cada sugerencia guarda la versión del diccionario, los términos coincidentes y la solidez relativa; esto no es una probabilidad ni una clasificación provista por ORCID. La interfaz y las exportaciones la identifican como temporal. Los perfiles de investigadores, otras escuelas y registros futuros no se clasifican con este diccionario.

El estado técnico `verificado` se utiliza únicamente para permitir la visibilidad pública del conjunto importado en el contrato actual del portal. `bibliographicSource` identifica la procedencia, la interfaz lo distingue como «Importado ORCID» y no existe `verifiedAt` ni una aprobación atribuida al comité.

## Almacenamiento local

La migración reconoce los antiguos productos sintéticos de ECMC `prod-001` a `prod-015` y docentes `doc-001` a `doc-006`. Estos identificadores están separados de los nuevos registros importados; no representan los identificadores de investigadores reales. Las credenciales de demostración se mantienen separadas de estos perfiles bibliográficos.
