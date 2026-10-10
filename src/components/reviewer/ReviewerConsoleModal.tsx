import React, { useState } from 'react';
import { ScientificProduct, ProductStatus } from '../../types';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';

interface ReviewerConsoleModalProps {
  products: ScientificProduct[];
  onUpdateStatus: (
    productId: string,
    newStatus: ProductStatus,
    reason?: string
  ) => { success: boolean; error?: string };
}

type ReviewerFilter = 'pendientes' | 'verificados' | 'todos';

export const ReviewerConsoleModal: React.FC<ReviewerConsoleModalProps> = ({
  products,
  onUpdateStatus,
}) => {
  const [filterMode, setFilterMode] = useState<ReviewerFilter>('pendientes');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.find((p) => p.status === 'cargado')?.id || products[0]?.id || ''
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);


  // Filtrar lista izquierda según pestaña
  const filteredProducts = products.filter((p) => {
    if (filterMode === 'pendientes') return p.status === 'cargado';
    if (filterMode === 'verificados') return p.status === 'verificado';
    return true;
  });

  const selectedProduct =
    filteredProducts.find((p) => p.id === selectedProductId) || filteredProducts[0];

  const handleVerify = () => {
    if (!selectedProduct) return;
    const res = onUpdateStatus(selectedProduct.id, 'verificado');
    if (res.success) {
      setActionNotice(
        `Producto "${selectedProduct.title}" verificado y certificado. Se ha notificado al autor.`
      );
      setShowRejectForm(false);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleReject = () => {
    if (!selectedProduct) return;
    if (!rejectionReason.trim()) {
      setActionNotice('Debes escribir un motivo de rechazo justificado.');
      return;
    }

    const res = onUpdateStatus(selectedProduct.id, 'rechazado', rejectionReason);
    if (res.success) {
      setActionNotice(
        `Producto "${selectedProduct.title}" rechazado. El autor recibió una notificación con el motivo.`
      );
      setShowRejectForm(false);
      setRejectionReason('');
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <section className="reviewer-page" aria-labelledby="reviewer-title">
      <div>
        <div className="reviewer-heading">
          <p className="eyebrow">REVISIÓN ACADÉMICA · ECMC</p>
          <h1 id="reviewer-title">Comité revisor</h1>
          <p>Revise los trabajos y comunique su dictamen al docente.</p>
        </div>

        {actionNotice && (
          <div className="bg-neutral-900 text-white px-5 py-2 text-xs flex items-center justify-between shrink-0">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. Cuerpo de la Consola: Dos Columnas */}
        <div className="reviewer-workspace">
          {/* Columna Izquierda: Bandeja de Entrada */}
          <div className="reviewer-inbox">
            {/* Pestañas de la Bandeja */}
            <div className="p-3 border-b border-neutral-200 flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setFilterMode('pendientes')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center ${
                  filterMode === 'pendientes'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Pendientes (
                {products.filter((p) => p.status === 'cargado').length})
              </button>
              <button
                onClick={() => setFilterMode('verificados')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center ${
                  filterMode === 'verificados'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Verificados
              </button>
              <button
                onClick={() => setFilterMode('todos')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center ${
                  filterMode === 'todos'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Todos ({products.length})
              </button>
            </div>

            {/* Lista de productos */}
            <div className="reviewer-list divide-y divide-neutral-200">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No hay productos en esta bandeja.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedProductId(p.id);setShowRejectForm(false);setRejectionReason('');}}}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className={`p-3.5 cursor-pointer transition-colors text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-red-50 border-l-4 border-red-500 shadow-xs'
                          : 'hover:bg-neutral-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                        <span className="uppercase text-neutral-400">
                          {p.type === 'publicacion' ? 'PUBLICACIÓN' : 'PROYECTO'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            p.status === 'verificado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'cargado'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <h4
                        className={`font-bold line-clamp-2 ${
                          isSelected ? 'text-neutral-900' : 'text-neutral-700'
                        }`}
                      >
                        {p.title}
                      </h4>

                      <div className="text-[11px] text-neutral-500 truncate">
                        {p.authors[0]} · {p.year}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle y Acciones del Dictamen (Captura 12) */}
          <div className="reviewer-detail">
            {selectedProduct ? (
              <div className="space-y-5">
                {/* Metadatos superiores */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-700 uppercase">
                      {selectedProduct.type === 'publicacion'
                        ? 'PUBLICACIÓN CIENTÍFICA'
                        : 'PROYECTO DE INVESTIGACIÓN'}
                    </span>
                    <span>·</span>
                    <span>{selectedProduct.year}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">
                    ID: {selectedProduct.id}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-neutral-900 leading-snug">
                  {selectedProduct.title}
                </h3>

                {/* Docente / Medio */}
                <div className="text-xs text-neutral-600 space-y-1">
                  <p>
                    <strong className="text-neutral-700">Docente / Investigadores:</strong>{' '}
                    {selectedProduct.authors.join(', ')}
                  </p>
                  {(selectedProduct.venue || selectedProduct.fundingVenue) && (
                    <p>
                      <strong className="text-neutral-700">Medio / Fondo:</strong>{' '}
                      <span className="italic">
                        {selectedProduct.venue || selectedProduct.fundingVenue}
                      </span>
                    </p>
                  )}
                </div>

                {/* Resumen del documento */}
                <div>
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Resumen del Documento
                  </h4>
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed">
                    {selectedProduct.abstract}
                  </div>
                </div>

                {/* Identificador y Línea de Investigación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Identificador
                    </span>
                    <span className="font-mono font-bold text-neutral-800">
                      {selectedProduct.doi
                        ? `DOI: ${selectedProduct.doi}`
                        : selectedProduct.projectCode
                        ? `CÓDIGO: ${selectedProduct.projectCode}`
                        : 'Sin identificador verificado'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Línea de Investigación
                    </span>
                    <span className="font-medium text-neutral-800">
                      {selectedProduct.researchLine}
                    </span>
                  </div>
                </div>

                {/* Sección de Dictamen */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Emitir Dictamen del Comité Revisor
                  </h4>

                  {/* Formulario de Rechazo */}
                  {showRejectForm ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-red-900">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Motivo de Rechazo Institucional (Obligatorio)</span>
                      </div>
                      <textarea aria-label="Motivo de rechazo"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explica detalladamente por qué se rechaza o qué documento/corrección hace falta..."
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-red-300 text-xs focus:ring-1 focus:ring-red-500 bg-white resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(false)}
                          className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 bg-white font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                        >
                          Confirmar Rechazo con Notificación
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Botón Verificar */}
                      <button
                        onClick={handleVerify}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Verificar y Certificar Producto</span>
                      </button>

                      {/* Botón Rechazar */}
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar con Motivo</span>
                      </button>

                      {selectedProduct.status !== 'cargado' && (
                        <button
                          onClick={() => onUpdateStatus(selectedProduct.id, 'cargado')}
                          className="text-xs text-neutral-500 hover:text-neutral-800 underline ml-auto"
                        >
                          Regresar a "cargado" (auditoría)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400 text-xs">
                Selecciona un producto de la bandeja para auditar.
              </div>
            )}

            {/* Pie institucional */}
            <div className="mt-8 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
              <span className="text-[11px]">
                La verificación actualiza los indicadores institucionales y el historial de
                escalafón docente.
              </span>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
