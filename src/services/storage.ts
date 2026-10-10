import { ScientificProduct, TeacherUser, UserNotification } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TEACHERS, INITIAL_NOTIFICATIONS } from '../constants/seedData';

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

export const storageService = {
  getProducts(): ScientificProduct[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        this.saveProducts(INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
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
        this.saveTeachers(INITIAL_TEACHERS);
        return INITIAL_TEACHERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TEACHERS;
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
      return JSON.parse(data);
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
      return data ? JSON.parse(data) : null;
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
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.PUBLIC_VISIBILITY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    } catch (err) {
      console.error('Error restableciendo datos:', err);
    }
  },
};
