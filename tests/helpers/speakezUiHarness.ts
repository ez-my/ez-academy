import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Text-only render of the real page, with named hook state and inert external services.
// Does not emulate a browser, microphone, Firebase, or animation/layout behavior.
export function renderSpeakEZ(state: Record<string, any>, modules: Record<string, any> = {}) {
  const source = readFileSync(new URL('../../src/pages/SpeakEZ.tsx', import.meta.url), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/const \[([^,]+), ([^\]]+)\] = \(0, react_1\.useState\)\(/g, (_all, name, setter) => `const [${name}, ${setter}] = useNamedState(${JSON.stringify(name)}, `);
  const exports: any = {};
  const jsx = (type: any, props: any) => ({ type, props });
  const noOp = () => {};
  const require = (name: string) => {
    if (Object.hasOwn(modules, name)) return modules[name];
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react') return { useRef: (current: any) => ({ current }), useEffect: noOp, default: {} };
    if (name === 'react-router-dom') return { useNavigate: () => noOp };
    if (name === 'motion/react') return { motion: new Proxy({}, { get: (_t, key) => String(key) }), AnimatePresence: 'presence' };
    if (name.endsWith('/useAudioRecorder')) return { useAudioRecorder: () => ({ duration: 0, transcript: '', reset: noOp }) };
    if (name.endsWith('/limits')) return { useDailyLimits: () => ({ isLimitReached: () => false, getRemaining: () => 5 }), CREDIT_COSTS: { speak: { deep: 1 } } };
    if (name.endsWith('/usePracticeProgress')) return { usePracticeDraft: noOp, usePracticeProgress: () => ({ attempt: null, complete: async (fields: any) => { await modules['../lib/firebase']?.saveSession?.('synthetic-memory-only', { id: 'synthetic-attempt', ...fields }); return true; } }) };
    if (name.endsWith('/firebase')) return { auth: {}, db: {} };
    return new Proxy({}, { get: (_t, key) => key === '__esModule' ? false : noOp });
  };
  vm.runInNewContext(code, {
    exports, require, console, Audio: class {}, navigator: { onLine: true }, window: {}, localStorage: { getItem: () => null },
    useNamedState: (name: string, initial: any) => [Object.hasOwn(state, name) ? state[name] : typeof initial === 'function' ? initial() : initial, noOp],
  });
  return exports.SpeakEZ({ profile: { uid: 'synthetic-local-only', plan: 'ez_plus' } });
}
export function renderedText(node: any): string {
  if (Array.isArray(node)) return node.map(renderedText).join(' ');
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return renderedText(node.props?.children);
}
export function findButton(node: any, label: string): any {
  if (Array.isArray(node)) return node.map(item => findButton(item, label)).find(Boolean);
  if (!node || typeof node !== 'object') return;
  if (node.type === 'button' && renderedText(node).includes(label)) return node;
  return findButton(node.props?.children, label);
}
