import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './TouchResearchStage.css';
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { SCHOOLS, type SchoolConfig } from '../../constants/schools';
import { RESEARCH_STAGE_SLIDES } from '../../constants/researchStageSlides';
import { ensureSchoolMascotDecoded, isSchoolMascotDecoded, scheduleNearbySchoolMascots, SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { BASE_MASCOT, SCHOOL_MASCOTS } from '../../assets/schoolMascots';
import { SchoolGraphBackdrop } from '../SchoolGraphBackdrop';
import type { MascotHandoff } from './mascotHandoff';

const EASE = [.22, 1, .36, 1] as const;
const label = 'Ver investigaciones y proyectos';
const acronym = (school: SchoolConfig) => school.code === 'ECIAA' ? 'ECAA' : school.code;
const styleFor = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
} as React.CSSProperties);

const TouchSlide = React.memo(function TouchSlide({ school, active, handoff, onSelect }: { school: SchoolConfig; active: boolean; handoff: MascotHandoff; onSelect: (school: SchoolConfig) => void }) {
  const blockOpacity = useMotionValue(active ? .65 : 0);
  const y = useMotionValue(12);
  const mascotFade = useMotionValue(isSchoolMascotDecoded(school.code) ? 1 : 0);
  const [mascotDecoded, setMascotDecoded] = useState(() => isSchoolMascotDecoded(school.code));
  const mascotAnimation = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    if (active) y.set(12);
    const fade = animate(blockOpacity, active ? 1 : 0, { duration: .35, ease: EASE });
    const shift = animate(y, active ? 0 : -12, { duration: .35, ease: EASE });
    return () => { fade.stop(); shift.stop(); };
  }, [active, blockOpacity, y]);
  useEffect(() => {
    mascotAnimation.current?.stop();
    if (!active) {
      mascotAnimation.current = animate(mascotFade, 0, { duration: .35, ease: EASE });
      return () => mascotAnimation.current?.stop();
    }
    let mounted = true;
    void ensureSchoolMascotDecoded(school.code).then((ready) => {
      if (!mounted || !ready) return;
      setMascotDecoded(true);
      mascotAnimation.current = animate(mascotFade, 1, { duration: .35, ease: EASE });
    });
    return () => { mounted = false; mascotAnimation.current?.stop(); };
  }, [active, school.code, mascotFade]);
  const handoffOpacity = useTransform(handoff.progress, [.84, 1], [0, 1]);
  const opacity = useTransform(() => mascotFade.get() * (school.code === 'ECIAA' ? handoffOpacity.get() : 1));
  const slide = RESEARCH_STAGE_SLIDES[school.code][0];
  return <motion.section className="touch-school-slide" data-school={school.code} inert={!active} aria-hidden={!active}
    style={{ ...styleFor(school), opacity: blockOpacity, y, pointerEvents: active ? 'auto' : 'none' }}>
    <div className="touch-school-copy">
      <div className="touch-school-identity"><img src={SCHOOL_LOGOS[school.code]} width={44} height={44} alt="" /><p>{acronym(school)}</p></div>
      <h2>{slide.title.split(' ').map((word, index, words) => <React.Fragment key={index}><span className={slide.accentWords.includes(index) ? 'is-accent' : undefined}>{word}</span>{index < words.length - 1 ? ' ' : ''}</React.Fragment>)}</h2>
    </div>
    <motion.div className="touch-school-mascot" style={{ opacity }} aria-hidden="true"><span className="research-stage-mascot-shadow" />{mascotDecoded && <img src={SCHOOL_MASCOTS[school.code]} width={768} height={768} alt="" draggable={false} />}</motion.div>
    <button className="touch-school-cta" type="button" aria-label={label + ' de ' + school.name} onClick={() => onSelect(school)}>{label}<span aria-hidden="true">→</span></button>
  </motion.section>;
});

/** Touch gestures commit once on release; school content never follows a partial drag. */
export function TouchResearchStage({ onSelect, logosReady, handoff, scrollY }: { onSelect: (school: SchoolConfig) => void; logosReady: boolean; handoff: MascotHandoff; scrollY: MotionValue<number> }) {
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const railTargets = useRef<number[]>([]);
  const measurement = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [landscape, setLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches);
  const active = useRef(0);
  const geometry = useRef({ start: 0, height: window.innerHeight });
  const navigationUntil = useRef(0);
  const entered = useRef(false);
  const ready = useRef(logosReady);
  ready.current = logosReady;
  const entry = useRef<ReturnType<typeof animate> | null>(null);
  const flash = useMotionValue(0);
  const baseOpacity = useTransform(handoff.progress, [0, .72, .84, 1], [0, 0, 1, 0]);
  const baseScale = useTransform(handoff.progress, [.72, 1], [.9, 1]);
  const activeSchool = SCHOOLS[activeIndex];
  useEffect(() => { scheduleNearbySchoolMascots(activeSchool.code); }, [activeSchool.code]);

  const commit = useCallback((index: number) => {
    if (!ready.current) return;
    const next = Math.max(0, Math.min(SCHOOLS.length - 1, index));
    if (entered.current && active.current === next) return;
    active.current = next;
    scrollY.set(geometry.current.start + next * geometry.current.height);
    setActiveIndex(next);
    if (!entered.current && next === 0) {
      entered.current = true;
      entry.current?.stop();
      entry.current = animate(handoff.progress, [0, .72, .84, 1], { duration: .9, times: [0, .55, .7, 1], ease: EASE });
      animate(flash, [0, 1, 0], { duration: .3, delay: .54, ease: EASE });
    } else if (next > 0 || handoff.progress.get() === 0) {
      entered.current = true;
      entry.current?.stop();
      handoff.progress.set(1);
    }
  }, [flash, handoff, scrollY]);

  const go = useCallback((index: number) => {
    if (!track.current || !ready.current) return;
    const { start, height } = geometry.current;
    navigationUntil.current = performance.now() + 240;
    if (index < 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      entered.current = false;
      entry.current?.stop();
      handoff.progress.set(0);
      scrollY.set(0);
    } else if (index >= SCHOOLS.length) {
      window.scrollTo({ top: start + SCHOOLS.length * height, behavior: 'instant' });
    } else {
      commit(index);
      window.scrollTo({ top: start + index * height, behavior: 'instant' });
    }
  }, [commit, handoff, scrollY]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('has-touch-school-tour');
    const update = () => {
      if (track.current && scene.current) geometry.current = { start: track.current.getBoundingClientRect().top + window.scrollY, height: scene.current.offsetHeight };
      if (rail.current) {
        const width = rail.current.clientWidth;
        railTargets.current = Array.from(rail.current.querySelectorAll<HTMLElement>('[data-school-index]'), button => button.offsetLeft + button.offsetWidth / 2 - width / 2);
      }
      const box = measurement.current?.getBoundingClientRect();
      if (box) { handoff.targetX.set(box.left + box.width / 2); handoff.targetY.set(box.top - (scene.current?.getBoundingClientRect().top ?? 0) + box.height / 2); }
      setLandscape(window.matchMedia('(orientation: landscape)').matches);
    };
    const observer = new ResizeObserver(update);
    if (scene.current) observer.observe(scene.current);
    update();
    return () => { root.classList.remove('has-touch-school-tour'); observer.disconnect(); entry.current?.stop(); };
  }, [handoff, logosReady]);

  useEffect(() => {
    const nav = rail.current;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => nav?.scrollTo({ left: railTargets.current[activeIndex] ?? 0, behavior: 'instant' }));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [activeIndex, logosReady]);

  useEffect(() => {
    const landing = track.current?.closest('.institutional-landing');
    if (!landing) return;
    let down: { x: number; y: number; inTour: boolean; inHero: boolean } | null = null;
    let timer = 0;
    const settle = (event?: Event) => {
      if (event && event.target !== document && event.target !== window) return;
      if (performance.now() < navigationUntil.current) return;
      if (!track.current || !scene.current) return;
      const { start, height } = geometry.current;
      const top = start - window.scrollY;
      if (top <= 1 && top > -7 * height + 1) commit(Math.round(-top / height));
    };
    const onScroll = () => { window.clearTimeout(timer); timer = window.setTimeout(settle, 140); };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      const target = event.target as HTMLElement;
      const { start, height } = geometry.current;
      const inTour = !!target.closest('.touch-school-stage') && window.scrollY >= start - 1 && window.scrollY <= start + 6 * height + 1;
      down = { x: event.clientX, y: event.clientY, inTour, inHero: !!target.closest('.institutional-landing-hero') };
    };
    const pointerUp = (event: PointerEvent) => {
      if (!down) return;
      const origin = down; down = null;
      const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
      if (Math.abs(dy) < 40 || Math.abs(dx) >= Math.abs(dy)) return;
      if (origin.inTour) go(active.current + (dy < 0 ? 1 : -1));
      else if (origin.inHero && dy < 0) go(0);
    };
    const click = (event: Event) => {
      if ((event.target as HTMLElement).closest('a[href="#escuelas"]')) { event.preventDefault(); go(0); }
    };
    const cancel = () => { down = null; };
    const keyboard = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).matches('input, textarea, select')) return;
      const { start, height } = geometry.current;
      if (window.scrollY < start - 1 || window.scrollY > start + 6 * height + 1) return;
      const delta = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
      if (delta) { event.preventDefault(); go(active.current + delta); }
    };
    landing.addEventListener('pointerdown', pointerDown as EventListener);
    landing.addEventListener('pointerup', pointerUp as EventListener);
    landing.addEventListener('pointercancel', cancel);
    landing.addEventListener('click', click);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', settle);
    window.addEventListener('keydown', keyboard);
    settle();
    return () => {
      window.clearTimeout(timer);
      landing.removeEventListener('pointerdown', pointerDown as EventListener);
      landing.removeEventListener('pointerup', pointerUp as EventListener);
      landing.removeEventListener('pointercancel', cancel);
      landing.removeEventListener('click', click);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', settle);
      window.removeEventListener('keydown', keyboard);
    };
  }, [commit, go]);

  return <div ref={track} id="escuelas" className="touch-school-track">
    {SCHOOLS.map((school, index) => <div className="touch-school-snap" key={school.code} style={{ top: `${index * 100}svh` }} aria-hidden="true" />)}
    <div ref={scene} className="touch-school-stage" style={styleFor(activeSchool)} data-school={activeSchool.code} data-active-index={activeIndex} aria-busy={!logosReady} role="region" aria-label="Recorrido por las escuelas">
      {logosReady && <>
        <SchoolGraphBackdrop school={activeSchool.code === 'ECIAA' ? 'ECAA' : activeSchool.code} className="touch-school-graph" anchorX={landscape ? .77 : .5} anchorY={.58} />
        <nav ref={rail} className="touch-school-navigation" aria-label="Escuelas de investigación"><ol>{SCHOOLS.map((school, index) => <li key={school.code}><button type="button" data-school-index={index} aria-current={index === activeIndex ? 'step' : undefined} aria-label={`Ir a ${school.name}`} onClick={() => go(index)} style={styleFor(school)}><img src={SCHOOL_LOGOS[school.code]} width={28} height={28} alt="" /><span>{acronym(school)}</span></button></li>)}</ol></nav>
        {SCHOOLS.map((school, index) => <TouchSlide key={`${school.code}-0`} school={school} active={index === activeIndex} handoff={handoff} onSelect={onSelect} />)}
        <div className="touch-school-handoff-layout" aria-hidden="true"><div /><div className="touch-school-mascot" ref={measurement}>
          <motion.div className="touch-school-base" style={{ opacity: baseOpacity, scale: baseScale }}><img src={BASE_MASCOT} width={768} height={768} alt="" /></motion.div>
          <motion.span className="touch-school-flash" style={{ opacity: flash }} />
        </div></div>
      </>}
    </div>
  </div>;
}
