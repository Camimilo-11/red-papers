import type { SchoolConfig } from '../constants/schools';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

// Optimized derivatives live separately; originals in /public/mascot remain unchanged.
export const BASE_MASCOT = publicAsset('mascot-optimized/base.webp');

export const SCHOOL_MASCOTS: Record<SchoolConfig['code'], string> = {
  ECIAA: publicAsset('mascot-optimized/ecaa.webp'),
  ECBI: publicAsset('mascot-optimized/ecbi.webp'),
  ECFN: publicAsset('mascot-optimized/ecfn.webp'),
  ECTEA: publicAsset('mascot-optimized/ectea.webp'),
  ECMC: publicAsset('mascot-optimized/ecmc.webp'),
  ECQI: publicAsset('mascot-optimized/ecqi.webp'),
  YTLC: publicAsset('mascot-optimized/ytlc.webp'),
};
