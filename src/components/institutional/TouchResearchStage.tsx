import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './TouchResearchStage.css';
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { SCHOOLS, type SchoolConfig } from '../../constants/schools';
import { RESEARCH_STAGE_SLIDES } from '../../constants/researchStageSlides';
import { ensureSchoolMascotDecoded, isSchoolMascotDecoded, scheduleNearbySchoolMascots, SCHOOL_LOGOS } from '../../assets/schoolLogos';
import { BASE_MASCOT, SCHOOL_MASCOTS } from '../../assets/schoolMascots';
import { SchoolGraphBackdrop } from '../SchoolGraphBackdrop';
import type { MascotHandoff } from './mascotHandoff';
import { ConstellationSparkles } from './ConstellationSparkles';
import type { MobileHandoffLogo } from './InstitutionalLanding';

const EASE = [.22, 1, .36, 1] as const;
const easeCurve = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  // Cubic-bezier(.22, 1, .36, 1), evaluated directly for per-frame motion values.
  const inv = 1 - t;
  return 3 * inv * inv * t + 3 * inv * t * t + t * t * t;
};
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const label = 'Ver investigaciones y proyectos';
const acronym = (school: SchoolConfig) => school.code === 'ECIAA' ? 'ECAA' : school.code;
const styleFor = (school: SchoolConfig) => ({
  '--school-accent': school.accent,
  '--school-ink': `color-mix(in srgb, ${school.accent} 42%, #111820)`,
} as React.CSSProperties);

const TouchSlide = React.memo(function TouchSlide({ school, active, handoff, onSelect, mobileTransition, reducedMotion, schoolFade, sharedEcaaMascotFade }: {
  school: SchoolConfig;
  active: boolean;
  handoff: MascotHandoff;
  onSelect: (school: SchoolConfig) => void;
  mobileTransition: boolean;
  reducedMotion: boolean;
  schoolFade: MotionValue<number>;
  sharedEcaaMascotFade: MotionValue<number>;
}) {
  const blockOpacity = useMotionValue(active ? .65 : 0);
  const activeMotion = useMotionValue(active ? 1 : 0);
  const y = useMotionValue(12);
  const ownMascotFade = useMotionValue(isSchoolMascotDecoded(school.code) ? 1 : 0);
  const isSharedEcaaFade = mobileTransition && school.code === 'ECIAA';
  const mascotFade = isSharedEcaaFade ? sharedEcaaMascotFade : ownMascotFade;
  const [mascotDecoded, setMascotDecoded] = useState(() => isSchoolMascotDecoded(school.code));
  const mascotAnimation = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    if (mobileTransition) return;
    if (active) y.set(12);
    const fade = animate(blockOpacity, active ? 1 : 0, { duration: .35, ease: EASE });
    const shift = animate(y, active ? 0 : -12, { duration: .35, ease: EASE });
    return () => { fade.stop(); shift.stop(); };
  }, [active, blockOpacity, mobileTransition, y]);
  useLayoutEffect(() => {
    activeMotion.set(active ? 1 : 0);
  }, [active, activeMotion]);
  useEffect(() => {
    mascotAnimation.current?.stop();
    if (!active) {
      if (isSharedEcaaFade) return;
      mascotAnimation.current = animate(mascotFade, 0, { duration: .35, ease: EASE });
      return () => mascotAnimation.current?.stop();
    }
    let mounted = true;
    void ensureSchoolMascotDecoded(school.code).then((ready) => {
      if (!mounted || !ready) return;
      setMascotDecoded(true);
      mascotAnimation.current = animate(mascotFade, 1, { duration: mobileTransition ? .25 : .35, ease: EASE });
    });
    return () => { mounted = false; mascotAnimation.current?.stop(); };
  }, [active, isSharedEcaaFade, mobileTransition, school.code, mascotFade]);
  const handoffOpacity = useTransform(handoff.progress, mobileTransition ? (reducedMotion ? [0, 1] : [.72, 1]) : [.84, 1], [0, 1]);
  const opacity = useTransform(() => mascotFade.get() * (school.code === 'ECIAA' ? handoffOpacity.get() : 1));
  const titleOpacity = useTransform(handoff.progress, (progress) => reducedMotion ? clamp(progress) : clamp((progress - .66) / .2));
  const titleY = useTransform(handoff.progress, (progress) => reducedMotion ? 0 : 16 * (1 - easeCurve((progress - .66) / .2)));
  const buttonOpacity = useTransform(handoff.progress, (progress) => reducedMotion ? clamp(progress) : clamp((progress - .73) / .2));
  const buttonY = useTransform(handoff.progress, (progress) => reducedMotion ? 0 : 16 * (1 - easeCurve((progress - .73) / .2)));
  const mobileOpacity = useTransform<number, number>([handoff.progress, schoolFade, activeMotion], ([progress, fade, isActive]) => isActive * (reducedMotion ? clamp(progress) : fade));
  const slide = RESEARCH_STAGE_SLIDES[school.code][0];
  return <motion.section className="touch-school-slide" data-school={school.code} inert={!active} aria-hidden={!active}
    style={{ ...styleFor(school), opacity: mobileTransition ? mobileOpacity : blockOpacity, y: mobileTransition ? 0 : y, pointerEvents: active ? 'auto' : 'none' }}>
    <motion.div className="touch-school-copy" style={mobileTransition ? { opacity: titleOpacity, y: titleY } : undefined}>
      <div className="touch-school-identity"><img src={SCHOOL_LOGOS[school.code]} width={44} height={44} alt="" /><p>{acronym(school)}</p></div>
      <h2>{slide.title.split(' ').map((word, index, words) => <React.Fragment key={index}><span className={slide.accentWords.includes(index) ? 'is-accent' : undefined}>{word}</span>{index < words.length - 1 ? ' ' : ''}</React.Fragment>)}</h2>
    </motion.div>
    <motion.div className="touch-school-mascot" style={{ opacity }} aria-hidden="true"><span className="research-stage-mascot-shadow" />{mascotDecoded && <img src={SCHOOL_MASCOTS[school.code]} width={768} height={768} alt="" draggable={false} />}</motion.div>
    <motion.button className="touch-school-cta" type="button" aria-label={label + ' de ' + school.name} onClick={() => onSelect(school)} style={mobileTransition ? { opacity: buttonOpacity, y: buttonY } : undefined}>{label}<span aria-hidden="true">→</span></motion.button>
  </motion.section>;
});

/** Touch gestures commit once on release; school content never follows a partial drag. */
export function TouchResearchStage({ onSelect, logosReady, handoff, scrollY, mobileTransitionEnabled, handoffLogos, interactionEnabled, reducedMotion }: {
  onSelect: (school: SchoolConfig) => void;
  logosReady: boolean;
  handoff: MascotHandoff;
  scrollY: MotionValue<number>;
  mobileTransitionEnabled: boolean;
  handoffLogos?: Map<SchoolConfig['code'], MobileHandoffLogo>;
  interactionEnabled: boolean;
  reducedMotion: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const railTargets = useRef<number[]>([]);
  const measurement = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const displayIndexRef = useRef(0);
  const [landscape, setLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches);
  const active = useRef(0);
  const activeIndexMotion = useMotionValue(0);
  const geometry = useRef({ start: 0, height: window.innerHeight });
  const navigationUntil = useRef(0);
  const entered = useRef(false);
  const ready = useRef(logosReady);
  ready.current = logosReady;
  const transitionAnimating = useRef(false);
  const destination = useRef<'schools' | 'welcome'>('schools');
  const queuedIntent = useRef<number | null>(null);
  const lockedScrollY = useRef(0);
  const transitionControl = useRef<ReturnType<typeof animate> | null>(null);
  const transitionGeneration = useRef(0);
  const slideControls = useRef<ReturnType<typeof animate>[]>([]);
  const entry = useRef<ReturnType<typeof animate> | null>(null);
  const flash = useMotionValue(0);
  const schoolFade = useMotionValue(1);
  const sharedEcaaMascotFade = useMotionValue(isSchoolMascotDecoded('ECIAA') ? 1 : 0);
  const clipOriginX = useMotionValue(window.innerWidth / 2);
  const clipOriginY = useMotionValue(window.innerHeight / 2);
  const clipLimit = useMotionValue(Math.hypot(window.innerWidth, window.innerHeight) * 2);
  const activeSchool = SCHOOLS[activeIndex];
  const stageClipPath = useTransform<number, string>([handoff.progress, clipOriginX, clipOriginY, clipLimit], ([progress, x, y, limit]) => {
    const radius = limit * clamp(progress / .34);
    return `circle(${radius}px at ${x}px ${y}px)`;
  });
  const graphProgress = useTransform(handoff.progress, (progress) => reducedMotion ? clamp(progress) : clamp((progress - .33) / .34));
  const mobileBaseOpacity = useTransform<number, number>([handoff.progress, sharedEcaaMascotFade, activeIndexMotion], ([progress, mascotFade, schoolIndex]) => {
    if (schoolIndex !== 0) return 0;
    const baseEntry = reducedMotion ? clamp(progress) : clamp((progress - .32) / .35);
    const outfitEntry = reducedMotion ? clamp(progress) : clamp((progress - .72) / .28);
    return baseEntry * (1 - mascotFade * outfitEntry);
  });
  const mobileBaseScale = useTransform(handoff.progress, (progress) => reducedMotion ? 1 : .9 + .1 * clamp((progress - .33) / .34));
  const mobileFlashOpacity = useTransform(handoff.progress, (progress) => {
    if (reducedMotion) return 0;
    const pulse = progress <= .32 || progress >= .61 ? 0 : progress <= .43 ? (progress - .32) / .11 : ( .61 - progress) / .18;
    return clamp(pulse);
  });
  const mobileFlashScale = useTransform(handoff.progress, (progress) => reducedMotion ? 1 : .6 + .7 * clamp((progress - .32) / .29));
  const mobileNavOpacity = useTransform(handoff.progress, (progress) => reducedMotion ? clamp(progress) : clamp((progress - .8) / .2));
  const mobileNavY = useTransform(handoff.progress, (progress) => reducedMotion ? 0 : 16 * (1 - clamp((progress - .8) / .2)));
  const legacyBaseOpacity = useTransform(handoff.progress, [0, .72, .84, 1], [0, 0, 1, 0]);
  const legacyBaseScale = useTransform(handoff.progress, [.72, 1], [.9, 1]);
  const executeIntentRef = useRef<(index: number) => void>(() => {});
  const finishTransitionRef = useRef<() => void>(() => {});
  const retargetRef = useRef<(to: number) => void>(() => {});
  useEffect(() => { scheduleNearbySchoolMascots(activeSchool.code); }, [activeSchool.code]);

  const measureHandoff = useCallback(() => {
    const stage = scene.current;
    const mascot = measurement.current;
    if (!stage || !mascot) return;
    const stageRect = stage.getBoundingClientRect();
    const mascotRect = mascot.getBoundingClientRect();
    handoff.targetX.set(mascotRect.left + mascotRect.width / 2);
    handoff.targetY.set(mascotRect.top - stageRect.top + mascotRect.height / 2);
    const setCircleLimit = (centerX: number, centerY: number) => {
      const farthestCorner = Math.max(
        Math.hypot(centerX, centerY),
        Math.hypot(window.innerWidth - centerX, centerY),
        Math.hypot(centerX, window.innerHeight - centerY),
        Math.hypot(window.innerWidth - centerX, window.innerHeight - centerY),
      );
      clipLimit.set(farthestCorner + 2);
    };
    if (handoff.progress.get() > .01) return;
    const points: Array<{ x: number; y: number }> = [];
    SCHOOLS.forEach((school) => {
      const logo = handoffLogos?.get(school.code);
      const rect = logo?.element.getBoundingClientRect();
      if (!logo || !rect) return;
      const x = rect.left + rect.width / 2;
      const y = rect.top + window.scrollY + rect.height / 2;
      logo.sourceX.set(x);
      logo.sourceY.set(y);
      logo.sourceSize.set(rect.width);
      points.push({ x, y: y - window.scrollY });
    });
    if (points.length) {
      const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
      const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
      clipOriginX.set(centerX);
      clipOriginY.set(centerY);
      setCircleLimit(centerX, centerY);
    } else {
      setCircleLimit(window.innerWidth / 2, window.innerHeight / 2);
    }
  }, [clipLimit, clipOriginX, clipOriginY, handoff, handoffLogos]);

  const animateDisplayedSchool = useCallback((next: number) => {
    if (next === displayIndexRef.current) return;
    slideControls.current.forEach((control) => control.stop());
    if (!mobileTransitionEnabled) {
      displayIndexRef.current = next;
      setDisplayIndex(next);
      return;
    }
    const fadeOut = animate(schoolFade, 0, {
      duration: .12,
      ease: EASE,
      onComplete: () => {
        displayIndexRef.current = next;
        setDisplayIndex(next);
        slideControls.current = [animate(schoolFade, 1, { duration: .2, ease: EASE })];
      },
    });
    slideControls.current = [fadeOut];
  }, [mobileTransitionEnabled, schoolFade]);

  const finishTransition = useCallback(() => {
    if (!transitionAnimating.current) return;
    const destinationAtFinish = destination.current;
    entered.current = destinationAtFinish === 'schools';
    const y = destinationAtFinish === 'schools'
      ? geometry.current.start + active.current * geometry.current.height
      : 0;
    lockedScrollY.current = y;
    window.scrollTo({ top: y, behavior: 'instant' });
    scrollY.set(window.scrollY);
    let alignedFrames = 0;
    let attempts = 0;
    const releaseWhenAligned = () => requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - y) > 1) {
        window.scrollTo({ top: y, behavior: 'instant' });
        alignedFrames = 0;
        attempts += 1;
      } else {
        alignedFrames += 1;
      }
      if (alignedFrames < 2 && attempts < 8) {
        releaseWhenAligned();
        return;
      }
      const landing = track.current?.closest<HTMLElement>('.institutional-landing');
      landing?.classList.remove('is-mobile-school-transitioning');
      document.documentElement.classList.remove('simapc-mobile-transition-lock');
      transitionAnimating.current = false;
      scene.current?.setAttribute('data-transitioning', 'false');
      const lastIntent = queuedIntent.current;
      queuedIntent.current = null;
      if (lastIntent === null) return;
      const remainsOnSameSide = destinationAtFinish === 'schools' ? lastIntent >= 0 : lastIntent < 0;
      if (!remainsOnSameSide || (destinationAtFinish === 'schools' && lastIntent !== active.current)) executeIntentRef.current(lastIntent);
    });
    releaseWhenAligned();
  }, [scrollY]);
  finishTransitionRef.current = finishTransition;

  const retargetTransition = useCallback((target: number) => {
    const destinationSide = target === 1 ? 'schools' : 'welcome';
    destination.current = destinationSide;
    const generation = ++transitionGeneration.current;
    transitionControl.current?.stop();
    const current = handoff.progress.get();
    const distance = Math.abs(target - current);
    if (distance < .002) {
      finishTransitionRef.current();
      return;
    }
    const duration = reducedMotion ? .2 * distance : (target === 1 ? .9 : .6) * distance;
    transitionControl.current = animate(handoff.progress, target, {
      duration,
      ease: 'linear',
      onComplete: () => {
        if (generation === transitionGeneration.current) finishTransitionRef.current();
      },
    });
  }, [handoff.progress, reducedMotion]);
  retargetRef.current = retargetTransition;

  const setTransitionLock = useCallback((locked: boolean) => {
    const landing = track.current?.closest<HTMLElement>('.institutional-landing');
    landing?.classList.toggle('is-mobile-school-transitioning', locked);
    document.documentElement.classList.toggle('simapc-mobile-transition-lock', locked);
    scene.current?.setAttribute('data-transitioning', String(locked));
    if (locked) lockedScrollY.current = window.scrollY;
    transitionAnimating.current = locked;
  }, []);

  const beginTransition = useCallback((side: 'schools' | 'welcome') => {
    if (!mobileTransitionEnabled) return false;
    if (transitionAnimating.current) {
      queuedIntent.current = side === 'schools' ? Math.max(0, active.current) : -1;
      retargetRef.current(side === 'schools' ? 1 : 0);
      return true;
    }
    if (side === 'schools') {
      active.current = 0;
      activeIndexMotion.set(0);
      setActiveIndex(0);
    }
    setTransitionLock(true);
    retargetRef.current(side === 'schools' ? 1 : 0);
    return true;
  }, [activeIndexMotion, handoff.progress, measureHandoff, mobileTransitionEnabled, setTransitionLock]);

  const queueTransitionIntent = useCallback((index: number) => {
    queuedIntent.current = Math.max(-1, Math.min(SCHOOLS.length - 1, index));
    const wantsSchools = index >= 0;
    const isTransitioningToSchools = destination.current === 'schools';
    if (wantsSchools !== isTransitioningToSchools) retargetRef.current(wantsSchools ? 1 : 0);
  }, []);

  const commit = useCallback((index: number) => {
    if (!ready.current || !interactionEnabled) return;
    const next = Math.max(0, Math.min(SCHOOLS.length - 1, index));
    if (transitionAnimating.current) { queueTransitionIntent(next); return; }
    if (entered.current && active.current === next) return;
    if (mobileTransitionEnabled && !entered.current && next === 0) { beginTransition('schools'); return; }
    if (!entered.current && next === 0) {
      entered.current = true;
      entry.current?.stop();
      entry.current = animate(handoff.progress, [0, .72, .84, 1], { duration: .9, times: [0, .55, .7, 1], ease: EASE });
      animate(flash, [0, 1, 0], { duration: .34, delay: .32, ease: EASE });
    } else if (!mobileTransitionEnabled && (next > 0 || handoff.progress.get() === 0)) {
      entered.current = true;
      entry.current?.stop();
      handoff.progress.set(1);
    }
    active.current = next;
    activeIndexMotion.set(next);
    animateDisplayedSchool(next);
    scrollY.set(geometry.current.start + next * geometry.current.height);
    setActiveIndex(next);
  }, [activeIndexMotion, animateDisplayedSchool, beginTransition, flash, handoff, interactionEnabled, mobileTransitionEnabled, queueTransitionIntent, scrollY]);

  const go = useCallback((index: number) => {
    if (!track.current || !ready.current || !interactionEnabled) return;
    const { start, height } = geometry.current;
    navigationUntil.current = performance.now() + 240;
    if (transitionAnimating.current) { queueTransitionIntent(index); return; }
    if (index < 0) {
      if (mobileTransitionEnabled && entered.current && active.current === 0) { beginTransition('welcome'); return; }
      window.scrollTo({ top: 0, behavior: 'instant' });
      entered.current = false;
      entry.current?.stop();
      handoff.progress.set(0);
      scrollY.set(0);
    } else if (index >= SCHOOLS.length) {
      window.scrollTo({ top: start + SCHOOLS.length * height, behavior: 'instant' });
    } else {
      if (mobileTransitionEnabled && !entered.current && active.current === 0 && index === 0) { beginTransition('schools'); return; }
      commit(index);
      window.scrollTo({ top: start + index * height, behavior: 'instant' });
    }
  }, [beginTransition, commit, handoff.progress, interactionEnabled, mobileTransitionEnabled, queueTransitionIntent, scrollY]);
  executeIntentRef.current = go;

  useLayoutEffect(() => {
    if (!interactionEnabled) return;
    const root = document.documentElement;
    root.classList.add('has-touch-school-tour');
    const update = () => {
      if (track.current && scene.current) geometry.current = { start: track.current.getBoundingClientRect().top + window.scrollY, height: scene.current.offsetHeight };
      if (rail.current) {
        const width = rail.current.clientWidth;
        railTargets.current = Array.from(rail.current.querySelectorAll<HTMLElement>('[data-school-index]'), button => button.offsetLeft + button.offsetWidth / 2 - width / 2);
      }
      measureHandoff();
      setLandscape(window.matchMedia('(orientation: landscape)').matches);
    };
    const observer = new ResizeObserver(update);
    if (scene.current) observer.observe(scene.current);
    window.addEventListener('resize', update);
    update();
    return () => {
      root.classList.remove('has-touch-school-tour');
      observer.disconnect();
      window.removeEventListener('resize', update);
      entry.current?.stop();
      transitionGeneration.current += 1;
      transitionControl.current?.stop();
      slideControls.current.forEach((control) => control.stop());
      const landing = track.current?.closest<HTMLElement>('.institutional-landing');
      landing?.classList.remove('is-mobile-school-transitioning');
      document.documentElement.classList.remove('simapc-mobile-transition-lock');
    };
  }, [interactionEnabled, measureHandoff]);

  useEffect(() => {
    const nav = rail.current;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => nav?.scrollTo({ left: railTargets.current[activeIndex] ?? 0, behavior: 'instant' }));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [activeIndex, logosReady]);

  useEffect(() => {
    if (!interactionEnabled) return;
    const landing = track.current?.closest('.institutional-landing');
    if (!landing) return;
    let down: { x: number; y: number; inTour: boolean; inHero: boolean } | null = null;
    let timer = 0;
    const settle = (event?: Event) => {
      if (event && event.target !== document && event.target !== window) return;
      if (transitionAnimating.current || performance.now() < navigationUntil.current) return;
      if (!track.current || !scene.current) return;
      const { start, height } = geometry.current;
      const top = start - window.scrollY;
      if (top <= 1 && top > -7 * height + 1) commit(Math.round(-top / height));
    };
    const onScroll = () => {
      if (transitionAnimating.current) {
        if (Math.abs(window.scrollY - lockedScrollY.current) > 1) {
          window.scrollTo({ top: lockedScrollY.current, behavior: 'instant' });
          scrollY.set(lockedScrollY.current);
        }
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 140);
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      const target = event.target as HTMLElement;
      const stage = target.closest<HTMLElement>('.touch-school-stage');
      const stageBounds = stage?.getBoundingClientRect();
      const inTour = !!stageBounds && stageBounds.top < window.innerHeight && stageBounds.bottom > 0;
      down = { x: event.clientX, y: event.clientY, inTour, inHero: !!target.closest('.institutional-landing-hero') };
    };
    const pointerUp = (event: PointerEvent) => {
      if (!down) return;
      const origin = down; down = null;
      const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
      if (Math.abs(dy) < 40 || Math.abs(dx) >= Math.abs(dy)) return;
      if (transitionAnimating.current) {
        if (origin.inTour) queueTransitionIntent(active.current + (dy < 0 ? 1 : -1));
        else if (origin.inHero) queueTransitionIntent(dy < 0 ? 0 : -1);
      } else if (origin.inTour) go(active.current + (dy < 0 ? 1 : -1));
      else if (origin.inHero && dy < 0) go(0);
    };
    const wheel = (event: WheelEvent) => {
      if (!mobileTransitionEnabled || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (transitionAnimating.current) {
        event.preventDefault();
        queueTransitionIntent(active.current + (event.deltaY > 0 ? 1 : -1));
        return;
      }
      const { start } = geometry.current;
      if (event.deltaY > 0 && window.scrollY < start - 1) {
        event.preventDefault();
        go(0);
      } else if (event.deltaY < 0 && entered.current && active.current === 0 && window.scrollY <= start + 1) {
        event.preventDefault();
        go(-1);
      }
    };
    const click = (event: Event) => {
      if ((event.target as HTMLElement).closest('a[href="#escuelas"]')) { event.preventDefault(); go(0); }
    };
    const cancel = () => { down = null; };
    const keyboard = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).matches('input, textarea, select')) return;
      const { start, height } = geometry.current;
      if (!transitionAnimating.current && (window.scrollY < start - 1 || window.scrollY > start + 6 * height + 1)) return;
      const delta = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
      if (delta) { event.preventDefault(); go(active.current + delta); }
    };
    landing.addEventListener('pointerdown', pointerDown as EventListener);
    landing.addEventListener('pointerup', pointerUp as EventListener);
    landing.addEventListener('pointercancel', cancel);
    landing.addEventListener('click', click);
    landing.addEventListener('wheel', wheel as EventListener, { passive: false, capture: true });
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
      landing.removeEventListener('wheel', wheel as EventListener, { capture: true } as EventListenerOptions);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', settle);
      window.removeEventListener('keydown', keyboard);
    };
  }, [commit, go, interactionEnabled, mobileTransitionEnabled, queueTransitionIntent, scrollY]);

  return <div ref={track} id="escuelas" className="touch-school-track">
    {SCHOOLS.map((school, index) => <div className="touch-school-snap" key={school.code} style={{ top: `${index * 100}svh` }} aria-hidden="true" />)}
    <motion.div ref={scene} className="touch-school-stage" style={{ ...styleFor(activeSchool), ...(mobileTransitionEnabled && reducedMotion ? { opacity: handoff.progress } : {}) }} data-school={activeSchool.code} data-active-index={activeIndex} data-transitioning="false" aria-busy={!logosReady} role="region" aria-label="Recorrido por las escuelas">
      <motion.div className="touch-school-tint" style={{ ...styleFor(activeSchool), clipPath: mobileTransitionEnabled && !reducedMotion ? stageClipPath : 'none' }} aria-hidden="true" />
      {logosReady && <>
        <motion.div className="touch-school-graph-transition" style={mobileTransitionEnabled ? { opacity: graphProgress } : undefined}><SchoolGraphBackdrop school={activeSchool.code === 'ECIAA' ? 'ECAA' : activeSchool.code} className="touch-school-graph" anchorX={landscape ? .77 : .5} anchorY={.58} /></motion.div>
        <motion.nav ref={rail} className="touch-school-navigation" aria-label="Escuelas" style={mobileTransitionEnabled ? { opacity: mobileNavOpacity, y: mobileNavY } : undefined}><ol>{SCHOOLS.map((school, index) => <li key={school.code}><button type="button" data-school-index={index} aria-current={index === activeIndex ? 'step' : undefined} aria-label={`Ir a ${school.name}`} onClick={() => go(index)} style={styleFor(school)}><img src={SCHOOL_LOGOS[school.code]} width={28} height={28} alt="" /><span>{acronym(school)}</span></button></li>)}</ol></motion.nav>
        {(mobileTransitionEnabled ? [SCHOOLS[displayIndex]] : SCHOOLS).map((school) => {
          const index = SCHOOLS.indexOf(school);
          return <TouchSlide key={`${school.code}-0`} school={school} active={mobileTransitionEnabled || index === displayIndex} handoff={handoff} onSelect={onSelect} mobileTransition={mobileTransitionEnabled} reducedMotion={reducedMotion} schoolFade={schoolFade} sharedEcaaMascotFade={sharedEcaaMascotFade} />;
        })}
        <div className="touch-school-handoff-layout" aria-hidden="true"><div /><div className="touch-school-mascot" ref={measurement}>
          <motion.div className="touch-school-base" style={{ opacity: mobileTransitionEnabled ? mobileBaseOpacity : legacyBaseOpacity, scale: mobileTransitionEnabled ? mobileBaseScale : legacyBaseScale }}><img src={BASE_MASCOT} width={768} height={768} alt="" /></motion.div>
          <motion.span className="touch-school-flash" style={{ opacity: mobileTransitionEnabled ? mobileFlashOpacity : flash, scale: mobileTransitionEnabled ? mobileFlashScale : 1 }}><ConstellationSparkles /></motion.span>
        </div></div>
      </>}
    </motion.div>
  </div>;
}
