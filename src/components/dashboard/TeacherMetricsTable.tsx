import React, { useState } from 'react';
import { TeacherMetrics } from '../../types';
import { Users, Search, ExternalLink, ChevronRight } from 'lucide-react';

interface TeacherMetricsTableProps {
  teacherMetrics: TeacherMetrics[];
  onSelectTeacher: (teacherId: string) => void;
  onViewTeacherProducts: (teacherId: string) => void;
}

export const TeacherMetricsTable: React.FC<TeacherMetricsTableProps> = ({
  teacherMetrics,
  onSelectTeacher,
  onViewTeacherProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const filteredTeachers = teacherMetrics.filter((tm) => {
    const q = searchQuery.toLowerCase();
    return (
      tm.teacher.name.toLowerCase().includes(q) ||
      tm.teacher.email.toLowerCase().includes(q) ||
      tm.teacher.rank.toLowerCase().includes(q) ||
      (tm.teacher.academicDegree&&tm.teacher.academicDegree.toLowerCase().includes(q)) ||
      (tm.teacher.academicField&&tm.teacher.academicField.toLowerCase().includes(q)) ||
      (tm.teacher.orcid && tm.teacher.orcid.includes(q))
    );
  });

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
      {/* Encabezado y buscador */}
      <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-[#EF4035]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 tracking-tight">
              Directorio e Indicadores por Docente (ECMC)
            </h3>
            <p className="text-xs text-neutral-500">
              Métricas consolidadas de producción: Publicaciones, Proyectos, Citas e Índice h
              calculado según estándares bibliométricos.
            </p>
          </div>
        </div>

        {/* Input de búsqueda */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchDraft} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();setSearchQuery(searchDraft.trim());}}}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Buscar profesor..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#EF4035] bg-neutral-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Tabla responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <th className="py-3 px-6">Docente Investigador</th>
              <th className="py-3 px-4">Identificador ORCID</th>
              <th className="py-3 px-4 text-center">Publicaciones</th>
              <th className="py-3 px-4 text-center">Proyectos</th>
              <th className="py-3 px-4 text-center">Citas Totales</th>
              <th className="py-3 px-4 text-center">Índice h</th>
              <th className="py-3 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-400">
                  No se encontraron docentes con el término "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredTeachers.map((tm) => (
                <tr
                  key={tm.teacher.id}
                  className="hover:bg-neutral-50/70 transition-colors group"
                >
                  {/* Docente */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => onSelectTeacher(tm.teacher.id)}
                      className="text-left group-hover:text-[#EF4035] transition-colors"
                    >
                      <div className="font-bold text-neutral-900 group-hover:text-[#EF4035]">
                        {tm.teacher.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {tm.teacher.rank}{tm.teacher.academicDegree?` · ${tm.teacher.academicDegree}${tm.teacher.academicField?` en ${tm.teacher.academicField}`:''}`:''} • <span className="font-mono text-[10px]">{tm.teacher.email}</span>
                      </div>
                    </button>
                  </td>

                  {/* ORCID */}
                  <td className="py-4 px-4 font-mono text-[11px]">
                    {tm.teacher.orcid ? (
                      <a
                        href={`https://orcid.org/${tm.teacher.orcid}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60"
                      >
                        <span>{tm.teacher.orcid}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Publicaciones */}
                  <td className="py-4 px-4 text-center font-semibold text-neutral-800 tabular-nums">
                    {tm.publicationsCount}
                  </td>

                  {/* Proyectos */}
                  <td className="py-4 px-4 text-center font-semibold text-neutral-800 tabular-nums">
                    {tm.projectsCount}
                  </td>

                  {/* Citas Totales */}
                  <td className="py-4 px-4 text-center font-bold text-neutral-900 tabular-nums">
                    {tm.citationsTotal}
                  </td>

                  {/* Índice h */}
                  <td className="py-4 px-4 text-center font-black text-[#EF4035] tabular-nums text-sm">
                    {tm.hIndex}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onViewTeacherProducts(tm.teacher.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-[#EF4035] transition-colors"
                    >
                      <span>Ver Productos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
