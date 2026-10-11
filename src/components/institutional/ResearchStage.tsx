import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, cubicBezier, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { SCHOOLS, type SchoolConfig } from '../../constants/schools';
import { ensureSchoolLogosDecoded, SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { BASE_MASCOT, SCHOOL_MASCOTS } from '../../assets/schoolMascots';
import SchoolGraphBackdrop from '../SchoolGraphBackdrop';
import type { SchoolCode as GraphSchoolCode } from '../schoolGraphs';
import type { MascotHandoff } from './mascotHandoff';
import './ResearchStage.css';

const ease = cubicBezier(.22, 1, .36, 1);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const RESEARCH_ENTRY_LABEL = 'Ver investigaciones y proyectos';

const displaySchoolCode = (school: SchoolConfig) => school.code === 'ECIAA' ? 'ECAA' : school.code;
const graphSchoolCode = (school: SchoolConfig) =>
  (school.code === 'ECIAA' ? 'ECAA' : school.code) as GraphSchoolCode;
const schoolStyle = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': 'color-mix(in srgb, ' + school.accent + ' 42%, #111820)',
} as React.CSSProperties);

function Emblem({ school }: { school: SchoolConfig }) {
  return <img src={SCHOOL_LOGOS[school.code]} alt="" draggable={false} />;
}

function Mascot({ src }: { src: string }) {
  return <><span className="research-stage-mascot-shadow" /><img src={src} width={1024} height={1024} alt="" draggable={false} /></>;
}

function SchoolScene({ school, active, handoff, reduced, onSelectSchool }: {
  school: SchoolConfig;
  active: boolean;
  handoff: MascotHandoff;
  reduced: boolean;
  onSelectSchool: (school: SchoolConfig) => void;
}) {
  const mascotOpacity = useTransform(handoff.progress, [0, .72, .96, 1], [0, 0, 1, 1]);
  const transition = { duration: reduced ? 0 : .35, ease };

  return <motion.article
    className="research-stage-school-screen"
    data-school={school.code}
    style={schoolStyle(school)}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={transition}
    aria-hidden={!active}
    inert={!active}
    aria-labelledby={'research-school-title-' + school.code}
  >
    <div className="research-stage-copy-stack">
      <div className="research-stage-title-row">
        <span className="research-stage-title-emblem" aria-hidden="true"><Emblem school={school} /></span>
        <p className="research-stage-school-acronym">{displaySchoolCode(school)}</p>
        <h2 id={'research-school-title-' + school.code}>{school.name}</h2>
      </div>
      <div className="research-stage-bottom">
        <button type="button" aria-label={RESEARCH_ENTRY_LABEL + ' de ' + school.name} onClick={() => onSelectSchool(school)}>
          {RESEARCH_ENTRY_LABEL} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
    <motion.div className="research-stage-mascot-slot" style={{ opacity: mascotOpacity }} aria-hidden="true">
      <Mascot src={SCHOOL_MASCOTS[school.code]} />
    </motion.div>
  </motion.article>;
}

function SchoolNavigationItem({ school, schoolIndex, active, reduced, onSelect }: {
  school: SchoolConfig;
  schoolIndex: number;
  active: boolean;
  reduced: boolean;
  onSelect: (index: number) => void;
}) {
  return <li className={active ? 'is-active' : undefined} data-school={school.code} style={schoolStyle(school)}>
    <button
      className="research-stage-school-button"
      type="button"
      data-school-index={schoolIndex}
      aria-label={'Ir a ' + school.name}
      aria-current={active ? 'step' : undefined}
      onClick={() => onSelect(schoolIndex)}
    >
      <span className="research-stage-school-emblem" aria-hidden="true"><Emblem school={school} /></span>
      <small>{displaySchoolCode(school)}</small>
      <motion.span
        className="research-stage-school-fill"
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : .35, ease }}
        aria-hidden="true"
      />
    </button>
  </li>;
}

export function ResearchStage({ onSelect, scrollY, handoff, scrollContainer }: {
  onSelect: (school: SchoolConfig) => void;
  scrollY: MotionValue<number>;
  handoff: MascotHandoff;
  scrollContainer: React.RefObject<HTMLElement | null>;
}) {
  const reduced = !!useReducedMotion();
  const [assetsReady, setAssetsReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const mascotMeasure = useRef<HTMLDivElement>(null);
  const handoffTriggerY = useRef(Number.POSITIVE_INFINITY);
  const handoffDirection = useRef(0);
  const handoffControl = useRef<ReturnType<typeof animate> | null>(null);
  const flashOpacity = useMotionValue(0);
  const flashScale = useMotionValue(.6);
  const flashControls = useRef<ReturnType<typeof animate>[]>([]);
  const previousHandoff = useRef(handoff.progress.get());
  const activeSchool = SCHOOLS[activeIndex];

  useEffect(() => {
    let mounted = true;
    void ensureSchoolLogosDecoded().then((ready) => { if (mounted) setAssetsReady(ready); });
    return () => { mounted = false; };
  }, []);

  const setHandoffDirection = useCallback((direction: number) => {
    if (direction === handoffDirection.current) return;
    handoffDirection.current = direction;
    handoffControl.current?.stop();
    if (reduced) {
      handoff.progress.set(direction);
      return;
    }
    handoffControl.current = animate(handoff.progress, direction, { duration: .9, ease });
  }, [handoff.progress, reduced]);

  useMotionValueEvent(scrollY, 'change', (position) => {
    const trigger = handoffTriggerY.current;
    if (!Number.isFinite(trigger)) return;
    const stage = scene.current;
    const mascot = mascotMeasure.current;
    if (stage && mascot) {
      const stageRect = stage.getBoundingClientRect();
      handoff.targetX.set(stageRect.left + mascot.offsetLeft + mascot.clientWidth / 2);
      handoff.targetY.set(stageRect.top + mascot.offsetTop + mascot.clientHeight / 2);
    }
    setHandoffDirection(position >= trigger ? 1 : 0);
  });

  useMotionValueEvent(handoff.progress, 'change', (value) => {
    if ((previousHandoff.current < .84) !== (value < .84)) {
      flashControls.current.forEach((control) => control.stop());
      flashScale.set(.6);
      flashControls.current = [
        animate(flashOpacity, [0, 1, 0], { duration: .3, times: [0, .25, 1], ease }),
        animate(flashScale, 1.3, { duration: .3, ease }),
      ];
    }
    previousHandoff.current = value;
  });

  useEffect(() => {
    const root = scrollContainer.current;
    const stage = scene.current;
    const mascot = mascotMeasure.current;
    const stageTrack = track.current;
    if (!root || !stage || !mascot || !stageTrack) return;

    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const stageHeight = stage.clientHeight || window.innerHeight;
      const rootRect = root.getBoundingClientRect();
      const stageScrollTop = stageTrack.getBoundingClientRect().top - rootRect.top + root.scrollTop;
      handoffTriggerY.current = stageScrollTop - stageHeight * .7;
      handoff.targetX.set(stageRect.left + mascot.offsetLeft + mascot.clientWidth / 2);
      handoff.targetY.set(stageRect.top + mascot.offsetTop + mascot.clientHeight / 2);
      setHandoffDirection(scrollY.get() >= handoffTriggerY.current ? 1 : 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(stage);
    observer.observe(stageTrack);
    observer.observe(mascot);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [handoff.targetX, handoff.targetY, scrollContainer, scrollY, setHandoffDirection]);

  const settleIndex = useCallback((index: number) => {
    setActiveIndex(index);
    if (index === 0 && scrollY.get() >= handoffTriggerY.current) setHandoffDirection(1);
  }, [scrollY, setHandoffDirection]);

  useEffect(() => {
    const root = scrollContainer.current;
    if (!root) return;
    const settle = () => {
      const spacers = track.current?.querySelectorAll<HTMLElement>('.research-stage-school-spacer');
      if (!spacers?.length) return;
      const rootTop = root.getBoundingClientRect().top;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      spacers.forEach((spacer, index) => {
        const distance = Math.abs(spacer.getBoundingClientRect().top - rootTop);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const index = clamp(nearestIndex, 0, SCHOOLS.length - 1);
      settleIndex(index);
    };
    let fallbackTimer = 0;
    const settleAfterScroll = () => {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(settle, 160);
    };
    root.addEventListener('scrollend', settle);
    root.addEventListener('scroll', settleAfterScroll, { passive: true });
    return () => {
      root.removeEventListener('scrollend', settle);
      root.removeEventListener('scroll', settleAfterScroll);
      window.clearTimeout(fallbackTimer);
    };
  }, [scrollContainer, settleIndex]);

  const selectSchool = useCallback((index: number) => {
    const target = clamp(index, 0, SCHOOLS.length - 1);
    const root = scrollContainer.current;
    const spacer = track.current?.querySelector<HTMLElement>('.research-stage-school-spacer[data-school-index="' + target + '"]');
    if (root && spacer) {
      const rootRect = root.getBoundingClientRect();
      const scrollTop = spacer.getBoundingClientRect().top - rootRect.top + root.scrollTop;
      root.scrollTo({ top: scrollTop, behavior: 'instant' });
    }
    setActiveIndex(target);
    if (target === 0 && scrollY.get() >= handoffTriggerY.current) setHandoffDirection(1);
  }, [scrollContainer, scrollY, setHandoffDirection]);

  useEffect(() => {
    const nav = rail.current;
    if (!nav || !window.matchMedia('(max-width: 768px)').matches) return;
    const active = nav.querySelector<HTMLButtonElement>('[data-school-index="' + activeIndex + '"]');
    if (!active) return;
    nav.scrollTo({
      left: active.offsetLeft - Math.max(0, (nav.clientWidth - active.clientWidth) / 2),
      behavior: reduced ? 'instant' : 'smooth',
    });
  }, [activeIndex, reduced]);

  useEffect(() => () => {
    handoffControl.current?.stop();
    flashControls.current.forEach((control) => control.stop());
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.isContentEditable || target.closest('input, textarea, select')) return;
    let next = activeIndex;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') next += 1;
    else if (event.key === 'ArrowUp' || event.key === 'PageUp') next -= 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SCHOOLS.length - 1;
    else return;
    event.preventDefault();
    selectSchool(next);
  };

  const baseOpacity = useTransform(handoff.progress, [0, .68, .76, .84, .96, 1], [0, 0, 1, 1, 0, 0]);
  const baseScale = useTransform(handoff.progress, [.68, .84], [.9, 1]);

  return <div
    className="research-stage-scrollport"
    id="escuelas"
    role="region"
    aria-label="Recorrido por las siete escuelas"
    aria-busy={!assetsReady}
    tabIndex={0}
    onKeyDown={onKeyDown}
  >
    <div className="research-stage-track" ref={track}>
      <div className="research-stage" ref={scene} style={schoolStyle(activeSchool)}>
        <div className="research-stage-pastel" aria-hidden="true" />
        {assetsReady && <SchoolGraphBackdrop school={graphSchoolCode(activeSchool)} className="research-stage-graph-backdrop" />}
        <header className="research-stage-brand-bar" aria-label="Universidad Yachay Tech">
          <img
            className="research-stage-brand-logo"
            src="./assets/yachay-logo-clean.svg"
            width={731}
            height={252}
            alt="Universidad Yachay Tech"
            draggable={false}
          />
        </header>
        <div className="research-stage-mascot-measure" ref={mascotMeasure} aria-hidden="true" />
        {assetsReady && <>
          <motion.div className="research-stage-mascot-slot research-stage-base-mascot" style={{ opacity: baseOpacity, scale: baseScale }} aria-hidden="true"><Mascot src={BASE_MASCOT} /></motion.div>
          <motion.div className="research-stage-mascot-flash" style={{ opacity: flashOpacity, scale: flashScale }} aria-hidden="true" />
          <AnimatePresence initial={false}>
            <SchoolScene key={activeSchool.code} school={activeSchool} active handoff={handoff} reduced={reduced} onSelectSchool={onSelect} />
          </AnimatePresence>
          <nav ref={rail} className="research-stage-navigation" aria-label="Escuelas de investigación">
            <ol>{SCHOOLS.map((school, index) => <SchoolNavigationItem key={school.code} school={school} schoolIndex={index} active={index === activeIndex} reduced={reduced} onSelect={selectSchool} />)}</ol>
          </nav>
        </>}
      </div>
      {SCHOOLS.map((school, index) => <div
        className="research-stage-school-spacer"
        data-school={school.code}
        data-school-index={index}
        aria-hidden="true"
        key={'spacer-' + school.code}
      />)}
    </div>
  </div>;
}

