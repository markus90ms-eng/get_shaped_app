import assert from 'node:assert/strict';
import {handle} from './index.js';
const env={APP_TOKEN:'geheim',ANTHROPIC_API_KEY:'sk-test',ALLOWED_ORIGIN:'https://markus90ms-eng.github.io'};
const img='data:image/jpeg;base64,'+Buffer.from('x'.repeat(50)).toString('base64');
const req=(over={},headers={})=>new Request('https://w.example/analyze',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://markus90ms-eng.github.io','X-App-Token':'geheim',...headers},body:JSON.stringify({images:[img],hint:'Mittag',reference:'Teller 26 cm',...over})});
let seen;
const okUpstream=async(url,opts)=>{seen={url,opts,body:JSON.parse(opts.body)};return new Response(JSON.stringify({content:[{type:'tool_use',name:'report_meal',input:{items:[{name:'Hähnchenbrust gegart',grams:150,unit:'g',confidence:'mittel',note:'Öl nicht sichtbar'},{name:'Quatsch',grams:-5,unit:'g',confidence:'hoch'}],uncertainty:'Soße unklar'}}]}),{status:200})};

let r=await handle(req(),env,okUpstream);let j=await r.json();
assert.equal(r.status,200);assert.equal(j.items.length,1);assert.equal(j.items[0].grams,150);assert.equal(j.uncertainty,'Soße unklar');
assert.equal(seen.opts.headers['x-api-key'],'sk-test');assert.equal(seen.body.tool_choice.name,'report_meal');
assert.ok(seen.body.messages[0].content.some(c=>c.type==='text'&&c.text.includes('Teller 26 cm')));
assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://markus90ms-eng.github.io');

r=await handle(req({},{'X-App-Token':'falsch'}),env,okUpstream);assert.equal(r.status,401);
r=await handle(req({},{'Origin':'https://evil.example'}),env,okUpstream);assert.equal(r.status,403);
r=await handle(req({images:['data:text/html;base64,AAAA']}),env,okUpstream);assert.equal(r.status,400);
r=await handle(req({images:[]}),env,okUpstream);assert.equal(r.status,400);
r=await handle(req({images:[img,img,img]}),env,okUpstream);assert.equal(r.status,200);assert.equal(seen.body.messages[0].content.filter(c=>c.type==='image').length,2);
r=await handle(req(),{...env,ANTHROPIC_API_KEY:''},okUpstream);assert.equal(r.status,500);
r=await handle(req(),env,async()=>new Response('boom sk-secret',{status:529}));j=await r.json();assert.equal(r.status,502);assert.ok(!JSON.stringify(j).includes('sk-secret'));
r=await handle(new Request('https://w.example/analyze',{method:'OPTIONS',headers:{Origin:'https://markus90ms-eng.github.io'}}),env);assert.equal(r.status,204);
console.log('Worker-Tests ok');
