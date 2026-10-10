import type { OfficialResearchLine, SchoolCode } from './schools';

export interface ResearchStageSlide {
  readonly title: string;
  readonly line: OfficialResearchLine;
  readonly accentWords: readonly number[];
}

/** Presentation titles are independent of the existing research-line SVG keys. */
export const RESEARCH_STAGE_SLIDES: Record<SchoolCode, readonly ResearchStageSlide[]> = {
  ECIAA: [
    { title: 'Ciencias Agrícolas', line: 'Ciencias Agrícolas', accentWords: [1] },
    { title: 'Investigación del mercado de productos agroindustriales', line: 'Investigación del mercado de productos agroindustriales', accentWords: [2] },
  ],
  ECBI: [
    { title: 'Biología', line: 'Ecología, evolución y conservación de ecosistemas terrestres', accentWords: [0] },
    { title: 'Biomedicina', line: 'Biomedicina', accentWords: [0] },
  ],
  ECFN: [
    { title: 'Física y Nanotecnología', line: 'Materiales nanoestructurados, síntesis y caracterización', accentWords: [1, 2] },
  ],
  ECTEA: [
    { title: 'Geología', line: 'Geología física y aplicada', accentWords: [0] },
    { title: 'Medioambiente y clima', line: 'Medioambiente y clima', accentWords: [1, 2] },
  ],
  ECMC: [
    { title: 'Matemática', line: 'Ciencia de datos', accentWords: [0] },
    { title: 'Computación', line: 'Inteligencia artificial', accentWords: [0] },
    { title: 'Ciencia de datos', line: 'Ciencia de datos', accentWords: [1, 2] },
  ],
  ECQI: [
    { title: 'Química', line: 'Química medicinal y farmacología molecular', accentWords: [0] },
    { title: 'Materiales', line: 'Desarrollo sostenible: Energía, alimentos, agricultura y medio ambiente', accentWords: [0] },
    { title: 'Bioquímica y Farmacia', line: 'Química medicinal y farmacología molecular', accentWords: [1, 2] },
  ],
  YTLC: [
    { title: 'Education technology & AI', line: 'Education technology & AI', accentWords: [0] },
    { title: 'Sociolinguistics/Language and Culture', line: 'Sociolinguistics/Language and Culture', accentWords: [0] },
  ],
};
