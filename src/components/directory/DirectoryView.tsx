import React, { useEffect, useRef, useState } from 'react';
import { AcademicDegree, SyntheticAcademicProfileField, TeacherUser, ScientificProduct } from '../../types';
import { metricsService } from '../../services/metricsService';
import { exportService, ExportMetadata } from '../../services/exportService';
import { productDateLabel } from '../../services/productPresentation';
import { ProductDetailModal } from '../catalog/ProductDetailModal';
import { Search, ExternalLink, Mail, Download, BarChart3, ArrowLeft, ChevronRight } from 'lucide-react';
import juanPhoto from '../../assets/researchers/juan-pablo-astudillo.png';
import diegoPhoto from '../../assets/researchers/diego-peluffo.png';
import eugenioPhoto from '../../assets/researchers/eugenio-morocho.png';
const degreeLabels:Record<AcademicDegree,string>={PhD:'Doctorado (PhD)',MSc:'Maestría (MSc)',BSc:'Licenciatura o Ingeniería',Other:'Otro título'};
const academicProfileLink=(teacher:TeacherUser,field:SyntheticAcademicProfileField,label:string,href:string)=>{
 if(!teacher[field]) return null;
 const rawValue=teacher[field]||'';
 const value=field==='githubUrl'?rawValue.replace(/^https?:\/\/(www\.)?github\.com\//i,'@'):rawValue;
 const labelWithValue=`${label} · ${value}`;
 if(teacher.syntheticAcademicProfileFields?.includes(field)) return <span className="academic-profile-unlinked">{label}</span>;
 return <a href={href} target="_blank" rel="noopener noreferrer">{labelWithValue}<ExternalLink size={15} aria-hidden="true"/></a>;
};
const academicTitle = (teacher:TeacherUser) => {
 if(!teacher.academicDegree) return undefined;
 const label=degreeLabels[teacher.academicDegree];
 return teacher.academicField
  ? teacher.academicDegree==='Other'?`${label}: ${teacher.academicField}`:`${label} en ${teacher.academicField}`
  : label;
};
const portrait = (teacher: TeacherUser) => {
 if(teacher.profileImage) return teacher.profileImage;
 const name=teacher.name.toLowerCase();
 if(name.includes('juan pablo') && name.includes('astudillo')) return juanPhoto;
 if(name.includes('diego') && name.includes('peluffo')) return diegoPhoto;
 if(name.includes('eugenio') && name.includes('morocho')) return eugenioPhoto;
 return undefined;
};


interface DirectoryViewProps {
  teachers: TeacherUser[];
  allProducts: ScientificProduct[];
  selectedTeacherId?: string;
  onFilterInCatalog: (teacherId: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  teachers,
  allProducts,
  selectedTeacherId,
  onFilterInCatalog,
}) => {
  const [activeTeacherId, setActiveTeacherId] = useState<string>(
    selectedTeacherId || teachers[0]?.id || 'doc-001'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [viewingProduct, setViewingProduct] = useState<ScientificProduct | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const profileRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileProfileOpen || !window.matchMedia('(max-width: 1000px)').matches) return;

    const frame = window.requestAnimationFrame(() => {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileProfileOpen, activeTeacherId]);

  // Docente activo seleccionado
  const activeTeacher = teachers.find((t) => t.id === activeTeacherId) || teachers[0];

  // Métricas del docente seleccionado
  const activeTeacherMetrics = activeTeacher
    ? metricsService.calculateTeacherMetrics(activeTeacher, allProducts.filter(product=>product.status==='verificado'))
    : null;

  // Productos del docente seleccionado
  const teacherProducts = allProducts.filter((p) => {
    if (p.status !== 'verificado') return false;
    if (!activeTeacher) return false;
    if (p.ownerId === activeTeacher.id) return true;
    return p.authors.some((a) => a.toLowerCase().includes(activeTeacher.name.toLowerCase()));
  });
  const teacherResearchLines = activeTeacher
    ? activeTeacher.researchLines?.length
      ? activeTeacher.researchLines
      : activeTeacher.researchLine
      ? [activeTeacher.researchLine]
      : [...new Set(teacherProducts.map(product=>product.researchLine))]
    : [];
  const annualResearchCounts = (()=>{
    const lastYear=new Date().getFullYear();
    return Array.from({length:5},(_,index)=>{
      const year=lastYear-4+index;
      return {year,count:teacherProducts.filter(product=>product.year===year).length};
    });
  })();
  const maxAnnualResearchCount=Math.max(1,...annualResearchCounts.map(item=>item.count));

  // Filtrado de la lista izquierda
  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.rank.toLowerCase().includes(q) ||
      (t.academicDegree&&degreeLabels[t.academicDegree].toLowerCase().includes(q)) ||
      (t.academicField&&t.academicField.toLowerCase().includes(q)) ||
      Object.values(t.researchSublines||{}).flat().some(subline=>subline.toLowerCase().includes(q)) ||
      t.email.toLowerCase().includes(q) ||
      (t.bio && t.bio.toLowerCase().includes(q))
    );
  });

  // Exportaciones de este docente
  const handleTeacherExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!activeTeacher || (format !== 'pdf' && teacherProducts.length === 0)) {
      setExportNotice('No hay productos para exportar en este formato.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    const meta: ExportMetadata = {
      filters: {
        searchQuery: '',
        productType: 'todos',
        teacherId: activeTeacher.id,
        periodYear: 'todos',
        researchLine: 'todas',
        status: 'todos',
      },
      totalRecords: teacherProducts.length,
      generatedAt: new Date().toLocaleString('es-EC'),
      institution: 'Universidad Yachay Tech',
      school: `Historial de ${activeTeacher.name} - ECMC`,
    };

    let success = false;
    const fileName = `historial_${activeTeacher.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    if (format === 'csv') {
      success = exportService.exportToCsv(teacherProducts, meta, `${fileName}.csv`);
    } else if (format === 'xlsx') {
      success = exportService.exportToExcel(teacherProducts, meta, `${fileName}.xlsx`);
    } else if (format === 'pdf') {
      success = exportService.exportTeacherCv(activeTeacher, teacherProducts, activeTeacherMetrics!, meta.generatedAt);
    }

    if (success) {
      setExportNotice(format === 'pdf' ? 'Currículum del docente listo para imprimir o guardar en PDF.' : `Historial exportado en formato ${format.toUpperCase()}.`);
    }
    setTimeout(() => setExportNotice(null), 3000);
  };

  return <section className="academic-directory">
    <header className="academic-directory-heading">
      <div><h2>Docentes e investigadores</h2><p>Conozca a nuestra comunidad y explore sus publicaciones.</p></div>
      <div className="academic-search"><Search size={19} aria-hidden="true"/><input aria-label="Buscar docente" placeholder="Nombre o especialidad · Enter" value={searchDraft} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();setSearchQuery(searchDraft.trim());}}} onChange={e=>setSearchDraft(e.target.value)}/></div>
    </header>
    {exportNotice&&<p role="status" className="save-notice">{exportNotice}</p>}
    <div className="academic-directory-layout" data-mobile-profile-open={mobileProfileOpen}>
      <nav className="academic-people" aria-label="Seleccionar docente">
        {filteredTeachers.map(t=><button key={t.id} type="button" className={t.id===activeTeacher?.id?'selected':''} aria-pressed={t.id===activeTeacher?.id} onClick={()=>{setActiveTeacherId(t.id);setMobileProfileOpen(true);}}><span>{t.name}</span><small>{t.rank}{academicTitle(t)?` · ${academicTitle(t)}`:''}</small><ChevronRight className="academic-person-open-icon" size={18} aria-hidden="true"/></button>)}
        {!filteredTeachers.length&&<p className="academic-empty">No se encontraron docentes.</p>}
      </nav>
      {activeTeacher&&activeTeacherMetrics?<article className="academic-profile" key={activeTeacher.id} ref={profileRef}>
        <button type="button" className="academic-mobile-back" onClick={()=>setMobileProfileOpen(false)}><ArrowLeft size={17} aria-hidden="true"/>Todos los docentes</button>
        <header className="academic-profile-heading">
          {portrait(activeTeacher)?<img className="academic-avatar" src={portrait(activeTeacher)} alt={activeTeacher.name}/>:<span className="academic-avatar academic-initial" aria-hidden="true">{activeTeacher.name.split(' ')[1]?.charAt(0)||activeTeacher.name.charAt(0)}</span>}
          <div><h3>{activeTeacher.name}</h3><p>{activeTeacher.rank}</p>{academicTitle(activeTeacher)&&<p className="academic-degree">{academicTitle(activeTeacher)}</p>}<p className="academic-school">Escuela de Ciencias Matemáticas y Computacionales</p>{activeTeacher.yachayEntryYear&&<p className="academic-entry-year">En Yachay Tech desde {activeTeacher.yachayEntryYear}</p>}</div>
        </header>
        <div className="academic-profile-body">
          <section className="academic-profile-section academic-research-section" aria-labelledby="academic-research-line-title">
            <h4 id="academic-research-line-title">Línea de investigación</h4>
            {teacherResearchLines.length?<div className="academic-research-groups">{teacherResearchLines.map(line=><div className="academic-research-group" key={line}><strong>{line}</strong>{activeTeacher.researchSublines?.[line]?.length?<ul>{activeTeacher.researchSublines[line]?.map(subline=><li key={subline}>{subline}</li>)}</ul>:null}</div>)}</div>:<p className="academic-section-empty">Este docente aún no ha registrado una línea de investigación.</p>}
          </section>
          <aside className="academic-year-chart" aria-labelledby="academic-year-chart-title">
            <div className="academic-year-chart-heading"><div><span>PRODUCCIÓN ACADÉMICA</span><h4 id="academic-year-chart-title">Investigaciones por año</h4></div><BarChart3 size={20} aria-hidden="true"/></div>
            {annualResearchCounts.length?<>
              <div className="academic-year-bars" role="img" aria-label={annualResearchCounts.map(item=>`${item.year}: ${item.count} registros`).join('; ')}>
                {annualResearchCounts.map(item=><div className="academic-year-bar-column" key={item.year} title={`${item.year}: ${item.count} registros`}><strong>{item.count}</strong><div className="academic-year-bar-track"><span style={{height:`${item.count?Math.max(8,item.count/maxAnnualResearchCount*100):0}%`}}/></div><small>{item.year}</small></div>)}
              </div>
              <p className="academic-year-chart-note">Publicaciones y proyectos registrados · {teacherProducts.length} en total</p>
            </>:<p className="academic-year-chart-empty">Aún no hay investigaciones para mostrar.</p>}
          </aside>
        </div>
        <section className="academic-profile-section academic-description-section" aria-labelledby="academic-description-title">
          <h4 id="academic-description-title">Descripción del docente</h4>
          {activeTeacher.bio?<p className="academic-bio">{activeTeacher.bio}</p>:<p className="academic-section-empty">Este docente aún no ha añadido una descripción.</p>}
        </section>
        <div className="academic-contact">
          <a href={`mailto:${activeTeacher.email}`}><Mail size={18} aria-hidden="true"/>{activeTeacher.email}</a>
          {activeTeacher.orcid?<a href={`https://orcid.org/${activeTeacher.orcid}`} target="_blank" rel="noopener noreferrer">ORCID · {activeTeacher.orcid}<ExternalLink size={15} aria-hidden="true"/></a>:<span>ORCID no registrado</span>}
          {academicProfileLink(activeTeacher,'githubUrl','GitHub',activeTeacher.githubUrl||'')}
          {academicProfileLink(activeTeacher,'googleScholarId','Google Scholar',`https://scholar.google.com/citations?user=${encodeURIComponent(activeTeacher.googleScholarId||'')}`)}
          {academicProfileLink(activeTeacher,'scopusAuthorId','Scopus',`https://www.scopus.com/authid/detail.uri?authorId=${encodeURIComponent(activeTeacher.scopusAuthorId||'')}`)}
          {academicProfileLink(activeTeacher,'webOfScienceId','Web of Science',`https://www.webofscience.com/wos/author/record/${encodeURIComponent(activeTeacher.webOfScienceId||'')}`)}
        </div>
        <dl className="academic-metrics">
          <div><dt>Publicaciones</dt><dd>{activeTeacherMetrics.publicationsCount}</dd></div>
          <div><dt>Proyectos</dt><dd>{activeTeacherMetrics.projectsCount}</dd></div>
          <div><dt>Citas</dt><dd>{activeTeacherMetrics.citationsTotal}</dd></div>
          <div className="academic-index-metric"><dt>Índices h externos</dt><dd><span>Google Scholar <strong>{activeTeacher.googleScholarHIndex??'—'}</strong></span><span>Scopus <strong>{activeTeacher.scopusHIndex??'—'}</strong></span></dd></div>
        </dl>
        <div className="academic-actions">
          <button className="primary-button" onClick={()=>onFilterInCatalog(activeTeacher.id)}>Ver publicaciones</button>
          <details className="academic-download"><summary><Download size={18} aria-hidden="true"/>Descargar perfil</summary><div>{(['pdf','xlsx','csv'] as const).map(format=><button key={format} onClick={e=>{handleTeacherExport(format);e.currentTarget.closest('details')?.removeAttribute('open');}}>{format==='pdf'?'CV · PDF':format==='xlsx'?'Excel':'CSV'}</button>)}</div></details>
        </div>
        <section className="academic-products" aria-label="Producción académica">
          <h4>Producción académica <span>({teacherProducts.length})</span></h4>
          {teacherProducts.length?teacherProducts.map(product=><button key={product.id} className="academic-product" onClick={()=>setViewingProduct(product)}><span className="academic-product-meta">{product.type==='publicacion'?'Publicación':'Proyecto'} · {productDateLabel(product)}</span><span className="academic-product-title">{product.title}</span><span className="academic-product-venue">{product.venue||product.fundingVenue||''}</span></button>):<p className="academic-empty">Este docente aún no tiene productos registrados.</p>}
        </section>
      </article>:<p className="academic-empty">No hay docentes registrados.</p>}
    </div>
    {viewingProduct&&<ProductDetailModal product={viewingProduct} onClose={()=>setViewingProduct(null)}/>}
  </section>;
};
