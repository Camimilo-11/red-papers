import React from 'react';
import { SchoolMetrics } from '../../types';
import { SchoolConfig } from '../../constants/schools';
import { SchoolIconTile } from '../institutional/SchoolLogo';
import './MetricCards.css';

const numberFormat = new Intl.NumberFormat('es-EC');

export const MetricCards: React.FC<{ metrics: SchoolMetrics; school: SchoolConfig }> = ({ metrics, school }) => {
  const summary = [
    { id: 'publications', value: metrics.totalPublications, label: 'Publicaciones' },
    { id: 'projects', value: metrics.totalProjects, label: 'Proyectos' },
    { id: 'citations', value: metrics.totalCitations, label: 'Citas registradas' },
    { id: 'research-lines', value: metrics.researchLinesWithProduction, label: 'Líneas con producción' },
  ];

  return (
    <section className="school-summary school-summary-overview" aria-label="Resumen de la escuela" aria-labelledby="school-summary-title">
      <header className="school-summary-heading">
        <div className="school-summary-heading-copy">
          <h1 id="school-summary-title">La escuela en cifras</h1>
        </div>
        <div className="school-summary-emblem" aria-hidden="true">
          <SchoolIconTile school={school} size={72} />
        </div>
      </header>
      <dl className="school-metrics-grid">
        {summary.map(({ id, value, label }) => (
          <div key={id} className="school-metric" data-metric={id}>
            <dt>{label}</dt>
            <dd>{numberFormat.format(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
