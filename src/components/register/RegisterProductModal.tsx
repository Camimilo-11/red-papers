import React, { useState, useEffect, useRef } from 'react';
import {
  ScientificProduct,
  ProductType,
  AcademicSemester,
  OfficialResearchLine,
  TeacherUser,
} from '../../types';
import { OFFICIAL_RESEARCH_LINES, ACADEMIC_SEMESTERS } from '../../constants/researchLines';
import { doiService, OrcidWorkItem } from '../../services/doiService';
import { pdfExtractorService } from '../../services/pdfExtractorService';
import { productService, DuplicateCheckResult } from '../../services/productService';
import {
  X,
  Plus,
  Search,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  BookOpen,
  FolderGit2,
} from 'lucide-react';

interface RegisterProductModalProps {
  initialType?: ProductType;
  lockType?: boolean;
  isOpen: boolean;
  currentUser: TeacherUser | null;
  onClose: () => void;
  onProductCreated: (product: ScientificProduct) => void;
}

type RegisterTab = 'identifier' | 'pdf' | 'manual';

export const RegisterProductModal: React.FC<RegisterProductModalProps> = ({
  initialType = 'publicacion',
  lockType = false,
  isOpen,
  currentUser,
  onClose,
  onProductCreated,
}) => {
  const [activeTab, setActiveTab] = useState<RegisterTab>('manual');
  const [productType, setProductType] = useState<ProductType>(initialType);
  useEffect(()=>{if(productType==='proyecto' && activeTab==='identifier')setActiveTab('manual');},[productType,activeTab]);

  // Campos del formulario
  const [title, setTitle] = useState('');
  const [authorsText, setAuthorsText] = useState(currentUser?.name || '');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<AcademicSemester>('2026-1');
  const [researchLine, setResearchLine] = useState<OfficialResearchLine>(
    'Computación científica'
  );
  const [abstract, setAbstract] = useState('');
  const [doi, setDoi] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [venue, setVenue] = useState('');
  const [volumeIssue, setVolumeIssue] = useState('');

  // Estados de carga e integración
  const [identifierInput, setIdentifierInput] = useState('');
  const [isSearchingId, setIsSearchingId] = useState(false);
  const [idSearchMessage, setIdSearchMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Obras encontradas por ORCID
  const [orcidWorks, setOrcidWorks] = useState<OrcidWorkItem[]>([]);

  // Estados de PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Validación y guardado
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen || !currentUser || currentUser.role==='reviewer_demo') return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if(event.key==='Escape') onClose();
      if(event.key==='Tab') {
        const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,[tabindex="0"]') || []).filter(el=>el.getClientRects().length>0);
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialogRef.current)){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',handleKey);
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handleKey);previous?.focus();};
  },[isOpen,currentUser?.role]);
  useEffect(()=>{contentRef.current?.scrollTo(0,0);dialogRef.current?.focus();},[step]);
  if (!isOpen || !currentUser || currentUser.role==='reviewer_demo') return null;

  // Manejador de autocompletado por DOI u ORCID
  const handleSearchIdentifier = async () => {
    const raw = identifierInput.trim();
    if (!raw) {
      setIdSearchMessage({ type: 'error', text: 'Por favor ingresa un DOI o un ID ORCID.' });
      return;
    }

    setIsSearchingId(true);
    setIdSearchMessage(null);
    setOrcidWorks([]);

    // Detección si es un formato de ORCID (0000-000X-XXXX-XXXX)
    if (/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/.test(raw)) {
      try {
        const works = await doiService.searchByOrcid(raw);
        setIsSearchingId(false);
        if (works.length > 0) {
          setOrcidWorks(works);
          setIdSearchMessage({
            type: 'info',
            text: `Se encontraron ${works.length} obras en el perfil ORCID. Selecciona una para precargar sus metadatos.`,
          });
        } else {
          setIdSearchMessage({
            type: 'info',
            text: 'No se encontraron obras públicas asociadas a este identificador ORCID.',
          });
        }
      } catch {
        setIsSearchingId(false);
        setIdSearchMessage({
          type: 'error',
          text: 'No fue posible conectar con el servicio de ORCID. Puedes ingresar los datos manualmente.',
        });
      }
      return;
    }

    // Si es DOI
    try {
      const res = await doiService.resolveDoi(raw);
      setIsSearchingId(false);
      if (res.success && res.data) {
        setTitle(res.data.title);
        setAuthorsText(res.data.authors.join(', '));
        setYear(res.data.year);
        setSemester(res.data.semester);
        setDoi(res.data.doi);
        setVenue(res.data.venue);
        setAbstract(res.data.abstract);
        if (res.data.researchLine) {
          setResearchLine(res.data.researchLine);
        }
        setIdSearchMessage({
          type: 'success',
          text: '¡Metadatos recuperados exitosamente! Revisa los campos y ajusta lo que consideres necesario.',
        });
      } else {
        setIdSearchMessage({
          type: 'error',
          text:
            res.error ||
            'No se encontraron metadatos para el identificador ingresado. Los campos previos se han conservado.',
        });
      }
    } catch {
      setIsSearchingId(false);
      setIdSearchMessage({
        type: 'error',
        text: 'Error de conexión con el servicio de identificadores. Puedes continuar con captura manual.',
      });
    }
  };

  const handleSelectOrcidWork = (work: OrcidWorkItem) => {
    setTitle(work.title);
    setYear(work.year);
    setSemester(`${work.year}-1` as AcademicSemester);
    setVenue(work.venue);
    setDoi(work.doi || '');
    setAbstract(work.abstract);
    setResearchLine(work.researchLine);
    if (!lockType) setProductType(work.type === 'proyecto' ? 'proyecto' : 'publicacion');
    setOrcidWorks([]);
    setIdSearchMessage({
      type: 'success',
      text: `Obra seleccionada: "${work.title}". Campos precargados para revisión.`,
    });
  };

  // Manejador de extracción desde PDF de proyecto
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setPdfError(null);
    setPdfSuccessMessage(null);
    setPdfExtracting(true);

    const result = await pdfExtractorService.extractProjectMetadata(file);
    setPdfExtracting(false);

    if (result.success && result.data) {
      if (!lockType) setProductType('proyecto');
      setTitle(result.data.title);
      setProjectCode(result.data.projectCode || '');
      setAuthorsText(result.data.participants.join(', '));
      setYear(result.data.year);
      setSemester(result.data.semester);
      setResearchLine(result.data.researchLine);
      setAbstract(result.data.abstract);
      setVenue(result.data.fundingVenue || '');
      setPdfSuccessMessage(
        result.warning ||
          'Metadatos básicos extraídos del documento PDF. Revisa y completa los campos antes de guardar.'
      );
    } else {
      setPdfError(
        result.error ||
          'No se pudo extraer información del archivo. Recuerda que puedes completar el registro de forma manual.'
      );
    }
  };

  // Manejador del guardado final (HU03, HU07, HU08)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDuplicateWarning(null);
    if(step<3){
      if(!title.trim()){setErrorMessage('Escriba el título para continuar.');return;}
      if(step===2&&!authorsText.trim()){setErrorMessage('Escriba al menos un autor.');return;}
      setStep(step+1);return;
    }

    if (!title.trim()) {
      setErrorMessage('El título del producto es obligatorio.');
      return;
    }

    const authors = authorsText
      .split(/[,;\n]/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (authors.length === 0) {
      setErrorMessage('Debes indicar al menos un autor o investigador.');
      return;
    }

    const ownerId = currentUser ? currentUser.id : 'doc-001';

    // Verificación de duplicados antes de persistir (HU07)
    const productPayload = {
      type: productType,
      title: title.trim(),
      authors,
      school: 'ECMC',
      year: Number(year),
      semester,
      researchLine,
      abstract: abstract.trim() || 'Sin resumen registrado.',
      doi: productType === 'publicacion' ? doi.trim() || undefined : undefined,
      venue: productType === 'publicacion' ? venue.trim() || undefined : undefined,
      volumeIssue: productType === 'publicacion' ? volumeIssue.trim() || undefined : undefined,
      projectCode: productType === 'proyecto' ? projectCode.trim() || undefined : undefined,
      fundingVenue: productType === 'proyecto' ? venue.trim() || undefined : undefined,
    };

    const creationResult = productService.createProduct(productPayload, ownerId);

    if (!creationResult.success) {
      setErrorMessage(creationResult.error || 'No se pudo crear el producto.');
      return;
    }

    if (creationResult.product) {
      onProductCreated(creationResult.product);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="register-heading" tabIndex={-1} className="registration-dialog bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 text-[#EF4035]">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 id="register-heading" className="text-base font-bold text-neutral-900">
                {productType === 'publicacion' ? 'Registrar publicación' : 'Registrar proyecto'}
              </h2>
              <p className="text-xs text-neutral-500">
                Complete los datos. Podrá revisarlos antes de guardar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar registro"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="registration-steps" aria-label="Pasos del registro">{['Datos básicos','Autores y detalles','Revisar y guardar'].map((name,index)=><li key={name} aria-current={step===index+1?'step':undefined} className={step===index+1?'current':step>index+1?'complete':''}><span>{index+1}</span>{name}</li>)}</ol>
        {step===1 && <>
        {/* Pestañas de Vía de Ingreso */}
        <div className="bg-white border-b border-neutral-200 px-6 pt-3 flex items-center gap-2 overflow-x-auto">
          {productType==='publicacion' && <button
            onClick={() => setActiveTab('identifier')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'identifier'
                ? 'border-[#EF4035] text-[#EF4035]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buscar con DOI / ORCID</span>
          </button>}

          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-[#EF4035] text-[#EF4035]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Usar un PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-[#EF4035] text-[#EF4035]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Escribir los datos</span>
          </button>
        </div>

        </>}
        {/* Contenido según pestaña */}
        <div ref={contentRef} className="registration-content p-6 overflow-y-auto space-y-5">
          {/* Pestaña 1: Asistente DOI / ORCID */}
          {step===1 && productType==='publicacion' && activeTab === 'identifier' && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#EF4035]" />
                  <span>Búsqueda Asistida por Identificador</span>
                </span>
                <span className="text-[11px] text-neutral-400">
                  Crossref / OpenAlex / ORCID
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="Ej. 10.1145/3576915.3623102  o  0000-0002-1825-0097"
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035] bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSearchIdentifier}
                  disabled={isSearchingId}
                  className="px-4 py-2 bg-[#EF4035] hover:bg-[#D02B20] disabled:bg-neutral-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearchingId ? 'Buscando...' : 'Consultar'}</span>
                </button>
              </div>

              {idSearchMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                    idSearchMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : idSearchMessage.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{idSearchMessage.text}</span>
                </div>
              )}

              {/* Lista de obras si la búsqueda fue por ORCID */}
              {orcidWorks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    Obras encontradas en ORCID:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {orcidWorks.map((work) => (
                      <div
                        key={work.id}
                        onClick={() => handleSelectOrcidWork(work)}
                        className="p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-[#EF4035] cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-neutral-900 group-hover:text-[#EF4035] truncate">
                            {work.title}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {work.venue} • {work.year}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700 text-[10px] font-semibold shrink-0 group-hover:bg-[#EF4035] group-hover:text-white transition-colors">
                          Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña 2: Asistente PDF de Proyecto */}
          {step===1 && activeTab === 'pdf' && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#EF4035]" />
                  <span>Documento del proyecto</span>
                </span>
                <span className="text-[11px] text-neutral-400">PDF máx. 10 MB</span>
              </div>

              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-[#EF4035] bg-white transition-colors">
                <input
                  type="file"
                  id="project-pdf-input"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <label
                  htmlFor="project-pdf-input"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700">
                    {pdfFile ? pdfFile.name : 'Haz clic para subir el documento PDF del proyecto'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Se validará tipo, tamaño e integridad antes de la extracción de metadatos básicos.
                  </span>
                </label>
              </div>

              {pdfExtracting && (
                <p className="text-xs text-[#EF4035] font-semibold text-center animate-pulse">
                  Procesando documento y extrayendo metadatos...
                </p>
              )}

              {pdfError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pdfError}</span>
                </div>
              )}

              {pdfSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pdfSuccessMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Formulario Principal de Datos */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Mensajes de error o advertencia */}
            {errorMessage && (
              <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {step===1 && <>
            {/* Alternador solo para entradas sin tipo elegido */}
            {!lockType && <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Tipo de Producto Académico *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('publicacion')}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    productType === 'publicacion'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Publicación Científica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType('proyecto')}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    productType === 'proyecto'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Proyecto de Investigación</span>
                </button>
              </div>
            </div>}

            {/* Título */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Título del Producto *
              </label>
              <input aria-label="Título del Producto"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título completo de la publicación o proyecto..."
                required
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035]"
              />
            </div>

            </>}
            {step===2 && <>
            {/* Autores */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Autores / Investigadores Participantes (separados por coma) *
              </label>
              <input aria-label="Autores / Investigadores Participantes (separados por coma)"
                type="text"
                value={authorsText}
                onChange={(e) => setAuthorsText(e.target.value)}
                placeholder="Ej. Juan Pablo Astudillo León, Elena Valdivieso Castro"
                required
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035]"
              />
            </div>

            {/* Año, Semestre y Línea de Investigación */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Año *</label>
              <input aria-label="Año"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  min={2020}
                  max={2030}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Semestre *</label>
              <select aria-label="Semestre"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as AcademicSemester)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035] bg-white"
                >
                  {ACADEMIC_SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Línea de Investigación *
                </label>
              <select aria-label="Línea de Investigación"
                  value={researchLine}
                  onChange={(e) => setResearchLine(e.target.value as OfficialResearchLine)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035] bg-white"
                >
                  {OFFICIAL_RESEARCH_LINES.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos condicionales por tipo de producto */}
            {productType === 'publicacion' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Identificador DOI (Opcional)
                  </label>
              <input aria-label="Identificador DOI (Opcional)"
                    type="text"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="10.1145/3576915.3623102"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono focus:ring-1 focus:ring-[#EF4035]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Revista, Conferencia o Editorial
                  </label>
              <input aria-label="Revista, Conferencia o Editorial"
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ej. ACM CCS 2025 / IEEE Transactions..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035]"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Código Institucional del Proyecto
                  </label>
              <input aria-label="Código Institucional del Proyecto"
                    type="text"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="Ej. ECMC-INV-2024-008"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono focus:ring-1 focus:ring-[#EF4035]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Fondo o Programa de Financiamiento
                  </label>
              <input aria-label="Fondo o Programa de Financiamiento"
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ej. Convocatoria Semilla Yachay Tech..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035]"
                  />
                </div>
              </div>
            )}

            {/* Resumen */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Resumen Académico (Abstract) *
              </label>
              <textarea aria-label="Resumen Académico (Abstract)"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={3}
                placeholder="Descripción concisa de la metodología y resultados del trabajo..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-[#EF4035] resize-none"
              />
            </div>

            </>}
            {step===3 && <section className="review-summary"><h3>Revise su registro</h3><dl><dt>Tipo</dt><dd>{productType==='publicacion'?'Publicación':'Proyecto'}</dd><dt>Título</dt><dd>{title}</dd><dt>Autores</dt><dd>{authorsText}</dd><dt>Período</dt><dd>{year} · {semester}</dd><dt>Línea de investigación</dt><dd>{researchLine}</dd><dt>Identificador</dt><dd>{doi||projectCode||'Sin identificador. No se podrá comprobar su existencia por código.'}</dd><dt>Medio / programa</dt><dd>{venue||'No indicado'}</dd><dt>Resumen</dt><dd>{abstract||'No indicado'}</dd></dl></section>}
            {/* Aviso sobre estado inicial "cargado" (Sección 8) */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                Al guardar, su trabajo quedará <strong>cargado para revisión</strong>. Recibirá las novedades en Avisos.
              </span>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={()=>step>1?setStep(step-1):onClose()}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold"
              >
                {step>1?'Atrás':'Cancelar'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#EF4035] hover:bg-[#D02B20] text-white font-bold transition-colors shadow-sm"
              >
                {step<3?'Continuar':'Confirmar y guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
