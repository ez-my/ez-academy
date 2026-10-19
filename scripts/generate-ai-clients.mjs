import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';

// Generate small browser clients from the preserved server task signatures.
// The server owns every rubric; the browser sends only the task arguments.
function wrapper(node, source, task) {
  const header = source.slice(node.getStart(), node.body.getStart());
  const args = node.parameters.map(parameter => parameter.name.getText()).join(', ');
  return `${header}{\n  return invokeTask('${task}', [${args}]);\n}`;
}

for (const [name, output, imports] of [
  ['spm', 'src/lib/gemini.ts', 'import type { PracticeSession } from "../types";'],
  ['muet', 'src/lib/muetService.ts', "import type { MUETTopic, MUETCandidateId, MUETExaminerReport, MUETDiscussionTurn } from '../types/muet';"],
]) {
  const source = readFileSync(`src/server/tasks/${name}.ts`, 'utf8');
  const ast = ts.createSourceFile(name + '.ts', source, ts.ScriptTarget.Latest, true);
  const parts = [imports, "import { invokeTask } from './aiTask';"];
  if (name === 'muet') parts.push(ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText() === 'FILLER_WORDS')).getText(ast));
  for (const node of ast.statements) {
    if (!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(node) && node.body) {
      if (node.name.text === 'generateJSONWithAI') continue;
      const async = node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
      parts.push(async ? wrapper(node, source, `${name}.${node.name.text}`) : node.getText(ast));
    } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) parts.push(node.getText(ast));
  }
  writeFileSync(output, '// Server-backed clients. Regenerate with npm run generate:ai-clients.\n' + parts.join('\n\n') + '\n');
}

const source = readFileSync('src/server/tasks/practice.ts', 'utf8');
const ast = ts.createSourceFile('practice.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(ts.isClassDeclaration);
const methods = declaration.members.filter(ts.isMethodDeclaration).map(node => wrapper(node, source, `practice.${node.name.getText()}`));
writeFileSync('src/services/geminiService.ts', `// Preserve the existing public service API while executing rubrics on the server.\nimport type { ListenQuestion } from '../types';\nimport { invokeTask } from '../lib/aiTask';\n\nexport class GeminiService {\n${methods.join('\n\n')}\n}\n`);
