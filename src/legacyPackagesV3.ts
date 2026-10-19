// Shared by pricing, checkout and server activation. Historical purchases use frozen catalogues.
export const PACKAGE_VERSION=3;
export const PACKAGES={
 lite:{id:'lite',name:'EZ Lite',price:5,amountInCents:500,type:'subscription',durationDays:30,aiUnits:20,dailyLimit:5,fullTests:false,description:'All 4 skills; 5 practices per skill daily, 20 AI credits, no full tests; 30 days'},
 plus:{id:'plus',name:'EZ Plus',price:10,amountInCents:1000,type:'subscription',durationDays:30,aiUnits:50,dailyLimit:10,fullTests:true,description:'All 4 skills; 10 practices per skill daily, 50 AI credits and full tests; 30 days'},
 max:{id:'max',name:'EZ Max',price:15,amountInCents:1500,type:'subscription',durationDays:30,aiUnits:100,dailyLimit:20,fullTests:true,description:'All 4 skills; 20 practices per skill daily, 100 AI credits and full tests; 30 days'},
 speak:{id:'speak',name:'SpeakEZ Focus',price:8,amountInCents:800,type:'skill',durationDays:30,aiUnits:40,dailyLimit:10,fullTests:true,description:'Speaking only; 10 practices daily, 40 AI credits; 30 days. Other skills stay Free'},
 write:{id:'write',name:'WriteEZ Focus',price:8,amountInCents:800,type:'skill',durationDays:30,aiUnits:40,dailyLimit:6,fullTests:true,description:'Writing only; 6 practices daily, 40 AI credits; 30 days. Other skills stay Free'},
 read:{id:'read',name:'ReadEZ Focus',price:5,amountInCents:500,type:'skill',durationDays:30,aiUnits:15,dailyLimit:10,fullTests:true,description:'Reading only; 10 practices daily, 15 AI credits; 30 days. Other skills stay Free'},
 listen:{id:'listen',name:'ListenEZ Focus',price:6,amountInCents:600,type:'skill',durationDays:30,aiUnits:25,dailyLimit:10,fullTests:true,description:'Listening only; 10 practices daily, 25 AI credits; 30 days. Other skills stay Free'},
 boost:{id:'boost',name:'EZ Boost',price:5,amountInCents:500,type:'credits',creditsGrant:20,aiUnits:20,description:'20 AI credits plus 20 practice credits; no expiry. Existing plan limits still apply'},
 boost_plus:{id:'boost_plus',name:'EZ Boost+',price:10,amountInCents:1000,type:'credits',creditsGrant:50,aiUnits:50,description:'50 AI credits plus 50 practice credits; no expiry. Existing plan limits still apply'},
} as const;
export const MONTHLY_AI_UNITS:Record<string,number>={free:0,lite:20,plus:50,max:100,basic:100,pro:250,pro_plus:500};
export type PackageId=keyof typeof PACKAGES;
export const PLAN_NAMES:Record<string,string>={free:'Free',lite:'EZ Lite',plus:'EZ Plus',max:'EZ Max',basic:'EZ Basic (existing)',pro:'EZ Pro (existing)',pro_plus:'EZ Pro+ (existing)',focus:'Focus'};
