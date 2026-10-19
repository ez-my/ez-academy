import {test} from 'node:test';
import assert from 'node:assert/strict';
import {primeExaminerAudio,SILENT_AUDIO} from '../src/lib/examinerPlayback';
test('media unlock occurs synchronously on the retained player before async microphone work',async()=>{
 const events:string[]=[];
 const audio={src:'',load(){events.push('load')},play(){events.push('play');return Promise.resolve()},pause(){events.push('pause')}};
 primeExaminerAudio(audio as unknown as HTMLAudioElement);
 assert.equal(audio.src,SILENT_AUDIO);assert.deepEqual(events,['load','play']);
 audio.src='blob:question';await Promise.resolve();
 assert.equal(audio.src,'blob:question');assert.deepEqual(events,['load','play']);
});
test('blocked unlock does not reject the practice start',async()=>{
 const audio={src:'',load(){},play(){return Promise.reject(new Error('NotAllowedError'))}};
 primeExaminerAudio(audio as unknown as HTMLAudioElement);await Promise.resolve();
});
