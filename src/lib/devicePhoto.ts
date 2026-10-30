import {useEffect,useState} from 'react';
import {createStore,get,set,del} from 'idb-keyval';
import {devicePhotoKey,MAX_SAVED_PHOTO_BYTES,validatePhoto} from './devicePhotoPolicy';
export type DevicePhoto={portrait:Blob;avatar:Blob};
const store=()=>createStore('ez-device-photos','photos');
const eventName='ez-device-photo-changed';
function announce(uid:string){window.dispatchEvent(new CustomEvent(eventName,{detail:uid}));if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel(eventName);channel.postMessage(uid);channel.close();}}
export async function saveDevicePhoto(uid:string,photo:DevicePhoto){
 if(!(photo.portrait instanceof Blob)||!(photo.avatar instanceof Blob)||photo.portrait.size+photo.avatar.size>MAX_SAVED_PHOTO_BYTES)throw Error('Could not save this photo. Please choose another.');
 try{await set(devicePhotoKey(uid),photo,store());}catch{throw Error('Device storage is unavailable or full. Free some space and try again.');}announce(uid);
}
export async function removeDevicePhoto(uid:string){await del(devicePhotoKey(uid),store());announce(uid);}
export function useDevicePhoto(uid:string){
 const [photo,setPhoto]=useState<{uid:string;portrait:string;avatar:string}|null>(null);
 useEffect(()=>{let active=true,revision=0,urls:string[]=[];setPhoto(null);
  const load=async()=>{const version=++revision;try{const value=await get<DevicePhoto>(devicePhotoKey(uid),store());if(!active||version!==revision)return;urls.forEach(URL.revokeObjectURL);urls=[];if(value?.portrait instanceof Blob&&value?.avatar instanceof Blob){urls=[URL.createObjectURL(value.portrait),URL.createObjectURL(value.avatar)];setPhoto({uid,portrait:urls[0],avatar:urls[1]});}else setPhoto(null);}catch{if(active)setPhoto(null);}};
  const changed=(event:Event)=>{if((event as CustomEvent).detail===uid)void load();};window.addEventListener(eventName,changed);
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(eventName):null;if(channel)channel.onmessage=e=>{if(e.data===uid)void load();};void load();
  return()=>{active=false;urls.forEach(URL.revokeObjectURL);window.removeEventListener(eventName,changed);channel?.close();};
 },[uid]);return photo?.uid===uid?photo:null;
}
export function processDevicePhoto(file:File,onProgress:(status:string)=>void,signal:AbortSignal):Promise<DevicePhoto>{
 return new Promise((resolve,reject)=>{try{validatePhoto(file);}catch(error){reject(error);return;}
  if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
  const worker=new Worker('/photo-tools/portrait-worker.js');let timer:ReturnType<typeof setTimeout>;
  const cleanup=()=>{clearTimeout(timer);worker.terminate();signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};signal.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{cleanup();reject(Error('Photo processing took too long. Try a smaller photo or check your connection.'));},180000);
  worker.onmessage=e=>{if(e.data.progress)onProgress(e.data.progress);else if(e.data.error){cleanup();reject(Error(e.data.error));}else if(e.data.result){cleanup();onProgress(e.data.removedBackground?'Background removed. Preview your photo.':'Background removal unavailable. Preview your normal photo.');resolve(e.data.result);}};
  worker.onerror=()=>{cleanup();reject(Error('Could not process this photo on this browser. Try a recent version of Safari or Chrome.'));};worker.postMessage({file});
 });
}
