import type { SchoolConfig } from '../constants/schools';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const BASE_MASCOT = publicAsset('mascot/base.webp');

/** Original transparent mascot assets, shared by preload and the school scenes. */
export const SCHOOL_MASCOTS: Record<SchoolConfig['code'], string> = {
  ECIAA: publicAsset('mascot/ecaa.webp'),
  ECBI: publicAsset('mascot/ecbi.webp'),
  ECFN: publicAsset('mascot/ecfn.webp'),
  ECTEA: publicAsset('mascot/ectea.webp'),
  ECMC: publicAsset('mascot/ecmc.webp'),
  ECQI: publicAsset('mascot/ecqi.webp'),
  YTLC: publicAsset('mascot/ytlc.webp'),
};
