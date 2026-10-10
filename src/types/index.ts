/**
 * Tipos de datos centrales de RED PAPERS - ECMC Yachay Tech
 * Conforme al Documento de Requisitos e Historias de Usuario (HU01 - HU11)
 */

export type ProductType = 'publicacion' | 'proyecto';

export type ProductStatus = 'cargado' | 'verificado' | 'rechazado';

export type AcademicSemester =
  | '2021-1' | '2021-2'
  | '2022-1' | '2022-2'
  | '2023-1' | '2023-2'
  | '2024-1' | '2024-2'
  | '2025-1' | '2025-2'
  | '2026-1' | '2026-2';

// 6 Líneas oficiales de investigación de la ECMC
export type OfficialResearchLine =
  | 'Ecuaciones diferenciales, análisis matemático, modelamiento y optimización'
  | 'Ciencia de datos'
  | 'Computación científica'
  | 'Inteligencia artificial'
  | 'Tecnologías de la información'
  | 'Ciencia, Tecnología y Sociedad';

export type AcademicDegree = 'PhD' | 'MSc' | 'BSc' | 'Other';

export interface ScientificProduct {
  id: string; // ej. prod-001
  type: ProductType;
  title: string;
  authors: string[];
  ownerId: string; // ID del profesor registrado propietario
  school: string; // Por defecto 'ECMC' (escalable para futuras escuelas)
  year: number;
  semester: AcademicSemester;
  researchLine: OfficialResearchLine;
  abstract: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  citations: number; // 0 o número de citas (fuente identificada como simulada en demo)

  // Específico para publicaciones
  doi?: string;
  venue?: string; // Revista, conferencia, medio
  volumeIssue?: string;

  // Específico para proyectos de investigación
  projectCode?: string; // ej. ECMC-INV-2024-008
  projectDirector?: string;
  fundingVenue?: string;
}

export interface TeacherUser {
  id: string;
  name: string;
  email: string; // Debe pertenecer al dominio @yachaytech.edu.ec
  rank: string; // Escalafón docente (Profesor Principal, Profesor Auxiliar, etc.)
  academicDegree?: AcademicDegree;
  academicField?: string;
  profileImage?: string; // Imagen optimizada en formato data URL
  researchLine?: OfficialResearchLine;
  orcid?: string; // Formato 0000-000X-XXXX-XXXX
  githubUrl?: string;
  googleScholarId?: string;
  bio?: string;
  school: string;
  role: 'teacher' | 'reviewer_demo' | 'developer'; // Revisor como consola demo propuesta
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  status: ProductStatus;
  reason?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface TeacherMetrics {
  teacher: TeacherUser;
  publicationsCount: number;
  projectsCount: number;
  citationsTotal: number;
  hIndex: number;
}

export interface SchoolMetrics {
  totalPublications: number;
  totalProjects: number;
  totalCitations: number;
  hIndex: number;
  verificationRate: number; // Porcentaje redondeado (ej. 79)
  verifiedCount: number;
  totalProductsCount: number;
}

export interface AgileHU {
  rf: string;
  epic: string;
  hu: string;
  title: string;
  actor: string;
  description: string;
  priority: 'Must' | 'Should' | 'Could';
  storyPoints: number;
  status: 'Verificado con evidencia' | 'Implementado sin verificar' | 'Pendiente' | 'Bloqueado';
  relatedRnfs: string[];
  acceptanceCriteria: {
    id: string;
    description: string;
  }[];
  tasks: {
    id: string;
    description: string;
    type: 'UX/UI' | 'Validación' | 'Backend/API' | 'Base de datos' | 'Seguridad' | 'Integración' | 'Pruebas' | 'Análisis' | 'Regla de negocio' | 'Arquitectura' | 'Diseño técnico';
    relatedCA: string;
    completed: boolean;
  }[];
  testCases: {
    id: string;
    type: 'Aceptación' | 'Seguridad' | 'Funcional' | 'Integración' | 'Resiliencia' | 'Rendimiento' | 'Validación' | 'Regla de negocio';
    relatedCA: string;
    summary: string;
    expectedResult: string;
    passed: boolean;
    evidenceText: string;
  }[];
}

export interface FilterState {
  searchQuery: string;
  productType: 'todos' | ProductType;
  teacherId: 'todos' | string;
  periodYear: 'todos' | string;
  researchLine: 'todas' | OfficialResearchLine;
  status: 'todos' | ProductStatus;
}
