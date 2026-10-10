import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { SCHOOLS, SchoolConfig } from '../../constants/schools';
import { YachayLogo } from './SchoolLogo';

function SchoolSelectorMark({ school, size = 76 }: { school: SchoolConfig; size?: number }) {
  return (
    <span
      className="school-symbol"
      role="img"
      aria-label={`Emblema de ${school.name}`}
      style={{ width: size, height: size }}
    >
      <img
        className="school-symbol-svg"
        src={`./assets/school-symbols/${school.code}.svg`}
        alt=""
        draggable={false}
      />
    </span>
  );
}

export function SchoolSelector({ onSelect }: { onSelect: (school: SchoolConfig) => void }) {
  return (
    <div className="school-selector-page">
      <header className="school-selector-header">
        <a className="school-selector-brand" href="#inicio" aria-label="SIMAPC, inicio">
          <YachayLogo width={136} />
          <span>SIMAPC<small>Sistema de Información, Monitoreo y Administración de la Producción Científica</small></span>
        </a>
      </header>

      <main id="inicio" className="school-selector-main">
        <p className="school-selector-eyebrow">PORTAL DE INVESTIGACIÓN</p>
        <h1>Seleccione su escuela</h1>
        <p className="school-selector-intro">Consulte publicaciones, proyectos y líneas de investigación de la comunidad académica.</p>

        <section className="school-selector-grid" aria-label="Escuelas disponibles">
          {SCHOOLS.map((school) => (
            <article className="school-selector-card" key={school.code} style={{ '--school-accent': school.accent, '--accent': `color-mix(in srgb, ${school.accent} 45%, #292522)` } as React.CSSProperties}>
              <div className="school-selector-logo"><SchoolSelectorMark school={school} /></div>
              <span className="school-selector-code">{school.code}</span>
              <h2>{school.name}</h2>
              <button type="button" className="school-selector-enter" onClick={() => onSelect(school)}>
                Ingresar a esta escuela <ArrowRight size={18} aria-hidden="true" />
              </button>
              <details className="school-selector-lines">
                <summary><span>Ver líneas de investigación</span><ChevronDown size={16} aria-hidden="true" /></summary>
                <ul>{school.researchLines.map((line) => <li key={line}>{line}</li>)}</ul>
              </details>
            </article>
          ))}
        </section>
      </main>

      <footer className="school-selector-footer">
        <span>SIMAPC · Universidad Yachay Tech</span>
      </footer>
    </div>
  );
}
