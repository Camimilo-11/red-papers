import React from 'react';
import { EcmcLogo } from '../../assets/EcmcLogo';
import { BookOpen, FolderPlus, Search, ShieldCheck } from 'lucide-react';
interface Props { showActions?:boolean; allowRegister?:boolean; onReview?:()=>void; onOpenRegister: (type: 'publicacion'|'proyecto')=>void; onBrowse:()=>void; }
export const InstitutionalBanner:React.FC<Props>=({onOpenRegister,onBrowse,onReview,allowRegister=true,showActions=true})=><section className={`home-welcome ${showActions?'':'home-welcome-public'}`}>
 <div className="welcome-heading"><div><p className="eyebrow">PRODUCCIÓN CIENTÍFICA · ECMC</p><h1>Su investigación,<br/><em>en un solo lugar.</em></h1>{allowRegister&&<p>Registre su trabajo y descubra la investigación de nuestra escuela.</p>}</div><div className="welcome-seal" aria-hidden="true"><EcmcLogo size={116} variant="white"/></div></div>
 {showActions&&<><h2 className="action-heading">¿Qué desea hacer hoy?</h2>
 <div className={`home-actions ${!allowRegister?(onReview?"home-actions-review":"home-actions-single"):""}`}>
  {allowRegister&&<><button onClick={()=>onOpenRegister('publicacion')}><span className="action-icon"><BookOpen/></span><strong>Registrar publicación</strong><span>Artículos, libros y otros trabajos publicados</span></button>
  <button onClick={()=>onOpenRegister('proyecto')}><span className="action-icon"><FolderPlus/></span><strong>Registrar proyecto</strong><span>Agregue su proyecto de investigación</span></button></>}
  <button onClick={onBrowse}><span className="action-icon"><Search/></span><strong>Consultar producción</strong><span>Busque por título, autor o tema</span></button>
  {onReview&&<button onClick={onReview}><span className="action-icon"><ShieldCheck/></span><strong>Revisión académica</strong><span>Revise y verifique publicaciones y proyectos</span></button>}
 </div></>}
</section>;
