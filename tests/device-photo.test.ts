import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePhoto,photoDimensions,devicePhotoKey,MAX_PHOTO_BYTES} from '../src/lib/devicePhotoPolicy';
import {AFFILIATE_TERMS} from '../src/affiliate';
test('accepts photos up to 500 MB and rejects larger or empty files',()=>{
 assert.doesNotThrow(()=>validatePhoto({size:MAX_PHOTO_BYTES,type:'image/jpeg'}));
 assert.throws(()=>validatePhoto({size:MAX_PHOTO_BYTES+1,type:'image/jpeg'}),/500 MB/);
 assert.throws(()=>validatePhoto({size:0,type:'image/png'}),/500 MB/);
});
test('only supported raster photo formats are accepted',()=>{
 for(const type of ['image/jpeg','image/png','image/webp'])assert.doesNotThrow(()=>validatePhoto({size:2000,type}));
 for(const type of ['image/svg+xml','application/pdf','image/heic',''])assert.throws(()=>validatePhoto({size:2000,type}),/JPG, PNG or WebP/);
});
test('bounds decoded photo size and preserves image proportions',()=>{
 assert.deepEqual(photoDimensions(4000,3000),{width:1024,height:768});
 assert.deepEqual(photoDimensions(3000,4000),{width:768,height:1024});
 assert.deepEqual(photoDimensions(192,128),{width:192,height:128});
 for(const [w,h] of [[0,100],[100,NaN],[Infinity,2],[10000,10000]])assert.throws(()=>photoDimensions(w,h));
});
test('device photos are isolated by account and cannot use an anonymous key',()=>{
 assert.notEqual(devicePhotoKey('user-a'),devicePhotoKey('user-b'));
 assert.throws(()=>devicePhotoKey(''));
});
test('affiliate payout copy specifies five working days and RM10 minimum',()=>{
 assert.match(AFFILIATE_TERMS,/within 5 working days/);
 assert.match(AFFILIATE_TERMS,/Minimum claim RM10/);
});
