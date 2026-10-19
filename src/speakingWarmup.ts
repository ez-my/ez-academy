// A reviewed, low-pressure bank. Never send Part 1 through critical-topic generation.
export const WARMUP_INTRO = "Hi! It's lovely to meet you. Let's warm up with a few easy questions about your day. Take your time and answer in your own words.";
export const WARMUP_VOICE = { voice: 'coral' as const, version: 'warmup-coral-v2', instructions: 'You are a kind, welcoming English teacher helping a Malaysian secondary-school student feel comfortable. Speak with a gentle smile, a relaxed conversational pace and soft, reassuring intonation. Be friendly, never stern, theatrical or overly excited. Read the supplied line once, exactly as written. Do not add a greeting, repeat the question, or invent extra words.' };
const groups = [
 ['What do you like to be called?', 'How do you usually get to school?', 'What time do you usually wake up on a school day?', 'What do you usually have for breakfast?', 'What do you usually pack in your school bag?', 'What do you do before leaving for school?', 'Where do you usually have breakfast?', 'What do you usually do when you reach school?', 'What do you like about your classroom?', 'What is your favourite place at school?', 'What do you usually do during assembly?', 'What do you usually do after your last lesson?'],
 ['Which school subject do you enjoy?', 'What do you usually eat during recess?', 'Who do you usually sit with during recess?', 'What do you like to do with your classmates?', 'What do you usually do in the school library?', 'Which club or school activity would you like to try?', 'What do you like about your favourite teacher?', 'What do you usually do during PE lessons?', 'What do you like to draw or write in your notebook?', 'How do you get ready for a normal school day?', 'What do you usually drink at the school canteen?', 'What is something you enjoyed at school recently?'],
 ['What do you like to do after school?', 'What food do you enjoy eating at home?', 'Where do you usually do your homework?', 'What music do you enjoy listening to?', 'What game do you like to play?', 'What do you like to watch in your free time?', 'How do you like to relax after doing homework?', 'What small task do you help with at home?', 'What do you usually do in the evening?', 'What do you like to read in your free time?', 'What sport or simple exercise do you enjoy?', 'What is your favourite snack?'],
 ['What do you like to do at the weekend?', 'Where do you like to go with your friends?', 'What local food would you like to eat this weekend?', 'What do you like to do on a rainy afternoon?', 'What do you enjoy doing during the school holidays?', 'What do you like to do at a park?', 'What do you usually do on Saturday morning?', 'What would you like to do after school today?', 'What do you like to take photos of?', 'What is a hobby you would like to try?', 'What do you like about the area where you live?', 'What is something simple that makes you smile?'],
];
export const WARMUP_QUESTIONS = groups.flatMap((questions, group) => questions.map((text, i) => ({id:`warmup-${group}-${i}`,group,text})));
export function parseWarmupHistory(raw: string | null): string[] {
 try { const value=JSON.parse(raw || '[]');return Array.isArray(value)?[...new Set(value.filter((x):x is string=>typeof x==='string'&&WARMUP_QUESTIONS.some(q=>q.id===x)))]:[]; } catch { return []; }
}
export function selectWarmupQuestions(history: string[], random = Math.random) {
 const used=new Set(history);const selected=groups.map((_,group)=>{
  const options=WARMUP_QUESTIONS.filter(q=>q.group===group&&!used.has(q.id));
  return options[Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)))];
 }).filter(Boolean);
 if(selected.length!==4) return null; // No silent recycling when the bank is exhausted.
 return {questions:selected.map(q=>q.text), history:[...used,...selected.map(q=>q.id)]};
}
