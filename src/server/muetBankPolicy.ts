import type {MUETTopic} from '../types/muet';
import {createHash} from 'node:crypto';
export const topicFingerprint=(t:MUETTopic)=>createHash('sha256').update([t.part1.situation,...Object.values(t.part1.tasks),t.part2.centralQuestion,...t.part2.points].join('|').toLowerCase().replace(/[^a-z0-9]+/g,' ')).digest('hex');
export function validateMUETTopic(t:any): t is MUETTopic {
 const text=(s:any,min=1,max=500)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;
 const words=(s:string)=>s.trim().split(/\s+/).length;
 return !!(t&&text(t.id,1,100)&&/^[-a-zA-Z0-9_]+$/.test(t.id)&&text(t.title,3,90)&&text(t.theme,3,80)&&
 text(t.part1?.situation,30,650)&&['A','B','C','D'].every(c=>text(t.part1?.tasks?.[c],12,100)&&/^Talk about /.test(t.part1.tasks[c])&&words(t.part1.tasks[c])<=10)&&new Set(Object.values(t.part1.tasks)).size===4&&
 text(t.part2?.situation,30,650)&&text(t.part2?.centralQuestion,15,180)&&Array.isArray(t.part2?.points)&&t.part2.points.length===5&&t.part2.points.every((p:any)=>text(p,2,45)&&words(p)<=3)&&new Set(t.part2.points.map((p:string)=>p.toLowerCase())).size===5&&text(t.part2?.decisionPrompt,20,180));
}
export function unseenTopics(topics:MUETTopic[],completed:Set<string>,mode:string){return topics.filter(t=>mode==='Mock'?!completed.has(`${t.id}:Part1`)&&!completed.has(`${t.id}:Part2`):!completed.has(`${t.id}:${mode}`));}
