import { ScientificProduct, TeacherUser, TeacherMetrics, SchoolMetrics, AcademicSemester } from '../types';
import { ACADEMIC_SEMESTERS } from '../constants/researchLines';
import { storageService } from './storage';

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
    const publications = verifiedProducts.filter((p) => p.type === 'publicacion');
    const projects = verifiedProducts.filter((p) => p.type === 'proyecto');

    const totalCitations = publications.reduce((acc, p) => acc + (p.citations || 0), 0);

    return {
      totalPublications: publications.length,
      totalProjects: projects.length,
      totalCitations,
      researchLinesWithProduction: new Set(verifiedProducts.map((product) => product.researchLine)).size,
    };
  },

  /**
   * Calcula las métricas individuales para cada docente
   */
  calculateTeacherMetrics(teacher: TeacherUser, allProducts: ScientificProduct[]): TeacherMetrics {
    // Las métricas de perfiles públicos se calculan solo con productos verificados.
    const verifiedProducts = allProducts.filter((p) => p.status === 'verificado');
    const teacherProducts = verifiedProducts.filter((p) => {
      if (p.ownerId === teacher.id) return true;
      return p.authors.some((author) => author.toLowerCase().includes(teacher.name.toLowerCase()));
    });

    const publications = teacherProducts.filter((p) => p.type === 'publicacion');
    const projects = teacherProducts.filter((p) => p.type === 'proyecto');

    // Citas acumuladas en publicaciones
    const citationsTotal = publications.reduce((acc, p) => acc + (p.citations || 0), 0);
    return {
      teacher,
      publicationsCount: publications.length,
      projectsCount: projects.length,
      citationsTotal,
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
