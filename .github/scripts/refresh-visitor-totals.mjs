// Publish aggregate totals only; never forward browser analytics requests.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const output=process.argv[process.argv.indexOf('--output')+1];
if(!process.argv.includes('--output')||!output)throw Error('--output is required');
let previous={};
try{previous=JSON.parse(await readFile(output,'utf8'));}catch(error){if(error.code!=='ENOENT'&&!(error instanceof SyntaxError))throw error;}
const now=new Date().toISOString(),sites={};
for(const [key,code] of Object.entries({tumblr:'cyberstudios-tumblr',byte:'cyberstudios-byte',wiki:'cyberstudios-wiki'})) {
  const old=previous.sites?.[key]||{};
  try {
    const response=await fetch('https://'+code+'.goatcounter.com/counter/TOTAL.json',{
      headers:{Accept:'application/json','User-Agent':'CyberStudios-public-totals/1.0'},signal:AbortSignal.timeout(15000)
    });
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json(),count=String(data.count??'');
    if(count.length>32||!/^\d[\d,.\s\u00a0\u202f]*$/.test(count))throw Error('Invalid count');
    sites[key]=old.available&&old.count===count?old:{available:true,count,updated_at:now};
    console.log(key+': '+count);
  } catch(error) {
    console.warn(key+': refresh failed ('+error.name+'); retaining previous valid data');
    sites[key]=old.available?old:{available:false};
  }
}
if(!Object.values(sites).some(item=>item.available))throw Error('No valid totals; no snapshot was written');
if(previous.version===1&&JSON.stringify(previous.sites)===JSON.stringify(sites)) {
  console.log('Totals unchanged; no file update needed');
} else {
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify({version:1,updated_at:now,sites},null,2)+'\n');
}
