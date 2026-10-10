import type { SchoolConfig } from '../constants/schools';
import ecaa from './schools/ecaa.jpg';
import ecbi from './schools/ecbi.jpg';
import ecfn from './schools/ecfn.jpg';
import ectea from './schools/ectea.jpg';
import ecmc from './schools/ecmc.jpg';
import ecqi from './schools/ecqi.jpg';
import ytlc from './schools/ytlc.jpg';

/** High-resolution school marks used by the public institutional pages. */
export const SCHOOL_LOGOS: Record<SchoolConfig['code'], string> = {
  ECIAA: ecaa,
  ECBI: ecbi,
  ECFN: ecfn,
  ECTEA: ectea,
  ECMC: ecmc,
  ECQI: ecqi,
  YTLC: ytlc,
};
