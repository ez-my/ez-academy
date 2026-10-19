import fs from 'fs';
let f1 = fs.readFileSync('src/lib/gemini.ts', 'utf8');
f1 = f1.replace(/import \{ genAI \} from "\.\/geminiClient";/g, 'import { getGenAI } from "./geminiClient";');
f1 = f1.replace(/genAI\.models/g, 'getGenAI().models');
fs.writeFileSync('src/lib/gemini.ts', f1);

let f2 = fs.readFileSync('src/services/geminiService.ts', 'utf8');
f2 = f2.replace(/import \{ genAI, Modality \} from "..\/lib\/geminiClient";/g, 'import { getGenAI, Modality } from "../lib/geminiClient";');
f2 = f2.replace(/genAI\.models/g, 'getGenAI().models');
fs.writeFileSync('src/services/geminiService.ts', f2);
console.log("Replaced successfully!");
