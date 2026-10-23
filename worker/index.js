/* Get Shaped – Foto-Analyse-Backend (Cloudflare Worker).
   Nimmt 1–2 Mahlzeitenfotos entgegen, lässt ein Vision-Modell die Lebensmittel und Gramm-Mengen schätzen
   und liefert NUR diese Liste zurück. Die Nährwerte berechnet die App selbst aus ihrer Lebensmitteltabelle.
   Der API-Schlüssel liegt ausschließlich als Secret im Worker – niemals in der App oder im Repo. */

const API_URL='https://api.anthropic.com/v1/messages';
const MAX_IMAGES=2;
const MAX_IMAGE_CHARS=4_000_000;            // ~3 MB Base64 pro Bild

const TOOL={
  name:'report_meal',
  description:'Liefert die auf dem Foto erkannten Lebensmittel mit geschätzten Mengen.',
  input_schema:{
    type:'object',
    properties:{
      items:{type:'array',items:{type:'object',properties:{
        name:{type:'string',description:'Einfacher deutscher Lebensmittelname ohne Marke, z. B. "Hähnchenbrust gegart", "Kartoffeln gekocht", "Brokkoli"'},
        grams:{type:'number',description:'Geschätztes Verzehrgewicht in Gramm (bei Getränken Milliliter)'},
        unit:{type:'string',enum:['g','ml']},
        confidence:{type:'string',enum:['hoch','mittel','niedrig']},
        note:{type:'string',description:'Kurzer Hinweis, z. B. "Öl/Butter nicht sichtbar"'}
      },required:['name','grams','unit','confidence']}},
      uncertainty:{type:'string',description:'Was die Schätzung unsicher macht (versteckte Zutaten, Portionshöhe, Soßen …)'}
    },
    required:['items']
  }
};

const SYSTEM=`Du hilfst bei einem privaten Ernährungstagebuch. Du siehst Fotos einer Mahlzeit (Draufsicht, ggf. Seitenansicht).
Nenne jedes erkennbare Lebensmittel einzeln (keine zusammengesetzten Gerichte) und schätze das Verzehrgewicht in Gramm.
Nutze Referenzobjekte (Teller, Besteck, Münze, Hand), wenn der Nutzer sie nennt, um Größen einzuordnen.
Erfinde nichts: Was du nicht erkennst, lässt du weg oder markierst mit confidence "niedrig".
Weise ausdrücklich auf nicht sichtbare Zutaten wie Öl, Butter, Soßen und Zucker hin. Gib keine Kalorien an.`;

function cors(origin,env){
  const allowed=env.ALLOWED_ORIGIN||'';
  const ok=origin&&allowed.split(',').map(s=>s.trim()).includes(origin);
  return {
    'Access-Control-Allow-Origin':ok?origin:'null',
    'Access-Control-Allow-Headers':'Content-Type, X-App-Token',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Vary':'Origin'
  };
}
const json=(body,status,headers)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...headers}});

// Zeitkonstanter Vergleich, damit der Token nicht über Antwortzeiten erraten werden kann.
function safeEqual(a,b){
  const x=new TextEncoder().encode(String(a)),y=new TextEncoder().encode(String(b));
  let diff=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);
  return diff===0;
}
function parseImage(dataUrl){
  const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));
  if(!m||m[2].length>MAX_IMAGE_CHARS)return null;
  return {type:'base64',media_type:m[1],data:m[2]};
}

export async function handle(request,env,fetchImpl=fetch){
  const origin=request.headers.get('Origin')||'';
  const headers=cors(origin,env);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return json({error:'Nur POST erlaubt'},405,headers);
  if(headers['Access-Control-Allow-Origin']==='null')return json({error:'Origin nicht erlaubt'},403,headers);
  if(!env.APP_TOKEN||!safeEqual(request.headers.get('X-App-Token')||'',env.APP_TOKEN))return json({error:'Zugangscode ungültig'},401,headers);
  if(!env.ANTHROPIC_API_KEY)return json({error:'Server nicht eingerichtet (API-Schlüssel fehlt)'},500,headers);

  let body;try{body=await request.json()}catch(_){return json({error:'Ungültige Anfrage'},400,headers)}
  const images=(Array.isArray(body.images)?body.images:[]).slice(0,MAX_IMAGES).map(parseImage);
  if(!images.length||images.some(i=>!i))return json({error:'Bitte 1–2 JPEG/PNG/WebP-Bilder als data-URL senden (max. ~3 MB)'},400,headers);

  const hint=String(body.hint||'').slice(0,300),reference=String(body.reference||'').slice(0,120);
  const text=['Analysiere diese Mahlzeit.',
    images.length>1?'Bild 1 ist von oben, Bild 2 von der Seite.':'',
    reference?'Referenzobjekt im Bild: '+reference+'.':'',
    hint?'Hinweis des Nutzers: '+hint:''].filter(Boolean).join(' ');

  const upstream=await fetchImpl(API_URL,{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({
      model:env.MODEL||'claude-sonnet-5-5',
      max_tokens:1200,
      system:SYSTEM,
      tools:[TOOL],
      tool_choice:{type:'tool',name:TOOL.name},
      messages:[{role:'user',content:[...images.map(source=>({type:'image',source})),{type:'text',text}]}]
    })
  });
  if(!upstream.ok){
    // Keine Details des Upstream-Fehlers an den Client durchreichen (könnten Schlüsselinfos enthalten).
    return json({error:'Analyse-Dienst nicht verfügbar (Status '+upstream.status+')'},502,headers);
  }
  const data=await upstream.json();
  const call=(data.content||[]).find(c=>c.type==='tool_use'&&c.name===TOOL.name);
  const items=Array.isArray(call?.input?.items)?call.input.items:null;
  if(!items)return json({error:'Keine auswertbare Antwort erhalten'},502,headers);
  const result=items
    .filter(i=>i&&typeof i.name==='string'&&Number(i.grams)>0&&Number(i.grams)<5000)
    .slice(0,20)
    .map(i=>({name:i.name.slice(0,80),grams:Math.round(Number(i.grams)),unit:i.unit==='ml'?'ml':'g',confidence:['hoch','mittel','niedrig'].includes(i.confidence)?i.confidence:'niedrig',note:String(i.note||'').slice(0,160)}));
  return json({items:result,uncertainty:String(call.input.uncertainty||'').slice(0,400)},200,headers);
}

export default {fetch:(request,env)=>handle(request,env)};
