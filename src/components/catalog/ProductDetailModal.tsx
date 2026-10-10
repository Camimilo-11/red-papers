import React from 'react';
import { ScientificProduct } from '../../types';
import { normalizeDoi } from '../../services/doiService';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Users,
  FileText,
  Quote,
  Shield,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: ScientificProduct | null;
  onClose: () => void;
  showStatus?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, showStatus = false }) => {
  if (!product) return null;

  const isPublicacion = product.type === 'publicacion';
  const isVerificado = product.status === 'verificado';
  const isCargado = product.status === 'cargado';
  const isRechazado = product.status === 'rechazado';

  const cleanDoi = normalizeDoi(product.doi);
  const doiUrl = cleanDoi ? `https://doi.org/${cleanDoi}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className={`font-bold tracking-wider uppercase text-[11px] ${
                  isPublicacion ? 'text-blue-700' : 'text-emerald-700'
                }`}
              >
                {isPublicacion ? 'PUBLICACIÓN CIENTÍFICA' : 'PROYECTO DE INVESTIGACIÓN'}
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-600 font-medium">
                {product.year} ({product.semester})
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-600 font-medium">{product.researchLine}</span>
            </div>

            {/* Estado */}
            {showStatus && <div>
              {isVerificado && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verificado / Certificado</span>
                </span>
              )}
              {isCargado && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cargado / En Proceso de Verificación</span>
                </span>
              )}
              {isRechazado && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rechazado</span>
                </span>
              )}
            </div>}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Título */}
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
            {product.title}
          </h2>

          {/* Medio o volumen */}
          {(product.venue || product.fundingVenue || product.volumeIssue) && (
            <p className="text-xs text-neutral-600">
              <span className="font-semibold text-neutral-700">Publicado en / Fondo:</span>{' '}
              <span className="italic">{product.venue || product.fundingVenue}</span>
              {product.volumeIssue && ` • ${product.volumeIssue}`}
            </p>
          )}

          {/* Motivo de rechazo si aplica */}
          {showStatus && product.status === 'rechazado' && product.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-red-700">
                <Shield className="w-4 h-4" />
                <span>Decisión del revisor</span>
              </div>
              <p>{product.rejectionReason}</p>
            </div>
          )}

          {/* Autores */}
          <div>
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Autores e Investigadores Participantes</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {product.authors.map((author, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-medium"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div>
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Resumen Académico (Abstract)</span>
            </h4>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-700 leading-relaxed">
              {product.abstract}
            </div>
          </div>

          {/* Fila de Métricas e Identificadores (Captura 09) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
            {/* Identificador Digital */}
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Identificador Digital
              </span>
              <div className="font-mono font-semibold text-neutral-900">
                {product.doi && `DOI: ${product.doi}`}
                {product.projectCode && `CÓDIGO: ${product.projectCode}`}
                {!product.doi && !product.projectCode && 'Sin identificador registrado'}
              </div>

              {doiUrl && (
                <a
                  href={doiUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EF4035] hover:underline pt-0.5"
                >
                  <span>Abrir enlace DOI oficial</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Impacto de Citaciones */}
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Impacto de Citaciones
              </span>
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-amber-500" />
                <span className="text-base font-black text-neutral-900 tabular-nums">
                  {product.citations} {product.citations === 1 ? 'cita indexada' : 'citas indexadas'}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 block">
                Registro bibliométrico (Demostración OpenAlex / Crossref)
              </span>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div className="font-mono text-[11px]">
            <span>ID Sistema: </span>
            <span className="font-bold text-neutral-800">{product.id}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-semibold transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
