import type { SchoolConfig } from '../constants/schools';
import { BASE_MASCOT, SCHOOL_MASCOTS } from './schoolMascots';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** One source for the original school marks, resized and compressed for the web. */
export const SCHOOL_LOGOS: Record<SchoolConfig['code'], string> = {
  ECIAA: publicAsset('logos/ecaa.webp'),
  ECBI: publicAsset('logos/ecbi.webp'),
  ECFN: publicAsset('logos/ecfn.webp'),
  ECTEA: publicAsset('logos/ectea.webp'),
  ECMC: publicAsset('logos/ecmc.webp'),
  ECQI: publicAsset('logos/ecqi.webp'),
  YTLC: publicAsset('logos/ytlc.webp'),
};

const institutionalImages = [
  ...Object.values(SCHOOL_LOGOS),
  publicAsset('assets/yachay-logo-clean.svg'),
  BASE_MASCOT,
  ...Object.values(SCHOOL_MASCOTS),
];
// Retain the decoded images so the intro, school navigation and slides share the cache.
const decodedImages = new Map<string, HTMLImageElement>();
let schoolLogosDecoded: Promise<boolean> | undefined;

/** Starts once in main.tsx, before React renders the 1.5-second intro. */
export function ensureSchoolLogosDecoded(): Promise<boolean> {
  schoolLogosDecoded ??= Promise.all(institutionalImages.map(async (src) => {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'high';
    image.src = src;
    await image.decode();
    decodedImages.set(src, image);
  })).then(() => true).catch(() => false);

  return schoolLogosDecoded;
}
