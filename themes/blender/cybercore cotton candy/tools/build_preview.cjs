const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'source-palettes.json'),'utf8'));
const data={};
for(const variant of ['soft','vivid']){
 const filename='Cybercore_Cotton_Candy_'+variant[0].toUpperCase()+variant.slice(1)+'.xml';
 data[variant]={filename,xml:fs.readFileSync(path.join(root,filename),'utf8'),syntax:{...source.soft.syntax,...source[variant].syntax}};
}
const encoded=JSON.stringify(data).replace(/</g,'\\u003c');
const html=fs.readFileSync(path.join(__dirname,'preview.template.html'),'utf8').replace('__EMBEDDED_THEME_DATA__',()=>encoded).replace(/<button([^>]*data-download="[^"]+"[^>]*)>([\s\S]*?)<\/button>/g,'<a$1 href="#install" download>$2</a>');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
const embedded=JSON.parse(html.match(/<script id="theme-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
for(const v of ['soft','vivid'])if(embedded[v].xml!==data[v].xml)throw new Error('Embedded theme mismatch: '+v);
fs.writeFileSync(path.join(root,'cybercore-cotton-candy.html'),html);
const checksums=Object.values(data).map(x=>crypto.createHash('sha256').update(x.xml).digest('hex')+'  '+x.filename);
checksums.push(crypto.createHash('sha256').update(html).digest('hex')+'  cybercore-cotton-candy.html');
fs.writeFileSync(path.join(root,'SHA256SUMS.txt'),checksums.join('\n')+'\n');
console.log('PASS: standalone HTML built; inline JavaScript parses; both embedded XML downloads exactly match the validated files.');
