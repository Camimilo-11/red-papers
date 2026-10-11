import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { SCHOOLS, type SchoolConfig } from './constants/schools';
import { InstitutionalLanding } from './components/institutional/InstitutionalLanding';
import { ensureFloatingSchoolLogosDecoded } from './assets/schoolLogos';

const PortalApp = lazy(() => import('./PortalApp'));
const SESSION_USER_KEY = 'red_papers_current_user_v1';

function currentSchoolFromSavedSession(): SchoolConfig | null {
  try {
    const user = JSON.parse(window.localStorage.getItem(SESSION_USER_KEY) || 'null') as { school?: string } | null;
    return SCHOOLS.find((school) => school.code === user?.school) ?? null;
  } catch {
    return null;
  }
}

export default function App() {
  const [selectedSchool, setSelectedSchool] = useState<SchoolConfig | null>(currentSchoolFromSavedSession);
  const returnToSchools = useCallback(() => setSelectedSchool(null), []);

  useEffect(() => {
    const shell = document.getElementById('simapc-startup');
    if (!shell) return;
    let hideTimer = 0;
    let removeTimer = 0;
    let cancelled = false;
    const hide = () => {
      if (cancelled) return;
      shell.setAttribute('aria-hidden', 'true');
      shell.classList.add('is-leaving');
      removeTimer = window.setTimeout(() => shell.remove(), 280);
    };

    if (selectedSchool) {
      hide();
    } else {
      void ensureFloatingSchoolLogosDecoded().then((ready) => {
        if (!ready || cancelled) return;
        const startup = window as Window & { __SIMAPC_STARTUP_END_AT?: number };
        const delay = Math.max(0, (startup.__SIMAPC_STARTUP_END_AT ?? performance.now()) - performance.now());
        hideTimer = window.setTimeout(hide, delay);
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [selectedSchool]);

  if (!selectedSchool) {
    return <InstitutionalLanding onSelect={setSelectedSchool} />;
  }

  return (
    <Suspense fallback={<main className="portal-loading" aria-live="polite">Abriendo el espacio de la escuela…</main>}>
      <PortalApp initialSchool={selectedSchool} onChangeSchool={returnToSchools} />
    </Suspense>
  );
}
