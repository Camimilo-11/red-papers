import React, { useEffect, useRef, useState } from 'react';
import { SCHOOLS, SchoolConfig } from '../../constants/schools';
import { EcmcLogo } from '../../assets/EcmcLogo';

const INTRO_TIMING_MS = {
  intro: 1500,
  words: 1150,
  logoFormation: 350,
  pageTransition: 800,
  logoTravel: 600,
  curtainRetraction: 600,
  contentStart: 1850,
  contentStagger: 70,
  emblemsStart: 1950,
  emblemStagger: 50,
  total: 1500 + 800,
  reducedFade: 200,
} as const;

const landingTimingStyles = {
  '--yt-blue': '#24618e',
  '--landing-intro-words-ms': `${INTRO_TIMING_MS.words}ms`,
  '--landing-logo-form-ms': `${INTRO_TIMING_MS.logoFormation}ms`,
  '--landing-transition-ms': `${INTRO_TIMING_MS.pageTransition}ms`,
  '--landing-logo-travel-ms': `${INTRO_TIMING_MS.logoTravel}ms`,
  '--landing-curtain-ms': `${INTRO_TIMING_MS.curtainRetraction}ms`,
  '--landing-content-start-ms': `${INTRO_TIMING_MS.contentStart}ms`,
  '--landing-content-stagger-ms': `${INTRO_TIMING_MS.contentStagger}ms`,
  '--landing-emblems-start-ms': `${INTRO_TIMING_MS.emblemsStart}ms`,
  '--landing-emblem-stagger-ms': `${INTRO_TIMING_MS.emblemStagger}ms`,
  '--landing-total-ms': `${INTRO_TIMING_MS.total}ms`,
};

const INTRO_STORAGE_KEY = 'simapc-institutional-intro-started';
let introStartedInMemory = false;

type IntroPhase = 'intro' | 'logo' | 'transition' | 'reduced' | 'done';

function markIntroStarted() {
  introStartedInMemory = true;
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'started');
  } catch {
    // The module-level flag keeps this tab from replaying the intro when storage is blocked.
  }
}

function getInitialPhase(): IntroPhase {
  try {
    if (window.sessionStorage.getItem(INTRO_STORAGE_KEY) === 'started') return 'done';
  } catch {
    if (introStartedInMemory) return 'done';
  }

  if (introStartedInMemory) return 'done';
  let reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    // Continue with the normal intro when matchMedia is unavailable.
  }

  markIntroStarted();
  return reducedMotion ? 'reduced' : 'intro';
}

const schoolKeywords: Record<SchoolConfig['code'], string> = {
  ECIAA: 'Agropecuarias',
  ECBI: 'Biológicas',
  ECFN: 'Físicas',
  ECTEA: 'Tierra',
  ECMC: 'Matemáticas',
  ECQI: 'Químicas',
  YTLC: 'Language',
};

const emblemPositions = [
  { left: '6%', top: '18%', size: 94, rotation: '-17deg', parallax: 0.035 },
  { left: '25%', top: '4%', size: 74, rotation: '12deg', parallax: 0.055 },
  { left: '52%', top: '3%', size: 88, rotation: '-9deg', parallax: 0.03 },
  { left: '83%', top: '16%', size: 102, rotation: '15deg', parallax: 0.05 },
  { left: '13%', top: '69%', size: 82, rotation: '11deg', parallax: 0.045 },
  { left: '67%', top: '69%', size: 76, rotation: '-13deg', parallax: 0.06 },
  { left: '91%', top: '57%', size: 70, rotation: '8deg', parallax: 0.04 },
] as const;

function LandingEmblem({ school, size }: { school: SchoolConfig; size: number }) {
  if (school.code === 'ECMC') {
    return <EcmcLogo className="institutional-landing-emblem-ecmc" size={size} variant="color" />;
  }

  return (
    <img
      className="institutional-landing-emblem-image"
      src={`./assets/school-emblems/${school.code}.svg`}
      alt=""
      draggable={false}
      style={{ width: size, height: size }}
    />
  );
}

function HighlightedSchoolName({ school }: { school: SchoolConfig }) {
  const keyword = schoolKeywords[school.code];
  const start = school.name.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase());
  if (start < 0) return <>{school.name}</>;

  return (
    <>
      {school.name.slice(0, start)}
      <span className="institutional-landing-highlight">{school.name.slice(start, start + keyword.length)}</span>
      {school.name.slice(start + keyword.length)}
    </>
  );
}

export function InstitutionalLanding({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  const [phase, setPhase] = useState<IntroPhase>(getInitialPhase);
  const [contentVisible, setContentVisible] = useState(phase === 'done' || phase === 'reduced');
  const [visibleEmblems, setVisibleEmblems] = useState<boolean[]>(() =>
    SCHOOLS.map(() => phase === 'done' || phase === 'reduced'),
  );
  const rootRef = useRef<HTMLElement>(null);
  const introTimersRef = useRef<number[]>([]);
  const introActiveRef = useRef(phase === 'intro');

  const completeIntro = () => {
    introActiveRef.current = false;
    introTimersRef.current.forEach(window.clearTimeout);
    introTimersRef.current = [];
    setPhase('done');
    setContentVisible(true);
    setVisibleEmblems(SCHOOLS.map(() => true));
  };

  useEffect(() => {
    if (phase === 'reduced') {
      const finishTimer = window.setTimeout(() => setPhase('done'), INTRO_TIMING_MS.reducedFade);
      return () => window.clearTimeout(finishTimer);
    }
    if (phase !== 'intro') return;

    introActiveRef.current = true;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase('logo'), INTRO_TIMING_MS.words));
    timers.push(window.setTimeout(() => setPhase('transition'), INTRO_TIMING_MS.intro));
    timers.push(window.setTimeout(() => setContentVisible(true), INTRO_TIMING_MS.contentStart));
    timers.push(window.setTimeout(() => {
      introActiveRef.current = false;
      setPhase('done');
    }, INTRO_TIMING_MS.total));

    SCHOOLS.forEach((_, index) => {
      timers.push(window.setTimeout(() => {
        setVisibleEmblems((current) => current.map((visible, itemIndex) => itemIndex === index || visible));
      }, INTRO_TIMING_MS.emblemsStart + index * INTRO_TIMING_MS.emblemStagger));
    });

    introTimersRef.current = timers;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && introActiveRef.current) completeIntro();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      timers.forEach(window.clearTimeout);
      introTimersRef.current = [];
      window.removeEventListener('keydown', onKeyDown);
    };
  // The sequence starts once and its timers must survive the intermediate phases.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateParallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollY = Math.min(window.scrollY, window.innerHeight * 1.2);
        rootRef.current?.querySelectorAll<HTMLElement>('[data-parallax-emblem]').forEach((element) => {
          const speed = Number(element.dataset.parallaxSpeed || '0.04');
          element.style.setProperty('--parallax-y', `${scrollY * speed}px`);
        });
      });
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateParallax);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const introVisible = phase === 'intro' || phase === 'logo' || phase === 'transition';
  const pageClasses = [
    'institutional-landing',
    `is-${phase}`,
    contentVisible ? 'has-revealed-content' : '',
  ].filter(Boolean).join(' ');
  const revealStyle = (step: number) => ({
    '--reveal-delay': `${step * INTRO_TIMING_MS.contentStagger}ms`,
  } as React.CSSProperties);

  return (
    <main
      ref={rootRef}
      className={pageClasses}
      style={landingTimingStyles as React.CSSProperties}
      onClick={(event) => {
        if (!introVisible || (event.target instanceof Element && event.target.closest('button, a'))) return;
        completeIntro();
      }}
    >
      <header className="institutional-landing-header" aria-label="Universidad Yachay Tech">
        <span className="institutional-landing-header-space" aria-hidden="true" />
        <img
          className="institutional-landing-brand-logo"
          src="./assets/yachay-logo-clean.svg"
          alt="Universidad Yachay Tech"
          draggable={false}
        />
      </header>

      {introVisible && (
        <div className="institutional-landing-curtain" aria-hidden="true">
          <div className="institutional-landing-intro-words">
            <span>UNIVERSIDAD</span>
            <span>YACHAY TECH</span>
            <small>SIMAPC</small>
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <button
          className="institutional-landing-skip"
          type="button"
          onClick={completeIntro}
        >
          Omitir intro <span aria-hidden="true">· Esc</span>
        </button>
      )}

      <section className="institutional-landing-hero" aria-labelledby="landing-title">
        <div className="institutional-landing-hero-emblems" aria-hidden="true">
          {SCHOOLS.map((school, index) => {
            const position = emblemPositions[index];
            return (
              <span
                className={`institutional-landing-hero-emblem ${visibleEmblems[index] ? 'is-visible' : ''}`}
                key={school.code}
                data-parallax-emblem
                data-parallax-speed={position.parallax}
                style={{
                  left: position.left,
                  top: position.top,
                  '--emblem-rotation': position.rotation,
                  '--emblem-size': `${position.size}px`,
                  '--entry-x': index % 2 === 0 ? '42px' : '-42px',
                  '--entry-rotation': index % 2 === 0 ? '13deg' : '-13deg',
                } as React.CSSProperties}
              >
                <span className={`institutional-landing-hero-emblem-float ${phase === 'done' ? 'is-floating' : ''}`}>
                  <LandingEmblem school={school} size={position.size} />
                </span>
              </span>
            );
          })}
        </div>

        <div className="institutional-landing-hero-copy">
          <p className="institutional-landing-eyebrow landing-reveal" style={revealStyle(0)}>UNIVERSIDAD YACHAY TECH · SIMAPC</p>
          <h1 id="landing-title" className="institutional-landing-title">
            <span className="institutional-landing-title-mask landing-reveal" style={revealStyle(1)}><span>¡BIENVENIDOS!</span></span>
            <span className="institutional-landing-title-mask landing-reveal" style={revealStyle(2)}><span className="institutional-landing-blue-word">SIMAPC</span></span>
          </h1>
          <p className="institutional-landing-subtitle landing-reveal" style={revealStyle(3)}>
            La producción científica y la comunidad investigadora de Yachay Tech, en un solo lugar.
          </p>
          <a className="institutional-landing-hero-link landing-reveal" style={revealStyle(4)} href="#escuelas">
            Explora nuestras escuelas <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <div id="escuelas" className="institutional-landing-section-heading">
        <p>INVESTIGACIÓN QUE CONECTA</p>
        <h2>Conoce nuestras <span>escuelas</span></h2>
      </div>

      <div className="institutional-landing-scenes">
        {SCHOOLS.map((school, index) => (
          <section
            className={`institutional-landing-school-scene ${index % 2 ? 'is-reversed' : ''}`}
            data-school={school.code}
            key={school.code}
            style={{
              '--school-accent': school.accent,
              '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
              '--school-wash': `color-mix(in srgb, ${school.accent} 10%, #ffffff)`,
            } as React.CSSProperties}
            aria-labelledby={`school-title-${school.code}`}
          >
            <div className="institutional-landing-school-copy">
              <p className="institutional-landing-school-code">{school.code} · LÍNEAS DE INVESTIGACIÓN</p>
              <h2 id={`school-title-${school.code}`}><HighlightedSchoolName school={school} /></h2>
              <p className="institutional-landing-school-description">Explora la producción y las líneas que impulsan el trabajo de {school.shortName}.</p>
              <ul className="institutional-landing-lines">
                {school.researchLines.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <div className="institutional-landing-progress" role="progressbar" aria-label={`Escuela ${index + 1} de ${SCHOOLS.length}`} aria-valuemin={1} aria-valuemax={SCHOOLS.length} aria-valuenow={index + 1}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="institutional-landing-progress-track"><span style={{ width: `${((index + 1) / SCHOOLS.length) * 100}%` }} /></span>
                <span>{String(SCHOOLS.length).padStart(2, '0')}</span>
              </div>
              <button className="institutional-landing-school-button" type="button" onClick={() => onSelect(school)}>
                Explorar esta escuela <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="institutional-landing-school-art" data-parallax-emblem data-parallax-speed="0.025" aria-hidden="true">
              <span className="institutional-landing-school-wash" />
              <span className="institutional-landing-school-emblem-float">
                <LandingEmblem school={school} size={320} />
              </span>
            </div>
          </section>
        ))}
      </div>

      <footer className="institutional-landing-footer">
        <span>SIMAPC · Sistema de Manejo de Producción Científica</span>
        <span>Universidad Yachay Tech</span>
      </footer>
    </main>
  );
}

export { INTRO_TIMING_MS };
