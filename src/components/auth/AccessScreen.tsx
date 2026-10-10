import React, {useState,useRef,useEffect} from 'react';
import {EcmcLogo} from '../../assets/EcmcLogo';
import {ArrowRight,Eye,EyeOff,LogIn,X} from 'lucide-react';
interface AccessScreenProps {
 onLogin:(email:string,pass:string)=>{success:boolean;error?:string}; onExploreAsGuest:()=>void;
}
export const AccessScreen:React.FC<AccessScreenProps>=(p)=>{
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);const [error,setError]=useState('');const [forgot,setForgot]=useState(false);
 const [loginOpen,setLoginOpen]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(loginOpen)dialog.current?.showModal();else dialog.current?.close();},[loginOpen]);
 return <div className="welcome-access">
  <header className="welcome-access-header">
   <div className="welcome-access-brand"><EcmcLogo size={48} variant="color"/><span>RED PAPERS<small>UNIVERSIDAD YACHAY TECH</small></span></div>
   <nav aria-label="Acceso a la plataforma"><button className="welcome-login-trigger" onClick={()=>{setError('');setLoginOpen(true);}}><LogIn size={20} aria-hidden="true"/>Iniciar sesión</button></nav>
  </header>
  <main className="welcome-access-main">
   <p className="welcome-access-kicker">EL CONOCIMIENTO NOS CONECTA</p>
   <h1>Un espacio para<br/><em>su investigación.</em></h1>
   <p className="welcome-access-description">Publicaciones, proyectos y la comunidad científica de nuestra escuela.</p>
   <button className="welcome-public" onClick={p.onExploreAsGuest}><span><strong>Consultar sin iniciar sesión</strong><small>Explore el catálogo y las estadísticas públicas.</small></span><ArrowRight size={24} aria-hidden="true"/></button>
  </main>
  <footer className="welcome-access-footer"><span>Escuela de Ciencias Matemáticas<br/>y Computacionales</span><span>Investigación · ECMC</span></footer>
  <div className="welcome-art" aria-hidden="true"><div className="welcome-emblem-tilt"><div className="welcome-emblem-solid">{Array.from({length:25},(_,layer)=><div key={layer} className={`welcome-emblem-layer ${layer===0||layer===24?'emblem-face':'emblem-edge'}`} style={{transform:`translateZ(${layer-12}px)`}}><EcmcLogo size={340} variant="white"/></div>)}</div></div></div>
  <dialog ref={dialog} className="welcome-login-dialog" onCancel={()=>setLoginOpen(false)} onClose={()=>setLoginOpen(false)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setLoginOpen(false);}}} aria-labelledby="welcome-login-title">
   <button className="welcome-login-close" aria-label="Cerrar inicio de sesión" onClick={()=>setLoginOpen(false)}><X size={22}/></button>
   <div className="login-form"><p className="eyebrow">RED PAPERS</p><h2 id="welcome-login-title">Iniciar sesión</h2><p>Ingrese con su cuenta institucional.</p>
   <form onSubmit={e=>{e.preventDefault();const result=p.onLogin(email,password);setError(result.success?'':result.error||'No se pudo iniciar sesión.');}}>
    <label htmlFor="login-email">Correo institucional</label><input id="login-email" type="email" autoComplete="username" placeholder="nombre@yachaytech.edu.ec" required value={email} onChange={e=>setEmail(e.target.value)}/>
    <label htmlFor="login-password">Contraseña</label><div className="password-field"><input id="login-password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={22}/>:<Eye size={22}/>}</button></div>
    <button type="button" className="forgot-link" onClick={()=>setForgot(!forgot)}>¿Olvidó su contraseña?</button>
    {forgot&&<p role="status" className="login-note">Esta versión es de demostración y todavía no envía correos de recuperación. Use las credenciales de prueba proporcionadas para su perfil.</p>}
    {error&&<p role="alert" className="login-error">{error}</p>}
    <button type="submit" className="primary-button login-submit">Iniciar sesión<ArrowRight size={20}/></button>
   </form>
   </div>
  </dialog>
 </div>;
};
