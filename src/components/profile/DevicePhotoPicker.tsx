import React,{useState,useRef,useEffect} from 'react';
import {Upload} from 'lucide-react';
import {processDevicePhoto,saveDevicePhoto,removeDevicePhoto,useDevicePhoto,type DevicePhoto} from '../../lib/devicePhoto';
export function DevicePhotoPicker(props:{uid:string;onSaved?:()=>void}){return <PhotoPickerSession key={props.uid} {...props}/>;}
function PhotoPickerSession({uid,onSaved}:{uid:string;onSaved?:()=>void}){
 const current=useDevicePhoto(uid),[draft,setDraft]=useState<DevicePhoto|null>(null),[preview,setPreview]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false);
 const input=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null);
 useEffect(()=>{if(!draft){setPreview('');return;}const url=URL.createObjectURL(draft.portrait);setPreview(url);return()=>URL.revokeObjectURL(url);},[draft]);
 useEffect(()=>()=>controller.current?.abort(),[uid]);
 async function select(file?:File){if(!file)return;controller.current?.abort();const task=new AbortController();controller.current=task;setBusy(true);setError('');setStatus('Preparing photo…');setDraft(null);
  try{const photo=await processDevicePhoto(file,setStatus,task.signal);if(!task.signal.aborted)setDraft(photo);}
  catch(e:any){if(e.name!=='AbortError')setError(e.message);}finally{if(controller.current===task)setBusy(false);}
 }
 async function save(){if(!draft)return;setSaving(true);setError('');try{await saveDevicePhoto(uid,draft);setDraft(null);setStatus('Saved on this device.');onSaved?.();}catch(e:any){setError(e.message);}finally{setSaving(false);}}
 async function remove(){setSaving(true);setError('');try{await removeDevicePhoto(uid);setDraft(null);setStatus('Removed. Your dashboard will use the EZ kid.');onSaved?.();}catch{setError('Could not remove the photo. Please try again.');}finally{setSaving(false);}}
 return <section className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3" aria-label="Photo on this device"><div><h4 className="font-semibold text-sm">Your dashboard photo</h4><p className="text-xs text-white/65 mt-1">Background removal is automatic when available. Saved only on this device.</p></div>
 <input ref={input} aria-label="Choose dashboard photo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void select(file);}}/>
 <div className="flex flex-wrap gap-2"><button type="button" disabled={busy||saving} className="px-4 py-3 rounded-xl bg-primary text-obsidian text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50" onClick={()=>input.current?.click()}><Upload size={16}/>{current?'Change photo':'Choose photo'}</button>{busy&&<button type="button" className="px-4 py-3 rounded-xl border border-white/20 text-sm" onClick={()=>{controller.current?.abort();setBusy(false);setStatus('');}}>Cancel</button>}{current&&!busy&&<button type="button" disabled={saving} className="px-4 py-3 rounded-xl border border-white/20 text-sm" onClick={remove}>Remove photo</button>}</div>
 <p className="text-xs text-white/50">JPG, PNG or WebP · up to 500 MB. A clear portrait works best.</p>
 {(preview||current?.portrait)&&<div className="rounded-xl bg-[#172311] border border-white/10 flex items-end justify-center h-48"><img src={preview||current!.portrait} alt="Your background-free photo preview" className="h-full max-w-full object-contain"/></div>}
 {draft&&<div className="flex gap-2"><button type="button" disabled={saving} onClick={save} className="px-4 py-3 rounded-xl bg-primary text-obsidian text-sm font-semibold">{saving?'Saving…':'Use this photo'}</button><button type="button" disabled={saving} onClick={()=>{setDraft(null);setStatus('');}} className="px-4 py-3 rounded-xl border border-white/20 text-sm">Discard</button></div>}
 {status&&<p role="status" className="text-xs text-white/70">{status}</p>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
 <p className="text-xs text-white/50">Not synced to other devices. Clearing browser data removes it.</p></section>;
}
