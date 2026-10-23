/* Get Shaped – „App aktualisieren“ und Versionsanzeige wandern in die Einstellungen. */
(() => {
'use strict';
const APP_VERSION='32';
function setup(){
  const bar=document.getElementById('gsForceUpdate')?.closest('.mini-stats');
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!bar||!grid||document.getElementById('gsUpdateCard'))return;
  const card=document.createElement('article');card.className='card';card.id='gsUpdateCard';
  card.innerHTML='<h2>↻ App-Version</h2><p class="sub">Wenn eine neue Version bereitsteht, lädt „App aktualisieren“ alle Dateien frisch. Deine Einträge bleiben erhalten.</p>';
  bar.style.margin='0';
  card.appendChild(bar);
  grid.appendChild(card);
  const badge=document.getElementById('gsBuildVersion');if(badge)badge.textContent='Get Shaped · Version '+APP_VERSION;
}
// Nach dem Setup der Analysemodule ausführen, damit deren Klick-Handler am Button erhalten bleiben.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,30));else setTimeout(setup,30);
})();
