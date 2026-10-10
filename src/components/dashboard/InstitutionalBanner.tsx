import React from 'react';
import { BookOpen, FolderPlus, Search, ShieldCheck } from 'lucide-react';
import { getSchoolByCode, SchoolConfig } from '../../constants/schools';
import { SchoolIconTile } from '../institutional/SchoolLogo';
interface Props { school?:SchoolConfig; showActions?:boolean; allowRegister?:boolean; onReview?:()=>void; onOpenRegister: (type: 'publicacion'|'proyecto')=>void; onBrowse:()=>void; }
export const InstitutionalBanner:React.FC<Props>=({school:providedSchool,onOpenRegister,onBrowse,onReview,allowRegister=true,showActions=true})=>{const school=providedSchool||getSchoolByCode('ECMC')!;return <section className={`home-welcome ${showActions?'':'home-welcome-public'}`} style={{'--school-accent':school.accent,'--accent':`color-mix(in srgb, ${school.accent} 45%, #292522)`} as React.CSSProperties}>
 <div className="welcome-heading"><div><p className="eyebrow">PRODUCCIÓN CIENTÍFICA · {school.code}</p><h1>Su investigación,<br/><em>en un solo lugar.</em></h1>{allowRegister&&<p>Registre su trabajo y descubra la investigación de {school.shortName}.</p>}</div><div className="welcome-seal" data-school={school.code} aria-hidden="true"><SchoolIconTile school={school} size={112}/></div></div>
 {showActions&&<><h2 className="action-heading">¿Qué desea hacer hoy?</h2>
 <div className={`home-actions ${!allowRegister?(onReview?"home-actions-review":"home-actions-single"):""}`}>
  {allowRegister&&<><button onClick={()=>onOpenRegister('publicacion')}><span className="action-icon"><BookOpen/></span><strong>Registrar publicación</strong><span>Artículos, libros y otros trabajos publicados</span></button>
  <button onClick={()=>onOpenRegister('proyecto')}><span className="action-icon"><FolderPlus/></span><strong>Registrar proyecto</strong><span>Agregue su proyecto de investigación</span></button></>}
  <button onClick={onBrowse}><span className="action-icon"><Search/></span><strong>Consultar producción</strong><span>Busque por título, autor o tema</span></button>
  {onReview&&<button onClick={onReview}><span className="action-icon"><ShieldCheck/></span><strong>Revisión académica</strong><span>Revise y verifique publicaciones y proyectos</span></button>}
 </div></>}
</section>;};
