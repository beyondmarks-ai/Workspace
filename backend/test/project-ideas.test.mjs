import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { projectIdeas } from '../../app/dashboard/projects/project-ideas.mjs';
import { course } from '../../app/dashboard/system-design.mjs';

test('each course module has an actionable project brief linked to its actual lessons', async () => {
  assert.equal(projectIdeas.length, course.sessions.length);
  assert.equal(new Set(projectIdeas.map(project => project.id)).size, projectIdeas.length);
  assert.equal(new Set(projectIdeas.map(project => project.session.id)).size, course.sessions.length);
  for (const project of projectIdeas) {
    assert.equal(project.session, course.sessions[project.number - 1]);
    assert.ok(project.title && project.summary && project.goal);
    assert.equal(project.steps.length, 3);
    assert.ok(project.steps.every(step => step.length > 20));
    assert.equal(project.session.lessons.length, 10);
    await access(new URL(`../../public${project.image}`, import.meta.url));
  }
});
