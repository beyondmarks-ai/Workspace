import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../../app/components/AuthDialog.js', import.meta.url), 'utf8');
const compiled = await transform(source, { filename: 'AuthDialog.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' } });

function findNode(node, type) {
  if (!node?.props) return;
  if (node.type === type) return node;
  return [node.props.children].flat().map(child => findNode(child, type)).find(Boolean);
}

for (const scenario of ['signup', 'pricing signup', 'failed signup', 'signin', 'pricing signin', 'failed signin', 'phone signin', 'pricing phone signin']) {
  test(`${scenario} completes in the correct place`, async () => {
    const signup = scenario.includes('signup');
    const phone = scenario.includes('phone');
    const state = [{}, signup, phone ? 'phone' : 'email', false, '', ''];
    const PhoneVerification = () => null;
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
        if (scenario.startsWith('failed')) throw new Error('Authentication failed.');
        return { user };
      } };
      if (name === './PhoneVerification') return PhoneVerification;
      if (name.startsWith('./')) return () => null;
      return require(name);
    } });
    const props = { onClose: () => calls.push('closed') };
    if (scenario.startsWith('pricing')) props.onComplete = () => calls.push('/dashboard?plan=all-access');
    const view = module.exports.default(props);
    const elements = Object.fromEntries(['name', 'email', 'whatsapp', 'referral', 'identifier', 'password', 'confirmPassword'].map(name => [name, { value: name.includes('assword') ? 'test-only-password' : 'test' }]));
    if (phone) findNode(view, PhoneVerification).props.onComplete(user);
    else await findNode(view, 'form').props.onSubmit({ preventDefault() {}, currentTarget: { elements } });
    assert.deepEqual(calls, scenario.startsWith('failed') ? [] : scenario.startsWith('pricing') ? ['/dashboard?plan=all-access'] : ['/dashboard']);
    if (scenario.startsWith('failed')) assert.ok(messages.includes('Authentication failed.'));
  });
}
