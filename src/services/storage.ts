import { AcademicDegree, OfficialResearchLine, ScientificProduct, TeacherUser, UserNotification } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TEACHERS, INITIAL_NOTIFICATIONS } from '../constants/seedData';
import { OFFICIAL_RESEARCH_LINES } from '../constants/researchLines';

const SEED_PRODUCT_BY_ID = new Map(INITIAL_PRODUCTS.map((product) => [product.id, product]));
const SEED_TEACHER_BY_ID = new Map(INITIAL_TEACHERS.map((teacher) => [teacher.id, teacher]));

function completeSyntheticTeacher(teacher: TeacherUser): TeacherUser {
  const defaults = SEED_TEACHER_BY_ID.get(teacher.id);
  if (!defaults || teacher.syntheticProfileSeedVersion) return teacher;

  let updated = teacher;
  const fillIfMissing = <K extends keyof TeacherUser>(key: K) => {
    if ((updated[key] === undefined || updated[key] === null) && defaults[key] !== undefined) {
      updated = { ...updated, [key]: defaults[key] };
    }
  };

  [
    'researchLines', 'researchSublines', 'githubUrl', 'googleScholarId', 'googleScholarHIndex',
    'scopusAuthorId', 'scopusHIndex', 'webOfScienceId',
  ].forEach((key) => fillIfMissing(key as keyof TeacherUser));

  const syntheticAcademicProfileFields = (defaults.syntheticAcademicProfileFields || [])
    .filter(field => updated[field] === defaults[field]);
  const syntheticBibliometricFields = (defaults.syntheticBibliometricFields || [])
    .filter(field => updated[field] === defaults[field]);

  return {
    ...updated,
    syntheticAcademicProfileFields,
    syntheticBibliometricFields,
    syntheticProfileSeedVersion: 1,
  };
}

function completeSyntheticProduct(product: ScientificProduct): ScientificProduct {
  const defaults = SEED_PRODUCT_BY_ID.get(product.id);
  if (!defaults) return product;

  let updated = product;
  const fillIfMissing = <K extends keyof ScientificProduct>(key: K) => {
    if ((updated[key] === undefined || updated[key] === null) && defaults[key] !== undefined) {
      updated = { ...updated, [key]: defaults[key] };
    }
  };

  [
    'publicationDate',
    'projectStartDate',
    'projectEndDate',
    'projectStatus',
    'projectParticipants',
    'projectDurationMonths',
    'expectedProducts',
    'projectProgressReports',
    'projectClosureReport',
    'articleAttachment',
    'privacyConsentAt',
    'venue',
    'volumeIssue',
  ].forEach((key) => fillIfMissing(key as keyof ScientificProduct));

  if (updated.id === 'prod-009' && updated.doi?.startsWith('10.1145/preview.')) {
    updated = { ...updated, doi: undefined };
  }

  if (updated.id === 'prod-009' && updated.title.startsWith('Borrador:')) {
    updated = {
      ...updated,
      title: defaults.title,
      authors: defaults.authors,
      year: defaults.year,
      semester: defaults.semester,
      researchLine: defaults.researchLine,
      abstract: defaults.abstract,
      publicationDate: defaults.publicationDate,
      privacyConsentAt: defaults.privacyConsentAt,
      venue: defaults.venue,
      volumeIssue: defaults.volumeIssue,
    };
  }

  if (updated.id === 'prod-009') {
    const attachment = updated.articleAttachment;
    updated = {
      ...updated,
      title: /ejemplo sint[eé]tico/i.test(updated.title) ? defaults.title : updated.title,
      authors: updated.authors.some(author => /demostraci[oó]n/i.test(author)) ? defaults.authors : updated.authors,
      abstract: /fictici|sint[eé]tic|demostraci[oó]n/i.test(updated.abstract) ? defaults.abstract : updated.abstract,
      venue: updated.venue && /demostraci[oó]n/i.test(updated.venue) ? defaults.venue : updated.venue,
      volumeIssue: updated.volumeIssue && /sint[eé]tic|dato de ejemplo/i.test(updated.volumeIssue) ? defaults.volumeIssue : updated.volumeIssue,
      articleAttachment: attachment && /sint[eé]tic|demo/i.test(`${attachment.id} ${attachment.fileName}`) ? defaults.articleAttachment : attachment,
    };
  }

  if (updated.id === 'prod-015') {
    updated = {
      ...updated,
      title: /ejemplo sint[eé]tico/i.test(updated.title) ? defaults.title : updated.title,
      projectCode: updated.projectCode && /demo/i.test(updated.projectCode) ? defaults.projectCode : updated.projectCode,
      abstract: /sint[eé]tic|demostraci[oó]n/i.test(updated.abstract) ? defaults.abstract : updated.abstract,
      expectedProducts: updated.expectedProducts?.some(item => /demostrativ/i.test(item)) ? defaults.expectedProducts : updated.expectedProducts,
      projectProgressReports: updated.projectProgressReports?.map(report => /demostraci[oó]n|prueba/i.test(`${report.summary} ${report.completedActivities.join(' ')}`)
        ? { ...report, summary: defaults.projectProgressReports?.[0]?.summary || report.summary, completedActivities: defaults.projectProgressReports?.[0]?.completedActivities || report.completedActivities }
        : report),
      fundingVenue: updated.fundingVenue && /demostrativ|sint[eé]tic/i.test(updated.fundingVenue) ? defaults.fundingVenue : updated.fundingVenue,
    };
  }

  if (updated.id === 'prod-012' && updated.projectProgressReports?.some(report => /simulad[oa]s/i.test(report.blockers || ''))) {
    updated = {
      ...updated,
      projectProgressReports: updated.projectProgressReports.map(report => {
        if (!/simulad[oa]s/i.test(report.blockers || '')) return report;
        const defaultReport = defaults.projectProgressReports?.find(item => item.id === report.id);
        return defaultReport ? { ...report, blockers: defaultReport.blockers } : { ...report, blockers: undefined };
      }),
    };
  }

  return updated;
}

const STORAGE_KEYS = {
  PRODUCTS: 'red_papers_products_v1',
  TEACHERS: 'red_papers_teachers_v1',
  NOTIFICATIONS: 'red_papers_notifications_v1',
  CURRENT_USER: 'red_papers_current_user_v1',
  PUBLIC_VISIBILITY_CONFIG: 'red_papers_public_config_v1',
};

// Configuración de visibilidad pública
// Por defecto: Solo productos 'verificados' para visitantes; el propietario ve todos los suyos.
export interface PublicVisibilityConfig {
  showOnlyVerifiedForVisitors: boolean;
}

const DEFAULT_CONFIG: PublicVisibilityConfig = {
  showOnlyVerifiedForVisitors: true,
};

function academicDegreeFrom(value?: string): AcademicDegree | undefined {
  if (!value) return undefined;
  if (/\b(?:ph\.?\s*d|doctorad[oa]?|doctora?)\b/i.test(value)) return 'PhD';
  if (/\b(?:m\.?\s*sc|master|maestr[ií]a|mag[ií]ster)\b/i.test(value)) return 'MSc';
  if (/\b(?:b\.?\s*sc|ingenier[oa]|licenciatur[ao])\b/i.test(value)) return 'BSc';
  return undefined;
}

function academicFieldFrom(value?: string): string | undefined {
  const match = value?.match(/\b(?:en|de)\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

function normalizeTeacher(teacher: TeacherUser): TeacherUser {
  const name = teacher.name || '';
  const namePrefix = name.match(/^\s*((?:m\.?\s*sc|ph\.?\s*d|dr|dra|ing|mag)\.?)\s+/i)?.[1];
  const cleanName = name.replace(/^\s*(?:(?:m\.?\s*sc|ph\.?\s*d|dr|dra|ing|mag)\.?)\s+/i, '').trim();
  const rankParts = (teacher.rank || 'Profesor').split(/\s*\/\s*/);
  const credentialIndex = rankParts.findIndex(part => academicDegreeFrom(part));
  const credential = credentialIndex >= 0 ? rankParts[credentialIndex] : undefined;
  const academicDegree = teacher.academicDegree || academicDegreeFrom(credential) || academicDegreeFrom(namePrefix);
  const academicField = teacher.academicField || academicFieldFrom(credential);
  const savedResearchLines = Array.isArray(teacher.researchLines) ? teacher.researchLines : teacher.researchLine ? [teacher.researchLine] : [];
  const researchLines = [...new Set(savedResearchLines)].filter((line): line is OfficialResearchLine => OFFICIAL_RESEARCH_LINES.includes(line));
  const rank = credential
    ? rankParts.filter((_, index) => index !== credentialIndex).join(' / ').trim() || 'Profesor'
    : teacher.rank || 'Profesor';

  return { ...teacher, name: cleanName, rank, academicDegree, academicField, researchLines: researchLines.length ? researchLines : undefined, researchLine: researchLines[0] };
}

export const storageService = {
  getProducts(): ScientificProduct[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        this.saveProducts(INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      const storedProducts: ScientificProduct[] = JSON.parse(data);
      const existingIds = new Set(storedProducts.map(product => product.id));
      const newDemoFixtures = INITIAL_PRODUCTS.filter(product => product.id === 'prod-015' && !existingIds.has(product.id));
      const products = [...storedProducts.map(completeSyntheticProduct), ...newDemoFixtures];
      if (JSON.stringify(products) !== JSON.stringify(storedProducts)) this.saveProducts(products);
      return products;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: ScientificProduct[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (err) {
      console.error('Error guardando productos en almacenamiento local:', err);
    }
  },

  getTeachers(): TeacherUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (!data) {
        const teachers = INITIAL_TEACHERS.map(teacher => normalizeTeacher(completeSyntheticTeacher(teacher)));
        this.saveTeachers(teachers);
        return teachers;
      }
      const storedTeachers: TeacherUser[] = JSON.parse(data);
      const teachers = storedTeachers.map(teacher => normalizeTeacher(completeSyntheticTeacher(teacher)));
      if (JSON.stringify(teachers) !== JSON.stringify(storedTeachers)) this.saveTeachers(teachers);
      return teachers;
    } catch {
      return INITIAL_TEACHERS.map(teacher => normalizeTeacher(completeSyntheticTeacher(teacher)));
    }
  },

  saveTeachers(teachers: TeacherUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    } catch (err) {
      console.error('Error guardando docentes:', err);
    }
  },

  getNotifications(): UserNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        this.saveNotifications(INITIAL_NOTIFICATIONS);
        return INITIAL_NOTIFICATIONS;
      }
      const notifications: UserNotification[] = JSON.parse(data);
      const normalized = notifications.map(notification => (notification.productTitle || '').startsWith('Ejemplo sintético:')
        ? { ...notification, productTitle: 'Análisis de datos para investigación académica' }
        : notification);
      if (JSON.stringify(normalized) !== JSON.stringify(notifications)) this.saveNotifications(normalized);
      return normalized;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifs: UserNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (err) {
      console.error('Error guardando notificaciones:', err);
    }
  },

  getCurrentUser(): TeacherUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;
      const storedUser: TeacherUser = JSON.parse(data);
      const user = normalizeTeacher(completeSyntheticTeacher(storedUser));
      if (JSON.stringify(user) !== JSON.stringify(storedUser)) this.setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: TeacherUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (err) {
      console.error('Error guardando usuario actual:', err);
    }
  },

  getPublicConfig(): PublicVisibilityConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PUBLIC_VISIBILITY_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  savePublicConfig(config: PublicVisibilityConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PUBLIC_VISIBILITY_CONFIG, JSON.stringify(config));
    } catch (err) {
      console.error('Error guardando configuración pública:', err);
    }
  },

  resetToSeed(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS.map(teacher => normalizeTeacher(completeSyntheticTeacher(teacher)))));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.PUBLIC_VISIBILITY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    } catch (err) {
      console.error('Error restableciendo datos:', err);
    }
  },
};
