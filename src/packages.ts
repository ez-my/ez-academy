// Shared by pricing, checkout and server activation. Historical purchases use frozen catalogues.
export const PACKAGE_VERSION=4;
export const PACKAGES={
 lite:{id:'lite',name:'EZ Lite',price:5,amountInCents:500,type:'subscription',durationDays:7,aiUnits:20,dailyLimit:3,dailyScope:'bundle',extraFree:true,fullTests:false,description:'All 4 skills; 3 shared plan practices daily plus 2 free; 7 days'},
 plus:{id:'plus',name:'EZ Plus',price:10,amountInCents:1000,type:'subscription',durationDays:14,aiUnits:50,dailyLimit:5,dailyScope:'bundle',extraFree:true,fullTests:true,description:'All 4 skills; 5 shared plan practices daily plus 2 free; 14 days'},
 max:{id:'max',name:'EZ Max',price:15,amountInCents:1500,type:'subscription',durationDays:14,aiUnits:100,dailyLimit:14,dailyScope:'bundle',extraFree:true,fullTests:true,description:'All 4 skills; 14 shared plan practices daily plus 2 free; 14 days'},
 speak:{id:'speak',name:'SpeakEZ Focus',price:8,amountInCents:800,type:'skill',durationDays:7,aiUnits:40,dailyLimit:10,dailyScope:'skill',extraFree:true,fullTests:true,description:'Speak only; 10 plan practices daily plus 2 shared free; 7 days'},
 write:{id:'write',name:'WriteEZ Focus',price:8,amountInCents:800,type:'skill',durationDays:7,aiUnits:40,dailyLimit:6,dailyScope:'skill',extraFree:true,fullTests:true,description:'Write only; 6 plan practices daily plus 2 shared free; 7 days'},
 read:{id:'read',name:'ReadEZ Focus',price:5,amountInCents:500,type:'skill',durationDays:7,aiUnits:15,dailyLimit:10,dailyScope:'skill',extraFree:true,fullTests:true,description:'Read only; 10 plan practices daily plus 2 shared free; 7 days'},
 listen:{id:'listen',name:'ListenEZ Focus',price:6,amountInCents:600,type:'skill',durationDays:7,aiUnits:25,dailyLimit:10,dailyScope:'skill',extraFree:true,fullTests:true,description:'Listen only; 10 plan practices daily plus 2 shared free; 7 days'},
 boost:{id:'boost',name:'EZ Boost',price:5,amountInCents:500,type:'credits',creditsGrant:20,aiUnits:20,description:'20 AI credits plus 20 practice credits; no expiry. Existing plan limits still apply'},
 boost_plus:{id:'boost_plus',name:'EZ Boost+',price:10,amountInCents:1000,type:'credits',creditsGrant:50,aiUnits:50,description:'50 AI credits plus 50 practice credits; no expiry. Existing plan limits still apply'},
} as const;
export const MONTHLY_AI_UNITS:Record<string,number>={free:0,lite:20,plus:50,max:100,basic:100,pro:250,pro_plus:500};
export type PackageId=keyof typeof PACKAGES;
export const PLAN_NAMES:Record<string,string>={free:'Free',lite:'EZ Lite',plus:'EZ Plus',max:'EZ Max',basic:'EZ Basic (existing)',pro:'EZ Pro (existing)',pro_plus:'EZ Pro+ (existing)',focus:'Focus'};
