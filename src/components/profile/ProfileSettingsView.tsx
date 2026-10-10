import React, {ChangeEvent, FormEvent, useRef, useState} from 'react';
import {CircleCheck, ExternalLink, ImagePlus, Save, Trash2, UserRound} from 'lucide-react';
import {AcademicDegree, OfficialResearchLine, TeacherUser} from '../../types';
import {OFFICIAL_RESEARCH_LINES} from '../../constants/researchLines';
import {authService} from '../../services/authService';

type Props={currentUser:TeacherUser; onUpdated:(user:TeacherUser)=>void};
type AcademicDegreeValue=AcademicDegree|'';

const degreeOptions:{value:AcademicDegree;label:string}[]=[
 {value:'PhD',label:'Doctorado (PhD)'},
 {value:'MSc',label:'Maestría (MSc)'},
 {value:'BSc',label:'Licenciatura o Ingeniería'},
 {value:'Other',label:'Otro título'},
];

function degreeLabel(degree?:AcademicDegree,field?:string){
 const label=degreeOptions.find(option=>option.value===degree)?.label;
 if(!label) return 'Título académico pendiente';
 if(!field) return label;
 return degree==='Other'?`${label}: ${field}`:`${label} en ${field}`;
}

async function optimizeProfileImage(file:File):Promise<string>{
 const supportedTypes=['image/jpeg','image/png','image/webp'];
 if(!supportedTypes.includes(file.type)) throw new Error('Elija una imagen JPG, PNG o WebP.');
 if(file.size>5*1024*1024) throw new Error('La imagen debe pesar 5 MB o menos.');

 const source=await new Promise<string>((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('No se pudo leer la imagen.'));
  reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
 });

 return new Promise<string>((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{
   const size=512;
   const canvas=document.createElement('canvas');
   canvas.width=size;canvas.height=size;
   const context=canvas.getContext('2d');
   if(!context){reject(new Error('No se pudo preparar la imagen.'));return;}
   const scale=Math.max(size/image.naturalWidth,size/image.naturalHeight);
   const width=image.naturalWidth*scale;
   const height=image.naturalHeight*scale;
   context.drawImage(image,(size-width)/2,(size-height)/2,width,height);
   resolve(canvas.toDataURL('image/jpeg',.8));
  };
  image.onerror=()=>reject(new Error('El archivo no contiene una imagen válida.'));
  image.src=source;
 });
}

export function ProfileSettingsView({currentUser,onUpdated}:Props) {
 const [name,setName]=useState(currentUser.name);
 const [rank,setRank]=useState(currentUser.rank);
 const [academicDegree,setAcademicDegree]=useState<AcademicDegreeValue>(currentUser.academicDegree||'');
 const [academicField,setAcademicField]=useState(currentUser.academicField||'');
 const [profileImage,setProfileImage]=useState(currentUser.profileImage);
 const [researchLine,setResearchLine]=useState<OfficialResearchLine|''>(currentUser.researchLine||'');
 const [orcid,setOrcid]=useState(currentUser.orcid||'');
 const [githubUrl,setGithubUrl]=useState(currentUser.githubUrl||'');
 const [googleScholarId,setGoogleScholarId]=useState(currentUser.googleScholarId||'');
 const [bio,setBio]=useState(currentUser.bio||'');
 const [profileMessage,setProfileMessage]=useState('');
 const [profileError,setProfileError]=useState('');
 const [photoError,setPhotoError]=useState('');
 const fileInput=useRef<HTMLInputElement>(null);

 const handlePhotoChange=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  if(!file) return;
  setPhotoError('');setProfileMessage('');
  try{setProfileImage(await optimizeProfileImage(file));}
  catch(error){setPhotoError(error instanceof Error?error.message:'No se pudo cargar la imagen.');}
  finally{event.target.value='';}
 };

 const saveProfile=(event:FormEvent)=>{
  event.preventDefault();setProfileMessage('');setProfileError('');
  if(!academicDegree){setProfileError('Seleccione su nivel de formación académica.');return;}
  const result=authService.updateProfile({name,rank,academicDegree,academicField,researchLine:researchLine||undefined,orcid,githubUrl,googleScholarId,bio,profileImage});
  if(!result.success||!result.user){setProfileError(result.error||'No se pudo actualizar el perfil.');return;}
  onUpdated(result.user);setProfileMessage('La información del perfil se actualizó.');
 };

 return <section className="profile-settings-page" aria-labelledby="profile-settings-title">
  <div className="reviewer-heading">
   <p className="eyebrow">MI CUENTA · ECMC</p>
   <h1 id="profile-settings-title">Configuración del perfil</h1>
   <p>Actualice su formación académica, su perfil profesional y sus enlaces de investigación.</p>
  </div>
  <div className="profile-settings-identity"><span className="profile-settings-avatar">{profileImage?<img src={profileImage} alt=""/>:<UserRound size={25}/>}</span><div><strong>{name}</strong><span>{degreeLabel(academicDegree||undefined,academicField)} · {currentUser.email}</span><small>{rank}</small></div></div>

  <form className="profile-settings-card" onSubmit={saveProfile}>
   <div className="profile-settings-card-heading"><div><p className="eyebrow">INFORMACIÓN ACADÉMICA</p><h2>Perfil profesional</h2></div><p>Escriba su nombre sin títulos; registre el grado académico en su propio campo.</p></div>
   <div className="profile-settings-grid">
    <div className="profile-settings-photo-field profile-settings-field-wide">
     <span>Imagen de perfil</span>
     <div className="profile-settings-photo-editor">
      <span className="profile-settings-avatar profile-settings-avatar-large">{profileImage?<img src={profileImage} alt="Vista previa de la foto de perfil"/>:<UserRound size={31}/>}</span>
      <div className="profile-settings-photo-controls"><strong>Su foto en el directorio</strong><small>JPG, PNG o WebP. Máximo 5 MB; la imagen se ajusta automáticamente.</small><div className="profile-settings-photo-actions"><button type="button" className="profile-photo-button" onClick={()=>fileInput.current?.click()}><ImagePlus size={17}/>{profileImage?'Cambiar imagen':'Elegir imagen'}</button>{profileImage&&<button type="button" className="profile-photo-button is-secondary" onClick={()=>{setProfileImage(undefined);setPhotoError('');}}><Trash2 size={16}/>Quitar</button>}</div><input ref={fileInput} className="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Elegir imagen de perfil" onChange={handlePhotoChange}/></div>
     </div>
     {photoError&&<small className="profile-photo-error" role="alert">{photoError}</small>}
    </div>
    <label className="profile-settings-field"><span>Nombre completo</span><input required minLength={3} maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/><small>Use sus nombres y apellidos, sin prefijos como Dr., Dra. o MSc.</small></label>
    <label className="profile-settings-field"><span>Escalafón docente</span><input required maxLength={100} value={rank} onChange={e=>setRank(e.target.value)} placeholder="Profesor/a Principal, Auxiliar, Agregado…"/></label>
    <label className="profile-settings-field"><span>Grado académico</span><select required value={academicDegree} onChange={e=>setAcademicDegree(e.target.value as AcademicDegreeValue)}><option value="">Seleccione su formación</option>{degreeOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Se mostrará separado de su nombre en el perfil público.</small></label>
    <label className="profile-settings-field"><span>{academicDegree==='Other'?'Especifique su título':'Área o especialidad del título'}</span><input maxLength={100} value={academicField} onChange={e=>setAcademicField(e.target.value)} placeholder="Ej. Ciencias de la Computación"/><small>Opcional, salvo que seleccione «Otro título».</small></label>
    <label className="profile-settings-field"><span>Línea principal de investigación</span><select value={researchLine} onChange={e=>setResearchLine(e.target.value as OfficialResearchLine|'')}><option value="">Sin seleccionar</option>{OFFICIAL_RESEARCH_LINES.map(line=><option key={line} value={line}>{line}</option>)}</select><small>Se mostrará en su perfil público.</small></label>
    <label className="profile-settings-field"><span>Correo institucional</span><input value={currentUser.email} readOnly aria-describedby="profile-email-note"/><small id="profile-email-note">Para corregir el correo, solicite el cambio al administrador.</small></label>
    <label className="profile-settings-field"><span>ORCID iD</span><input placeholder="0000-0002-1825-0097" autoComplete="off" value={orcid} onChange={e=>setOrcid(e.target.value)}/><small>Acepte su iD o el enlace de ORCID.</small></label>
    <label className="profile-settings-field"><span>GitHub</span><input placeholder="usuario o github.com/usuario" autoComplete="url" value={githubUrl} onChange={e=>setGithubUrl(e.target.value)}/><small>Enlace a su perfil público.</small></label>
    <label className="profile-settings-field"><span>Google Scholar ID</span><input placeholder="ID o enlace del perfil" autoComplete="off" value={googleScholarId} onChange={e=>setGoogleScholarId(e.target.value)}/><small>Puede pegar el enlace completo; guardaremos el identificador.</small></label>
    <label className="profile-settings-field profile-settings-field-wide"><span>Descripción del docente</span><textarea rows={4} maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Describa brevemente su trayectoria, experiencia y áreas de trabajo."/><small>{bio.length}/500 caracteres</small></label>
   </div>
   {profileError&&<p className="profile-form-message is-error" role="alert">{profileError}</p>}
   {profileMessage&&<p className="profile-form-message is-success" role="status"><CircleCheck size={18}/>{profileMessage}</p>}
   <div className="profile-settings-actions"><button className="primary-button" type="submit"><Save size={18}/>Guardar perfil</button></div>
  </form>
  {(currentUser.orcid||currentUser.githubUrl||currentUser.googleScholarId)&&<div className="profile-links-note"><ExternalLink size={17}/><span>Los enlaces académicos guardados pueden mostrarse en su perfil público de docente.</span></div>}
 </section>;
}
