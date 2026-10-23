/* Get Shaped – verschlüsselte Backups (AES-GCM, Schlüssel per PBKDF2 aus deinem Passwort). Ohne Passwort ist die Datei nicht lesbar – es gibt keine Wiederherstellung. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const ITER=310000,enc=new TextEncoder(),dec=new TextDecoder();
const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(password,salt,iter){
  const base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encrypt(text,password){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const k=await key(password,salt,ITER);
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(text));
  return {gsEncrypted:1,kdf:'PBKDF2-SHA256',iter:ITER,salt:b64(salt),iv:b64(iv),data:b64(data)};
}
async function decrypt(env,password){
  const k=await key(password,unb64(env.salt),env.iter||ITER);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(env.iv)},k,unb64(env.data));
  return dec.decode(plain);
}

let encryptNext=null;
const baseDownload=window.download;
if(typeof baseDownload==='function'){
  window.download=function(name,text,type){
    if(encryptNext&&/\.json$/.test(name)){
      const password=encryptNext;encryptNext=null;
      encrypt(text,password).then(env=>baseDownload.call(this,name.replace(/\.json$/,'.verschluesselt.json'),JSON.stringify(env),'application/json'))
        .then(()=>toast('Verschlüsseltes Backup gesichert 🔐'))
        .catch(e=>toast('Verschlüsselung fehlgeschlagen: '+e.message));
      return;
    }
    return baseDownload.apply(this,arguments);
  };
}
async function exportEncrypted(){
  if(!crypto?.subtle){toast('Verschlüsselung wird in diesem Browser nicht unterstützt.');return}
  const p1=prompt('Passwort für das Backup (mindestens 8 Zeichen). Ohne dieses Passwort lässt sich das Backup NICHT wiederherstellen.');
  if(p1===null)return;
  if(p1.length<8){toast('Passwort zu kurz (mindestens 8 Zeichen).');return}
  const p2=prompt('Passwort zur Bestätigung noch einmal eingeben:');
  if(p2!==p1){toast('Die Passwörter stimmen nicht überein.');return}
  encryptNext=p1;
  try{await exportWithPhotos()}finally{setTimeout(()=>{encryptNext=null},3000)}
}
function setup(){
  const input=$('importFile'),json=$('exportJSON');
  if(!input||!json||$('exportEncrypted'))return;
  const btn=document.createElement('button');btn.className='btn second';btn.id='exportEncrypted';btn.type='button';btn.textContent='🔐 Verschlüsseltes Backup';
  btn.style.cssText='width:100%;margin-top:10px';
  json.closest('.btnrow').insertAdjacentElement('afterend',btn);btn.onclick=exportEncrypted;
  const original=input.onchange;
  input.onchange=async e=>{
    const file=e.target.files?.[0];
    if(!file)return original?.call(input,e);
    let env=null;
    try{const t=JSON.parse(await file.text());if(t&&t.gsEncrypted===1)env=t}catch(_){}
    if(!env)return original?.call(input,e);
    const password=prompt('Passwort für dieses verschlüsselte Backup:');
    if(password===null){input.value='';return}
    try{
      const plain=await decrypt(env,password);
      const dt=new DataTransfer();dt.items.add(new File([plain],'backup.json',{type:'application/json'}));
      input.files=dt.files;
      return original?.call(input,{target:input});
    }catch(_){toast('Entschlüsselung fehlgeschlagen – Passwort falsch oder Datei beschädigt.');input.value=''}
  };
}
window.GSSecureBackup={encrypt,decrypt};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,50));else setTimeout(setup,50);
})();
