import C2_BANK from './c2VocabularyBank.json';
export const LEGACY_WORDS=[
 ['versatile','useful in many different ways','serba guna','A phone is a versatile tool for learning.'],
 ['reliable','able to be trusted','boleh dipercayai','Reliable buses help students arrive on time.'],
 ['improve','to make something better','menambah baik','Daily reading can improve your vocabulary.'],
 ['benefit','a helpful result','manfaat','One benefit of exercise is better sleep.'],
 ['reduce','to make something smaller or less','mengurangkan','We can reduce waste by reusing bags.'],
 ['support','to help someone or something','menyokong','Friends can support each other during exams.'],
 ['confident','sure that you can do something','yakin','Practice helps me feel confident when speaking.'],
 ['affordable','not too expensive','mampu milik','Students need affordable public transport.'],
 ['essential','very important or needed','penting','Clean water is essential for good health.'],
 ['achieve','to succeed in doing something','mencapai','Small steps help us achieve our goals.'],
 ['balance','to give enough time or attention to different things','keseimbangan','Students need to balance study and rest.'],
 ['protect','to keep someone or something safe','melindungi','Strong passwords protect our information.'],
 ['aware','knowing about something','sedar','We should be aware of online risks.'],
 ['opportunity','a chance to do something','peluang','Volunteering is an opportunity to learn new skills.'],
 ['effective','working well and giving the wanted result','berkesan','A clear plan makes revision more effective.'],
 ['encourage','to help someone feel ready to try','menggalakkan','Teachers encourage students to ask questions.'],
 ['responsible','acting carefully and doing what is right','bertanggungjawab','Responsible users check news before sharing it.'],
 ['flexible','able to change when needed','fleksibel','Flexible work hours can help students.'],
 ['maintain','to keep something in good condition','mengekalkan','Exercise helps us maintain good health.'],
 ['participate','to take part','menyertai','Everyone should have a chance to participate.'],
 ['compare','to look at how things are alike or different','membandingkan','Compare prices before buying a new phone.'],
 ['consider','to think carefully about something','mempertimbangkan','We should consider the cost before deciding.'],
 ['practical','useful in real life','praktikal','Cooking is a practical skill for young adults.'],
 ['contribute','to give time, ideas or help','menyumbang','Students can contribute to their community.'],
 ['cooperate','to work together','bekerjasama','Team members need to cooperate to finish the task.'],
 ['suitable','right for a person or purpose','sesuai','Choose a suitable place to study.'],
 ['access','the chance or ability to use something','akses','All students need access to learning materials.'],
 ['respect','to treat people and their views with care','menghormati','We should respect different opinions.'],
 ['adapt','to change for a new situation','menyesuaikan diri','New students need time to adapt to college life.'],
 ['consistent','done regularly in a similar way','konsisten','Consistent practice builds speaking confidence.'],
].map(([word,meaning,malay,example])=>({id:word,word,meaning,malay,example}));

export const DAILY_WORDS=C2_BANK;
// Preserve previously saved words when the daily bank changes.
export const ALL_VOCABULARY=[...new Map([...LEGACY_WORDS,...DAILY_WORDS].map(w=>[w.id,w])).values()];
const EPOCH=Date.parse('2026-10-17T00:00:00Z')/86400000;
export function vocabularyForDay(day:string){
 const offset=Math.floor(Date.parse(day+'T00:00:00Z')/86400000)-EPOCH;
 if(!Number.isFinite(offset))throw Error('Invalid vocabulary date');
 return DAILY_WORDS[((offset%DAILY_WORDS.length)+DAILY_WORDS.length)%DAILY_WORDS.length];
}
