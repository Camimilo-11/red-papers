import { TeacherUser } from '../types';
import { INITIAL_TEACHERS } from './seedData';

// Public test fixtures for this local prototype, not production credentials.
export const DEMO_ACCOUNTS: {user: TeacherUser; password: string}[] = [
  {user: {...INITIAL_TEACHERS[0], email:'profesor@yachaytech.edu.ec', role:'teacher'}, password:'Profesor2026!'},
  {user: {id:'demo-developer', name:'Equipo de desarrollo', email:'desarrollo@yachaytech.edu.ec', role:'developer', rank:'Desarrollador', school:'ECMC', createdAt:'2026-09-30'}, password:'Equipo2026!'},
  {user: {id:'demo-reviewer', name:'Comité Científico', email:'comite@yachaytech.edu.ec', role:'reviewer_demo', rank:'Miembro del Comité', school:'ECMC', createdAt:'2026-09-30'}, password:'Comite2026!'},
];

export const canReview = (user: TeacherUser | null) => user?.role === 'developer' || user?.role === 'reviewer_demo';
export const canDevelop = (user: TeacherUser | null) => user?.role === 'developer';
