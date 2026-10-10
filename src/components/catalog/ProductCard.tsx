import React from 'react';
import { ScientificProduct, PRODUCT_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../../types';
import { BookOpen, FolderOpen, ArrowRight, CheckCircle2, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { normalizeDoi } from '../../services/doiService';
import { productDateLabel } from '../../services/productPresentation';

export const ProductCard: React.FC<{
  product: ScientificProduct;
  onClick: () => void;
  showStatus?: boolean;
}> = ({ product, onClick, showStatus = false }) => {
  const Icon = product.type === 'publicacion' ? BookOpen : FolderOpen;
  const Status = product.status === 'verificado'
    ? CheckCircle2
    : product.status === 'rechazado' ? AlertTriangle : Clock;
  const doi = product.type === 'publicacion' ? normalizeDoi(product.doi) : '';

  return (
    <article className="product-row">
      <div className="product-type-icon"><Icon /></div>
      <div className="product-row-body">
        <div className="product-meta">
          <span>{product.type === 'publicacion' ? 'Publicación' : 'Proyecto'} · {productDateLabel(product)}{product.type==='proyecto'&&product.projectStatus?` · ${PROJECT_STATUS_LABELS[product.projectStatus]}`:''}</span>
          {showStatus && (
            <span className={`status-label status-${product.status}`}>
              <Status size={17} />
              {PRODUCT_STATUS_LABELS[product.status]}
            </span>
          )}
        </div>
        <h3><button onClick={onClick}>{product.title}</button></h3>
        <p>{product.authors.join(' · ')}</p>
        {doi && (
          <a
            className="product-doi-link"
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir DOI ${doi} en una pestaña nueva`}
          >
            <span>DOI: {doi}</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        <span className="product-line">{product.researchLine}</span>
      </div>
      <button className="product-open" onClick={onClick} aria-label={`Ver detalle: ${product.title}`}>
        Ver detalle<ArrowRight size={19} />
      </button>
    </article>
  );
};
