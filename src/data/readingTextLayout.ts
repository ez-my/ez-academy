export interface ReadingTextBlock {kind:'text'|'question'|'choice';text:string;label?:string}
// Only change layout. Keep every source word, number and answer option.
export function readingTextBlocks(text:string):ReadingTextBlock[]{
 const blocks:ReadingTextBlock[]=[];let separated=false;
 for(const line of text.replace(/\r\n?/g,'\n').split('\n')){
  const value=line.trim();if(!value){separated=true;if(blocks.at(-1)?.kind==='text')blocks.push({kind:'text',text:''});continue;}
  const previous=blocks.at(-1),continueChoice=!separated&&previous?.kind==='choice'&&/^[a-z]/.test(value);separated=false;
  const question=value.match(/^(?:Question\s+([1-9]|[1-3]\d|40)(?:[.)]|$|\s)|([1-9]|[1-3]\d|40)[.)]?\s+\S)/i);
  const choice=value.match(/^([A-H]|[b-h]|a[.)])[.)]?\s+(.+)$/);
  if(question)blocks.push({kind:'question',text:value});
  else if(choice)blocks.push({kind:'choice',label:choice[1][0].toUpperCase(),text:choice[2]});
  else if(continueChoice&&previous)previous.text+='\n'+value;
  else {const last=blocks.at(-1);if(last?.kind==='text'&&last.text)last.text+='\n'+value;else blocks.push({kind:'text',text:value});}
 }
 return blocks.filter(b=>b.text);
}
