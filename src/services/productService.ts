import { authService } from './authService';
import { ScientificProduct, ProductStatus, FilterState, UserNotification, ProjectProgressReport, ProjectClosureReport } from '../types';
import { storageService } from './storage';
import { normalizeDoi, normalizeProjectCode } from './doiService';

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  message?: string;
  existingProduct?: ScientificProduct;
  warning?: string;
}

const validIsoDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const cleanList = (values: string[]) => values.map(value => value.trim()).filter(Boolean);

export const productService = {
  /**
   * Obtiene todos los productos almacenados
   */
  getAllProducts(): ScientificProduct[] {
    return storageService.getProducts();
  },

  /**
   * Obtiene productos visibles según el usuario actual y la política pública
   * Si es visitante: solo productos 'verificado' (por defecto)
   * Si es profesor: ve todos sus propios productos + productos verificados de otros
   */
  getVisibleProducts(currentUserId: string | null): ScientificProduct[] {
    const all = storageService.getProducts();

    if (!currentUserId) {
      return all.filter((p) => p.status === 'verificado');
    }

    const actor = authService.getCurrentUser();
    if (!actor || actor.id !== currentUserId) {
      return all.filter((p) => p.status === 'verificado');
    }

    return all.filter((p) => {
      // El propietario conserva acceso a sus registros en cualquier estado.
      if (p.status === 'verificado') return true;
      if (p.ownerId === actor.id) return true;
      // Los proyectos no verificados quedan restringidos a docentes y al comité científico.
      return p.type === 'proyecto' && ['teacher', 'reviewer_demo', 'developer'].includes(actor.role);
    });
  },

  /**
   * Obtiene un producto por su identificador
   */
  getProductById(id: string): ScientificProduct | undefined {
    const products = storageService.getProducts();
    return products.find((p) => p.id === id);
  },

  /**
   * Valida la existencia de duplicados antes de agregar (HU07)
   */
  checkDuplicates(productData: Partial<ScientificProduct>, excludeId?: string): DuplicateCheckResult {
    const products = storageService.getProducts();
    const targetDoi = normalizeDoi(productData.doi);
    const targetCode = normalizeProjectCode(productData.projectCode);

    // 1. Verificación por DOI para publicaciones
    if (targetDoi) {
      const match = products.find((p) => {
        if (excludeId && p.id === excludeId) return false;
        return normalizeDoi(p.doi) === targetDoi;
      });

      if (match) {
        return {
          hasDuplicate: true,
          message: `Ya existe una publicación registrada con el DOI "${match.doi}". Producto existente: "${match.title}" (ID: ${match.id}).`,
          existingProduct: match,
        };
      }
    }

    // 2. Verificación por código de proyecto
    if (targetCode) {
      const match = products.find((p) => {
        if (excludeId && p.id === excludeId) return false;
        return normalizeProjectCode(p.projectCode) === targetCode;
      });

      if (match) {
        return {
          hasDuplicate: true,
          message: `Ya existe un proyecto registrado con el código "${match.projectCode}". Producto existente: "${match.title}" (ID: ${match.id}).`,
          existingProduct: match,
        };
      }
    }

    // 3. Si no tiene ni DOI ni código
    if (!targetDoi && !targetCode) {
      return {
        hasDuplicate: false,
        warning: 'No fue posible verificar la existencia mediante identificador. El producto se registrará para verificación del Comité Científico.',
      };
    }

    return { hasDuplicate: false };
  },

  /**
   * Registra un nuevo producto con estado inicial obligatorio "cargado" (HU03)
   */
  createProduct(
    productData: Omit<ScientificProduct, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'citations' | 'ownerId'>,
    ownerId: string
  ): { success: boolean; product?: ScientificProduct; error?: string; warning?: string } {
    const actor=authService.getCurrentUser();
    if (!actor || actor.role==='reviewer_demo' || actor.id!==ownerId) return {success:false,error:'Su perfil no permite registrar publicaciones ni proyectos.'};
    const dupCheck = this.checkDuplicates(productData);
    if (dupCheck.hasDuplicate) {
      return { success: false, error: dupCheck.message };
    }

    const products = storageService.getProducts();
    const newId = `prod-${String(products.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newProduct: ScientificProduct = {
      ...productData,
      id: newId,
      ownerId,
      school: productData.school || 'ECMC',
      status: 'cargado', // Estado oficial inicial
      citations: 0,
      createdAt: now,
      updatedAt: now,
    };

    products.unshift(newProduct);
    storageService.saveProducts(products);

    // Generar notificación al propietario (HU08 / CA22)
    this.createNotification({
      userId: ownerId,
      productId: newId,
      productTitle: newProduct.title,
      status: 'cargado',
      message: `Tu ${newProduct.type === 'publicacion' ? 'publicación científica' : 'proyecto de investigación'} "${newProduct.title}" ha sido cargado exitosamente. Estado: cargado.`,
    });

    return {
      success: true,
      product: newProduct,
      warning: dupCheck.warning,
    };
  },

  addProjectProgressReport(
    productId: string,
    reportData: Omit<ProjectProgressReport, 'id' | 'reportedAt' | 'isSynthetic'>
  ): { success: boolean; product?: ScientificProduct; error?: string } {
    const actor = authService.getCurrentUser();
    if (!actor || actor.role !== 'teacher') return { success: false, error: 'Inicia sesión con un perfil docente para registrar avances.' };

    const products = storageService.getProducts();
    const index = products.findIndex(product => product.id === productId);
    if (index < 0) return { success: false, error: 'No se encontró el proyecto.' };
    const product = products[index];
    if (product.type !== 'proyecto') return { success: false, error: 'El seguimiento solo está disponible para proyectos.' };
    if (product.ownerId !== actor.id) return { success: false, error: 'Solo el docente responsable puede registrar avances.' };
    if (product.projectStatus === 'finalizado' || product.projectStatus === 'cancelado') return { success: false, error: 'El proyecto ya tiene un informe de cierre y no admite nuevos avances.' };
    if (!validIsoDate(reportData.periodStart) || !validIsoDate(reportData.periodEnd) || reportData.periodStart > reportData.periodEnd || reportData.periodEnd > new Date().toISOString().slice(0, 10)) {
      return { success: false, error: 'Revise las fechas del periodo informado.' };
    }
    if (!Number.isInteger(reportData.progressPercent) || reportData.progressPercent < 0 || reportData.progressPercent > 100) {
      return { success: false, error: 'El avance debe ser un porcentaje entre 0 y 100.' };
    }
    if (reportData.summary.trim().length < 20) return { success: false, error: 'Describa el avance con al menos 20 caracteres.' };
    if (reportData.nextSteps.trim().length < 8) return { success: false, error: 'Indique los próximos pasos.' };
    const completedActivities = cleanList(reportData.completedActivities);
    if (!completedActivities.length) return { success: false, error: 'Añada al menos una actividad realizada.' };

    const now = new Date().toISOString();
    const report: ProjectProgressReport = {
      ...reportData,
      id: `avance-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      summary: reportData.summary.trim(),
      completedActivities,
      achievedProducts: cleanList(reportData.achievedProducts),
      blockers: reportData.blockers?.trim() || undefined,
      nextSteps: reportData.nextSteps.trim(),
      reportedAt: now,
    };
    const updated: ScientificProduct = {
      ...product,
      projectStatus: report.statusAfterReport,
      projectProgressReports: [...(product.projectProgressReports || []), report],
      updatedAt: now,
    };
    products[index] = updated;
    storageService.saveProducts(products);
    this.createNotification({
      userId: actor.id,
      productId: updated.id,
      productTitle: updated.title,
      status: updated.status,
      message: `Se guardó el informe de avance de "${updated.title}" (${report.progressPercent}%).`,
    });
    return { success: true, product: updated };
  },

  closeProject(
    productId: string,
    closureData: Omit<ProjectClosureReport, 'id' | 'isSynthetic'>
  ): { success: boolean; product?: ScientificProduct; error?: string } {
    const actor = authService.getCurrentUser();
    if (!actor || actor.role !== 'teacher') return { success: false, error: 'Inicia sesión con un perfil docente para cerrar el proyecto.' };

    const products = storageService.getProducts();
    const index = products.findIndex(product => product.id === productId);
    if (index < 0) return { success: false, error: 'No se encontró el proyecto.' };
    const product = products[index];
    if (product.type !== 'proyecto') return { success: false, error: 'El cierre solo está disponible para proyectos.' };
    if (product.ownerId !== actor.id) return { success: false, error: 'Solo el docente responsable puede cerrar este proyecto.' };
    if (product.projectClosureReport) {
      return { success: false, error: 'El proyecto ya cuenta con un informe de cierre.' };
    }
    if (!validIsoDate(closureData.closedAt) || closureData.closedAt > new Date().toISOString().slice(0, 10)) return { success: false, error: 'Indique una fecha de cierre válida.' };
    if (closureData.summary.trim().length < 30) return { success: false, error: 'El resumen de cierre debe tener al menos 30 caracteres.' };
    const deliveredProducts = cleanList(closureData.deliveredProducts);
    if (closureData.finalStatus === 'finalizado' && !deliveredProducts.length) {
      return { success: false, error: 'Registre al menos un producto o resultado entregado para finalizar el proyecto.' };
    }

    const closure: ProjectClosureReport = {
      ...closureData,
      id: `cierre-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      summary: closureData.summary.trim(),
      deliveredProducts,
      pendingItems: cleanList(closureData.pendingItems),
      lessonsLearned: closureData.lessonsLearned?.trim() || undefined,
    };
    const updated: ScientificProduct = {
      ...product,
      projectStatus: closure.finalStatus,
      projectClosureReport: closure,
      updatedAt: new Date().toISOString(),
    };
    products[index] = updated;
    storageService.saveProducts(products);
    this.createNotification({
      userId: actor.id,
      productId: updated.id,
      productTitle: updated.title,
      status: updated.status,
      message: `Se registró el cierre del proyecto "${updated.title}" como ${closure.finalStatus === 'finalizado' ? 'finalizado' : 'cancelado'}.`,
    });
    return { success: true, product: updated };
  },

  /**
   * Transición de estado ejecutada por el Comité Revisor (Consola de Extensión Propuesta)
   * Estados oficiales: cargado -> verificado | rechazado
   */
  updateProductStatus(
    productId: string,
    newStatus: ProductStatus,
    rejectionReason?: string
  ): { success: boolean; product?: ScientificProduct; error?: string } {
    if (newStatus === 'rechazado' && (!rejectionReason || !rejectionReason.trim())) {
      return {
        success: false,
        error: 'Indique qué información debe corregirse o completarse antes de verificar el producto.',
      };
    }

    const products = storageService.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    const now = new Date().toISOString();
    const product = products[index];
    const prevStatus = product.status;

    // Solo emitir notificación si hubo transición efectiva (evitar duplicados)
    if (prevStatus === newStatus) {
      return { success: true, product };
    }

    product.status = newStatus;
    product.updatedAt = now;

    if (newStatus === 'verificado') {
      product.verifiedAt = now;
      product.rejectionReason = undefined;
    } else if (newStatus === 'rechazado') {
      product.rejectionReason = rejectionReason?.trim();
    }

    products[index] = product;
    storageService.saveProducts(products);

    // Notificación al autor (HU08 / CA23)
    const notifMessage =
      newStatus === 'verificado'
        ? `El Comité Científico ha verificado y certificado tu producto "${product.title}".`
        : `El Comité Científico dejó el producto "${product.title}" en observación. Información solicitada: ${product.rejectionReason}`;

    this.createNotification({
      userId: product.ownerId,
      productId: product.id,
      productTitle: product.title,
      status: newStatus,
      reason: product.rejectionReason,
      message: notifMessage,
    });

    return { success: true, product };
  },

  /**
   * Notificaciones para un usuario con control de duplicados
   */
  createNotification(data: Omit<UserNotification, 'id' | 'read' | 'createdAt'>): void {
    const notifs = storageService.getNotifications();
    const newId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newNotif: UserNotification = {
      ...data,
      id: newId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifs.unshift(newNotif);
    storageService.saveNotifications(notifs);
  },

  getUserNotifications(userId: string): UserNotification[] {
    const notifs = storageService.getNotifications();
    return notifs.filter((n) => n.userId === userId);
  },

  markNotificationAsRead(notifId: string): void {
    const notifs = storageService.getNotifications();
    const updated = notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    storageService.saveNotifications(updated);
  },

  markAllNotificationsAsRead(userId: string): void {
    const notifs = storageService.getNotifications();
    const updated = notifs.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    storageService.saveNotifications(updated);
  },

  /**
   * Filtra productos combinando todos los criterios con intersección lógica (HU06)
   */
  filterProducts(products: ScientificProduct[], filters: FilterState): ScientificProduct[] {
    const query = filters.searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // 1. Búsqueda de texto (título, autores, DOI, medio/venue, código)
      if (query) {
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesAuthor = p.authors.some((a) => a.toLowerCase().includes(query));
        const matchesDoi = p.doi ? p.doi.toLowerCase().includes(query) : false;
        const matchesVenue = p.venue ? p.venue.toLowerCase().includes(query) : false;
        const matchesCode = p.projectCode ? p.projectCode.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesAuthor && !matchesDoi && !matchesVenue && !matchesCode) {
          return false;
        }
      }

      // 2. Tipo de producto
      if (filters.productType !== 'todos' && p.type !== filters.productType) {
        return false;
      }

      // 3. Docente
      if (filters.teacherId !== 'todos') {
        const teachers = storageService.getTeachers();
        const teacher = teachers.find((t) => t.id === filters.teacherId);
        if (teacher) {
          // Coincidencia por ID de propietario o autor en la lista
          const isOwner = p.ownerId === teacher.id;
          const isCoauthor = p.authors.some((a) => a.toLowerCase().includes(teacher.name.toLowerCase()));
          if (!isOwner && !isCoauthor) return false;
        }
      }

      // 4. Periodo / Año
      if (filters.periodYear !== 'todos') {
        const matchesYear = String(p.year) === filters.periodYear;
        const matchesSemester = p.semester === filters.periodYear;
        if (!matchesYear && !matchesSemester) return false;
      }

      // 5. Línea de investigación
      if (filters.researchLine !== 'todas' && p.researchLine !== filters.researchLine) {
        return false;
      }

      // 6. Estado de verificación
      if (filters.status !== 'todos' && p.status !== filters.status) {
        return false;
      }

      return true;
    });
  },
};
