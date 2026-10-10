import React, { useEffect, useRef, useState } from 'react';
import { cubicBezier, motion, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { SCHOOLS, SchoolConfig } from '../../constants/schools';
import { ensureSchoolLogosDecoded, SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { ResearchStage } from './ResearchStage';
import { useMascotHandoff } from './mascotHandoff';
import type { MascotHandoff } from './mascotHandoff';
import './MascotHandoff.css';

const INTRO_TIMING_MS = {
  intro: 1500,
  words: 1150,
  logoFormation: 350,
  pageTransition: 800,
  logoTravel: 600,
  curtainRetraction: 600,
  contentStart: 1850,
  contentStagger: 70,
  emblemsStart: 0,
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

const FOOTER_LINK_GROUPS = [
  {
    title: 'Estudiantes',
    label: 'Enlaces para estudiantes',
    links: [
      { label: 'Moodle Pregrado', href: 'https://eva.yachaytech.edu.ec/login/index.php' },
      { label: 'Biblioteca en línea', href: 'https://biblioteca.yachaytech.edu.ec/' },
    ],
  },
  {
    title: 'Yachay Tech',
    label: 'Enlaces de Yachay Tech',
    links: [
      { label: 'Folleto en español', href: 'https://yachaytech.edu.ec/wp-content/uploads/2026/01/FOLLETO-YT-2026_compressed.pdf' },
      { label: 'English brochure', href: 'https://yachaytech.edu.ec/wp-content/uploads/2025/03/Yachay-Tech-Brochure-2025.pdf' },
      { label: 'Acerca de', href: 'https://yachaytech.edu.ec/acerca-de/' },
      { label: 'Investigación', href: 'https://yachaytech.edu.ec/investigacion/' },
      { label: 'Noticias', href: 'https://yachaytech.edu.ec/noticias/' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: 'Facebook', shortLabel: 'f', href: 'https://www.facebook.com/universidadyachaytech/' },
  { label: 'X', shortLabel: 'X', href: 'https://x.com/UniYachayTech' },
  { label: 'Instagram', shortLabel: 'ig', href: 'https://www.instagram.com/uniyachaytech/' },
  { label: 'YouTube', shortLabel: '▶', href: 'https://www.youtube.com/user/YachayTech/videos' },
  { label: 'LinkedIn', shortLabel: 'in', href: 'https://www.linkedin.com/company/uni-yachay-tech/' },
  { label: 'TikTok', shortLabel: '♪', href: 'https://www.tiktok.com/@uniyachaytech' },
] as const;

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

const emblemPositions = [
  { left: '67%', top: '14%', size: 224, rotation: '-17deg', parallax: 0.035, floatDelay: '0s' },
  { left: '86%', top: '16%', size: 184, rotation: '12deg', parallax: 0.055, floatDelay: '-1.1s' },
  { left: '73%', top: '40%', size: 220, rotation: '-9deg', parallax: 0.03, floatDelay: '-2.2s' },
  { left: '91%', top: '43%', size: 204, rotation: '15deg', parallax: 0.05, floatDelay: '-3.3s' },
  { left: '66%', top: '70%', size: 204, rotation: '11deg', parallax: 0.045, floatDelay: '-4.4s' },
  { left: '84%', top: '72%', size: 190, rotation: '-13deg', parallax: 0.06, floatDelay: '-5.5s' },
  { left: '94%', top: '89%', size: 176, rotation: '8deg', parallax: 0.04, floatDelay: '-6.1s' },
] as const;

function LandingEmblem({ school, size }: { school: SchoolConfig; size: number }) {
  return (
    <img
      className="institutional-landing-emblem-image"
      src={SCHOOL_LOGOS[school.code]}
      alt=""
      draggable={false}
      style={{ width: size, height: size }}
    />
  );
}

const handoffEase = cubicBezier(.22, 1, .36, 1);

function FloatingLandingEmblem({ school, index, visible, scrollY, reducedMotion, handoff }: {
  school: SchoolConfig;
  index: number;
  visible: boolean;
  scrollY: MotionValue<number>;
  reducedMotion: boolean;
  handoff: MascotHandoff;
}) {
  const position = emblemPositions[index];
  const anchorRef = useRef<HTMLSpanElement>(null);
  const sourceX = useMotionValue(0);
  const sourceY = useMotionValue(0);
  const sourceSize = useMotionValue<number>(position.size);
  const travel = useTransform(handoff.progress, [.02, .84 + index * .012], [0, 1], { ease: handoffEase });
  const angle = parseFloat(position.rotation) * Math.PI / 180;
  const travelAt = (progress: number) => handoffEase(Math.min(1, Math.max(0, (progress - .02) / (.82 + index * .012))));
  // Subscribe after arrival is resolved, avoiding a stale travel value on reverse scroll.
  const positionInputs = [handoff.progress, handoff.targetX, handoff.targetY, sourceX, sourceY];
  // The enclosing reveal keeps its original rotation; compensate its coordinates
  // so all seven centers still arrive at the exact same point in the stage.
  const x = useTransform<number, number>(positionInputs, ([progress, targetX, targetY, originX, originY]) => {
    if (reducedMotion) return 0;
    const dx = targetX - originX;
    const dy = scrollY.get() + targetY - originY;
    return (dx * Math.cos(angle) + dy * Math.sin(angle)) * travelAt(progress);
  });
  const y = useTransform<number, number>(positionInputs, ([progress, targetX, targetY, originX, originY]) => {
    if (reducedMotion) return 0;
    const amount = travelAt(progress);
    const dx = targetX - originX;
    const dy = scrollY.get() + targetY - originY;
    return (-dx * Math.sin(angle) + dy * Math.cos(angle)) * amount;
  });
  const scale = useTransform(() => reducedMotion ? 1 : 1 + (40 / sourceSize.get() - 1) * travel.get());
  const rotate = useTransform(() => reducedMotion ? 0 : -parseFloat(position.rotation) * travel.get());
  const opacity = useTransform(handoff.progress, [0, .82, .96, 1], [1, 1, 0, 0]);

  useEffect(() => {
    const anchor = anchorRef.current;
    const overlay = anchor?.parentElement;
    const root = overlay?.offsetParent as HTMLElement | null;
    if (!anchor || !overlay || !root) return;
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      sourceX.set(rootRect.left + overlay.offsetLeft + anchor.offsetLeft);
      sourceY.set(rootRect.top + window.scrollY + overlay.offsetTop + anchor.offsetTop);
      sourceSize.set(anchor.offsetWidth || position.size);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(overlay);
    observer.observe(anchor);
    measure();
    return () => observer.disconnect();
  }, [position.size, sourceSize, sourceX, sourceY]);

  return (
    <span
      ref={anchorRef}
      className={`institutional-landing-hero-emblem ${visible ? 'is-visible' : ''}`}
      data-school={school.code}
      style={{
        left: position.left,
        top: position.top,
        '--emblem-rotation': position.rotation,
        '--emblem-size': `${position.size}px`,
        '--float-delay': position.floatDelay,
        '--entry-x': index % 2 === 0 ? '42px' : '-42px',
        '--entry-rotation': index % 2 === 0 ? '13deg' : '-13deg',
      } as React.CSSProperties}
    >
      <motion.span className="institutional-landing-hero-emblem-parallax" style={{ x, y, scale, rotate, opacity: reducedMotion ? 1 : opacity }}>
        <span className={`institutional-landing-hero-emblem-float ${visible ? 'is-floating' : ''}`}>
          <LandingEmblem school={school} size={position.size} />
        </span>
      </motion.span>
    </span>
  );
}

// Start the one scroll observer after the first paint, so its initial geometry
// read does not force layout inside the intro's first animation frame.
function LandingScrollDriver({ value }: { value: MotionValue<number> }) {
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => value.set(latest));
  useEffect(() => { value.set(scrollY.get()); }, [scrollY, value]);
  return null;
}

export function InstitutionalLanding({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  const [phase, setPhase] = useState<IntroPhase>(getInitialPhase);
  const [contentVisible, setContentVisible] = useState(phase === 'done' || phase === 'reduced');
  const [visibleEmblems, setVisibleEmblems] = useState<boolean[]>(() =>
    SCHOOLS.map(() => phase === 'done' || phase === 'reduced'),
  );
  const [logosReady, setLogosReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const scrollY = useMotionValue(window.scrollY);
  const handoff = useMascotHandoff();
  const [scrollReady, setScrollReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const emblemsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const introTimersRef = useRef<number[]>([]);
  const introActiveRef = useRef(phase === 'intro');

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setScrollReady(true));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, []);

  useEffect(() => {
    let mounted = true;
    void ensureSchoolLogosDecoded().then((ready) => { if (mounted) setLogosReady(ready); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const overlay = emblemsRef.current;
    if (!hero || !overlay) return;
    const measure = () => {
      // Static layout geometry only: scrolling updates motion values, not styles.
      overlay.style.top = `${hero.offsetTop}px`;
      overlay.style.left = `${hero.offsetLeft}px`;
      overlay.style.width = `${hero.offsetWidth}px`;
      overlay.style.height = `${hero.offsetHeight}px`;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    const hero = heroRef.current;
    const overlay = emblemsRef.current;
    if (!footer || !hero) return;
    if (!('IntersectionObserver' in window)) {
      footer.dataset.revealed = 'true';
      hero.dataset.inView = 'true';
      if (overlay) overlay.dataset.inView = 'true';
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) {
          hero.dataset.inView = String(entry.isIntersecting);
          if (overlay) overlay.dataset.inView = String(entry.isIntersecting);
        }
        if (entry.target === footer && entry.isIntersecting) {
          footer.dataset.revealed = 'true';
          observer.unobserve(footer);
        }
      });
    }, { threshold: 0.04 });
    observer.observe(footer);
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

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
      {scrollReady && <LandingScrollDriver value={scrollY} />}
      <header className="institutional-landing-header" aria-label="Universidad Yachay Tech">
        <span className="institutional-landing-header-space" aria-hidden="true" />
        <img
          className="institutional-landing-brand-logo"
          src="./assets/yachay-logo-clean.svg"
          width={731}
          height={252}
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

      <section ref={heroRef} className="institutional-landing-hero" aria-labelledby="landing-title" data-assets-ready={logosReady} data-in-view="false">
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

      <div ref={emblemsRef} className="institutional-landing-hero-emblems mascot-handoff-logos" aria-hidden="true" data-in-view="false">
        {SCHOOLS.map((school, index) => (
          <FloatingLandingEmblem key={school.code} school={school} index={index} visible={logosReady && visibleEmblems[index]} scrollY={scrollY} reducedMotion={!!reducedMotion} handoff={handoff} />
        ))}
      </div>

      <ResearchStage onSelect={onSelect} scrollY={scrollY} handoff={handoff} />

      <footer ref={footerRef} className="institutional-landing-footer" data-revealed="false" aria-label="Enlaces institucionales">
        <div className="institutional-landing-footer-ribbon" aria-hidden="true">
          {SCHOOLS.map((school) => <span key={school.code} style={{ backgroundColor: school.accent }} />)}
        </div>
        <div className="institutional-landing-footer-content">
          <div className="institutional-landing-footer-brand">
            <img src="./assets/yachay-logo-clean.svg" width={731} height={252} alt="Universidad Yachay Tech" />
            <p>Producción científica y comunidad investigadora en un solo lugar.</p>
          </div>
          {FOOTER_LINK_GROUPS.map((group) => (
            <nav className="institutional-landing-footer-group" aria-label={group.label} key={group.title}>
              <h2>{group.title}</h2>
              <ul>{group.links.map((link) => (
                <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></li>
              ))}</ul>
            </nav>
          ))}
          <nav className="institutional-landing-footer-group institutional-landing-footer-social" aria-label="Redes sociales de Yachay Tech">
            <h2>Síguenos en redes</h2>
            <ul>{SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                  <span aria-hidden="true">{link.shortLabel}</span>
                  <span>{link.label}</span>
                </a>
              </li>
            ))}</ul>
          </nav>
        </div>
        <div className="institutional-landing-footer-bottom">
          <span>SIMAPC · Sistema de Manejo de Producción Científica</span>
          <span>Universidad Yachay Tech</span>
        </div>
      </footer>
    </main>
  );
}

export { INTRO_TIMING_MS };
