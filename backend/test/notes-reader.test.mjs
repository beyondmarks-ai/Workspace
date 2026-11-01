import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { validatePdf } from '../../app/dashboard/notes/pdf-file.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { transform } = require('next/dist/build/swc');
const revealStub = () => null;
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
    require: name => name === 'react' ? fakeReact : name === './pdf-reveal' ? revealStub : name.endsWith('PricingBackdrop') || name === './pdf-chat' ? () => null : name === './pdf-file.mjs' ? { validatePdf } : require(name),
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
  assert.ok(find(viewport, n => n.type === revealStub));
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

test('PDF chat makes real requests, prevents overlap, cancels and ignores late responses', async () => {
  const state = [], refs = [], effects = [], calls = [], busyChanges = [];
  let index = 0, refIndex = 0, resolveUpload;
  const module = { exports: {} };
  const fakeReact = { ...React,
    useState(initial) { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef(initial) { const i = refIndex++; return refs[i] ||= { current: initial }; },
    useEffect: fn => effects.push(fn),
  };
  let holdUpload = true;
  vm.runInNewContext(await compile('../../app/dashboard/notes/pdf-chat.js'), { module, exports: module.exports, AbortController, DOMException, setTimeout, clearTimeout,
    require: name => name === 'react' ? fakeReact : require(name),
    fetch: async (url, options) => {
      calls.push(options);
      if (holdUpload) return new Promise(resolve => { resolveUpload = resolve; });
      return Response.json(options.headers['Content-Type'] === 'application/pdf'
        ? { document: { id: 'doc', status: 'ready', expiresAt: Date.now() + 60000 } }
        : { answer: 'Supported answer.', citations: [{ id: 's1', page: 2, quote: 'Exact supporting quotation.' }] });
    },
  });
  const render = () => { index = 0; refIndex = 0; return module.exports.default({ document: { name: 'notes.pdf', url: 'blob:notes', file: new File(['%PDF-1.7'], 'notes.pdf') }, onBusyChange: value => busyChanges.push(value) }); };
  render(); const cleanup = effects.splice(0).map(fn => fn());
  const submit = () => find(render(), n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await submit(); assert.equal(calls.length, 0);
  find(render(), n => n.type === 'textarea').props.onChange({ target: { value: '  Explain this idea  ' } });
  const pending = submit();
  await submit(); assert.equal(calls.length, 1);
  assert.equal(find(render(), n => n.props.className === 'pdf-answer').props['aria-busy'], true);
  find(render(), n => n.type === 'button' && n.props.children === 'Stop').props.onClick();
  assert.equal(calls[0].signal.aborted, true);
  resolveUpload(Response.json({ document: { id: 'late', status: 'ready' } })); await pending;
  assert.equal(find(render(), n => n.props.className === 'pdf-answer'), undefined);
  holdUpload = false; await submit();
  assert.equal(calls.length, 3);
  assert.equal(find(render(), n => n.props.className === 'pdf-answer').props['data-phase'], 'done');
  assert.equal(find(render(), n => n.type === 'a').props.href, 'blob:notes#page=2');
  assert.match(find(render(), n => n.props.id === 'pdf-data-disclosure').props.children, /Azure/);
  holdUpload = true; const unmountPending = submit();
  cleanup.forEach(fn => fn?.());
  assert.equal(calls.at(-1).signal.aborted, true);
  resolveUpload(Response.json({ answer: 'Late answer', citations: [] })); await unmountPending;
  assert.equal(busyChanges.at(-1), 'Finding the right passage');
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

test('dot-only renderer caps resolution, stops hidden/reduced motion and releases resources', async () => {
  const effects = [], frames = new Map(), listeners = new Map(), mediaListeners = new Map(), states = [];
  let frameId = 0, now = 0, arcs = 0, disconnected = false;
  const context = { clearRect() {}, setTransform() {}, beginPath() {}, fill() {}, stroke() { assert.fail('dot animation must not draw corner networks'); }, arc(x, y, radius) { assert.ok(Number.isFinite(x + y + radius)); assert.ok(radius >= 0); arcs++; } };
  const canvas = { getContext: () => context, getBoundingClientRect: () => ({ width: 800, height: 600 }) };
  const doc = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const media = { matches: false, addEventListener: (name, fn) => mediaListeners.set(name, fn), removeEventListener: name => mediaListeners.delete(name) };
  const module = { exports: {} };
  vm.runInNewContext(await compile('../../app/dashboard/notes/pdf-reveal.js'), { module, exports: module.exports,
    require: name => name === 'react' ? { ...React, useRef: () => ({ current: canvas }), useState: initial => [initial, value => states.push(value)], useEffect: fn => effects.push(fn) } : require(name),
    matchMedia: () => media, performance: { now: () => now }, window: { devicePixelRatio: 3 }, document: doc,
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; }, cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
  });
  module.exports.default(); const cleanup = effects[0]();
  assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200);
  assert.ok(arcs > 100 && arcs < 2000); assert.equal(frames.size, 1);
  for (const timestamp of [16.7, 33.4, 50.1]) {
    const previousArcs = arcs;
    now = timestamp; const tick = [...frames.values()][0]; frames.clear(); tick(now);
    assert.ok(arcs > previousArcs, 'draw on every display frame without a 30fps throttle');
    assert.equal(frames.size, 1);
  }
  now = 2500; const tick = [...frames.values()][0]; frames.clear(); tick(now);
  assert.deepEqual(states, []);
  doc.hidden = true; listeners.get('visibilitychange')(); assert.equal(frames.size, 0);
  doc.hidden = false; listeners.get('visibilitychange')(); assert.equal(frames.size, 1);
  media.matches = true; mediaListeners.get('change')(); assert.equal(frames.size, 0);
  cleanup(); assert.equal(disconnected, true); assert.equal(listeners.size, 0); assert.equal(mediaListeners.size, 0);
});
