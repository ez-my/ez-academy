import { practiceRequest } from './practice';
const key='ez-referral';
export function captureReferral() {
  const code=new URLSearchParams(location.search).get('ref')?.trim().toUpperCase();
  if (code && /^EZ[A-F0-9]{12}$/.test(code)) localStorage.setItem(key,JSON.stringify({code,expires:Date.now()+30*86400000}));
}
export function savedReferral() {
  try {const saved=JSON.parse(localStorage.getItem(key)||'null');return saved?.expires>Date.now()?saved.code:'';} catch {return '';}
}
export function saveReferral(code:string) {if(code)localStorage.setItem(key,JSON.stringify({code,expires:Date.now()+30*86400000}));else localStorage.removeItem(key);}
export const affiliateRequest=practiceRequest;
