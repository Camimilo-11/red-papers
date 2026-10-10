import { canDevelop } from '../../constants/demoAccounts';
import React, { useState, useEffect, useRef } from 'react';
import { TeacherUser, UserNotification } from '../../types';
import { getSchoolByCode, SchoolConfig } from '../../constants/schools';
import { YachayLogo } from '../institutional/SchoolLogo';
import { NotificationsPopover } from './NotificationsPopover';
import { Home, BookOpen, Users, FolderOpen, Bell, LogOut, LogIn, Menu, X, ShieldCheck, GitBranch, Settings } from 'lucide-react';
export type ActiveTab = 'dashboard' | 'catalog' | 'directory' | 'mine' | 'settings' | 'traceability' | 'reviewer' | 'roles';
interface HeaderProps {
  activeTab: ActiveTab; onTabChange: (tab: ActiveTab) => void;
  currentUser: TeacherUser | null; teachers: TeacherUser[]; notifications: UserNotification[]; school?: SchoolConfig;
  onLoginClick: () => void; onLogoutClick: () => void; onSwitchUser: (id: string) => void;
  onOpenRegisterModal: () => void; onOpenReviewerConsole: () => void;
  onMarkNotificationAsRead: (id: string) => void; onMarkAllNotificationsAsRead: () => void;
}
export const Header: React.FC<HeaderProps> = (p) => {
 const school=p.school||getSchoolByCode('ECMC')!;
 const [mobileOpen,setMobileOpen]=useState(false);
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const notificationRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!notificationsOpen)return;
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!notificationRef.current?.contains(event.target))setNotificationsOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setNotificationsOpen(false);};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[notificationsOpen]);
 const tabs: {id:ActiveTab; label:string; icon:typeof Home}[] = [
  {id:'dashboard',label:'Inicio',icon:Home}, {id:'catalog',label:'Publicaciones y proyectos',icon:BookOpen},
  {id:'directory',label:'Docentes',icon:Users}];
 if(p.currentUser && p.currentUser.role!=='reviewer_demo') tabs.push({id:'mine',label:'Mis registros',icon:FolderOpen});
 if(p.currentUser?.role==='reviewer_demo') tabs.push({id:'reviewer',label:'Comité Científico',icon:ShieldCheck});
 const navigate=(id:ActiveTab)=>{setMobileOpen(false);setNotificationsOpen(false); if(id==='mine'&&!p.currentUser)p.onLoginClick();else p.onTabChange(id);window.scrollTo(0,0);requestAnimationFrame(()=>document.getElementById('main-content')?.focus({preventScroll:true}));};
 const unread=p.notifications.filter(n=>!n.read).length;
 return <>
  <a href="#main-content" className="skip-link">Ir al contenido</a>
  <header className="portal-topbar">
   <button className="mobile-menu" aria-label={mobileOpen?'Cerrar menú':'Abrir menú'} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button>
   <div className="topbar-context"><span>SIMAPC</span><span>{school.name}</span></div>
   <div className="topbar-actions">
    {p.currentUser ? <>
     <div className="relative" ref={notificationRef}><button className="notification-button" aria-label={`Avisos, ${unread} sin leer`} onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-expanded={notificationsOpen}><Bell size={20}/><span>Avisos</span>{unread>0&&<b>{unread}</b>}</button>
      {notificationsOpen&&<NotificationsPopover notifications={p.notifications} onMarkAsRead={p.onMarkNotificationAsRead} onMarkAllAsRead={p.onMarkAllNotificationsAsRead} onClose={()=>setNotificationsOpen(false)}/>}</div>
     <button className="exit-button" onClick={p.onLogoutClick}><LogOut size={19}/><span>Cerrar sesión</span></button>
    </>:<button className="primary-button" onClick={p.onLoginClick}><LogIn size={20}/>Iniciar sesión</button>}
   </div>
  </header>
  {mobileOpen&&<button className="sidebar-scrim" aria-label="Cerrar menú" onClick={()=>setMobileOpen(false)}/>}
  <aside data-role={p.currentUser?.role || 'visitor'} className={`portal-sidebar ${mobileOpen?'is-open':''}`}>
   <button className="sidebar-brand" onClick={()=>navigate('dashboard')} aria-label="SIMAPC, ir al inicio"><YachayLogo width={96}/><span>SIMAPC<small>Investigación · {school.code}</small></span></button>
   <div className="sidebar-section-label">TU ESPACIO DE INVESTIGACIÓN</div>
   <nav aria-label="Navegación principal">{tabs.map(({id,label,icon:Icon})=><button key={id} className={`sidebar-link ${p.activeTab===id?'active':''}`} aria-current={p.activeTab===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={23}/><span>{label}</span></button>)}</nav>
   <div className="sidebar-bottom">
    {canDevelop(p.currentUser) && <details className="secondary-tools"><summary>Otras herramientas</summary><button onClick={()=>navigate('traceability')}><GitBranch size={19}/>Trazabilidad del proyecto</button><button aria-current={p.activeTab==='reviewer'?'page':undefined} onClick={()=>{setMobileOpen(false);setNotificationsOpen(false);p.onOpenReviewerConsole();}}><ShieldCheck size={19}/>Comité Científico</button>

     <button aria-current={p.activeTab==='roles'?'page':undefined} onClick={()=>navigate('roles')}><Users size={19}/>Asignar comité</button>
    </details>}
    {p.currentUser?.role==='teacher' ? <button type="button" className={`sidebar-profile sidebar-profile-button ${p.activeTab==='settings'?'is-current':''}`} aria-label={`Abrir configuración del perfil de ${p.currentUser.name}`} aria-current={p.activeTab==='settings'?'page':undefined} onClick={()=>navigate('settings')}><span className="profile-initial">{p.currentUser.name.charAt(0).toUpperCase()}</span><span><strong>{p.currentUser.name}</strong><small>Profesor · Configuración</small></span><Settings className="sidebar-profile-settings-icon" size={17} aria-hidden="true"/></button> : <div className="sidebar-profile"><span className="profile-initial">{p.currentUser?'D':'V'}</span><div><strong>{p.currentUser?.name||'Visitante'}</strong><small>{p.currentUser ? (p.currentUser.role==='developer'?'Desarrollador':p.currentUser.role==='reviewer_demo'?'Comité Científico':'Profesor') : 'Consulta pública'}</small></div></div>}
   </div>
  </aside>
 </>;
};
