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

let schoolLogosDecoded: Promise<boolean> | undefined;

/** Resolve only after each school mark is available for an uninterrupted slide swap. */
export function ensureSchoolLogosDecoded() {
  schoolLogosDecoded ??= Promise.all(Object.values(SCHOOL_LOGOS).map(async (src) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    await image.decode();
  })).then(() => true).catch(() => false);

  return schoolLogosDecoded;
}
