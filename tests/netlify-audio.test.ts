import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import serverless from 'serverless-http';
import {readFileSync} from 'node:fs';

test('Netlify adapter preserves MP3 bytes without UTF-8 corruption',async()=>{
 const bytes=Buffer.from([0x49,0x44,0x33,0,0xff,0xfb,0x90,0x64,0x80,0xfe,0x00]);
 const app=express();app.get('/audio',(_q,r)=>r.type('audio/mpeg').send(bytes));
 // Read actual adapter options so removing binary configuration breaks this test.
 const source=readFileSync('src/server/netlifyApi.ts','utf8');
 assert.match(source,/binary: \['audio\/\*', 'application\/octet-stream'\]/);
 const handler=serverless(app,{binary:['audio/*','application/octet-stream']});
 const result:any=await handler({path:'/audio',httpMethod:'GET',headers:{},requestContext:{}},{});
 assert.equal(result.isBase64Encoded,true);
 const response=new Response(Buffer.from(result.body,'base64'));
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
});
