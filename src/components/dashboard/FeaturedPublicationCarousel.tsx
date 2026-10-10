import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Award, ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';
import { OFFICIAL_RESEARCH_LINES } from '../../constants/researchLines';
import { normalizeDoi } from '../../services/doiService';
import { OfficialResearchLine, ScientificProduct } from '../../types';
import { FeaturedPublicationBackdrop, ResearchTheme } from './FeaturedPublicationBackdrop';

const numberFormat = new Intl.NumberFormat('es-EC');
const ROTATION_MS = 5000;

/** Anima el número sin movimiento si la persona prefiere reducirlo. */
function useCountUp(value: number, resetKey: string | undefined) {
  const [shown, setShown] = useState(value);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    setShown(0);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 750);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, resetKey]);

  return shown;
}

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
  const [paused, setPaused] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pauseForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setPaused(true);
    };

    motionPreference.addEventListener('change', pauseForReducedMotion);
    return () => motionPreference.removeEventListener('change', pauseForReducedMotion);
  }, []);

  useEffect(() => {
    if (publications.length < 2 || paused || focused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % publications.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [activeIndex, focused, paused, publications.length]);

  useEffect(() => {
    setActiveIndex((index) => publications.length ? index % publications.length : 0);
  }, [publications.length]);

  const currentIndex = publications.length ? activeIndex % publications.length : 0;
  const publication = publications[currentIndex];
  const citationsShown = useCountUp(publication?.citations ?? 0, publication?.id);
  const canRotate = publications.length > 1;
  const running = canRotate && !paused && !focused;

  if (!publications.length) {
    return (
      <section className="featured-publications" aria-labelledby="featured-publications-title">
        <header className="featured-publications-heading">
          <div>
            <p className="featured-publications-kicker">PRODUCCIÓN CIENTÍFICA · ECMC</p>
            <h2 id="featured-publications-title">Publicaciones con mayor repercusión</h2>
            <p>Una publicación verificada destacada por cada línea de investigación.</p>
          </div>
        </header>
        <div className="featured-paper-empty">Aún no hay publicaciones verificadas para destacar.</div>
      </section>
    );
  }

  const theme = themeByLine[publication.researchLine];
  const cleanDoi = normalizeDoi(publication.doi);
  const goTo = (offset: number) => {
    setActiveIndex((index) => (index + offset + publications.length) % publications.length);
  };

  return (
    <section className="featured-publications" aria-labelledby="featured-publications-title">
      <header className="featured-publications-heading">
        <div>
          <p className="featured-publications-kicker">PRODUCCIÓN CIENTÍFICA · ECMC</p>
          <h2 id="featured-publications-title">Publicaciones con mayor repercusión</h2>
          <p>Una publicación verificada destacada por cada línea de investigación.</p>
        </div>
        <span className="featured-publications-selection"><Award size={16} aria-hidden="true" />Selección por citas registradas</span>
      </header>

      <div
        className="featured-paper-card"
        data-theme={theme}
        onFocusCapture={(event) => {
          if ((event.target as HTMLElement).matches(':focus-visible')) setFocused(true);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <FeaturedPublicationBackdrop key={`backdrop-${publication.id}`} theme={theme} />
        <div className="featured-paper-copy" key={publication.id}>
          <p className="eyebrow">PUBLICACIÓN DESTACADA · {currentIndex + 1} / {publications.length}</p>
          <p className="featured-paper-line">
            <span className="featured-paper-line-dot" aria-hidden="true" />
            {publication.researchLine}
          </p>
          <h3>{publication.title}</h3>
          <p className="featured-paper-authors">{publication.authors.join(' · ')}</p>
          <p className="featured-paper-meta">
            {publication.year}{publication.venue ? ` · ${publication.venue}` : ''}
          </p>
          {cleanDoi && (
            <div className="featured-paper-actions">
              <a
                className="featured-paper-link"
                href={`https://doi.org/${cleanDoi}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir publicación <ExternalLink size={15} aria-hidden="true" />
              </a>
              <span className="featured-paper-doi">DOI {cleanDoi}</span>
            </div>
          )}
        </div>

        <aside className="featured-paper-citations" aria-label={`${publication.citations} citas registradas en los datos de demostración`}>
          <span>IMPACTO REGISTRADO</span>
          <strong>{numberFormat.format(citationsShown)}</strong>
          <span>citas de demostración</span>
          <div className="featured-paper-rank"><Award size={16} aria-hidden="true" />La más citada de esta línea</div>
        </aside>

        <div className="featured-paper-controls" role="group" aria-label="Controles de publicaciones destacadas">
          <button type="button" onClick={() => goTo(-1)} aria-label="Mostrar publicación anterior">
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <div className="featured-paper-dots" role="group" aria-label="Elegir publicación destacada">
            {publications.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === currentIndex ? 'selected' : ''}
                aria-label={`Mostrar: ${item.title}`}
                aria-pressed={index === currentIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <span className="featured-paper-counter">{currentIndex + 1} de {publications.length}</span>
          <button type="button" onClick={() => goTo(1)} aria-label="Mostrar siguiente publicación">
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          {canRotate && (
            <button
              type="button"
              className="featured-paper-pause"
              onClick={() => {
                setPaused((value) => !value);
                setFocused(false);
              }}
              aria-pressed={paused}
              aria-label={paused ? 'Reanudar la rotación automática' : 'Pausar la rotación automática'}
              title={paused ? 'Reanudar' : 'Pausar'}
            >
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            </button>
          )}
        </div>

        {running && (
          <span
            className="featured-paper-progress"
            key={`progress-${publication.id}`}
            style={{ animationDuration: `${ROTATION_MS}ms` }}
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}
