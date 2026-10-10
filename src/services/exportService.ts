import * as XLSX from 'xlsx';
import { ScientificProduct, FilterState } from '../types';

export interface ExportMetadata {
  filters: FilterState;
  totalRecords: number;
  generatedAt: string;
  institution: string;
  school: string;
}

export const exportService = {
  /**
   * Genera y descarga archivo CSV con codificación UTF-8 y BOM
   */
  exportToCsv(products: ScientificProduct[], meta: ExportMetadata, fileName = 'produccion_cientifica_ecmc.csv'): boolean {
    if (!products || products.length === 0) {
      return false;
    }

    const headers = [
      'ID Sistema',
      'Tipo de Producto',
      'Título',
      'Autores / Investigadores',
      'Año',
      'Semestre',
      'Línea de Investigación Oficial',
      'Estado Oficial',
      'Identificador (DOI / Código)',
      'Medio / Revista / Fondo',
      'Citas Registradas',
      'Fecha Registro',
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.type === 'publicacion' ? 'Publicación Científica' : 'Proyecto de Investigación'}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.authors.join('; ').replace(/"/g, '""')}"`,
      p.year,
      `"${p.semester}"`,
      `"${p.researchLine}"`,
      `"${p.status}"`,
      `"${(p.doi || p.projectCode || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.venue || p.fundingVenue || 'N/A').replace(/"/g, '""')}"`,
      p.citations || 0,
      `"${new Date(p.createdAt).toLocaleDateString('es-EC')}"`,
    ]);

    // Encabezado de metadatos institucionales
    const metaHeader = [
      `# RED PAPERS - PORTAL DE PRODUCCIÓN CIENTÍFICA`,
      `# ${meta.school} - ${meta.institution}`,
      `# Fecha de Generación: ${meta.generatedAt}`,
      `# Total Registros Exportados: ${meta.totalRecords}`,
      `# Filtros Aplicados: Tipo=${meta.filters.productType}; Línea=${meta.filters.researchLine}; Periodo=${meta.filters.periodYear}`,
      `# Aviso: Datos del modo demostración institucional ECMC Yachay Tech`,
      '',
    ].join('\r\n');

    const csvContent = '\uFEFF' + metaHeader + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Genera y descarga un libro de trabajo auténtico de Excel (.xlsx)
   */
  exportToExcel(products: ScientificProduct[], meta: ExportMetadata, fileName = 'produccion_cientifica_ecmc.xlsx'): boolean {
    if (!products || products.length === 0) {
      return false;
    }

    const data = products.map((p) => ({
      'ID Sistema': p.id,
      'Tipo de Producto': p.type === 'publicacion' ? 'Publicación Científica' : 'Proyecto de Investigación',
      'Título': p.title,
      'Autores / Investigadores': p.authors.join('; '),
      'Año': p.year,
      'Semestre': p.semester,
      'Línea de Investigación': p.researchLine,
      'Estado': p.status,
      'Identificador Digital / Código': p.doi || p.projectCode || 'N/A',
      'Medio de Difusión / Fondo': p.venue || p.fundingVenue || 'N/A',
      'Citas Indexadas': p.citations || 0,
      'Fecha Registro': new Date(p.createdAt).toLocaleDateString('es-EC'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajuste de anchos de columna automáticos
    worksheet['!cols'] = [
      { wch: 12 }, // ID
      { wch: 22 }, // Tipo
      { wch: 55 }, // Título
      { wch: 40 }, // Autores
      { wch: 8 },  // Año
      { wch: 12 }, // Semestre
      { wch: 45 }, // Línea
      { wch: 14 }, // Estado
      { wch: 30 }, // Identificador
      { wch: 35 }, // Medio
      { wch: 14 }, // Citas
      { wch: 15 }, // Fecha
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Producción Científica ECMC');

    // Hoja secundaria con metadatos de la consulta
    const metaData = [
      { Parámetro: 'Portal', Valor: 'RED PAPERS' },
      { Parámetro: 'Escuela', Valor: meta.school },
      { Parámetro: 'Institución', Valor: meta.institution },
      { Parámetro: 'Fecha Generación', Valor: meta.generatedAt },
      { Parámetro: 'Registros Exportados', Valor: meta.totalRecords },
      { Parámetro: 'Filtro Tipo', Valor: meta.filters.productType },
      { Parámetro: 'Filtro Línea', Valor: meta.filters.researchLine },
      { Parámetro: 'Filtro Periodo', Valor: meta.filters.periodYear },
    ];
    const metaWorksheet = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Metadatos de Consulta');

    XLSX.writeFile(workbook, fileName);
    return true;
  },

  /**
   * Genera vista imprimible o PDF del reporte filtrado
   */
  exportToPrintablePdf(products: ScientificProduct[], meta: ExportMetadata): boolean {
    if (!products || products.length === 0) {
      return false;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return false;
    }

    const tableRowsHtml = products
      .map(
        (p) => `
      <tr style="border-bottom: 1px solid #E5E7EB; font-size: 11px;">
        <td style="padding: 8px 6px; font-weight: bold; color: #111827;">${p.id}</td>
        <td style="padding: 8px 6px;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${
            p.type === 'publicacion' ? '#EFF6FF; color: #1D4ED8' : '#F0FDF4; color: #15803D'
          };">
            ${p.type === 'publicacion' ? 'Publicación' : 'Proyecto'}
          </span>
        </td>
        <td style="padding: 8px 6px; max-width: 320px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 2px;">${p.title}</div>
          <div style="color: #6B7280; font-size: 10px;">${p.authors.join(', ')}</div>
          <div style="color: #9CA3AF; font-size: 9px; margin-top: 2px;">${p.venue || p.fundingVenue || ''}</div>
        </td>
        <td style="padding: 8px 6px; color: #374151; font-size: 10px;">${p.researchLine}</td>
        <td style="padding: 8px 6px; text-align: center; color: #374151;">${p.semester}</td>
        <td style="padding: 8px 6px; font-family: monospace; font-size: 10px; color: #4B5563;">
          ${p.doi ? `DOI: ${p.doi}` : p.projectCode ? `Cód: ${p.projectCode}` : '—'}
        </td>
        <td style="padding: 8px 6px; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; ${
            p.status === 'verificado'
              ? 'background: #ECFDF5; color: #047857;'
              : p.status === 'cargado'
              ? 'background: #FFFBEB; color: #B45309;'
              : 'background: #FEF2F2; color: #B91C1C;'
          }">
            ${p.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace;">${p.citations || 0}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Producción Científica - RED PAPERS ECMC</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1F2937; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #EF4035; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-title { font-size: 20px; font-weight: 900; color: #EF4035; margin: 0; line-height: 1; }
          .brand-subtitle { font-size: 11px; font-weight: 600; color: #4B5563; text-transform: uppercase; margin-top: 4px; }
          .meta-box { font-size: 10px; color: #6B7280; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #F9FAFB; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #4B5563; border-bottom: 2px solid #E5E7EB; }
          .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 9px; color: #9CA3AF; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div>
              <div class="brand-title">RED PAPERS</div>
              <div class="brand-subtitle">Escuela de Ciencias Matemáticas y Computacionales • Yachay Tech</div>
            </div>
          </div>
          <div class="meta-box">
            <div><strong>Reporte Oficial de Producción Científica</strong></div>
            <div>Fecha: ${meta.generatedAt}</div>
            <div>Total Registros: ${meta.totalRecords}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 70px;">ID</th>
              <th style="width: 85px;">Tipo</th>
              <th>Título y Autores</th>
              <th style="width: 170px;">Línea de Investigación</th>
              <th style="width: 65px; text-align: center;">Periodo</th>
              <th style="width: 130px;">Identificador</th>
              <th style="width: 85px; text-align: center;">Estado</th>
              <th style="width: 50px; text-align: right;">Citas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Universidad de Investigación de Tecnología Experimental Yachay Tech • San Miguel de Urcuquí, Imbabura, Ecuador</div>
          <div>Reporte generado desde RED PAPERS ECMC • Modo Demostración</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);

    return true;
  },
};
