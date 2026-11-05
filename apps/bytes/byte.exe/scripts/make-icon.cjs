'use strict';
// Build Windows icons from an existing approved idle frame. No artwork is redrawn.
// Node built-ins keep icon generation independent of image tools and native modules.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const signature = Buffer.from([137,80,78,71,13,10,26,10]);
function paeth(a,b,c) {
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}
function decodeRGBA(file) {
  const png=fs.readFileSync(file);
  if(!png.subarray(0,8).equals(signature))throw new Error('The Byte icon source must be a PNG.');
  let width,height;const chunks=[];
  for(let offset=8;offset+12<=png.length;){
    const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);
    if(offset+length+12>png.length)throw new Error('Incomplete Byte PNG.');
    const data=png.subarray(offset+8,offset+8+length);
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      if(data[8]!==8||data[9]!==6||data[10]!==0||data[11]!==0||data[12]!==0)throw new Error('Use a non-interlaced 8-bit RGBA PNG for Byte.');
    }else if(type==='IDAT')chunks.push(data);
    offset+=length+12;if(type==='IEND')break;
  }
  if(!width||!height||width*height>16777216)throw new Error('Unsupported Byte PNG dimensions.');
  const stride=width*4,raw=zlib.inflateSync(Buffer.concat(chunks),{maxOutputLength:(stride+1)*height});
  if(raw.length!==(stride+1)*height)throw new Error('Unexpected Byte PNG pixel data.');
  const pixels=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];if(filter>4)throw new Error('Invalid PNG filter.');
    for(let x=0;x<stride;x++){
      const index=y*stride+x,a=x>=4?pixels[index-4]:0,b=y?pixels[index-stride]:0,c=y&&x>=4?pixels[index-stride-4]:0;
      const predictor=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
      pixels[index]=(raw[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  return {width,height,pixels};
}
function crc32(buffer) {
  let c=0xffffffff;for(const byte of buffer){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;
}
function chunk(type,data) {
  const tag=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));
  return Buffer.concat([length,tag,data,crc]);
}
function encodePNG(size,pixels) {
  const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  const stride=size*4,raw=Buffer.alloc((stride+1)*size);
  for(let y=0;y<size;y++)pixels.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);
  return Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function generateIcon() {
  const assets=path.join(__dirname,'..','src','assets'),manifest=JSON.parse(fs.readFileSync(path.join(assets,'sprites.json'),'utf8'));
  const image=decodeRGBA(path.join(assets,path.basename(manifest.image)));
  const fw=manifest.frameWidth,fh=manifest.frameHeight,columns=manifest.columns||image.width/fw,frame=manifest.animations.idle.frames[0];
  const ox=(frame%columns)*fw,oy=Math.floor(frame/columns)*fh;
  if(!Number.isInteger(fw)||!Number.isInteger(fh)||fw<1||fh<1||ox+fw>image.width||oy+fh>image.height)throw new Error('The idle frame is outside the Byte atlas.');
  let minX=fw,minY=fh,maxX=-1,maxY=-1;
  for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)if(image.pixels[((oy+y)*image.width+ox+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(maxX<0)throw new Error('The idle frame is empty.');
  const width=maxX-minX+1,height=maxY-minY+1,sizes=[16,20,24,32,40,48,64,128,256],images=[];
  for(const size of sizes){
    const pixels=Buffer.alloc(size*size*4),scale=(size-Math.max(2,Math.round(size/16)))/Math.max(width,height);
    const dw=Math.max(1,Math.round(width*scale)),dh=Math.max(1,Math.round(height*scale)),dx=Math.floor((size-dw)/2),dy=Math.floor((size-dh)/2);
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
      const sx=ox+minX+Math.min(width-1,Math.floor((x+0.5)*width/dw)),sy=oy+minY+Math.min(height-1,Math.floor((y+0.5)*height/dh));
      image.pixels.copy(pixels,((dy+y)*size+dx+x)*4,(sy*image.width+sx)*4,(sy*image.width+sx)*4+4);
    }
    images.push(encodePNG(size,pixels));
  }
  const header=Buffer.alloc(6+sizes.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
  let offset=header.length;
  images.forEach((png,index)=>{
    const entry=6+index*16,size=sizes[index];header[entry]=size===256?0:size;header[entry+1]=header[entry];
    header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(png.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=png.length;
  });
  fs.writeFileSync(path.join(assets,'icon.ico'),Buffer.concat([header,...images]));
  fs.writeFileSync(path.join(assets,'icon.png'),images.at(-1));
  console.log(`Byte icons generated from approved idle frame ${frame}: ${sizes.join(', ')} px.`);
}
if(require.main===module)generateIcon();
module.exports={generateIcon};
