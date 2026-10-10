import React, { useState, useMemo } from 'react';
import { ScientificProduct, TeacherUser, FilterState, ProductType, OfficialResearchLine, ProductStatus } from '../../types';
import { OFFICIAL_RESEARCH_LINES, ACADEMIC_SEMESTERS } from '../../constants/researchLines';
import { productService } from '../../services/productService';
import { exportService, ExportMetadata } from '../../services/exportService';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { ProjectTrackingModal } from './ProjectTrackingModal';
import {
  Search,
  Download,
  Plus,
  Filter,
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

interface CatalogViewProps {
  onlyMine?: boolean;
  allowRegister?: boolean;
  allProducts: ScientificProduct[];
  teachers: TeacherUser[];
  currentUserId: string | null;
  initialTeacherFilter?: string;
  onOpenRegister: () => void;
  onProjectUpdated?: (product: ScientificProduct) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onlyMine = false,
  allowRegister = true,
  allProducts,
  teachers,
  currentUserId,
  initialTeacherFilter,
  onOpenRegister,
  onProjectUpdated,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ScientificProduct | null>(null);
  const [trackingProject, setTrackingProject] = useState<ScientificProduct | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'recent' | 'citations' | 'title'>('recent');

  // Estado de filtros
  const [searchDraft,setSearchDraft]=useState('');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    productType: 'todos',
    teacherId: initialTeacherFilter || 'todos',
    periodYear: 'todos',
    researchLine: 'todas',
    status: 'todos',
  });

  // Productos visibles según sesión
  const visibleProducts = useMemo(() => {
    const visible = productService.getVisibleProducts(currentUserId);
    return onlyMine ? visible.filter(p=>p.ownerId===currentUserId) : visible;
  }, [allProducts, currentUserId, onlyMine]);

  // Aplicar filtros combinados
  const filteredProducts = useMemo(() => {
    let result = productService.filterProducts(visibleProducts, filters);

    // Ordenamiento
    if (sortOption === 'recent') {
      result = [...result].sort((a, b) => b.year - a.year || (b.semester||'').localeCompare(a.semester||''));
    } else if (sortOption === 'citations') {
      result = [...result].sort((a, b) => (b.citations || 0) - (a.citations || 0));
    } else if (sortOption === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [visibleProducts, filters, sortOption]);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.productType !== 'todos' ||
    filters.teacherId !== 'todos' ||
    filters.periodYear !== 'todos' ||
    filters.researchLine !== 'todas';

  const resetFilters = () => {
    setSearchDraft('');
    setFilters({
      searchQuery: '',
      productType: 'todos',
      teacherId: 'todos',
      periodYear: 'todos',
      researchLine: 'todas',
      status: 'todos',
    });
  };

  // Manejador de exportaciones (HU11)
  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setShowExportMenu(false);

    if (filteredProducts.length === 0) {
      setExportNotice('No hay productos que coincidan con los filtros actuales para exportar.');
      setTimeout(() => setExportNotice(null), 3500);
      return;
    }

    const meta: ExportMetadata = {
      filters,
      totalRecords: filteredProducts.length,
      generatedAt: new Date().toLocaleString('es-EC'),
      institution: 'Universidad Yachay Tech',
      school: 'Escuela de Ciencias Matemáticas y Computacionales (ECMC)',
    };

    let success = false;
    if (format === 'csv') {
      success = exportService.exportToCsv(filteredProducts, meta);
    } else if (format === 'xlsx') {
      success = exportService.exportToExcel(filteredProducts, meta);
    } else if (format === 'pdf') {
      success = exportService.exportToPrintablePdf(filteredProducts, meta);
    }

    if (success) {
      setExportNotice(`Exportación en formato ${format.toUpperCase()} generada exitosamente (${filteredProducts.length} registros).`);
    } else {
      setExportNotice('Hubo un error al generar la exportación.');
    }
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Encabezado del Catálogo (Captura 08) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {onlyMine ? 'Mis registros' : 'Publicaciones y proyectos'}
          </h2>
          <p className="text-xs text-neutral-500">
            {onlyMine ? 'Consulte sus trabajos y el estado de revisión.' : 'Encuentre la investigación de nuestra comunidad.'}
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2">
          {/* Botón Descargar resultados con menú */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Descargar resultados</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 z-30 p-1.5 text-xs">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 flex items-center gap-2 font-medium text-neutral-700"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Descargar como CSV</span>
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 flex items-center gap-2 font-medium text-neutral-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Descargar como Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 flex items-center gap-2 font-medium text-neutral-700"
                >
                  <Printer className="w-4 h-4 text-[#EF4035]" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Acceso al registro solo en Mis registros */}
          {onlyMine && allowRegister && <button
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EF4035] hover:bg-[#D02B20] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar</span>
          </button>}
        </div>
      </div>

      {/* Aviso de exportación si aplica */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-white/70 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Barra de Búsqueda y Pestañas Rápidas de Tipo */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchDraft} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();setFilters(current=>({...current,searchQuery:searchDraft.trim()}));}}}
              onChange={(e) => setSearchDraft(e.target.value)}
              aria-label="Buscar publicaciones y proyectos" placeholder="Escriba un título, autor o revista"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#EF4035] bg-neutral-50/50 focus:bg-white transition-colors"
            />
          </div>

          {/* Segmented control: Todos, Publicaciones, Proyectos */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0 text-xs font-semibold">
            <button
              onClick={() => setFilters({ ...filters, productType: 'todos' })}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filters.productType === 'todos'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todos ({visibleProducts.length})
            </button>
            <button
              onClick={() => setFilters({ ...filters, productType: 'publicacion' })}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filters.productType === 'publicacion'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Publicaciones
            </button>
            <button
              onClick={() => setFilters({ ...filters, productType: 'proyecto' })}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filters.productType === 'proyecto'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Proyectos
            </button>
          </div>
        </div>

        <details className="catalog-filters"><summary><Filter size={19}/> Más filtros</summary>
        {/* 3. Fila de filtros para docente, periodo y línea de investigación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 text-xs">
          {/* Filtro Docente */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Docente / Investigador
            </label>
            <select
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-800 focus:ring-1 focus:ring-[#EF4035]"
            >
              <option value="todos">Todos los docentes</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Periodo */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Periodo / Año
            </label>
            <select
              value={filters.periodYear}
              onChange={(e) => setFilters({ ...filters, periodYear: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-800 focus:ring-1 focus:ring-[#EF4035]"
            >
              <option value="todos">Todos los años</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <optgroup label="Por semestre específico">
                {ACADEMIC_SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Filtro Línea de Investigación (Las 6 oficiales) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Línea de Investigación
            </label>
            <select
              value={filters.researchLine}
              onChange={(e) => setFilters({ ...filters, researchLine: e.target.value as any })}
              className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-800 focus:ring-1 focus:ring-[#EF4035]"
            >
              <option value="todas">Todas las áreas</option>
              {OFFICIAL_RESEARCH_LINES.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>

        </div>

        </details>
        {/* Chips de filtros activos y botón limpiar */}
        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase">
                Filtros activos:
              </span>
              {filters.searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                  Búsqueda: "{filters.searchQuery}"
                  <button onClick={() => {setSearchDraft('');setFilters({ ...filters, searchQuery: '' });}}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.productType !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                  Tipo: {filters.productType}
                  <button onClick={() => setFilters({ ...filters, productType: 'todos' })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.teacherId !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                  Docente: {teachers.find((t) => t.id === filters.teacherId)?.name}
                  <button onClick={() => setFilters({ ...filters, teacherId: 'todos' })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.researchLine !== 'todas' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                  Línea: {filters.researchLine}
                  <button onClick={() => setFilters({ ...filters, researchLine: 'todas' })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.periodYear !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                  Periodo: {filters.periodYear}
                  <button onClick={() => setFilters({ ...filters, periodYear: 'todos' })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-[11px] font-semibold text-[#EF4035] hover:underline"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* 4. Contador de Resultados y Ordenamiento (Captura 08) */}
      <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
        <div>
          Mostrando <strong className="text-neutral-900 tabular-nums">{filteredProducts.length}</strong>{' '}
          productos científicos
        </div>

        <div className="flex items-center gap-2">
          <span className="text-neutral-500">Ordenar por:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="py-1 px-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-800 focus:ring-1 focus:ring-[#EF4035]"
          >
            <option value="recent">Más recientes (Año desc)</option>
            <option value="citations">Más citados</option>
            <option value="title">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 5. Catálogo en Rejilla de 2 Columnas (Captura 08) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-neutral-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900">
            No se encontraron productos con los criterios seleccionados
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Ninguna publicación o proyecto coincide simultáneamente con todos los filtros activos.
            Prueba ajustando los términos de búsqueda o limpiando filtros.
          </p>
          <div className="pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-xs hover:bg-black transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="product-list">
          {filteredProducts.map((product) => (
            <article className={`catalog-product-item ${onlyMine && product.type === 'proyecto' ? 'has-project-tracking' : ''}`} key={product.id}>
              <ProductCard
                product={product}
                showStatus={onlyMine}
                onClick={() => setSelectedProduct(product)}
              />
              {onlyMine && product.type === 'proyecto' && <button type="button" className="project-tracking-open" onClick={() => setTrackingProject(product)}><ClipboardList size={17} aria-hidden="true"/><span>Seguimiento del proyecto</span><span className="project-tracking-count">{product.projectProgressReports?.length || 0} avances</span></button>}
            </article>
          ))}
        </div>
      )}

      {/* Modal de Detalle */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          showStatus={onlyMine}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {trackingProject && <ProjectTrackingModal product={trackingProject} onClose={() => setTrackingProject(null)} onUpdated={updated => { setTrackingProject(updated); onProjectUpdated?.(updated); }}/ >}
    </div>
  );
};
