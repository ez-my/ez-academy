import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await mkdir('public/photo-tools/wasm',{recursive:true});
await copyFile('node_modules/@mediapipe/tasks-vision/vision_bundle.js','public/photo-tools/vision_bundle.js');
for(const name of ['vision_wasm_internal','vision_wasm_nosimd_internal'])for(const ext of ['js','wasm'])await copyFile(`node_modules/@mediapipe/tasks-vision/wasm/${name}.${ext}`,`public/photo-tools/wasm/${name}.${ext}`);
await build({entryPoints:['src/workers/devicePhotoWorker.ts'],outfile:'public/photo-tools/portrait-worker.js',bundle:true,platform:'browser',format:'iife',target:'es2022'});
