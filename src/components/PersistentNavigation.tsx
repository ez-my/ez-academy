import React,{useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {Home,Mic,PenTool,BookOpen,Headphones,Ellipsis,ChevronRight,X} from 'lucide-react';
import './persistent-navigation.css';
export function PersistentNavigation({isLoggedIn,isAdmin,goal}:{isLoggedIn:boolean;isAdmin:boolean;goal?:string}){
 const navigate=useNavigate(),location=useLocation(),[more,setMore]=useState(false);
 useEffect(()=>setMore(false),[location.pathname]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setMore(false)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 const speaking=goal==='MUET'?'/app/muet':'/app/speakez';
 const items=[{path:isLoggedIn?'/app':'/',label:'Home',Icon:Home,active:location.pathname==='/'||location.pathname==='/app'||location.pathname==='/app/'},{path:speaking,label:'Speaking',Icon:Mic,active:['/app/speakez','/app/muet'].includes(location.pathname)},{path:'/app/writeez',label:'Writing',Icon:PenTool,active:location.pathname==='/app/writeez'},{path:'/app/readez',label:'Reading',Icon:BookOpen,active:location.pathname==='/app/readez'},{path:'/app/listenez',label:'Listening',Icon:Headphones,active:location.pathname==='/app/listenez'}];
 const extras=[{path:'/app/profile',label:'Profile'},{path:isLoggedIn?'/app/pricing':'/plans',label:'Plans'},{path:'/app/history',label:'Practice history'},{path:'/app/muet',label:'MUET speaking'},{path:'/app/study-tools',label:'Reminders & tips'},{path:'/app/support',label:'Help & support'},{path:'/resources',label:'Resources'},...(isAdmin?[{path:'/app/admin',label:'Admin'}]:[])];
 return <div className={`persistent-navigation ${location.pathname==='/'?'on-homepage':''}`}>{more&&<><button className="persistent-backdrop" aria-label="Close menu" onClick={()=>setMore(false)}/><section className="persistent-menu" role="dialog" aria-label="More options"><header><b>More</b><button aria-label="Close more options" onClick={()=>setMore(false)}><X/></button></header>{extras.map(i=><button key={i.path} onClick={()=>{setMore(false);navigate(i.path)}}>{i.label}<ChevronRight/></button>)}</section></>}<nav aria-label="Main app navigation">{items.map(({path,label,Icon,active})=><button key={label} aria-current={active?'page':undefined} aria-label={label} onClick={()=>navigate(path)}><Icon/><span>{label}</span></button>)}<button aria-label="More options" aria-expanded={more} aria-current={!items.some(i=>i.active)?'page':undefined} onClick={()=>setMore(v=>!v)}><Ellipsis/><span>More</span></button></nav></div>;
}
