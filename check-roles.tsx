import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEMO_ACCOUNTS, canReview, canDevelop } from './src/constants/demoAccounts';
import { authService } from './src/services/authService';
import { Header } from './src/components/layout/Header';
const memory = new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}});
for(const {user,password} of DEMO_ACCOUNTS){
  authService.logout();
  assert.equal(authService.login(user.email,'incorrecta').success,false);
  assert.equal(authService.getCurrentUser(),null);
  assert.equal(authService.login(user.email,password).success,true);
  assert.equal(authService.getCurrentUser()?.role,user.role);
  const html=renderToStaticMarkup(<Header activeTab="dashboard" currentUser={user} teachers={[]} notifications={[]} onTabChange={()=>{}} onLoginClick={()=>{}} onLogoutClick={()=>{}} onSwitchUser={()=>{}} onOpenRegisterModal={()=>{}} onOpenReviewerConsole={()=>{}} onMarkNotificationAsRead={()=>{}} onMarkAllNotificationsAsRead={()=>{}}/>);
  assert.equal(html.includes('Otras herramientas'),user.role==='developer');
  assert.equal(html.includes('Comité revisor</span></button>'),user.role==='reviewer_demo');
  assert.equal(canReview(user),user.role!=='teacher');
  assert.equal(canDevelop(user),user.role==='developer');
  if(user.role==='teacher')assert.equal(html.includes('Trazabilidad del proyecto'),false);
}
authService.logout();
assert.equal(canReview(authService.getCurrentUser()),false);
assert.equal(canDevelop(authService.getCurrentUser()),false);
console.log('PASS: three exact passwords, sessions, menu variants and permissions.');
