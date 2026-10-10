import React, {useMemo, useState} from 'react';
import {BarChart3, ChartPie, Quote} from 'lucide-react';
import {ScientificProduct, TeacherMetrics, TeacherUser} from '../../types';
import {OFFICIAL_RESEARCH_LINES} from '../../constants/researchLines';
import {metricsService} from '../../services/metricsService';
import type {TemporalDataPoint} from '../../services/metricsService';
import {TemporalEvolutionChart} from './TemporalEvolutionChart';

type RankingMetric='citations'|'publications'|'scholarHIndex'|'scopusHIndex';
const rankingOptions:{id:RankingMetric;label:string}[]=[
 {id:'citations',label:'Citas'},
 {id:'publications',label:'Publicaciones'},
 {id:'scholarHIndex',label:'h Google Scholar'},
 {id:'scopusHIndex',label:'h Scopus'},
];
const colors=['#bd3027','#e66a55','#b58a70','#d1b399','#625853'];
const numberFormat=new Intl.NumberFormat('es-EC');
const metricValue=(teacher:TeacherMetrics,metric:RankingMetric)=>metric==='citations'?teacher.citationsTotal:metric==='publications'?teacher.publicationsCount:metric==='scholarHIndex'?teacher.teacher.googleScholarHIndex||0:teacher.teacher.scopusHIndex||0;

function TeacherRankingChart({teachers,products}:{teachers:TeacherUser[];products:ScientificProduct[]}) {
 const [metric,setMetric]=useState<RankingMetric>('citations');
 const verified=useMemo(()=>products.filter(product=>product.status==='verificado'),[products]);
 const top=useMemo(()=>teachers.filter(teacher=>teacher.role==='teacher')
  .map(teacher=>metricsService.calculateTeacherMetrics(teacher,verified))
  .sort((a,b)=>metricValue(b,metric)-metricValue(a,metric)||a.teacher.name.localeCompare(b.teacher.name,'es'))
  .slice(0,5),[teachers,verified,metric]);
 const total=top.reduce((sum,teacher)=>sum+metricValue(teacher,metric),0);
 const circumference=2*Math.PI*67;
 let offset=0;
 const metricLabel=rankingOptions.find(option=>option.id===metric)?.label||'Citas';

 return <section className="research-chart-card teacher-ranking-card" aria-labelledby="teacher-ranking-title">
  <header className="research-chart-heading">
   <div><p className="eyebrow">RANKING · DOCENTES</p><h3 id="teacher-ranking-title">Top profesores</h3></div>
   <ChartPie size={21} aria-hidden="true"/>
  </header>
  <div className="ranking-metric-picker" role="group" aria-label="Métrica para ordenar profesores">
   {rankingOptions.map(option=><button type="button" key={option.id} aria-pressed={metric===option.id} className={metric===option.id?'selected':''} onClick={()=>setMetric(option.id)}>{option.label}</button>)}
  </div>
  {total>0?<div className="teacher-ranking-content">
   <svg className="teacher-ranking-donut" viewBox="0 0 200 200" role="img" aria-label={`Participación de los cinco primeros profesores por ${metricLabel.toLowerCase()}`}>
    <circle cx="100" cy="100" r="67" fill="none" stroke="#eee9e3" strokeWidth="26"/>
    {top.map((teacher,index)=>{
     const value=metricValue(teacher,metric);
     if(!value)return null;
     const length=value/total*circumference;
     const dashOffset=-offset;
     offset+=length;
     return <circle key={teacher.teacher.id} cx="100" cy="100" r="67" fill="none" stroke={colors[index%colors.length]} strokeWidth="26" strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={dashOffset} transform="rotate(-90 100 100)"/>;
    })}
    <text x="100" y="94" textAnchor="middle" className="donut-center-label">Top {top.length}</text>
    <text x="100" y="116" textAnchor="middle" className="donut-center-caption">profesores</text>
   </svg>
   <ol className="teacher-ranking-legend">{top.map((teacher,index)=><li key={teacher.teacher.id}><span className="ranking-swatch" style={{backgroundColor:colors[index%colors.length]}}/><span className="ranking-teacher-name" title={teacher.teacher.name}>{teacher.teacher.name}</span><strong>{numberFormat.format(metricValue(teacher,metric))}{metric==='scholarHIndex'&&teacher.teacher.syntheticBibliometricFields?.includes('googleScholarHIndex')||metric==='scopusHIndex'&&teacher.teacher.syntheticBibliometricFields?.includes('scopusHIndex')?<small className="demo-data-badge">DEMO</small>:null}</strong></li>)}</ol>
  </div>:<div className="teacher-ranking-empty"><Quote size={22}/><p>No hay datos disponibles para comparar con esta métrica.</p></div>}
 </section>;
}

function ResearchLineChart({products}:{products:ScientificProduct[]}) {
 const verified=products.filter(product=>product.status==='verificado');
 const values=OFFICIAL_RESEARCH_LINES.map((line,index)=>({line,index,count:verified.filter(product=>product.researchLine===line).length}))
  .sort((a,b)=>b.count-a.count||a.index-b.index);
 const max=Math.max(1,...values.map(item=>item.count));
 return <section className="research-chart-card research-line-chart" aria-labelledby="research-lines-chart-title">
  <header className="research-chart-heading">
   <div><p className="eyebrow">ÁREAS · ECMC</p><h3 id="research-lines-chart-title">Productos por línea de investigación</h3></div>
   <BarChart3 size={21} aria-hidden="true"/>
  </header>
  <ol className="research-line-bars">{values.map(item=><li key={item.line}>
   <span className="research-line-name">{item.line}</span>
   <span className="research-line-track"><span style={{width:`${item.count?Math.max(3,item.count/max*100):0}%`}}/></span>
   <strong>{numberFormat.format(item.count)}</strong>
  </li>)}</ol>
 </section>;
}

export function ResearchDashboard({teachers,products,temporalData}:{teachers:TeacherUser[];products:ScientificProduct[];temporalData:TemporalDataPoint[]}) {
 return <section className="research-dashboard" aria-label="Indicadores de investigación de la ECMC">
  <div className="research-dashboard-grid">
   <TemporalEvolutionChart data={temporalData}/>
   <TeacherRankingChart teachers={teachers} products={products}/>
   <ResearchLineChart products={products}/>
  </div>
 </section>;
}
