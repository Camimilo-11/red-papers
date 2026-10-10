import React from 'react';
import { SchoolConfig } from '../../constants/schools';
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

  return (
    <img
      className="school-emblem-svg"
      src={`./assets/school-emblems/${school.code}.svg`}
      alt={`Emblema de ${school.name}`}
      style={{ width: size, height: size }}
    />
  );
}

export function YachayLogo({ width = 136, className = '' }: { width?: number; className?: string }) {
  const scale = width / 146;
  return (
    <span
      className={`yachay-logo-crop ${className}`}
      role="img"
      aria-label="Universidad Yachay Tech"
      style={{ width, height: 52 * scale }}
    >
      <img
        src="./assets/university-logo.png"
        alt=""
        aria-hidden="true"
        style={{ width: 219 * scale, height: 96 * scale, left: -36 * scale, top: -18 * scale }}
      />
    </span>
  );
}
