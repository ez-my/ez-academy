import {createHash} from 'node:crypto';
// Synthetic 1/4-second tone, never a learner recording. Exercises binary
// adaptation without an OpenAI call, microphone permission or stored audio.
export function operationsAudioCanary(){
 const samples=4000,buffer=Buffer.alloc(44+samples*2);
 buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(16000,24);buffer.writeUInt32LE(32000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/16000)*1000),44+i*2);
 return buffer;
}
export const audioDigest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
