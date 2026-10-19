// Public catalogue; contains no credentials. Version 1 purchases retain their terms.
export const PACKAGE_VERSION = 2;
export const PACKAGES = {
 speak: {id:'speak',name:'SpeakEZ Focus',price:19,amountInCents:1900,type:'skill',durationDays:30,aiUnits:60,description:'Speaking practice and mock mode, with 60 speaking AI credits for 30 days'},
 write: {id:'write',name:'WriteEZ Focus',price:15,amountInCents:1500,type:'skill',durationDays:30,aiUnits:60,description:'Writing practice and mock mode, with 60 writing AI credits for 30 days'},
 read: {id:'read',name:'ReadEZ Focus',price:9,amountInCents:900,type:'skill',durationDays:30,aiUnits:20,description:'Reading practice and mock mode, with 20 reading AI credits for 30 days'},
 listen: {id:'listen',name:'ListenEZ Focus',price:15,amountInCents:1500,type:'skill',durationDays:30,aiUnits:40,description:'Listening practice and mock mode, with 40 listening AI credits for 30 days'},
 basic: {id:'basic',name:'EZ Basic',price:29,amountInCents:2900,type:'subscription',durationDays:30,aiUnits:100,description:'All four skills, mock tests and 100 shared AI credits for 30 days'},
 pro: {id:'pro',name:'EZ Pro',price:49,amountInCents:4900,type:'subscription',durationDays:30,aiUnits:250,description:'All four skills, detailed feedback and 250 shared AI credits for 30 days'},
 pro_plus: {id:'pro_plus',name:'EZ Pro+',price:79,amountInCents:7900,type:'subscription',durationDays:30,aiUnits:500,description:'All four skills, intensive practice and 500 shared AI credits for 30 days'},
 credits: {id:'credits',name:'EZ Credits',price:15,amountInCents:1500,type:'credits',creditsGrant:50,aiUnits:50,description:'50 extra AI credits plus 50 practice credits; no expiry'},
} as const;
export const MONTHLY_AI_UNITS: Record<string,number> = {free:0,basic:100,pro:250,pro_plus:500};
