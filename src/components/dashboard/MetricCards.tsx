import React from 'react';
import { SchoolMetrics } from '../../types';

export const MetricCards: React.FC<{ metrics: SchoolMetrics }> = ({ metrics }) => {
  const summary = [
    { value: metrics.totalPublications, label: 'Publicaciones' },
    { value: metrics.totalProjects, label: 'Proyectos' },
    { value: metrics.totalCitations, label: 'Citas registradas' },
    { value: metrics.hIndex, label: 'Índice h' },
  ];

  return (
    <section className="school-summary" aria-label="Resumen de la escuela">
      <div className="section-heading">
        <div>
          <h2>La escuela en cifras</h2>
        </div>
      </div>
      <dl className="metrics-strip">
        {summary.map(({ value, label }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
