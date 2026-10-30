import React,{useEffect,useState} from 'react';
import {useDevicePhoto} from '../../lib/devicePhoto';
export function DashboardPortrait({uid}:{uid:string}){
 const photo=useDevicePhoto(uid),[failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[photo?.portrait]);
 return <img className="ezd-hero-mascot" src={!failed&&photo?.portrait?photo.portrait:'/images/dashboard/ez-mascot-v1.webp'} alt="" onError={()=>setFailed(true)}/>;
}
