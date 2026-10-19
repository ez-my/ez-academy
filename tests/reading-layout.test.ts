import test from 'node:test';
import assert from 'node:assert/strict';
import {readingTextBlocks} from '../src/data/readingTextLayout';
test('question stems and A/B/C options remain distinct without losing wording',()=>{
 const source='Read the notice.\n\n1 What should Ali buy?\nA A shirt\nB New shoes\nC A bag\n\n2 Why is he late?\nA Work\nB School\nC Travel';
 const blocks=readingTextBlocks(source);
 assert.deepEqual(blocks.filter(b=>b.kind==='question').map(b=>b.text),['1 What should Ali buy?','2 Why is he late?']);
 assert.deepEqual(blocks.filter(b=>b.kind==='choice').map(b=>b.label),['A','B','C','A','B','C']);
 assert.equal(blocks.map(b=>(b.label?b.label+' ':'')+b.text).join(' ').replace(/\s+/g,' ').trim(),source.replace(/\s+/g,' ').trim());
});
test('cloze headings and wrapped options preserve content',()=>{
 const blocks=readingTextBlocks('Question 9\r\nA replaced\r\nB exchanged\r\nC a longer option\r\ncontinued on another line\r\nD renewed');
 assert.equal(blocks[0].kind,'question');assert.equal(blocks[0].text,'Question 9');assert.equal(blocks.filter(b=>b.kind==='choice').length,4);assert.equal(blocks.find(b=>b.label==='C')?.text,'a longer option\ncontinued on another line');
});

test('a separate paragraph does not become part of the previous choice',()=>{
 const blocks=readingTextBlocks('1 Choose a word.\nA first\nB second\nC third\n\na separate passage begins here.');assert.equal(blocks.at(-1)?.kind,'text');assert.equal(blocks.find(b=>b.label==='C')?.text,'third');
});
