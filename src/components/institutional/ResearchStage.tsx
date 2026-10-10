import React, { useEffect, useRef, useState } from 'react';
import { animate, cubicBezier, motion, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { SCHOOLS, type OfficialResearchLine, type SchoolCode, type SchoolConfig } from '../../constants/schools';
import { RESEARCH_STAGE_SLIDES } from '../../constants/researchStageSlides';
import { ensureSchoolLogosDecoded, SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { RESEARCH_LINE_MOTIFS, useBackdropMotionVisibility } from '../dashboard/ResearchLineBackdrop';
import './ResearchStage.css';

export const STAGE_RESEARCH_LINES = SCHOOLS.reduce((lines, school) => {
  lines[school.code] = RESEARCH_STAGE_SLIDES[school.code].map((slide) => slide.line);
  return lines;
}, {} as Record<SchoolCode, readonly OfficialResearchLine[]>);
const stageSlidesFor = (school: SchoolConfig) => RESEARCH_STAGE_SLIDES[school.code];
export const STAGE_PLANES = SCHOOLS.flatMap((school) =>
  stageSlidesFor(school).map((slide, lineIndex) => ({ school, ...slide, lineIndex })),
);
export const STAGE_TIMING = { sceneVh: 130, overlap: 0.2, step: 0.8, drawMs: 600 } as const;
const TOTAL_UNITS = STAGE_PLANES.length * STAGE_TIMING.step;
const SCHOOL_LINE_OFFSETS = SCHOOLS.map((school, schoolIndex) =>
  SCHOOLS.slice(0, schoolIndex).reduce((total, previous) => total + stageSlidesFor(previous).length, 0),
);
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export function getStageState(value: number) {
  const progress = clamp(value, 0, TOTAL_UNITS);
  const current = clamp(Math.floor(progress / STAGE_TIMING.step), 0, STAGE_PLANES.length - 1);
  const activeIndex = current;
  return { progress, activeIndex };
}
const displaySchoolCode = (school: SchoolConfig) => school.code === 'ECIAA' ? 'ECAA' : school.code;
const schoolStyle = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
} as React.CSSProperties);

function Emblem({ school }: { school: SchoolConfig }) {
  return <img src={SCHOOL_LOGOS[school.code]} alt="" draggable={false} />;
}


const ease = cubicBezier(.22, 1, .36, 1);
const FADE = .12;
const motifCache = new Map<number, SVGSVGElement>();

// Build detached SVG templates from the existing, stateless motif elements.
// Preparation runs in small tasks during the intro, never in a scroll callback.
const svgAttributes: Record<string, string> = { className: 'class', strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', fillOpacity: 'fill-opacity', strokeOpacity: 'stroke-opacity', strokeDasharray: 'stroke-dasharray', strokeDashoffset: 'stroke-dashoffset', vectorEffect: 'vector-effect' };
function appendGeometry(node: React.ReactNode, parent: SVGElement) {
  if (Array.isArray(node)) { node.forEach((child) => appendGeometry(child, parent)); return; }
  if (!React.isValidElement<Record<string, unknown>>(node)) return;
  const { children, ...attributes } = node.props;
  if (node.type === React.Fragment) { appendGeometry(children as React.ReactNode, parent); return; }
  if (typeof node.type === 'function') {
    appendGeometry((node.type as (props: Record<string, unknown>) => React.ReactNode)(node.props), parent);
    return;
  }
  if (typeof node.type !== 'string') return;
  const element = document.createElementNS('http://www.w3.org/2000/svg', node.type);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || key === 'ref') return;
    if (key === 'style') Object.assign(element.style, value);
    else element.setAttribute(svgAttributes[key] ?? key, String(value));
  });
  appendGeometry(children as React.ReactNode, element);
  parent.append(element);
}
let motifsReady: Promise<void> | undefined;
function prepareMotifs() {
  motifsReady ??= new Promise<void>((resolve) => {
    let index = 0;
    const prepareNext = () => {
      const Motif = RESEARCH_LINE_MOTIFS[STAGE_PLANES[index].line];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('research-stage-svg');
      svg.setAttribute('viewBox', '170 -30 510 430');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      appendGeometry(<Motif />, svg);
      motifCache.set(index++, svg);
      if (index < STAGE_PLANES.length) window.setTimeout(prepareNext, 0);
      else resolve();
    };
    window.setTimeout(prepareNext, 0);
  });
  return motifsReady;
}
function motifFor(index: number) {
  return motifCache.get(index)!.cloneNode(true) as SVGSVGElement;
}

function slideOpacity(value: number, index: number) {
  const local = value - index;
  const enter = index === 0 ? 1 : ease(clamp((local + FADE) / (FADE * 2)));
  const exit = index === STAGE_PLANES.length - 1 ? 1 : 1 - ease(clamp((local - 1 + FADE) / (FADE * 2)));
  return enter * exit;
}

function StageSlide({ index, timeline, live, registerHost, onSelectLine, onPreviewLine, onSelectSchool }: {
  index: number;
  timeline: MotionValue<number>;
  live: MotionValue<boolean>;
  registerHost: (index: number, node: HTMLDivElement | null) => void;
  onSelectLine: (school: SchoolConfig, lineIndex: number) => void;
  onPreviewLine: (index: number) => void;
  onSelectSchool: (school: SchoolConfig) => void;
}) {
  const plane = STAGE_PLANES[index];
  const { school } = plane;
  const opacity = useTransform(timeline, (value) => slideOpacity(value, index));
  const y = useTransform(timeline, (value) => (1 - ease(clamp((value - index + FADE) / (FADE * 2)))) * 12 - ease(clamp((value - index - 1 + FADE) / (FADE * 2))) * 12);
  const drift = useTransform(() => live.get() ? clamp(timeline.get() - index) : 0);
  const motifX = useTransform(drift, [0, 1], [0, 10]);
  const motifY = useTransform(drift, [0, 1], [0, -6]);
  const scale = useTransform(drift, [0, 1], [1, 1.05]);
  const rotate = useTransform(drift, [0, 1], [0, 4]);
  const emblemRotate = useTransform(drift, [0, 1], [-3, 3]);
  const words = plane.title.split(' ');

  return <motion.section className="research-stage-slide" data-school={school.code} data-slide-index={index} style={{ ...schoolStyle(school), opacity, y }} aria-hidden={index !== 0} inert={index !== 0}>
    <div className="research-stage-art" aria-hidden="true">
      <div className="research-stage-shot-art">
        <div className="research-stage-wash-parallax"><div className="research-stage-wash" /></div>
        <motion.div className="research-stage-motif-camera" style={{ x: motifX, y: motifY, scale, rotate }}>
          <div className="research-stage-motif-ambient" ref={(node) => registerHost(index, node)} />
        </motion.div>
      </div>
    </div>
    <motion.div className="research-stage-slide-emblem" style={{ rotate: emblemRotate }} aria-hidden="true"><Emblem school={school} /></motion.div>
    <div className="research-stage-copy-stack" aria-labelledby={`research-shot-title-${index}`}>
      <p className="research-stage-counter"><span>{displaySchoolCode(school)}</span><span>{String(plane.lineIndex + 1).padStart(2, '0')} / {String(stageSlidesFor(school).length).padStart(2, '0')}</span></p>
      <h2 id={`research-shot-title-${index}`} aria-label={plane.title}>
        {words.map((word, wordIndex) => <React.Fragment key={`${word}-${wordIndex}`}>{plane.accentWords.includes(wordIndex) ? <span className="is-accent">{word}</span> : word}{wordIndex < words.length - 1 ? ' ' : ''}</React.Fragment>)}
      </h2>
      <nav className="research-stage-line-selector" aria-label={`Líneas de investigación de ${school.name}`}>
        {stageSlidesFor(school).map((slide, lineIndex) => <button key={`${school.code}-${lineIndex}`} type="button" className={plane.lineIndex === lineIndex ? 'is-active' : ''} aria-label={`Mostrar ${slide.title}`} aria-current={plane.lineIndex === lineIndex ? 'step' : undefined}
          onClick={() => onSelectLine(school, lineIndex)}
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') onPreviewLine(SCHOOL_LINE_OFFSETS[SCHOOLS.indexOf(school)] + lineIndex); }}
          onPointerLeave={() => onPreviewLine(-1)}><span aria-hidden="true" /></button>)}
      </nav>
    </div>
    <div className="research-stage-bottom"><button type="button" onClick={() => onSelectSchool(school)}>Explorar esta escuela <span aria-hidden="true">→</span></button></div>
  </motion.section>;
}

function SchoolNavigationItem({ school, schoolIndex, timeline, jump }: {
  school: SchoolConfig; schoolIndex: number; timeline: MotionValue<number>;
  jump: (school: SchoolConfig, lineIndex?: number) => void;
}) {
  const fill = useTransform(timeline, (value) => clamp((value - SCHOOL_LINE_OFFSETS[schoolIndex]) / stageSlidesFor(school).length));
  return <li data-school={school.code} style={schoolStyle(school)}>
    <button className="research-stage-school-button" type="button" data-school-index={schoolIndex} aria-label={`Ir a ${school.name}`} aria-current={schoolIndex === 0 ? 'step' : undefined} onClick={() => jump(school)}>
      <span className="research-stage-school-emblem" aria-hidden="true"><Emblem school={school} /></span><small>{displaySchoolCode(school)}</small>
      <motion.span className="research-stage-school-fill" style={{ scaleX: fill }} aria-hidden="true" />
    </button>
  </li>;
}

function SelectionGrid({ onSelect, reduced = false }: { onSelect: (school: SchoolConfig) => void; reduced?: boolean }) {
  return (
    <section className={`research-stage-selection ${reduced ? 'is-static' : ''}`} id="seleccion-escuelas" aria-labelledby="research-selection-title">
      <p className="research-stage-eyebrow">TU PRÓXIMO PUNTO DE PARTIDA</p>
      <h2 id="research-selection-title">Explora nuestras <span>escuelas</span></h2>
      <div className="research-stage-school-grid">
        {SCHOOLS.map((school) => (
          <article id={`research-school-${school.code}`} className="research-stage-school-card" data-school={school.code} style={schoolStyle(school)} key={school.code}>
            {reduced && <svg className="research-stage-static-motif" viewBox="170 -30 510 430" aria-hidden="true" focusable="false">{React.createElement(RESEARCH_LINE_MOTIFS[stageSlidesFor(school)[0].line])}</svg>}
            <div className="research-stage-card-emblem" aria-hidden="true"><Emblem school={school} /></div>
            <p className="research-stage-eyebrow">{school.code}</p>
            <h3>{school.name}</h3>
            <button id={`research-select-${school.code}`} type="button" onClick={() => onSelect(school)}>Explorar esta escuela <span aria-hidden="true">→</span></button>
            <details open={reduced || undefined}>
              <summary>Líneas de investigación <span aria-hidden="true">+</span></summary>
              <ul>{stageSlidesFor(school).map((slide, lineIndex) => <li id={`research-line-${school.code}-${lineIndex}`} key={`${school.code}-${lineIndex}`} tabIndex={-1}>{slide.title}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}


function AnimatedStage({ onSelect, logosReady, scrollY }: { onSelect: (school: SchoolConfig) => void; logosReady: boolean; scrollY: MotionValue<number> }) {
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const previewHost = useRef<HTMLDivElement>(null);
  const hosts = useRef(new Map<number, HTMLDivElement>());
  const attached = useRef(new Set<number>());
  const currentIndex = useRef(-1);
  const activeSlide = useRef({ school: STAGE_PLANES[0].school, index: 0 });
  const start = useMotionValue(0);
  const unit = useMotionValue(1);
  const live = useMotionValue(false);
  const preview = useMotionValue(-1);
  const navigationOpacity = useMotionValue(1);
  const navigationY = useMotionValue(0);
  const navigationAnimation = useRef<ReturnType<typeof animate>[]>([]);
  const timeline = useTransform(() => {
    const schoolProgress = clamp((scrollY.get() - start.get()) / unit.get(), 0, SCHOOLS.length - .001);
    const schoolIndex = Math.floor(schoolProgress);
    return SCHOOL_LINE_OFFSETS[schoolIndex] + (schoolProgress - schoolIndex) * stageSlidesFor(SCHOOLS[schoolIndex]).length;
  });
  const previewOpacity = useTransform(preview, (index) => index < 0 ? 0 : .27);
  const hintOpacity = useTransform(timeline, [0, .06], [1, 0]);
  const hintY = useTransform(timeline, [0, .06], [0, 8]);
  useBackdropMotionVisibility(scene, { enabled: logosReady });

  const registerHost = (index: number, node: HTMLDivElement | null) => {
    if (node) hosts.current.set(index, node);
    else hosts.current.delete(index);
  };

  const sync = (value: number) => {
    if (!logosReady || motifCache.size !== STAGE_PLANES.length) return;
    const index = clamp(Math.floor(value), 0, STAGE_PLANES.length - 1);
    const hovered = preview.get();
    const candidates = hovered >= 0 && hovered !== index
      ? [index]
      : Array.from(new Set([clamp(Math.floor(value - FADE), 0, STAGE_PLANES.length - 1), clamp(Math.floor(value + FADE), 0, STAGE_PLANES.length - 1)]));
    // Remove first: even rapid jumps never leave a third motif mounted.
    attached.current.forEach((previous) => {
      if (!candidates.includes(previous)) {
        const host = hosts.current.get(previous);
        host?.replaceChildren();
        host?.parentElement?.style.removeProperty('will-change');
        attached.current.delete(previous);
      }
    });
    if (previewHost.current && (hovered < 0 || hovered === index)) {
      previewHost.current.replaceChildren();
      delete previewHost.current.dataset.index;
    }
    candidates.forEach((next) => {
      const host = hosts.current.get(next);
      if (host && !attached.current.has(next)) {
        host.append(motifFor(next));
        attached.current.add(next);
      }
      if (host?.parentElement) host.parentElement.style.willChange = live.get() ? 'transform' : 'auto';
    });
    if (hovered >= 0 && hovered !== index && previewHost.current?.dataset.index !== String(hovered)) {
      previewHost.current?.replaceChildren(motifFor(hovered));
      if (previewHost.current) previewHost.current.dataset.index = String(hovered);
    }
    if (hovered < 0 && previewHost.current) delete previewHost.current.dataset.index;

    if (currentIndex.current === index) return;
    currentIndex.current = index;
    activeSlide.current = { school: STAGE_PLANES[index].school, index };
    if (scene.current) {
      scene.current.dataset.school = activeSlide.current.school.code;
      scene.current.style.setProperty('--school-accent', activeSlide.current.school.accent);
      scene.current.style.setProperty('--school-ink', `color-mix(in srgb, ${activeSlide.current.school.accent} 42%, #111820)`);
    }
    const focusedSlide = document.activeElement?.closest('[data-slide-index]');
    const focusedLine = document.activeElement?.closest('.research-stage-line-selector');
    if (focusedSlide && Number((focusedSlide as HTMLElement).dataset.slideIndex) !== index) {
      const destination = scene.current?.querySelector<HTMLElement>(`[data-slide-index="${index}"]`);
      if (destination) {
        destination.inert = false;
        destination.querySelector<HTMLButtonElement>(focusedLine ? '.research-stage-line-selector .is-active' : '.research-stage-bottom button')?.focus({ preventScroll: true });
      }
    }
    scene.current?.querySelectorAll<HTMLElement>('[data-slide-index]').forEach((element) => {
      const active = Number(element.dataset.slideIndex) === index;
      element.inert = !active;
      element.setAttribute('aria-hidden', String(!active));
      element.classList.toggle('is-active', active);
    });
    rail.current?.querySelectorAll<HTMLButtonElement>('[data-school-index]').forEach((button) => {
      const active = SCHOOLS[Number(button.dataset.schoolIndex)].code === activeSlide.current.school.code;
      button.closest('li')?.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };
  useMotionValueEvent(timeline, 'change', sync);
  useMotionValueEvent(preview, 'change', () => sync(timeline.get()));
  useMotionValueEvent(live, 'change', () => sync(timeline.get()));

  useEffect(() => {
    const measure = () => {
      if (!track.current || !scene.current) return;
      const header = parseFloat(getComputedStyle(scene.current).top) || 0;
      start.set(track.current.getBoundingClientRect().top + window.scrollY - header);
      unit.set((track.current.clientHeight - scene.current.clientHeight) / SCHOOLS.length);
    };
    // The first ResizeObserver delivery measures after the browser has laid out the page.
    const resize = new ResizeObserver(measure);
    if (track.current) resize.observe(track.current);
    if (scene.current) resize.observe(scene.current);
    window.addEventListener('resize', measure);
    return () => { resize.disconnect(); window.removeEventListener('resize', measure); };
  }, [start, unit]);

  useEffect(() => {
    let mounted = true;
    // Fast Refresh can retain readiness while rebuilding this module's SVG cache.
    void prepareMotifs().then(() => { if (mounted) sync(timeline.get()); });
    const observer = new IntersectionObserver(([entry]) => live.set(entry.isIntersecting));
    if (scene.current) observer.observe(scene.current);
    return () => { mounted = false; observer.disconnect(); navigationAnimation.current.forEach((control) => control.stop()); };
  }, [logosReady]);

  const jump = (school: SchoolConfig, lineIndex = 0) => {
    const schoolIndex = SCHOOLS.indexOf(school);
    const index = SCHOOL_LINE_OFFSETS[schoolIndex] + lineIndex;
    preview.set(-1);
    // Land beyond the blend boundary so a direct jump settles the whole target slide.
    const target = index + FADE + .001;
    const schoolProgress = schoolIndex + (target - SCHOOL_LINE_OFFSETS[schoolIndex]) / stageSlidesFor(school).length;
    window.scrollTo({ top: start.get() + schoolProgress * unit.get(), behavior: 'instant' });
    scrollY.set(window.scrollY);
    sync(target);
    navigationAnimation.current.forEach((control) => control.stop());
    navigationOpacity.set(.68);
    navigationY.set(12);
    navigationAnimation.current = [animate(navigationOpacity, 1, { duration: .35, ease }), animate(navigationY, 0, { duration: .35, ease })];
  };
  const keyboardNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = event.target as HTMLElement;
    if (element.isContentEditable || element.closest('input, textarea, select')) return;
    let next = activeSlide.current.index;
    const schoolIndex = SCHOOLS.indexOf(activeSlide.current.school);
    if (event.key === 'ArrowRight') next++;
    else if (event.key === 'ArrowLeft') next--;
    else if (event.key === 'PageDown') next = SCHOOL_LINE_OFFSETS[Math.min(schoolIndex + 1, SCHOOLS.length - 1)];
    else if (event.key === 'PageUp') next = SCHOOL_LINE_OFFSETS[Math.max(schoolIndex - 1, 0)];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = STAGE_PLANES.length - 1;
    else return;
    event.preventDefault();
    const plane = STAGE_PLANES[clamp(next, 0, STAGE_PLANES.length - 1)];
    jump(plane.school, plane.lineIndex);
  };

  return <div ref={track} className="research-stage-track" id="escuelas" onKeyDown={keyboardNavigation}>
    <div ref={scene} className="research-stage" data-school={SCHOOLS[0].code} role="region" aria-label="Recorrido por las líneas de investigación" aria-busy={!logosReady}>
      {logosReady && <motion.div className="research-stage-slides" style={{ opacity: navigationOpacity, y: navigationY }}>
        {STAGE_PLANES.map((plane, index) => <StageSlide key={`${plane.school.code}-${index}`} index={index} timeline={timeline} live={live} registerHost={registerHost} onSelectLine={jump} onSelectSchool={onSelect} onPreviewLine={(next) => preview.set(next)} />)}
        <motion.div className="research-stage-preview research-stage-motif-camera" style={{ opacity: previewOpacity }} aria-hidden="true"><div ref={previewHost} className="research-stage-motif-ambient" /></motion.div>
      </motion.div>}
      {logosReady && <motion.span className="research-stage-scroll-hint" style={{ opacity: hintOpacity, x: '-50%', y: hintY }}>Desliza <span aria-hidden="true">↓</span></motion.span>}
    </div>
    {logosReady && <nav ref={rail} className="research-stage-navigation" aria-label="Escuelas de investigación"><ol>{SCHOOLS.map((school, index) => <SchoolNavigationItem key={school.code} school={school} schoolIndex={index} timeline={timeline} jump={jump} />)}</ol></nav>}
    <ol className="research-stage-accessible-lines" aria-label="Líneas de investigación en el orden del recorrido">{STAGE_PLANES.map(({ school, title }, index) => <li key={`${school.code}-${index}`}>{displaySchoolCode(school)}: {title}</li>)}</ol>
  </div>;
}

export function ResearchStage({ onSelect, scrollY }: { onSelect: (school: SchoolConfig) => void; scrollY: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const [logosReady, setLogosReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void Promise.all([ensureSchoolLogosDecoded(), reduced ? Promise.resolve() : prepareMotifs()]).then(([ready]) => { if (mounted) setLogosReady(ready); });
    return () => { mounted = false; };
  }, []);
  if (reduced) return <div id="escuelas" aria-busy={!logosReady} style={{ visibility: logosReady ? 'visible' : 'hidden' }}><SelectionGrid onSelect={onSelect} reduced /></div>;
  return <AnimatedStage onSelect={onSelect} logosReady={logosReady} scrollY={scrollY} />;
}
