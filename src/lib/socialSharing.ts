export const ACHIEVEMENT_SHARE_URL='https://ez-academy.my/';
export const SOCIAL_PLATFORMS=[
 {id:'whatsapp',label:'WhatsApp',manual:false}, {id:'facebook',label:'Facebook',manual:false},
 {id:'x',label:'X',manual:false}, {id:'threads',label:'Threads',manual:false},
 {id:'instagram',label:'Instagram',manual:true}, {id:'tiktok',label:'TikTok',manual:true},
 {id:'telegram',label:'Telegram',manual:false}, {id:'linkedin',label:'LinkedIn',manual:false},
 {id:'reddit',label:'Reddit',manual:false}, {id:'email',label:'Email',manual:false},
] as const;
export type SocialPlatform=typeof SOCIAL_PLATFORMS[number]['id'];
export function achievementCaption(name:string,description:string){return `I unlocked ${name} on EZ Academy! ${description}.\n\n${ACHIEVEMENT_SHARE_URL}\n#EZAcademy #EnglishLearning #AchievementUnlocked`;}
export function socialShareURL(platform:SocialPlatform,name:string,description:string){
 const text=achievementCaption(name,description),caption=`I unlocked ${name} on EZ Academy! ${description}. #EZAcademy #EnglishLearning`;
 const encoded=encodeURIComponent,link=encoded(ACHIEVEMENT_SHARE_URL);
 switch(platform){
  case 'whatsapp':return `https://wa.me/?text=${encoded(text)}`;
  case 'facebook':return `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${encoded(caption)}`;
  case 'x':return `https://twitter.com/intent/tweet?text=${encoded(caption)}&url=${link}`;
  case 'threads':return `https://www.threads.com/intent/post?text=${encoded(text)}`;
  case 'instagram':return 'https://www.instagram.com/';
  case 'tiktok':return 'https://www.tiktok.com/';
  case 'telegram':return `https://t.me/share/url?url=${link}&text=${encoded(caption)}`;
  case 'linkedin':return `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
  case 'reddit':return `https://www.reddit.com/submit?url=${link}&title=${encoded(`I unlocked ${name} on EZ Academy!`)}`;
  case 'email':return `mailto:?subject=${encoded(`EZ Academy achievement: ${name}`)}&body=${encoded(text)}`;
 }
}
// Render a shareable card entirely on the user's device, without AI or uploads.
export function achievementCard(name:string,description:string){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const c=canvas.getContext('2d');if(!c)throw new Error('Image creation is unavailable. Copy the caption instead.');
 const bg=c.createLinearGradient(0,0,1080,1080);bg.addColorStop(0,'#171d2c');bg.addColorStop(1,'#05070c');c.fillStyle=bg;c.fillRect(0,0,1080,1080);c.strokeStyle='#e8c452';c.lineWidth=4;c.strokeRect(44,44,992,992);
 c.textAlign='center';c.fillStyle='#e8c452';c.font='bold 36px sans-serif';c.fillText('EZ ACADEMY',540,135);
 c.beginPath();c.arc(540,325,108,0,Math.PI*2);c.fillStyle='#e8c452';c.fill();c.fillStyle='#111827';c.font='bold 110px sans-serif';c.fillText('★',540,363);
 c.fillStyle='#e8c452';c.font='bold 24px sans-serif';c.fillText('ACHIEVEMENT UNLOCKED',540,500);
 const wrap=(text:string,y:number,size:number,color:string)=>{c.font=`bold ${size}px sans-serif`;c.fillStyle=color;let line='',row=y;for(const word of text.split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width>850&&line){c.fillText(line,540,row);row+=size*1.4;line=word;}else line=next;}if(line)c.fillText(line,540,row);return row;};
 const end=wrap(name,605,64,'#ffffff');wrap(description,end+85,32,'#cbd5e1');
 c.fillStyle='#e8c452';c.font='bold 30px sans-serif';c.fillText('SPEAK · WRITE · READ · LISTEN',540,900);c.fillStyle='#cbd5e1';c.font='26px sans-serif';c.fillText('ez-academy.my',540,967);
 return canvas.toDataURL('image/png');
}
export function cardFile(name:string,description:string){const data=achievementCard(name,description).split(',')[1];const bytes=Uint8Array.from(atob(data),v=>v.charCodeAt(0));return new File([bytes],`ez-academy-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`,{type:'image/png'});}
export function downloadCard(name:string,description:string){const link=document.createElement('a');link.href=achievementCard(name,description);link.download=`ez-academy-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`;link.click();}
