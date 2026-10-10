import { OfficialResearchLine } from '../types';

/**
 * 6 Líneas de investigación oficiales y centralizadas de la Escuela de Ciencias
 * Matemáticas y Computacionales (ECMC) de Yachay Tech.
 * Conforme a la sección 4 de requerimientos: usar exclusivamente estos nombres.
 */
export const OFFICIAL_RESEARCH_LINES: readonly OfficialResearchLine[] = [
  'Ecuaciones diferenciales, análisis matemático, modelamiento y optimización',
  'Ciencia de datos',
  'Computación científica',
  'Inteligencia artificial',
  'Tecnologías de la información',
  'Ciencia, Tecnología y Sociedad',
] as const;

export const ACADEMIC_SEMESTERS = [
  '2021-1', '2021-2',
  '2022-1', '2022-2',
  '2023-1', '2023-2',
  '2024-1', '2024-2',
  '2025-1', '2025-2',
  '2026-1', '2026-2',
] as const;

export const ESCUELA_NAME = 'Escuela de Ciencias Matemáticas y Computacionales';
export const ESCUELA_CODE = 'ECMC';
export const INSTITUTION_NAME = 'Yachay Tech';
export const ALLOWED_EMAIL_DOMAIN = '@yachaytech.edu.ec';
