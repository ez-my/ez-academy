import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { withoutRecordingData } from '../src/lib/recordingPrivacy';
import { persistSessionOnce } from '../src/lib/sessionPersistence';

// Execute the actual saveSession body against an isolated Firestore adapter.
// Never connect these fixtures to the existing production database.
const source = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('firebase.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'saveSession'))!;
const javascript = ts.transpileModule(declaration.getText(ast).replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

function isolatedSave(fail = false, failActivity = false) {
  const writes: Array<{ path: string; data: any }> = [];
  const profile = { plan: 'pro', credits: 47, points: 10, streak: 2, usage: { date: '' } };
  const records = new Map<string, any>([['users/existing-uid', profile]]);
  const bindings = {
    persistSessionOnce, auth: { currentUser: { uid: 'existing-uid' } },
    runTransaction: async (_db: any, work: any) => {
      const pending: any[] = [];
      await work({
        get: async (path: string) => ({ exists: () => records.has(path), data: () => records.get(path) }),
        set: (path: string, data: any) => pending.push({ path, data }),
        update: (path: string, data: any) => pending.push({ path, data }),
      });
      if (fail) throw Error('offline');
      for (const row of pending) { writes.push(row); records.set(row.path, { ...records.get(row.path), ...row.data }); }
    },
    withoutRecordingData, db: {}, doc: (_db: any, ...parts: string[]) => parts.join('/'),
    setDoc: async (path: string, data: any) => { if (fail) throw Error('offline'); writes.push({ path, data }); },
    getDoc: async () => ({ exists: () => true, data: () => profile }),
    updateDoc: async (path: string, data: any) => { if (failActivity) throw Error('profile rule rejected'); writes.push({ path, data }); },
    Timestamp: { fromMillis: (milliseconds: number) => ({ milliseconds }) },
    serverTimestamp: () => ({ serverTimestamp: true }), increment: (amount: number) => ({ increment: amount }),
    OperationType: { WRITE: 'write' }, handleFirestoreError: () => undefined,
  };
  const save = new Function(...Object.keys(bindings), javascript + '\nreturn saveSession;')(...Object.values(bindings));
  return { save, writes, profile, records };
}

for (const type of ['SpeakEZ', 'WriteEZ', 'ReadEZ', 'ListenEZ']) {
  test(`${type} sync retains result and existing UID without cloud recording or credit changes`, async () => {
    const { save, writes, profile } = isolatedSave();
    await save('existing-uid', { id: 'fixture', userId: 'existing-uid', type, timestamp: 123456, duration: 30, score: 85, transcript: 'A sample answer.', metrics: { grammar: 85 }, audioBlob: new Blob(['private recording']), audioUrl: 'blob:device-only', recordingData: 'private' });
    await new Promise(resolve => setImmediate(resolve));
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
test('session sync commits the result independently and never writes points', async () => {
  const {save,writes}=isolatedSave();
  const base={id:'stable-fixture',userId:'existing-uid',type:'WriteEZ',timestamp:123456,duration:0,transcript:'My meaningful fixture answer.',feedback:''};
  await save('existing-uid',{...base,score:null});
  await save('existing-uid',{...base,score:0,feedback:'Synthetic assessed feedback'});
  await new Promise(resolve => setImmediate(resolve));
  await save('existing-uid',{...base,score:0,feedback:'Synthetic assessed feedback'});
  assert.ok(writes.filter(w=>w.path==='users/existing-uid').length >= 1);
  assert.equal(writes.filter(w=>w.path.endsWith('/sessions/stable-fixture')).length,3);
  assert.equal(writes.filter(w=>w.path.endsWith('/sessions/stable-fixture')).at(-1)?.data.score,0);

  // This used to assert the client incremented points by 5. It must not any
  // more: points decide leaderboard rank, the server awards them when it spends
  // a practice, and firestore.rules now rejects a points change from a learner.
  // A client that still sent one would have every result sync refused.
  for (const write of writes.filter(w=>w.path==='users/existing-uid')) {
    assert.equal('points' in write.data, false, 'the browser must not write points');
  }
  // The streak update is best effort and separate from the result transaction.
  assert.ok(writes.find(w=>w.path==='users/existing-uid' && 'streak' in w.data));
});

test('profile activity rejection does not undo a saved result', async () => {
  const {save,records}=isolatedSave(false,true);
  await save('existing-uid',{id:'independent',userId:'existing-uid',type:'SpeakEZ',timestamp:123456,duration:10,transcript:'A meaningful spoken answer.',score:81});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(records.get('users/existing-uid/sessions/independent').score,81);
});

test('failed session write rejects and never awards points', async () => {
  const { save, writes } = isolatedSave(true);
  await assert.rejects(save('existing-uid', { id: 'fixture', userId: 'existing-uid', type: 'SpeakEZ', score: 85 }), /not synced/);
  assert.equal(writes.length, 0);
});

test('actual saveSession adapter passes stable ordering metadata and returns effective persisted version',async()=>{
  const {save,writes,records}=isolatedSave();
  const base={id:'versioned',userId:'existing-uid',type:'WriteEZ',timestamp:123456,duration:0,transcript:'Synthetic answer',score:90,feedback:'New feedback',resultVersion:'new',resultOrder:9};
  const first=await save('existing-uid',base);
  const stale=await save('existing-uid',{...base,score:80,feedback:'Old feedback',resultVersion:'old',resultOrder:8});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(first.resultVersion,'new');assert.equal(stale.resultVersion,'new');assert.equal(stale.resultOrder,9);assert.equal(stale.score,90);
  assert.equal(records.get('users/existing-uid/sessions/versioned').resultVersion,'new');
  assert.deepEqual(stale.timestamp,{milliseconds:123456});
  assert.ok(writes.filter(w=>w.path==='users/existing-uid').length >= 1);
});
