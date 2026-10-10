import React, {useState,useRef,useEffect} from 'react';
import {ArrowLeft,ArrowRight,Eye,EyeOff,LogIn,X} from 'lucide-react';
import {SchoolConfig} from '../../constants/schools';
import type {SchoolMetrics} from '../../types';
import {SchoolEmblem,SchoolEmblemDepth,YachayLogo} from '../institutional/SchoolLogo';
interface AccessScreenProps {
 school:SchoolConfig; schoolMetrics:SchoolMetrics; teacherCount:number; onLogin:(email:string,pass:string)=>{success:boolean;error?:string}; onExploreAsGuest:()=>void; onChangeSchool:()=>void;
}
export const AccessScreen:React.FC<AccessScreenProps>=(p)=>{
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);const [error,setError]=useState('');const [forgot,setForgot]=useState(false);
 const [loginOpen,setLoginOpen]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(loginOpen)dialog.current?.showModal();else dialog.current?.close();},[loginOpen]);
 return <div className="welcome-access" style={{'--school-accent':p.school.accent,'--accent':`color-mix(in srgb, ${p.school.accent} 45%, #292522)`} as React.CSSProperties}>
  <header className="welcome-access-header">
   <div className="welcome-access-brand"><YachayLogo width={130}/><span>SIMAPC<small>{p.school.shortName}</small></span></div>
   <nav aria-label="Acceso a la plataforma"><button className="welcome-school-switch" onClick={p.onChangeSchool}><ArrowLeft size={17} aria-hidden="true"/>Cambiar escuela</button><button className="welcome-login-trigger" onClick={()=>{setError('');setLoginOpen(true);}}><LogIn size={20} aria-hidden="true"/>Iniciar sesión</button></nav>
  </header>
  <main className="welcome-access-main">
   <div className="welcome-access-content">
    <p className="welcome-access-kicker">EL CONOCIMIENTO NOS CONECTA</p>
    <h1>Un espacio para<br/><em>su investigación.</em></h1>
    <p className="welcome-access-description">Publicaciones, proyectos y la comunidad científica de nuestra escuela.</p>
    <button className="welcome-public" onClick={p.onExploreAsGuest}><span><strong>Consultar sin iniciar sesión</strong><small>Explore el catálogo y las estadísticas públicas.</small></span><ArrowRight size={24} aria-hidden="true"/></button>
    <dl className="welcome-access-metrics" aria-label={`Cifras de ${p.school.shortName}`}>
     <div><dt>Publicaciones</dt><dd>{p.schoolMetrics.totalPublications}</dd></div>
     <div><dt>Proyectos</dt><dd>{p.schoolMetrics.totalProjects}</dd></div>
     <div><dt>Docentes</dt><dd>{p.teacherCount}</dd></div>
     <div><dt>Líneas con producción</dt><dd>{p.schoolMetrics.researchLinesWithProduction}</dd></div>
    </dl>
   </div>
   <div className="welcome-art" aria-hidden="true" data-school={p.school.code}>
   <div className="welcome-emblem-tilt"><div className="welcome-emblem-solid">
    {Array.from({length:49},(_,layer)=>{
     const isFace=layer===0||layer===48;
     const cleanExtrusion=p.school.code!=='ECMC'&&p.school.code!=='ECIAA';
     const depthScale=cleanExtrusion?0.35:1;
     return <div key={layer} className={`welcome-emblem-layer ${isFace?'emblem-face':'emblem-edge'}`} style={{transform:`translateZ(${(layer-24)*depthScale}px)`}}>
      {isFace||!cleanExtrusion?<SchoolEmblem school={p.school} size={340}/>:<SchoolEmblemDepth school={p.school} size={340}/>}
     </div>;
    })}
   </div></div>
   </div>
  </main>
  <footer className="welcome-access-footer"><span>{p.school.name}</span><span>Investigación · {p.school.code}</span></footer>
  <dialog ref={dialog} className="welcome-login-dialog" onCancel={()=>setLoginOpen(false)} onClose={()=>setLoginOpen(false)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setLoginOpen(false);}}} aria-labelledby="welcome-login-title">
   <button className="welcome-login-close" aria-label="Cerrar inicio de sesión" onClick={()=>setLoginOpen(false)}><X size={22}/></button>
   <div className="login-form"><p className="eyebrow">SIMAPC</p><h2 id="welcome-login-title">Iniciar sesión</h2><p>Ingrese con su cuenta institucional.</p>
   <form onSubmit={e=>{e.preventDefault();const result=p.onLogin(email,password);setError(result.success?'':result.error||'No se pudo iniciar sesión.');}}>
    <label htmlFor="login-email">Correo institucional</label><input id="login-email" type="email" autoComplete="username" placeholder="nombre@yachaytech.edu.ec" required value={email} onChange={e=>setEmail(e.target.value)}/>
    <label htmlFor="login-password">Contraseña</label><div className="password-field"><input id="login-password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={22}/>:<Eye size={22}/>}</button></div>
    <button type="button" className="forgot-link" onClick={()=>setForgot(!forgot)}>¿Olvidó su contraseña?</button>
    {forgot&&<p role="status" className="login-note">Para recuperar su acceso, contacte con el administrador de la plataforma.</p>}
    {error&&<p role="alert" className="login-error">{error}</p>}
    <button type="submit" className="primary-button login-submit">Iniciar sesión<ArrowRight size={20}/></button>
   </form>
   </div>
  </dialog>
 </div>;
};
