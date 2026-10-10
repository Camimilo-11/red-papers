import React from 'react';
import { SchoolConfig, UNIVERSITY_HOME_URL } from '../../constants/schools';
import { EcmcLogo } from '../../assets/EcmcLogo';

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

export function SchoolEmblem({ school, size = 260 }: { school: SchoolConfig; size?: number }) {
  if (school.code === 'ECMC') {
    return <EcmcLogo className="school-emblem-ecmc" size={size} variant="white" />;
  }

  const { x, y, width, height } = school.emblemCrop;
  const scale = size / Math.max(width, height);
  return (
    <span
      className="school-emblem-crop"
      role="img"
      aria-label={`Emblema de ${school.name}`}
      style={{ width: width * scale, height: height * scale }}
    >
      <img
        className="school-emblem-sheet"
        src="./assets/school-logos.png"
        alt=""
        style={{ width: 1282 * scale, height: 238 * scale, left: -x * scale, top: -y * scale }}
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
