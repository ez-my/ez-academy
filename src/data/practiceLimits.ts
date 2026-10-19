export const DAILY_PRACTICE_LIMITS={
 lite:{speak:5,write:5,read:5,listen:5,aiListen:5},
 plus:{speak:10,write:10,read:10,listen:10,aiListen:10},
 max:{speak:20,write:20,read:20,listen:20,aiListen:20},
 focus:{speak:10,write:6,read:10,listen:10,aiListen:10},
 free:{speak:2,write:2,read:2,listen:2,aiListen:2},
 basic:{speak:3,write:2,read:2,listen:2,aiListen:0},
 pro:{speak:12,write:8,read:12,listen:12,aiListen:8},
 pro_plus:{speak:30,write:20,read:30,listen:30,aiListen:20},
};
export function nextPracticeDay(data:any,day:string,skill:string,paid:boolean){return {...data,day,used:Number(data?.used||0)+(paid?0:1),bySkill:{...data?.bySkill,[skill]:Number(data?.bySkill?.[skill]||0)+1}};}
