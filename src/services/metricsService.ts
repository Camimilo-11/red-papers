import { ScientificProduct, TeacherUser, TeacherMetrics, SchoolMetrics, AcademicSemester } from '../types';
import { ACADEMIC_SEMESTERS } from '../constants/researchLines';
import { storageService } from './storage';

/**
 * Calcula el índice h estándar a partir de un arreglo de citas
 * Algoritmo: Ordenar descendentemente y encontrar el mayor h tal que citas[h - 1] >= h
 */
export function calculateHIndex(citations: number[]): number {
  if (!citations || citations.length === 0) return 0;
  const sorted = [...citations].sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      h = i + 1;
    } else {
      break;
    }
  }
  return h;
}

export interface TemporalDataPoint {
  semester: AcademicSemester;
  publications: number;
  projects: number;
  total: number;
}

export const metricsService = {
  /**
   * Calcula las métricas institucionales de la Escuela de Ciencias Matemáticas y Computacionales (ECMC)
   * Los productos en coautoría cuentan UNA sola vez para el total institucional.
   */
  calculateSchoolMetrics(products: ScientificProduct[]): SchoolMetrics {
    // Para indicadores institucionales oficiales, tomamos los productos verificados
    // (siguiendo la política de visualización y trazabilidad)
    const verifiedProducts = products.filter((p) => p.status === 'verificado');
    const totalProductsCount = products.length;
    const verifiedCount = verifiedProducts.length;

    const publications = verifiedProducts.filter((p) => p.type === 'publicacion');
    const projects = verifiedProducts.filter((p) => p.type === 'proyecto');

    const totalCitations = publications.reduce((acc, p) => acc + (p.citations || 0), 0);

    // Lista de citas de cada publicación única
    const citationsList = publications.map((p) => p.citations || 0);
    const hIndex = calculateHIndex(citationsList);

    const verificationRate = totalProductsCount > 0
      ? Math.round((verifiedCount / totalProductsCount) * 100)
      : 0;

    return {
      totalPublications: publications.length,
      totalProjects: projects.length,
      totalCitations,
      hIndex,
      verificationRate,
      verifiedCount,
      totalProductsCount,
    };
  },

  /**
   * Calcula las métricas individuales para cada docente
   */
  calculateTeacherMetrics(teacher: TeacherUser, allProducts: ScientificProduct[]): TeacherMetrics {
    // Productos en los que participa el docente (como propietario o coautor)
    const teacherProducts = allProducts.filter((p) => {
      if (p.ownerId === teacher.id) return true;
      return p.authors.some((author) => author.toLowerCase().includes(teacher.name.toLowerCase()));
    });

    const publications = teacherProducts.filter((p) => p.type === 'publicacion');
    const projects = teacherProducts.filter((p) => p.type === 'proyecto');

    // Citas acumuladas en publicaciones
    const citationsTotal = publications.reduce((acc, p) => acc + (p.citations || 0), 0);
    const citationsList = publications.map((p) => p.citations || 0);
    const hIndex = calculateHIndex(citationsList);

    return {
      teacher,
      publicationsCount: publications.length,
      projectsCount: projects.length,
      citationsTotal,
      hIndex,
    };
  },

  /**
   * Obtiene la tabla completa de métricas para todos los docentes registrados
   */
  getAllTeacherMetrics(): TeacherMetrics[] {
    const teachers = storageService.getTeachers();
    const products = storageService.getProducts();

    return teachers.map((teacher) => this.calculateTeacherMetrics(teacher, products));
  },

  /**
   * Genera los puntos de la serie temporal por semestre (2021-1 a 2026-2)
   * Los semestres sin producción registran explícitamente 0
   */
  getTemporalEvolutionData(products: ScientificProduct[]): TemporalDataPoint[] {
    // Agrupamos publicaciones y proyectos verificados (o total visible)
    const verified = products.filter((p) => p.status === 'verificado');

    return ACADEMIC_SEMESTERS.map((semester) => {
      const inSemester = verified.filter((p) => p.semester === semester);
      const pubCount = inSemester.filter((p) => p.type === 'publicacion').length;
      const projCount = inSemester.filter((p) => p.type === 'proyecto').length;

      return {
        semester,
        publications: pubCount,
        projects: projCount,
        total: pubCount + projCount,
      };
    });
  },
};
