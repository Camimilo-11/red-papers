import React, {FormEvent, useState} from 'react';
import {CircleCheck, ExternalLink, LockKeyhole, Save, UserRound} from 'lucide-react';
import {TeacherUser} from '../../types';
import {OfficialResearchLine} from '../../types';
import {OFFICIAL_RESEARCH_LINES} from '../../constants/researchLines';
import {authService} from '../../services/authService';

type Props={currentUser:TeacherUser; onUpdated:(user:TeacherUser)=>void};

export function ProfileSettingsView({currentUser,onUpdated}:Props) {
 const [name,setName]=useState(currentUser.name);
 const [rank,setRank]=useState(currentUser.rank);
 const [researchLine,setResearchLine]=useState<OfficialResearchLine|''>(currentUser.researchLine||'');
 const [orcid,setOrcid]=useState(currentUser.orcid||'');
 const [githubUrl,setGithubUrl]=useState(currentUser.githubUrl||'');
 const [googleScholarId,setGoogleScholarId]=useState(currentUser.googleScholarId||'');
 const [bio,setBio]=useState(currentUser.bio||'');
 const [profileMessage,setProfileMessage]=useState('');
 const [profileError,setProfileError]=useState('');
 const [currentPassword,setCurrentPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [passwordMessage,setPasswordMessage]=useState('');
 const [passwordError,setPasswordError]=useState('');

 const saveProfile=(event:FormEvent)=>{
  event.preventDefault();setProfileMessage('');setProfileError('');
  const result=authService.updateProfile({name,rank,researchLine:researchLine||undefined,orcid,githubUrl,googleScholarId,bio});
  if(!result.success||!result.user){setProfileError(result.error||'No se pudo actualizar el perfil.');return;}
  onUpdated(result.user);setProfileMessage('La información del perfil se actualizó.');
 };
 const changePassword=(event:FormEvent)=>{
  event.preventDefault();setPasswordMessage('');setPasswordError('');
  if(newPassword!==confirmPassword){setPasswordError('La confirmación no coincide con la nueva contraseña.');return;}
  const result=authService.changePassword(currentPassword,newPassword);
  if(!result.success){setPasswordError(result.error||'No se pudo cambiar la contraseña.');return;}
  setCurrentPassword('');setNewPassword('');setConfirmPassword('');setPasswordMessage('La contraseña se actualizó correctamente.');
 };

 return <section className="profile-settings-page" aria-labelledby="profile-settings-title">
  <div className="reviewer-heading">
   <p className="eyebrow">MI CUENTA · ECMC</p>
   <h1 id="profile-settings-title">Configuración del perfil</h1>
   <p>Administre su información académica y los enlaces asociados a su trabajo.</p>
  </div>
  <div className="profile-settings-identity"><span className="profile-settings-avatar"><UserRound size={25}/></span><div><strong>{currentUser.name}</strong><span>{currentUser.rank} · {currentUser.email}</span></div></div>

  <form className="profile-settings-card" onSubmit={saveProfile}>
   <div className="profile-settings-card-heading"><div><p className="eyebrow">INFORMACIÓN ACADÉMICA</p><h2>Perfil profesional</h2></div><p>El correo institucional identifica su cuenta y solo puede cambiarlo la administración.</p></div>
   <div className="profile-settings-grid">
    <label className="profile-settings-field"><span>Nombre completo</span><input required minLength={3} maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
    <label className="profile-settings-field"><span>Escalafón o título académico</span><input required maxLength={100} value={rank} onChange={e=>setRank(e.target.value)}/></label>
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

  <form className="profile-settings-card password-settings" onSubmit={changePassword}>
   <div className="profile-settings-card-heading"><div><p className="eyebrow">ACCESO</p><h2><LockKeyhole size={21}/> Cambiar contraseña</h2></div><p>Use una contraseña de al menos 6 caracteres.</p></div>
   <div className="profile-settings-grid password-settings-grid">
    <label className="profile-settings-field profile-settings-field-wide"><span>Contraseña actual</span><input type="password" required autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label>
    <label className="profile-settings-field"><span>Nueva contraseña</span><input type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label>
    <label className="profile-settings-field"><span>Confirmar nueva contraseña</span><input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>
   </div>
   {passwordError&&<p className="profile-form-message is-error" role="alert">{passwordError}</p>}
   {passwordMessage&&<p className="profile-form-message is-success" role="status"><CircleCheck size={18}/>{passwordMessage}</p>}
   <div className="profile-settings-actions"><button className="primary-button" type="submit"><LockKeyhole size={18}/>Actualizar contraseña</button></div>
  </form>
  {(currentUser.orcid||currentUser.githubUrl||currentUser.googleScholarId)&&<div className="profile-links-note"><ExternalLink size={17}/><span>Los enlaces académicos guardados pueden mostrarse en su perfil público de docente.</span></div>}
 </section>;
}
