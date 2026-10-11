import React from 'react';
import { BookOpen, FolderPlus, Search, ShieldCheck } from 'lucide-react';
interface Props { showActions?:boolean; allowRegister?:boolean; onReview?:()=>void; onOpenRegister: (type: 'publicacion'|'proyecto')=>void; onBrowse:()=>void; }
export const InstitutionalBanner:React.FC<Props>=({onOpenRegister,onBrowse,onReview,allowRegister=true,showActions=true})=>{
 if (!showActions) return null;
 return <section className="home-welcome dashboard-actions" aria-labelledby="dashboard-actions-title">
 <h2 id="dashboard-actions-title" className="action-heading">Accesos rápidos</h2>
 <div className={`home-actions ${!allowRegister?(onReview?"home-actions-review":"home-actions-single"):""}`}>
  {allowRegister&&<><button onClick={()=>onOpenRegister('publicacion')}><span className="action-icon"><BookOpen/></span><strong>Registrar publicación</strong><span>Artículos, libros y otros trabajos publicados</span></button>
  <button onClick={()=>onOpenRegister('proyecto')}><span className="action-icon"><FolderPlus/></span><strong>Registrar proyecto</strong><span>Agregue su proyecto de investigación</span></button></>}
  <button onClick={onBrowse}><span className="action-icon"><Search/></span><strong>Consultar producción</strong><span>Busque por título, autor o tema</span></button>
  {onReview&&<button onClick={onReview}><span className="action-icon"><ShieldCheck/></span><strong>Revisión académica</strong><span>Revise y verifique publicaciones y proyectos</span></button>}
 </div>
</section>;};
