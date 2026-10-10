import React from 'react';
import { SchoolConfig, UNIVERSITY_HOME_URL } from '../../constants/schools';

export function SchoolLogo({ school, className = '', scale = 1 }: { school: SchoolConfig; className?: string; scale?: number }) {
  const { x, y } = school.logoCrop;
  return (
    <span className={`school-logo-crop ${className}`} role="img" aria-label={school.name} style={{ width: school.logoCrop.width * scale, height: school.logoCrop.height * scale }}>
      <img
        className="school-logo-sheet"
        src="./assets/school-logos.png"
        alt=""
        style={{ left: -x * scale, top: -y * scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      />
    </span>
  );
}

export function SchoolIconTile({ school, className = '', size = 112 }: { school: SchoolConfig; className?: string; size?: number }) {
  const { x, y } = school.iconTilePosition;
  const scale = size / 113;
  return (
    <span
      className={`school-icon-crop ${className}`}
      role="img"
      aria-label={`Logo de ${school.name}`}
      style={{ width: 113 * scale, height: 112 * scale }}
    >
      <img
        className="school-icon-sheet"
        src="./assets/school-icon-tiles.png"
        alt=""
        style={{ left: -x * scale, top: -y * scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      />
    </span>
  );
}

export function UniversityLogoLink({ className = '' }: { className?: string }) {
  return (
    <a
      className={`university-logo-link ${className}`}
      href={UNIVERSITY_HOME_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visitar el sitio oficial de la Universidad Yachay Tech"
    >
      <span className="university-logo-crop" aria-hidden="true">
        <img src="./assets/university-logo.png" alt="" />
      </span>
      <span>Universidad Yachay Tech <span aria-hidden="true">↗</span></span>
    </a>
  );
}
