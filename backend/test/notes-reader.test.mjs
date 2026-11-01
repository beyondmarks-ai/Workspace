import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { validatePdf } from '../../app/dashboard/notes/pdf-file.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { transform } = require('next/dist/build/swc');
const compile = async path => (await transform(await readFile(new URL(path, import.meta.url), 'utf8'), { filename: path, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' } })).code;
function find(node, predicate) {
  if (!node?.props) return;
  if (predicate(node)) return node;
  return React.Children.toArray(node.props.children).map(child => find(child, predicate)).find(Boolean);
}

test('PDF validation accepts PDF headers and rejects empty or disguised files', async () => {
  await validatePdf(new File(['%PDF-1.7\nTest'], 'notes.PDF'));
  await assert.rejects(validatePdf(new File([], 'notes.pdf')), /at least one page/);
  await assert.rejects(validatePdf(new File(['image'], 'notes.pdf')), /does not appear/);
  await assert.rejects(validatePdf(new File(['%PDF-1.7'], 'notes.html')), /choose a PDF/);
});

test('reader preserves a valid PDF on errors and releases replaced and unmounted files', async () => {
  const state = [], refs = [], effects = [], revoked = [], created = [];
  let index = 0, refIndex = 0;
  const fakeReact = { ...React,
    useState(initial) { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef(initial) { const i = refIndex++; return refs[i] ||= { current: initial }; },
    useEffect: fn => effects.push(fn),
  };
  const module = { exports: {} };
  vm.runInNewContext(await compile('../../app/dashboard/notes/notes-reader.js'), { module, exports: module.exports, Blob,
    require: name => name === 'react' ? fakeReact : name.endsWith('PricingBackdrop') || name === './pdf-chat' ? () => null : name === './pdf-file.mjs' ? { validatePdf } : require(name),
    URL: { createObjectURL: file => { const url = `blob:test-${created.length}`; created.push(file.name); return url; }, revokeObjectURL: url => revoked.push(url) },
  });
  function render() { index = 0; refIndex = 0; return module.exports.default(); }
  render(); const cleanup = effects.splice(0).map(fn => fn());
  const choose = async file => { find(render(), n => n.type === 'input').props.onChange({ target: { files: [file], value: '' } }); await new Promise(resolve => setImmediate(resolve)); };
  await choose(new File(['%PDF-1.7'], 'first.pdf'));
  assert.equal(find(render(), n => n.type === 'iframe').props.src, 'blob:test-0#view=FitH&toolbar=1');
  const chat = find(render(), n => typeof n.props.onBusyChange === 'function');
  chat.props.onBusyChange(true);
  const viewport = find(render(), n => n.props.className === 'notes-pdf-viewport');
  assert.equal(viewport.props['aria-busy'], true);
  assert.ok(find(viewport, n => n.props.className === 'notes-pdf-reveal'));
  assert.equal(find(viewport, n => n.type === 'iframe').props.src, 'blob:test-0#view=FitH&toolbar=1');
  await choose(new File(['bad'], 'wrong.pdf'));
  assert.equal(find(render(), n => n.type === 'iframe').props.src, 'blob:test-0#view=FitH&toolbar=1');
  assert.ok(find(render(), n => n.props.role === 'alert'));
  await choose(new File(['%PDF-1.7'], 'second.pdf'));
  assert.equal(find(render(), n => n.props.className === 'notes-pdf-viewport').props['aria-busy'], false);
  assert.deepEqual(revoked, ['blob:test-0']);
  cleanup.forEach(fn => fn?.());
  assert.deepEqual(revoked, ['blob:test-0', 'blob:test-1']);
});

test('PDF chat preview rejects blank questions, prevents overlap, cancels and cleans up', async () => {
  const state = [], refs = [], effects = [], timers = new Map();
  const busyChanges = [];
  let index = 0, refIndex = 0, timerId = 0;
  const module = { exports: {} };
  const fakeReact = { ...React,
    useState(initial) { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef(initial) { const i = refIndex++; return refs[i] ||= { current: initial }; },
    useEffect: fn => effects.push(fn),
  };
  vm.runInNewContext(await compile('../../app/dashboard/notes/pdf-chat.js'), { module, exports: module.exports,
    require: name => name === 'react' ? fakeReact : require(name),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  });
  const render = () => { index = 0; refIndex = 0; return module.exports.default({ document: { name: 'notes.pdf' }, onBusyChange: busy => busyChanges.push(busy) }); };
  render(); const cleanup = effects.splice(0).map(fn => fn());
  const submit = () => find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  submit(); assert.equal(timers.size, 0);
  find(render(), n => n.type === 'textarea').props.onChange({ target: { value: '  Explain this idea  ' } });
  submit(); assert.equal(timers.size, 1);
  assert.deepEqual(busyChanges, [true]);
  assert.equal(find(render(), n => n.props.className === 'pdf-chat-question').props.children, 'Explain this idea');
  assert.equal(find(render(), n => n.props.className === 'pdf-answer').props['aria-busy'], true);
  submit(); assert.equal(timers.size, 1);
  find(render(), n => n.type === 'button' && n.props.children === 'Stop preview').props.onClick();
  assert.equal(timers.size, 0); assert.equal(find(render(), n => n.props.className === 'pdf-answer'), undefined);
  assert.deepEqual(busyChanges, [true, false]);
  submit(); const done = [...timers.values()][0]; timers.clear(); done();
  assert.equal(find(render(), n => n.props.className === 'pdf-answer').props['data-phase'], 'done');
  assert.deepEqual(busyChanges, [true, false, true, false]);
  assert.match(find(render(), n => n.props.id === 'pdf-preview-disclosure').props.children, /not connected/);
  submit(); cleanup.forEach(fn => fn?.()); assert.equal(timers.size, 0);
});

test('Notes sidebar opens the protected Notes route instead of Coming soon', async () => {
  const paths = [], module = { exports: {} };
  vm.runInNewContext(await compile('../../app/dashboard/sidebar.js'), { module, exports: module.exports,
    require: name => name === 'react' ? { ...React, useState: initial => [initial, () => {}], useRef: () => ({ current: null }), useEffect() {} } : name === 'next/navigation' ? { useRouter: () => ({ push: path => paths.push(path) }) } : name === 'next/link' ? () => null : name.endsWith('.css') || name.includes('use-account') ? {} : require(name),
  });
  const tree = module.exports.default({ profile: { name: 'Student' }, workspaceOrigin: 'https://beyondmarks.ai' });
  const notes = find(tree, n => n.props['aria-label'] === 'Notes');
  assert.equal(notes.props['aria-haspopup'], undefined);
  notes.props.onClick();
  assert.deepEqual(paths, ['https://beyondmarks.ai/dashboard/notes']);
});
