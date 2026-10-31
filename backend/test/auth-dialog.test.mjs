import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../../app/components/AuthDialog.js', import.meta.url), 'utf8');
const compiled = await transform(source, { filename: 'AuthDialog.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' } });

function findForm(node) {
  if (!node?.props) return;
  if (node?.type === 'form') return node;
  return [node?.props?.children].flat().map(child => findForm(child)).find(Boolean);
}

for (const scenario of ['signup', 'pricing signup', 'failed signup', 'signin']) {
  test(`${scenario} completes in the correct place`, async () => {
    const signup = scenario !== 'signin';
    const state = [{}, signup, 'email', false, null, false, '', ''];
    const calls = [], messages = [];
    const user = { name: 'Test student' };
    const fakeReact = { ...require('react'), useEffect() {}, useRef: value => ({ current: value }), useState: () => {
      const value = state.shift();
      return [value, update => messages.push(update)];
    } };
    const module = { exports: {} };
    vm.runInNewContext(compiled.code, { module, exports: module.exports, require: name => {
      if (name === 'react') return fakeReact;
      if (name === 'react-dom') return { createPortal: node => node };
      if (name === 'next/navigation') return { useRouter: () => ({ push: url => calls.push(url) }) };
      if (name === './use-account') return { accountChanged() {}, accountRequest: async body => {
        assert.equal(body.action, signup ? 'signup' : 'signin');
        if (scenario === 'failed signup') throw new Error('Account could not be created.');
        return { user };
      } };
      if (name.startsWith('./')) return () => null;
      return require(name);
    } });
    const props = { onClose: () => calls.push('closed') };
    if (scenario === 'pricing signup') props.onComplete = () => calls.push('/dashboard?plan=all-access');
    const view = module.exports.default(props);
    const elements = Object.fromEntries(['name', 'email', 'whatsapp', 'referral', 'identifier', 'password', 'confirmPassword'].map(name => [name, { value: name.includes('assword') ? 'test-only-password' : 'test' }]));
    await findForm(view).props.onSubmit({ preventDefault() {}, currentTarget: { elements } });
    assert.deepEqual(calls, scenario === 'signup' ? ['/dashboard'] : scenario === 'pricing signup' ? ['/dashboard?plan=all-access'] : []);
    if (scenario === 'failed signup') assert.ok(messages.includes('Account could not be created.'));
    if (scenario === 'signin') assert.ok(messages.includes(user));
  });
}
