import { TeacherUser } from '../types';
import { INITIAL_TEACHERS } from './seedData';

// Default to the current public demo; production builds can explicitly disable it.
export const DEMO_ENABLED = import.meta.env.DEV || (import.meta.env.VITE_ENABLE_DEMO ?? 'true') === 'true';

// Public test fixtures for this local prototype, not production credentials.
const demoAccounts: {user: TeacherUser; password: string}[] = [
  {user: {...INITIAL_TEACHERS[0], email:'profesor@yachaytech.edu.ec', role:'teacher'}, password:'Profesor2026!'},
  {user: {id:'demo-student-ecmc', name:'Estudiante ECMC', email:'estudiante.ecmc@yachaytech.edu.ec', role:'student', rank:'Estudiante colaborador', school:'ECMC', bio:'Estudiante colaborador de la Escuela de Ciencias Matemáticas y Computacionales.', createdAt:'2026-10-10'}, password:'Estudiante2026!'},
  {user: {id:'demo-developer', name:'Equipo de desarrollo', email:'desarrollo@yachaytech.edu.ec', role:'developer', rank:'Desarrollador', school:'ECMC', createdAt:'2026-09-30'}, password:'Equipo2026!'},
  {user: {id:'demo-reviewer', name:'Comité Científico', email:'comite@yachaytech.edu.ec', role:'reviewer_demo', rank:'Miembro del Comité', school:'ECMC', createdAt:'2026-09-30'}, password:'Comite2026!'},
];

export const DEMO_ACCOUNTS = DEMO_ENABLED ? demoAccounts : [];

// Keep recognizing persisted demo identities even when their login is disabled.
export function isDemoAccount(identity: {id?: string; email?: string}): boolean {
  const email = identity.email?.trim().toLowerCase();
  return demoAccounts.some(({user}) => user.id === identity.id || user.email === email);
}

export const canReview = (user: TeacherUser | null) => user?.role === 'developer' || user?.role === 'reviewer_demo';
export const canDevelop = (user: TeacherUser | null) => user?.role === 'developer';
