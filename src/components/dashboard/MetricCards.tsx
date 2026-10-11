import React from 'react';
import { BookOpen, FolderOpen, GitBranch, Quote } from 'lucide-react';
import { SchoolMetrics } from '../../types';
import { SchoolConfig } from '../../constants/schools';
import { SchoolIconTile } from '../institutional/SchoolLogo';
import './MetricCards.css';

const numberFormat = new Intl.NumberFormat('es-EC');

export const MetricCards: React.FC<{ metrics: SchoolMetrics; school: SchoolConfig }> = ({ metrics, school }) => {
  const summary = [
    { id: 'publications', value: metrics.totalPublications, label: 'Publicaciones', icon: BookOpen },
    { id: 'projects', value: metrics.totalProjects, label: 'Proyectos', icon: FolderOpen },
    { id: 'citations', value: metrics.totalCitations, label: 'Citas registradas', icon: Quote },
    { id: 'research-lines', value: metrics.researchLinesWithProduction, label: 'Líneas con producción', icon: GitBranch },
  ];

  return (
    <section className="school-summary school-summary-overview" aria-label="Resumen de la escuela" aria-labelledby="school-summary-title">
      <header className="school-summary-heading">
        <div className="school-summary-heading-copy">
          <span className="school-summary-code">{school.code}</span>
          <h1 id="school-summary-title">La escuela en cifras</h1>
        </div>
        <div className="school-summary-emblem" aria-hidden="true">
          <SchoolIconTile school={school} size={48} />
        </div>
      </header>
      <dl className="school-metrics-grid">
        {summary.map(({ id, value, label, icon: Icon }) => (
          <div key={id} className="school-metric" data-metric={id}>
            <dt>
              <span>{label}</span>
              <span className="school-metric-icon" aria-hidden="true"><Icon size={19} strokeWidth={1.8} /></span>
            </dt>
            <dd>{numberFormat.format(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
