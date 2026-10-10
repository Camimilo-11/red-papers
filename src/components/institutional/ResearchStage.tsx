import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react';
import { SCHOOLS, type OfficialResearchLine, type SchoolConfig } from '../../constants/schools';
import { SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { RESEARCH_LINE_MOTIFS } from '../dashboard/ResearchLineBackdrop';
import './ResearchStage.css';

// The tracing engine uses the same per-line timeline; each school gets its own
// 130svh scroll scene, with its research lines distributed through that scene.
export const STAGE_PLANES = SCHOOLS.flatMap((school) =>
  school.researchLines.map((line, lineIndex) => ({ school, line, lineIndex })),
);
export const STAGE_TIMING = { sceneVh: 130, overlap: 0.2, step: 0.8, drawMs: 600 } as const;
const TOTAL_UNITS = STAGE_PLANES.length * STAGE_TIMING.step;
const SCHOOL_LINE_OFFSETS = SCHOOLS.map((school, schoolIndex) =>
  SCHOOLS.slice(0, schoolIndex).reduce((total, previous) => total + previous.researchLines.length, 0),
);
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export function getStageState(value: number) {
  const progress = clamp(value, 0, TOTAL_UNITS);
  const current = clamp(Math.floor(progress / STAGE_TIMING.step), 0, STAGE_PLANES.length - 1);
  const localProgress = progress - current * STAGE_TIMING.step;
  const pairStart = localProgress < STAGE_TIMING.overlap && current > 0 ? current - 1 : current;
  const activeIndex = current;
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
const displaySchoolCode = (school: SchoolConfig) => school.code === 'ECIAA' ? 'ECAA' : school.code;
const schoolStyle = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
} as React.CSSProperties);

function Emblem({ school }: { school: SchoolConfig }) {
  return <img src={SCHOOL_LOGOS[school.code]} alt="" draggable={false} />;
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

function ShotArt({ index, progress, preview = false, selected = false }: { index: number; progress: MotionValue<number>; preview?: boolean; selected?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const plane = STAGE_PLANES[index];
  const schoolChange = index > 0 && STAGE_PLANES[index - 1].school.code !== plane.school.code;
  const update = (value: number) => {
    const node = root.current;
    if (!node || selectedRef.current) return;
    if (preview) {
      node.style.setProperty('--plane-opacity', '.27');
      node.style.setProperty('--plane-draw', '1');
      node.style.setProperty('--motif-scale', '1');
      node.style.setProperty('--motif-rotate', '0deg');
      node.style.setProperty('--motif-x', '0px');
      node.style.setProperty('--motif-y', '0px');
      node.style.setProperty('--wash-opacity', '0');
      return;
    }
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
  useLayoutEffect(() => {
    if (selected) {
      root.current?.style.setProperty('--plane-opacity', '1');
      root.current?.style.setProperty('--plane-draw', '0');
      root.current?.style.setProperty('--wash-opacity', '.1');
      return;
    }
    update(progress.get());
  }, [index, progress, selected, preview]);
  useMotionValueEvent(progress, 'change', update);
  useEffect(() => {
    if (!selected) return;
    const node = root.current;
    if (!node) return;
    let frame = 0;
    const startedAt = performance.now();
    const draw = (now: number) => {
      const amount = clamp((now - startedAt) / STAGE_TIMING.drawMs);
      node.style.setProperty('--plane-draw', String(amount));
      if (amount < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [index, selected]);
  return (
    <div ref={root} className={`research-stage-shot-art ${schoolChange ? 'is-school-change' : ''} ${preview ? 'is-preview' : ''} ${selected ? 'is-selected-draw' : ''}`} data-school={plane.school.code} data-plane-index={index} style={{ ...schoolStyle(plane.school), zIndex: STAGE_PLANES.length - index }} aria-hidden="true">
      <div className="research-stage-wash-parallax"><div className="research-stage-wash" /></div>
      <div className="research-stage-motif-camera"><div className="research-stage-motif-ambient"><TracedMotif line={plane.line} /></div></div>
    </div>
  );
}

/** One continuous emblem layer; only adjacent schools crossfade at a boundary. */
function StageEmblems({ progress }: { progress: MotionValue<number> }) {
  const root = useRef<HTMLDivElement>(null);
  const update = (value: number) => {
    root.current?.querySelectorAll<HTMLElement>('[data-stage-emblem]').forEach((emblem, index) => {
      const start = SCHOOL_LINE_OFFSETS[index] * STAGE_TIMING.step;
      const end = (SCHOOL_LINE_OFFSETS[index] + SCHOOLS[index].researchLines.length) * STAGE_TIMING.step;
      const entrance = index === 0 ? 1 : clamp((value - start + STAGE_TIMING.overlap) / STAGE_TIMING.overlap);
      const departure = index === SCHOOLS.length - 1 ? 0 : clamp((value - end + STAGE_TIMING.overlap) / STAGE_TIMING.overlap);
      const opacity = entrance * (1 - departure);
      const turn = -15 + value * 7 + departure * 65 - (1 - entrance) * 45;
      emblem.style.opacity = String(opacity);
      emblem.style.setProperty('--emblem-turn', `${turn}deg`);
      emblem.style.setProperty('--emblem-y', `${Math.sin(value * 0.7 + index) * 9}px`);
    });
  };
  useLayoutEffect(() => update(progress.get()), [progress]);
  useMotionValueEvent(progress, 'change', update);
  return <div ref={root} className="research-stage-emblems" aria-hidden="true">{SCHOOLS.map((school) => <div className="research-stage-emblem-camera" data-stage-emblem data-school={school.code} key={school.code}><div className="research-stage-emblem-ambient"><Emblem school={school} /></div></div>)}</div>;
}

function ShotText({ plane, index, progress, manualIndex, showSelector, onSelectLine, onPreviewLine }: {
  plane: Plane;
  index: number;
  progress: MotionValue<number>;
  manualIndex: number | null;
  showSelector: boolean;
  onSelectLine: (school: SchoolConfig, lineIndex: number) => void;
  onPreviewLine: (index: number | null) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const words = plane.line.split(' ');
  const highlight = words.findIndex((word) => !/^(de|del|y|e|la|el|en|ciencias|investigación)$/i.test(word));
  const update = (value: number) => {
    const node = root.current;
    if (!node) return;
    if (manualIndex !== null) {
      const selected = manualIndex === index;
      node.style.opacity = String(Number(selected));
      node.style.transform = 'translateY(0)';
      node.querySelectorAll<HTMLElement>('[data-word]').forEach((word) => {
        word.style.transform = 'translateY(0)';
        word.style.opacity = String(Number(selected));
      });
      node.style.setProperty('--caption-opacity', String(Number(selected)));
      return;
    }
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
  useLayoutEffect(() => update(progress.get()), [index, progress, manualIndex]);
  useMotionValueEvent(progress, 'change', update);
  return (
    <article ref={root} className="research-stage-shot-copy" data-school={plane.school.code} style={schoolStyle(plane.school)} aria-labelledby={`research-shot-title-${index}`}>
      <p className="research-stage-shot-label">{displaySchoolCode(plane.school)} <span aria-hidden="true">·</span> {String(plane.lineIndex + 1).padStart(2, '0')} / {String(plane.school.researchLines.length).padStart(2, '0')}</p>
      <h2 id={`research-shot-title-${index}`} aria-label={plane.line}>
        {words.map((word, wordIndex) => <React.Fragment key={`${word}-${wordIndex}`}><span className="research-stage-word-mask" aria-hidden="true"><span data-word className={wordIndex === highlight ? 'is-accent' : ''}>{word}</span></span>{' '}</React.Fragment>)}
      </h2>
      <p className="research-stage-caption">{descriptions[plane.line]}</p>
      {showSelector && <nav className="research-stage-line-selector" aria-label={`Líneas de investigación de ${plane.school.name}`}>
        {plane.school.researchLines.map((line, lineIndex) => {
          const planeIndex = STAGE_PLANES.findIndex((item) => item.school.code === plane.school.code && item.line === line);
          return <button
            key={line}
            type="button"
            className={plane.lineIndex === lineIndex ? 'is-active' : ''}
            aria-current={plane.lineIndex === lineIndex ? 'step' : undefined}
            onClick={() => onSelectLine(plane.school, lineIndex)}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') onPreviewLine(planeIndex); }}
            onPointerLeave={() => onPreviewLine(null)}
          >{line}</button>;
        })}
      </nav>}
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
            {reduced && <svg className="research-stage-static-motif" viewBox="170 -30 510 430" aria-hidden="true" focusable="false">{React.createElement(RESEARCH_LINE_MOTIFS[school.researchLines[0]])}</svg>}
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
  const pointerX = useSpring(useMotionValue(0), { stiffness: 120, damping: 30 });
  const pointerY = useSpring(useMotionValue(0), { stiffness: 120, damping: 30 });
  const pointerTiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 30 });
  const pointerTiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 30 });
  const [pairStart, setPairStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displayIndex = manualIndex ?? activeIndex;
  const activePlane = STAGE_PLANES[displayIndex];

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed || !track.current) return;
      const header = parseFloat(getComputedStyle(track.current).getPropertyValue('--landing-header-height')) || 86;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const unit = viewportHeight * STAGE_TIMING.sceneVh / 100;
      const totalLength = unit * SCHOOLS.length;
      track.current.style.setProperty('--stage-scroll-length', `${totalLength}px`);
      track.current.querySelectorAll<HTMLElement>('[data-snap-position]').forEach((marker) => {
        marker.style.top = `${Number(marker.dataset.snapPosition) * unit}px`;
      });
      geometry.current = { start: track.current.getBoundingClientRect().top + window.scrollY - header, unit };
      update();
    };
    const update = () => {
      frame = 0;
      const sceneOffset = clamp((window.scrollY - geometry.current.start) / geometry.current.unit, 0, SCHOOLS.length);
      const sceneIndex = Math.min(SCHOOLS.length - 1, Math.floor(sceneOffset));
      const localProgress = clamp(sceneOffset - sceneIndex);
      const school = SCHOOLS[sceneIndex];
      const value = (SCHOOL_LINE_OFFSETS[sceneIndex] + localProgress * school.researchLines.length) * STAGE_TIMING.step;
      target.set(clamp(value, 0, TOTAL_UNITS));
      if (scene.current) scene.current.dataset.scrolled = String(sceneOffset > 0.02);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const releaseManualSelection = () => setManualIndex(null);
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', releaseManualSelection);
    window.addEventListener('wheel', releaseManualSelection, { passive: true });
    window.addEventListener('touchstart', releaseManualSelection, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', releaseManualSelection);
      window.removeEventListener('wheel', releaseManualSelection);
      window.removeEventListener('touchstart', releaseManualSelection);
      window.removeEventListener('resize', measure);
    };
  }, [target]);

  useMotionValueEvent(progress, 'change', (value) => {
    // Keep the outgoing shot until its full fade; its successor starts 20% earlier.
    const { progress: v, pairStart: base, activeIndex: active } = getStageState(value);
    setPairStart((old) => old === base ? old : base);
    setActiveIndex((old) => old === active ? old : active);
    if (scene.current) scene.current.dataset.timeline = v.toFixed(4);
    rail.current?.querySelectorAll<HTMLElement>('[data-school-fill]').forEach((button) => {
      const index = Number(button.dataset.schoolIndex);
      const start = SCHOOL_LINE_OFFSETS[index] * STAGE_TIMING.step;
      const length = SCHOOLS[index].researchLines.length * STAGE_TIMING.step;
      button.style.setProperty('--school-progress', String(clamp((v - start) / length)));
    });
    rail.current?.querySelectorAll<HTMLElement>('[data-line-progress]').forEach((mark) => {
      const index = Number(mark.dataset.lineProgress);
      mark.style.setProperty('--line-progress', String(clamp((v - index * STAGE_TIMING.step) / STAGE_TIMING.step)));
    });
  });

  const jump = (school: SchoolConfig, lineIndex = 0) => {
    const index = STAGE_PLANES.findIndex((plane) => plane.school.code === school.code && plane.lineIndex === lineIndex);
    const schoolIndex = SCHOOLS.findIndex((item) => item.code === school.code);
    if (index < 0 || schoolIndex < 0) return;
    setManualIndex(index);
    setHoveredIndex(null);
    const linePosition = (lineIndex + 0.5) / school.researchLines.length;
    const scenePosition = schoolIndex + linePosition;
    window.scrollTo({ top: geometry.current.start + scenePosition * geometry.current.unit, behavior: 'smooth' });
  };
  const keyboardNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).isContentEditable) return;
    const currentPlane = STAGE_PLANES[manualIndex ?? activeIndex];
    const currentSchoolIndex = SCHOOLS.findIndex((school) => school.code === currentPlane.school.code);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const next = clamp((manualIndex ?? activeIndex) + (event.key === 'ArrowRight' ? 1 : -1), 0, STAGE_PLANES.length - 1);
      if (next !== (manualIndex ?? activeIndex)) {
        event.preventDefault();
        jump(STAGE_PLANES[next].school, STAGE_PLANES[next].lineIndex);
      }
      return;
    }
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      const nextSchoolIndex = clamp(currentSchoolIndex + (event.key === 'PageDown' ? 1 : -1), 0, SCHOOLS.length - 1);
      if (nextSchoolIndex !== currentSchoolIndex) {
        event.preventDefault();
        const nextSchool = SCHOOLS[nextSchoolIndex];
        jump(nextSchool, Math.min(currentPlane.lineIndex, nextSchool.researchLines.length - 1));
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const plane = event.key === 'Home' ? STAGE_PLANES[0] : STAGE_PLANES[STAGE_PLANES.length - 1];
      jump(plane.school, plane.lineIndex);
    }
  };
  const baseRendered = manualIndex !== null
    ? [manualIndex, manualIndex + 1]
    : [pairStart, pairStart + 1];
  const rendered = hoveredIndex !== null
    ? [baseRendered[0], hoveredIndex]
    : baseRendered;
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = scene.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    const y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    pointerX.set(x * 12);
    pointerY.set(y * 12);
    pointerTiltX.set(y * -6);
    pointerTiltY.set(x * 6);
  };
  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
    pointerTiltX.set(0);
    pointerTiltY.set(0);
  };
  useMotionValueEvent(pointerX, 'change', (value) => scene.current?.style.setProperty('--pointer-x', `${value.toFixed(2)}px`));
  useMotionValueEvent(pointerY, 'change', (value) => scene.current?.style.setProperty('--pointer-y', `${value.toFixed(2)}px`));
  useMotionValueEvent(pointerTiltX, 'change', (value) => scene.current?.style.setProperty('--pointer-tilt-x', `${value.toFixed(2)}deg`));
  useMotionValueEvent(pointerTiltY, 'change', (value) => scene.current?.style.setProperty('--pointer-tilt-y', `${value.toFixed(2)}deg`));
  return (
      <div ref={track} className="research-stage-track" id="escuelas" onKeyDown={keyboardNavigation} style={{ '--stage-units': SCHOOLS.length } as React.CSSProperties}>
        <div className="research-stage-snap-markers" aria-hidden="true">
          {SCHOOLS.flatMap((school, schoolIndex) => [
            <span key={`${school.code}-start`} data-school={school.code} data-school-scene data-snap-position={schoolIndex} />,
            ...school.researchLines.map((line, lineIndex) => {
              const position = schoolIndex + (lineIndex + 0.5) / school.researchLines.length;
              return <span key={`${school.code}-${line}`} data-snap-position={position} />;
            }),
          ])}
        </div>
        <div ref={scene} className="research-stage" data-school={activePlane.school.code} data-timeline="0" data-scrolled="false" role="region" aria-label="Recorrido por las líneas de investigación" onPointerMove={onPointerMove} onPointerLeave={resetPointer}>
          <div className="research-stage-art" aria-hidden="true">
            {rendered.filter((index, itemIndex) => index >= 0 && index < STAGE_PLANES.length && rendered.indexOf(index) === itemIndex).map((index) => <ShotArt index={index} progress={progress} selected={manualIndex === index} preview={hoveredIndex === index && manualIndex !== index && index !== activeIndex} key={index} />)}
            <StageEmblems progress={progress} />
          </div>
          <p className="research-stage-eyebrow">INVESTIGACIÓN QUE CONECTA</p>
          <div className="research-stage-copy-stack">
            {STAGE_PLANES.map((plane, index) => <ShotText
              key={`${plane.school.code}-${plane.line}`}
              plane={plane}
              index={index}
              progress={progress}
              manualIndex={manualIndex}
              showSelector={index === displayIndex}
              onSelectLine={jump}
              onPreviewLine={setHoveredIndex}
            />)}
          </div>
          <div className="research-stage-bottom" data-school={activePlane.school.code} style={schoolStyle(activePlane.school)}>
            <button type="button" onClick={() => onSelect(activePlane.school)}>Explorar esta escuela <span aria-hidden="true">→</span></button>
          </div>
          <span className="research-stage-scroll-hint">Desliza <span aria-hidden="true">↓</span></span>
        </div>
        <nav ref={rail} className="research-stage-navigation" aria-label="Escuelas de investigación">
          <ol>{SCHOOLS.map((school, index) => (
            <li key={school.code} data-school={school.code} style={schoolStyle(school)} className={activePlane.school.code === school.code ? 'is-active' : ''}>
              <button className="research-stage-school-button" type="button" data-school-fill data-school-index={index} aria-label={`Ir a ${school.name}`} aria-current={activePlane.school.code === school.code ? 'step' : undefined} onClick={() => jump(school)}>
                <span className="research-stage-school-emblem" aria-hidden="true"><Emblem school={school} /></span>
                <small>{displaySchoolCode(school)}</small>
              </button>
            </li>
          ))}</ol>
        </nav>
      </div>
  );
}

export function ResearchStage({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  const reduced = useReducedMotion();
  return reduced ? <div id="escuelas"><SelectionGrid onSelect={onSelect} reduced /></div> : <AnimatedStage onSelect={onSelect} />;
}
