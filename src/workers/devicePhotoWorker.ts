import {MAX_SAVED_PHOTO_BYTES,validatePhoto,photoDimensions} from '../lib/devicePhotoPolicy';
const scope=self as any;
function sourceDimensions(bytes:Uint8Array): {width:number;height:number}|undefined {
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length>=24&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return {width:view.getUint32(16),height:view.getUint32(20)};
 if(bytes[0]===255&&bytes[1]===216){let i=2;while(i+8<bytes.length){if(bytes[i++]!==255)continue;let marker=bytes[i++];while(marker===255)marker=bytes[i++];if(marker===218||marker===217)break;if(marker===0||marker===1||(marker>=208&&marker<=215))continue;const size=view.getUint16(i);if(size<2)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return {height:view.getUint16(i+3),width:view.getUint16(i+5)};i+=size;}}
 if(bytes.length>=30&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){
  const type=String.fromCharCode(...bytes.slice(12,16));
  if(type==='VP8X')return {width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};
  if(type==='VP8L')return {width:1+bytes[21]+((bytes[22]&63)<<8),height:1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10)};
  if(type==='VP8 ')return {width:view.getUint16(26,true)&16383,height:view.getUint16(28,true)&16383};
 }
}
function canvas(width:number,height:number){const image=new OffscreenCanvas(width,height),ctx=image.getContext('2d');if(!ctx)throw Error('Photo editing is unavailable in this browser.');return {image,ctx};}
scope.onmessage=async(event:MessageEvent<{file:File}>)=>{
 let segmenter:any,bitmap:ImageBitmap|undefined;
 try {
  const {file}=event.data;validatePhoto(file);scope.postMessage({progress:'Preparing photo…'});
  const dimensions=sourceDimensions(new Uint8Array(await file.slice(0,1024*1024).arrayBuffer()));
  // Avoid decoding unknown/malformed headers and oversized pixel dimensions.
  if(!dimensions)throw Error('Could not read this photo. Save it as a JPG, PNG or WebP and try again.');
  const target=photoDimensions(dimensions.width,dimensions.height);
  bitmap=await createImageBitmap(file,{resizeWidth:target.width,resizeHeight:target.height,resizeQuality:'high',imageOrientation:'from-image'});
  const output=photoDimensions(bitmap.width,bitmap.height);
  const {image,ctx}=canvas(output.width,output.height);ctx.drawImage(bitmap,0,0,output.width,output.height);bitmap.close();bitmap=undefined;
  scope.postMessage({progress:'Removing background on your device…'});
  let removedBackground=false;
  try {
   scope.importScripts('/photo-tools/vision_bundle.js');
   const {ImageSegmenter,FilesetResolver}=scope.Vision;
   const vision=await FilesetResolver.forVisionTasks('/photo-tools/wasm');
   segmenter=await ImageSegmenter.createFromOptions(vision,{baseOptions:{modelAssetPath:'/photo-tools/selfie_segmenter.tflite',delegate:'CPU'},runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true});
   const result=segmenter.segment(image);
   try {
    const masks=result.confidenceMasks;if(!masks?.length)throw Error('No person found');
    const mask=masks.length===1?masks[0]:masks[1];
    const confidence=mask.getAsFloat32Array(),overlay=canvas(mask.width,mask.height),alpha=overlay.ctx.createImageData(mask.width,mask.height);
    for(let i=0;i<confidence.length;i++){const value=Math.max(0,Math.min(1,(confidence[i]-.35)/.45));alpha.data[4*i+3]=Math.round(255*value*value*(3-2*value));}
    overlay.ctx.putImageData(alpha,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(overlay.image,0,0,image.width,image.height);ctx.globalCompositeOperation='source-over';removedBackground=true;
   }finally{result.close();}
  }catch{scope.postMessage({progress:'Background removal unavailable. Saving a normal photo instead…'});}
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;let left=image.width,top=image.height,right=0,bottom=0,count=0;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>64){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;}
  if(count<image.width*image.height*.01)throw Error('Could not read this photo. Try another image.');
  left=Math.max(0,left-8);top=Math.max(0,top-8);right=Math.min(image.width-1,right+8);bottom=Math.min(image.height-1,bottom+8);
  const width=right-left+1,height=bottom-top+1,crop=canvas(width,height);crop.ctx.drawImage(image,left,top,width,height,0,0,width,height);
  let portrait=await crop.image.convertToBlob({type:'image/webp',quality:.8});
  const avatarCanvas=canvas(192,192),side=Math.min(width,height);avatarCanvas.ctx.drawImage(crop.image,(width-side)/2,0,side,side,0,0,192,192);
  let avatar=await avatarCanvas.image.convertToBlob({type:'image/webp',quality:.75});
  for(const quality of [.65,.5,.35]){if(portrait.size+avatar.size<=MAX_SAVED_PHOTO_BYTES)break;portrait=await crop.image.convertToBlob({type:'image/webp',quality});avatar=await avatarCanvas.image.convertToBlob({type:'image/webp',quality});}
  if(portrait.size+avatar.size>MAX_SAVED_PHOTO_BYTES)throw Error('This image is too detailed to save. Try a smaller or simpler photo.');
  scope.postMessage({result:{portrait,avatar},removedBackground});
 }catch(error){scope.postMessage({error:error instanceof Error?error.message:'Could not process this photo. Try another image.'});}
 finally{bitmap?.close();segmenter?.close();}
};
