import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react';
import { SCHOOLS, type OfficialResearchLine, type SchoolConfig } from '../../constants/schools';
import { SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { RESEARCH_LINE_MOTIFS } from '../dashboard/ResearchLineBackdrop';
import './ResearchStage.css';

// Phase 1: the four Agropecuarias shots and the first shot of Biológicas.
// ECIAA is the existing persisted school identifier (also used by its assets).
export const STAGE_PLANES = SCHOOLS.slice(0, 2).flatMap((school, schoolIndex) =>
  school.researchLines.slice(0, schoolIndex === 0 ? 4 : 1).map((line, lineIndex) => ({ school, line, lineIndex })),
);
export const STAGE_TIMING = { desktopVh: 55, mobileVh: 45, overlap: 0.2, step: 0.8 } as const;
const TOTAL_UNITS = (STAGE_PLANES.length - 1) * STAGE_TIMING.step + 1;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export function getStageState(value: number) {
  const progress = clamp(value, 0, TOTAL_UNITS);
  const pairStart = clamp(Math.floor((progress - STAGE_TIMING.overlap + 0.00001) / STAGE_TIMING.step), 0, STAGE_PLANES.length - 1);
  const activeIndex = clamp(pairStart + (progress - pairStart * STAGE_TIMING.step >= 0.9 - 1e-8 ? 1 : 0), 0, STAGE_PLANES.length - 1);
  return { progress, pairStart, activeIndex };
}
// The same entry curve is used for words, fills and the circular school reveal.
// CSS handles cubic-bezier(.22, 1, .36, 1); these are its sampled scroll values.
function entryEase(x: number) {
  const target = clamp(x);
  let low = 0, high = 1;
  for (let i = 0; i < 12; i++) {
    const t = (low + high) / 2;
    const bx = 3 * (1 - t) ** 2 * t * 0.22 + 3 * (1 - t) * t ** 2 * 0.36 + t ** 3;
    if (bx < target) low = t; else high = t;
  }
  const t = (low + high) / 2;
  return 1 - (1 - t) ** 3;
}
const descriptions: Partial<Record<OfficialResearchLine, string>> = {
  'Ciencias Agrícolas': 'Conocimiento que nace del suelo y acompaña el futuro de nuestros cultivos.',
  'Investigación del mercado de productos agroindustriales': 'Del campo al mercado: investigar el valor y el recorrido de nuestros productos.',
  'Ciencias Animales': 'Comprender la vida animal para cuidar su bienestar y mejorar la producción.',
  'I+D+i Agroindustrial': 'Transformar el conocimiento en procesos, productos y nuevas posibilidades.',
  'Ecología, evolución y conservación de ecosistemas terrestres': 'Entender las conexiones de la vida para conservar nuestros ecosistemas.',
};
type Plane = (typeof STAGE_PLANES)[number];
const schoolStyle = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
} as React.CSSProperties);

function Emblem({ school }: { school: SchoolConfig }) {
  return <img src={SCHOOL_LOGOS[school.code]} alt="" draggable={false} style={{ mixBlendMode: 'multiply' }} />;
}

/** Geometry stays in ResearchLineBackdrop. Only its tracing attributes change here. */
const TracedMotif = memo(function TracedMotif({ line }: { line: OfficialResearchLine }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const Motif = RESEARCH_LINE_MOTIFS[line];
  useLayoutEffect(() => {
    const shapes = svgRef.current?.querySelectorAll<SVGElement>('path, circle, ellipse, rect, polyline, polygon, line');
    shapes?.forEach((shape, index) => {
      // StrictMode runs layout effects twice: retain the source fill, not its animated value.
      if (shape.dataset.trace === 'true') return;
      const original = getComputedStyle(shape);
      const sourceFill = original.fill;
      const sourceFillOpacity = original.fillOpacity;
      shape.setAttribute('pathLength', '1');
      shape.dataset.trace = 'true';
      shape.style.setProperty('--trace-delay', String((index / Math.max(1, shapes.length - 1)) * 0.28));
      if (sourceFill !== 'none') {
        shape.dataset.filled = 'true';
        shape.style.setProperty('--original-fill-opacity', sourceFillOpacity);
      }
    });
  }, [line]);
  return (
    <svg ref={svgRef} className="research-stage-svg" viewBox="170 -30 510 430" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <Motif />
    </svg>
  );
});

function ShotArt({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const root = useRef<HTMLDivElement>(null);
  const plane = STAGE_PLANES[index];
  const schoolChange = index > 0 && STAGE_PLANES[index - 1].school.code !== plane.school.code;
  const update = (value: number) => {
    const node = root.current;
    if (!node) return;
    const p = clamp(value - index * STAGE_TIMING.step);
    const entered = value >= index * STAGE_TIMING.step;
    const exit = index === STAGE_PLANES.length - 1 ? 0 : clamp((p - 0.75) / 0.25);
    const camera = clamp((p - 0.35) / 0.4);
    node.dataset.planeProgress = p.toFixed(4);
    node.style.setProperty('--plane-opacity', String(entered ? 1 - exit : 0));
    node.style.setProperty('--plane-draw', String(clamp(p / 0.35)));
    node.style.setProperty('--motif-scale', String(1 + camera * 0.15 + exit * 0.15));
    node.style.setProperty('--motif-rotate', `${camera * 4 + exit * 2}deg`);
    node.style.setProperty('--motif-x', `${(p - 0.35) * 38 * 0.6}px`);
    node.style.setProperty('--motif-y', `${(p - 0.35) * -24 * 0.6}px`);
    node.style.setProperty('--wash-y', `${(p - 0.35) * -24 * 0.3}px`);
    node.style.setProperty('--wash-opacity', String(index === 0 ? 0.1 : 0.1 * clamp(p / STAGE_TIMING.overlap)));
    node.style.setProperty('--wash-radius', schoolChange ? `${entryEase(p / 0.22) * 150}%` : '150%');
  };
  useLayoutEffect(() => update(progress.get()), [index, progress]);
  useMotionValueEvent(progress, 'change', update);
  return (
    <div ref={root} className={`research-stage-shot-art ${schoolChange ? 'is-school-change' : ''}`} data-school={plane.school.code} data-plane-index={index} style={{ ...schoolStyle(plane.school), zIndex: STAGE_PLANES.length - index }} aria-hidden="true">
      <div className="research-stage-wash-parallax"><div className="research-stage-wash" /></div>
      <div className="research-stage-motif-camera"><div className="research-stage-motif-ambient"><TracedMotif line={plane.line} /></div></div>
    </div>
  );
}

/** One continuous school emblem; it changes only at the school boundary. */
function StageEmblems({ progress }: { progress: MotionValue<number> }) {
  const root = useRef<HTMLDivElement>(null);
  const boundary = 4 * STAGE_TIMING.step;
  const update = (value: number) => {
    root.current?.querySelectorAll<HTMLElement>('[data-stage-emblem]').forEach((emblem, index) => {
      const change = clamp((value - boundary) / STAGE_TIMING.overlap);
      const opacity = index === 0 ? 1 - change : change;
      const turn = index === 0 ? -15 + value * 8 + change * 75 : -60 + entryEase(change) * 45 + Math.max(0, value - boundary) * 8;
      emblem.style.opacity = String(opacity);
      emblem.style.setProperty('--emblem-turn', `${turn}deg`);
      emblem.style.setProperty('--emblem-y', `${(value - 1.5) * -8}px`);
    });
  };
  useLayoutEffect(() => update(progress.get()), [progress]);
  useMotionValueEvent(progress, 'change', update);
  return <div ref={root} className="research-stage-emblems" aria-hidden="true">{SCHOOLS.slice(0, 2).map((school) => <div className="research-stage-emblem-camera" data-stage-emblem data-school={school.code} key={school.code}><div className="research-stage-emblem-ambient"><Emblem school={school} /></div></div>)}</div>;
}

function ShotText({ plane, index, progress }: { plane: Plane; index: number; progress: MotionValue<number> }) {
  const root = useRef<HTMLElement>(null);
  const words = plane.line.split(' ');
  const highlight = words.findIndex((word) => !/^(de|del|y|e|la|el|en|ciencias|investigación)$/i.test(word));
  const update = (value: number) => {
    const node = root.current;
    if (!node) return;
    const p = clamp(value - index * STAGE_TIMING.step);
    const entered = value >= index * STAGE_TIMING.step;
    const exit = index === STAGE_PLANES.length - 1 ? 0 : entryEase((p - 0.75) / 0.25);
    node.style.opacity = String(entered ? 1 - exit : 0);
    node.style.transform = `translateY(${-exit * 28}px)`;
    node.querySelectorAll<HTMLElement>('[data-word]').forEach((word, wordIndex) => {
      const delay = (wordIndex / Math.max(1, words.length - 1)) * 0.12;
      const wordIn = entryEase((p - delay) / 0.18);
      word.style.transform = `translateY(${(1 - wordIn) * 110}%)`;
      word.style.opacity = String(wordIn);
    });
    node.style.setProperty('--caption-opacity', String(entryEase((p - 0.16) / 0.14)));
  };
  useLayoutEffect(() => update(progress.get()), [index, progress]);
  useMotionValueEvent(progress, 'change', update);
  return (
    <article ref={root} className="research-stage-shot-copy" data-school={plane.school.code} style={schoolStyle(plane.school)} aria-labelledby={`research-shot-title-${index}`}>
      <p className="research-stage-shot-label">{plane.school.code} <span aria-hidden="true">·</span> {String(plane.lineIndex + 1).padStart(2, '0')} / {String(plane.school.researchLines.length).padStart(2, '0')}</p>
      <h2 id={`research-shot-title-${index}`} aria-label={plane.line}>
        {words.map((word, wordIndex) => <React.Fragment key={`${word}-${wordIndex}`}><span className="research-stage-word-mask" aria-hidden="true"><span data-word className={wordIndex === highlight ? 'is-accent' : ''}>{word}</span></span>{' '}</React.Fragment>)}
      </h2>
      <p className="research-stage-caption">{descriptions[plane.line]}</p>
    </article>
  );
}

function SelectionGrid({ onSelect, reduced = false }: { onSelect: (school: SchoolConfig) => void; reduced?: boolean }) {
  return (
    <section className={`research-stage-selection ${reduced ? 'is-static' : ''}`} id="seleccion-escuelas" aria-labelledby="research-selection-title">
      <p className="research-stage-eyebrow">TU PRÓXIMO PUNTO DE PARTIDA</p>
      <h2 id="research-selection-title">Explora nuestras <span>escuelas</span></h2>
      <div className="research-stage-school-grid">
        {SCHOOLS.map((school, index) => (
          <article id={`research-school-${school.code}`} className="research-stage-school-card" data-school={school.code} style={schoolStyle(school)} key={school.code}>
            {reduced && index < 2 && <svg className="research-stage-static-motif" viewBox="170 -30 510 430" aria-hidden="true" focusable="false">{React.createElement(RESEARCH_LINE_MOTIFS[school.researchLines[0]])}</svg>}
            <div className="research-stage-card-emblem" aria-hidden="true"><Emblem school={school} /></div>
            <p className="research-stage-eyebrow">{school.code}</p>
            <h3>{school.name}</h3>
            <button id={`research-select-${school.code}`} type="button" onClick={() => onSelect(school)}>Explorar esta escuela <span aria-hidden="true">→</span></button>
            <details open={reduced || undefined}>
              <summary>Líneas de investigación <span aria-hidden="true">+</span></summary>
              <ul>{school.researchLines.map((line, lineIndex) => <li id={`research-line-${school.code}-${lineIndex}`} key={line} tabIndex={-1}>{line}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnimatedStage({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const geometry = useRef({ start: 0, unit: 1 });
  const target = useMotionValue(0);
  const progress = useSpring(target, { stiffness: 120, damping: 30, mass: 1, restDelta: 0.0001, restSpeed: 0.0001 });
  const [pairStart, setPairStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activePlane = STAGE_PLANES[activeIndex];

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed || !track.current) return;
      const header = parseFloat(getComputedStyle(track.current).getPropertyValue('--landing-header-height')) || 86;
      const unit = window.innerHeight * (window.matchMedia('(max-width: 768px)').matches ? STAGE_TIMING.mobileVh : STAGE_TIMING.desktopVh) / 100;
      track.current.style.setProperty('--stage-scroll-length', `${unit * TOTAL_UNITS}px`);
      geometry.current = { start: track.current.getBoundingClientRect().top + window.scrollY - header, unit };
      update();
    };
    const update = () => {
      frame = 0;
      target.set(clamp((window.scrollY - geometry.current.start) / geometry.current.unit, 0, TOTAL_UNITS));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => { disposed = true; cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure); };
  }, [target]);

  useMotionValueEvent(progress, 'change', (value) => {
    // Keep the outgoing shot until its full fade; its successor starts 20% earlier.
    const { progress: v, pairStart: base, activeIndex: active } = getStageState(value);
    setPairStart((old) => old === base ? old : base);
    setActiveIndex((old) => old === active ? old : active);
    if (scene.current) scene.current.dataset.timeline = v.toFixed(4);
    rail.current?.querySelectorAll<HTMLElement>('[data-line-progress]').forEach((mark) => {
      const index = Number(mark.dataset.lineProgress);
      mark.style.setProperty('--line-progress', String(clamp(v - index * STAGE_TIMING.step)));
    });
  });

  const jump = (school: SchoolConfig, lineIndex = 0) => {
    const index = STAGE_PLANES.findIndex((plane) => plane.school.code === school.code && plane.lineIndex === lineIndex);
    if (index >= 0) {
      // Land inside the shot so its title is readable when keyboard navigation ends.
      window.scrollTo({ top: geometry.current.start + (index * STAGE_TIMING.step + 0.34) * geometry.current.unit, behavior: 'smooth' });
    } else {
      const card = document.getElementById(`research-school-${school.code}`);
      const details = card?.querySelector('details');
      if (details) details.open = true;
      const destination = document.getElementById(`research-line-${school.code}-${lineIndex}`);
      destination?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      destination?.focus({ preventScroll: true });
    }
  };
  const keyboardNavigation = (event: React.KeyboardEvent<HTMLElement>) => {
    const buttons = Array.from(rail.current?.querySelectorAll<HTMLButtonElement>('button') || []);
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current + buttons.length - 1) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].focus();
  };
  const rendered = [pairStart, pairStart + 1].filter((index) => index < STAGE_PLANES.length);
  return (
    <>
      <div ref={track} className="research-stage-track" id="escuelas" style={{ '--stage-units': TOTAL_UNITS } as React.CSSProperties}>
        <div ref={scene} className="research-stage" data-school={activePlane.school.code} data-timeline="0" role="region" aria-label="Recorrido por las líneas de investigación">
          <div className="research-stage-art" aria-hidden="true">{rendered.map((index) => <ShotArt index={index} progress={progress} key={index} />)}<StageEmblems progress={progress} /></div>
          <div className="research-stage-topline"><p>INVESTIGACIÓN QUE CONECTA</p><span>{activePlane.school.shortName}</span></div>
          <div className="research-stage-copy-stack">{STAGE_PLANES.map((plane, index) => <ShotText key={plane.line} plane={plane} index={index} progress={progress} />)}</div>
          <nav ref={rail} className="research-stage-navigation" aria-label="Escuelas y líneas de investigación" onKeyDown={keyboardNavigation}>
            <ol>{SCHOOLS.map((school) => (
              <li key={school.code} data-school={school.code} style={schoolStyle(school)} className={activePlane.school.code === school.code ? 'is-active' : ''}>
                <button className="research-stage-school-dot" type="button" aria-label={`Ir a ${school.name}`} aria-current={activePlane.school.code === school.code ? 'step' : undefined} onClick={() => jump(school)}><span /><small>{school.code}</small></button>
                <div className="research-stage-line-marks">{school.researchLines.map((line, lineIndex) => {
                  const index = STAGE_PLANES.findIndex((plane) => plane.line === line);
                  return <button key={line} type="button" data-line-progress={index >= 0 ? index : undefined} aria-label={`${school.code}: ${line}`} aria-current={index === activeIndex ? 'step' : undefined} onClick={() => jump(school, lineIndex)}><span /></button>;
                })}</div>
              </li>
            ))}</ol>
          </nav>
          <div className="research-stage-bottom" data-school={activePlane.school.code} style={schoolStyle(activePlane.school)}>
            <button type="button" onClick={() => onSelect(activePlane.school)}>Explorar esta escuela <span aria-hidden="true">→</span></button>
            <span className="research-stage-scroll-hint">Desliza para descubrir <span aria-hidden="true">↓</span></span>
            <a href="#seleccion-escuelas">Ver todas las escuelas <span aria-hidden="true">↘</span></a>
          </div>
        </div>
      </div>
      <SelectionGrid onSelect={onSelect} />
    </>
  );
}

export function ResearchStage({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  const reduced = useReducedMotion();
  return reduced ? <div id="escuelas"><SelectionGrid onSelect={onSelect} reduced /></div> : <AnimatedStage onSelect={onSelect} />;
}
