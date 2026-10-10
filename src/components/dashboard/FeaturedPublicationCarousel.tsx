import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OFFICIAL_RESEARCH_LINES } from '../../constants/researchLines';
import { normalizeDoi } from '../../services/doiService';
import { OfficialResearchLine, ScientificProduct } from '../../types';
import { FeaturedPublicationBackdrop, ResearchTheme } from './FeaturedPublicationBackdrop';

const numberFormat = new Intl.NumberFormat('es-EC');

const themeByLine: Record<OfficialResearchLine, ResearchTheme> = {
  'Ecuaciones diferenciales, análisis matemático, modelamiento y optimización': 'mathematics',
  'Ciencia de datos': 'data',
  'Computación científica': 'computing',
  'Inteligencia artificial': 'artificial-intelligence',
  'Tecnologías de la información': 'technology',
  'Ciencia, Tecnología y Sociedad': 'society',
};

function getMostCitedByResearchLine(products: ScientificProduct[]) {
  const topByLine = new Map<OfficialResearchLine, ScientificProduct>();

  products.forEach((product) => {
    if (product.type !== 'publicacion' || product.status !== 'verificado') return;

    const current = topByLine.get(product.researchLine);
    if (!current || product.citations > current.citations) {
      topByLine.set(product.researchLine, product);
    }
  });

  return OFFICIAL_RESEARCH_LINES
    .map((line) => topByLine.get(line))
    .filter((product): product is ScientificProduct => Boolean(product))
    .sort((a, b) => b.citations - a.citations || b.year - a.year);
}

export function FeaturedPublicationCarousel({ products }: { products: ScientificProduct[] }) {
  const publications = useMemo(() => getMostCitedByResearchLine(products), [products]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (publications.length < 2 || paused || hovered || focused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % publications.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [activeIndex, focused, hovered, paused, publications.length]);

  useEffect(() => {
    setActiveIndex((index) => publications.length ? index % publications.length : 0);
  }, [publications.length]);

  if (!publications.length) {
    return (
      <section className="featured-publications" aria-label="Publicaciones destacadas">
        <div className="featured-paper-empty">
          Aún no hay publicaciones verificadas para destacar.
        </div>
      </section>
    );
  }

  const publication = publications[activeIndex];
  const theme = themeByLine[publication.researchLine];
  const cleanDoi = normalizeDoi(publication.doi);
  const goTo = (offset: number) => {
    setActiveIndex((index) => (index + offset + publications.length) % publications.length);
  };

  return (
    <section className="featured-publications" aria-label="Publicaciones más citadas por línea de investigación">
      <div
        className="featured-paper-card"
        data-theme={theme}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <FeaturedPublicationBackdrop key={`backdrop-${publication.id}`} theme={theme} />
        <div className="featured-paper-copy" key={publication.id}>
          <p className="eyebrow">PUBLICACIÓN DESTACADA · {activeIndex + 1} / {publications.length}</p>
          <p className="featured-paper-line">{publication.researchLine}</p>
          <h3>{publication.title}</h3>
          <p className="featured-paper-authors">{publication.authors.join(' · ')}</p>
          <p className="featured-paper-meta">
            {publication.year}{publication.venue ? ` · ${publication.venue}` : ''}
          </p>
          {cleanDoi && (
            <a
              className="featured-paper-link"
              href={`https://doi.org/${cleanDoi}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir publicación <ExternalLink size={15} aria-hidden="true" />
            </a>
          )}
        </div>

        <aside className="featured-paper-citations" aria-label={`${publication.citations} citas registradas en los datos de demostración`}>
          <span>IMPACTO REGISTRADO</span>
          <strong>{numberFormat.format(publication.citations)}</strong>
          <span>citas de demostración</span>
          <div className="featured-paper-rank">La más citada de esta línea</div>
        </aside>

        <div className="featured-paper-controls" aria-label="Controles del carrusel">
          <button type="button" onClick={() => goTo(-1)} aria-label="Mostrar publicación anterior">
            <ChevronLeft size={19} />
          </button>
          <div className="featured-paper-dots" role="group" aria-label="Elegir publicación destacada">
            {publications.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === activeIndex ? 'selected' : ''}
                aria-label={`Mostrar: ${item.title}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <span className="featured-paper-counter">{activeIndex + 1} de {publications.length}</span>
          <button type="button" onClick={() => goTo(1)} aria-label="Mostrar siguiente publicación">
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </section>
  );
}
