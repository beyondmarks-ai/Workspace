import test from 'node:test';
import assert from 'node:assert/strict';
import { needsSharedSidebar } from '../../app/components/navigation-scope.mjs';

test('sidebar is confined to dashboard areas and never duplicated in the classroom', () => {
  for (const path of ['/', '/pricing', '/phone-signin', '/admin', '/dashboard-other', null]) {
    assert.equal(needsSharedSidebar(path), false, path);
    assert.equal(needsSharedSidebar(path, true), false, path);
  }
  assert.equal(needsSharedSidebar('/dashboard'), false);
  assert.equal(needsSharedSidebar('/dashboard', true), true);
  for (const path of ['/dashboard/projects', '/dashboard/agent', '/dashboard/notes']) {
    assert.equal(needsSharedSidebar(path), true);
    assert.equal(needsSharedSidebar(path, true), true);
  }
});
