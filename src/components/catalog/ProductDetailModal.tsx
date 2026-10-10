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
  const venue = product.venue || product.fundingVenue;

  return (
    <div className="product-detail-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="product-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <header className="product-detail-header">
          <div className="product-detail-meta">
            <span className={`product-detail-kind ${isPublicacion ? 'is-publication' : 'is-project'}`}>
              {isPublicacion ? 'Publicación científica' : 'Proyecto de investigación'}
            </span>
            <span className="product-detail-meta-divider" aria-hidden="true">·</span>
            <span>{product.year} ({product.semester})</span>
            <span className="product-detail-meta-divider" aria-hidden="true">·</span>
            <span className="product-detail-research-line">{product.researchLine}</span>
          </div>

          <button
            onClick={onClose}
            className="product-detail-close-icon"
            aria-label="Cerrar detalle del producto"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="product-detail-content">
          {showStatus && (
            <div className={`product-detail-status ${isVerificado ? 'is-verified' : isCargado ? 'is-pending' : 'is-rejected'}`}>
              {isVerificado && <><CheckCircle2 size={17} /><span>Verificado / Certificado</span></>}
              {isCargado && <><Clock size={17} /><span>Cargado / En Proceso de Verificación</span></>}
              {isRechazado && <><XCircle size={17} /><span>Rechazado</span></>}
            </div>
          )}

          <div className="product-detail-intro">
            <p className="product-detail-eyebrow">Ficha del producto</p>
            <h2 id="product-detail-title">{product.title}</h2>
            {venue && (
              <p className="product-detail-venue">
                <span>{isPublicacion ? 'Publicado en' : 'Entidad o fondo'}</span>
                <strong>{venue}</strong>
                {product.volumeIssue && <span className="product-detail-volume">{product.volumeIssue}</span>}
              </p>
            )}
          </div>

          {showStatus && isRechazado && product.rejectionReason && (
            <div className="product-detail-rejection">
              <div><Shield size={17} /><strong>Decisión del revisor</strong></div>
              <p>{product.rejectionReason}</p>
            </div>
          )}

          <section className="product-detail-section" aria-labelledby="product-detail-authors">
            <h3 id="product-detail-authors"><Users size={18} aria-hidden="true" />Autores e investigadores participantes</h3>
            <div className="product-detail-author-list">
              {product.authors.map((author, index) => (
                <span key={`${author}-${index}`} className="product-detail-author">{author}</span>
              ))}
            </div>
          </section>

          <section className="product-detail-section" aria-labelledby="product-detail-abstract">
            <h3 id="product-detail-abstract"><FileText size={18} aria-hidden="true" />Resumen académico (abstract)</h3>
            <div className="product-detail-abstract">{product.abstract}</div>
          </section>

          <div className="product-detail-information">
            <section className="product-detail-card" aria-labelledby="product-detail-identifier">
              <h3 id="product-detail-identifier">Identificador digital</h3>
              <p className="product-detail-identifier-value">
                {product.doi && <>DOI: {product.doi}</>}
                {product.projectCode && <>Código: {product.projectCode}</>}
                {!product.doi && !product.projectCode && 'Sin identificador registrado'}
              </p>
              {doiUrl && (
                <a
                  href={doiUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="product-detail-doi-link"
                >
                  Abrir enlace DOI oficial <ExternalLink size={15} aria-hidden="true" />
                </a>
              )}
            </section>

            <section className="product-detail-card product-detail-citations" aria-labelledby="product-detail-citations">
              <h3 id="product-detail-citations">Impacto de citas</h3>
              <div className="product-detail-citation-count">
                <Quote size={20} aria-hidden="true" />
                <strong>{product.citations}</strong>
                <span>{product.citations === 1 ? 'cita indexada' : 'citas indexadas'}</span>
              </div>
              <p>Registro bibliométrico (Demostración OpenAlex / Crossref)</p>
            </section>
          </div>
        </div>

        <footer className="product-detail-footer">
          <p><span>ID Sistema</span><strong>{product.id}</strong></p>
          <button onClick={onClose} className="product-detail-close-button">Cerrar ventana</button>
        </footer>
      </section>
    </div>
  );
};
