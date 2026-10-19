import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { withoutRecordingData } from '../src/lib/recordingPrivacy';

// Execute the actual saveSession body against an isolated Firestore adapter.
// Never connect these fixtures to the existing production database.
const source = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('firebase.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'saveSession'))!;
const javascript = ts.transpileModule(declaration.getText(ast).replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

function isolatedSave(fail = false) {
  const writes: Array<{ path: string; data: any }> = [];
  const profile = { plan: 'pro', credits: 47, points: 10, streak: 2, usage: { date: new Date().toISOString().split('T')[0] } };
  const bindings = {
    withoutRecordingData, db: {}, doc: (_db: any, ...parts: string[]) => parts.join('/'),
    setDoc: async (path: string, data: any) => { if (fail) throw Error('offline'); writes.push({ path, data }); },
    getDoc: async () => ({ exists: () => true, data: () => profile }),
    updateDoc: async (path: string, data: any) => { writes.push({ path, data }); },
    Timestamp: { fromMillis: (milliseconds: number) => ({ milliseconds }) },
    serverTimestamp: () => ({ serverTimestamp: true }), increment: (amount: number) => ({ increment: amount }),
    OperationType: { WRITE: 'write' }, handleFirestoreError: () => undefined,
  };
  const save = new Function(...Object.keys(bindings), javascript + '\nreturn saveSession;')(...Object.values(bindings));
  return { save, writes, profile };
}

for (const type of ['SpeakEZ', 'WriteEZ', 'ReadEZ', 'ListenEZ']) {
  test(`${type} sync retains result and existing UID without cloud recording or credit changes`, async () => {
    const { save, writes, profile } = isolatedSave();
    await save('existing-uid', { id: 'fixture', userId: 'existing-uid', type, timestamp: 123456, duration: 30, score: 85, transcript: 'A sample answer.', metrics: { grammar: 85 }, audioBlob: new Blob(['private recording']), audioUrl: 'blob:device-only', recordingData: 'private' });
    assert.equal(writes[0].path, 'users/existing-uid/sessions/fixture');
    assert.equal(writes[0].data.type, type);
    assert.deepEqual(writes[0].data.timestamp, { milliseconds: 123456 });
    assert.equal(writes[0].data.transcript, 'A sample answer.');
    assert.deepEqual(writes[0].data.metrics, { grammar: 85 });
    assert.ok(!JSON.stringify(writes).includes('private'));
    assert.ok(!JSON.stringify(writes).includes('blob:'));
    assert.equal(writes[1].path, 'users/existing-uid');
    assert.ok(!Object.hasOwn(writes[1].data, 'credits'));
    assert.equal(profile.credits, 47);
  });
}
test('failed session write rejects and never awards points', async () => {
  const { save, writes } = isolatedSave(true);
  await assert.rejects(save('existing-uid', { id: 'fixture', type: 'SpeakEZ', score: 85 }), /could not be synced/);
  assert.equal(writes.length, 0);
});
