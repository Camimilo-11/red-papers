import { authService } from './authService';
import { ScientificProduct, ProductStatus, FilterState, UserNotification } from '../types';
import { storageService } from './storage';
import { normalizeDoi, normalizeProjectCode } from './doiService';

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  message?: string;
  existingProduct?: ScientificProduct;
  warning?: string;
}

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
    const config = storageService.getPublicConfig();

    if (!currentUserId) {
      if (config.showOnlyVerifiedForVisitors) {
        return all.filter((p) => p.status === 'verificado');
      }
      return all;
    }

    return all.filter((p) => {
      // El propietario ve todos sus productos (cargado, verificado, rechazado)
      if (p.ownerId === currentUserId) return true;
      // Para otros docentes, ve los verificados (o todos si la política lo autoriza)
      return p.status === 'verificado';
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
        warning: 'No fue posible verificar la existencia mediante identificador. El producto se registrará para posterior revisión del comité.',
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
        error: 'El motivo de rechazo es obligatorio para registrar la decisión del comité.',
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
        ? `El Comité Revisor Institucional ha verificado y certificado tu producto "${product.title}".`
        : `El Comité Revisor Institucional ha emitido dictamen de rechazo para "${product.title}". Motivo: ${product.rejectionReason}`;

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
