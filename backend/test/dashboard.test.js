import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPlanName, getPreviewPlan, lessons } from '../../app/dashboard/preview-data.mjs';
import { aiLessons } from '../../app/dashboard/ai-lessons.mjs';
import { readFile } from 'node:fs/promises';
import { createDragScroll } from '../../app/dashboard/drag-scroll.mjs';

test('lesson drag scroll moves the row without accidentally opening a class', () => {
  const handlers = createDragScroll();
  let captured = false;
  const row = { scrollLeft: 80, dataset: {}, setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; } };
  const event = { pointerType: 'mouse', pointerId: 1, button: 0, buttons: 1, clientX: 200, currentTarget: row, preventDefault() {} };
  handlers.onPointerDown(event);
  handlers.onPointerMove({ ...event, clientX: 196 });
  assert.equal(row.scrollLeft, 80, 'Small click movement is not a drag');
  assert.equal(captured, false);
  handlers.onPointerMove({ ...event, clientX: 100 });
  assert.equal(row.scrollLeft, 180);
  assert.equal(row.dataset.dragging, 'true');
  handlers.onPointerUp(event);
  assert.equal(captured, false);
  assert.equal(row.dataset.dragging, undefined);
  let prevented = false, stopped = false;
  handlers.onClickCapture({ detail: 1, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.ok(prevented && stopped);
  handlers.onPointerDown(event);
  handlers.onPointerUp(event);
  handlers.onClickCapture({ detail: 1, preventDefault() { assert.fail('Ordinary Play/Notes/Talk clicks must work'); } });
});

test('native touch swipes and keyboard activation remain available; cancellation releases drag', () => {
  const handlers = createDragScroll();
  let captured = false;
  const row = { scrollLeft: 0, dataset: {}, setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; } };
  const event = { pointerType: 'touch', pointerId: 2, button: 0, buttons: 1, clientX: 200, currentTarget: row, preventDefault() { assert.fail('Touch must retain native scrolling'); } };
  handlers.onPointerDown(event);
  handlers.onPointerMove({ ...event, clientX: 100 });
  assert.equal(captured, false);
  assert.equal(row.scrollLeft, 0);
  handlers.onPointerDown({ ...event, pointerType: 'mouse' });
  handlers.onPointerMove({ ...event, pointerType: 'mouse', clientX: 100, preventDefault() {} });
  handlers.onPointerCancel(event);
  assert.equal(captured, false);
  assert.equal(row.dataset.dragging, undefined);
  handlers.onClickCapture({ detail: 0, preventDefault() { assert.fail('Keyboard activation must still work'); } });
});

test('all ten AI demo lessons have distinct content, notes and real local MP4 previews', async () => {
  assert.equal(aiLessons.length, 10);
  assert.equal(new Set(aiLessons.map(lesson => lesson.id)).size, 10);
  for (const lesson of aiLessons) {
    assert.match(lesson.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(lesson.title && lesson.summary && lesson.category);
    assert.ok(lesson.coverTitle);
    assert.equal(lesson.duration, '0:18', 'Duration badge matches the generated demo length');
    assert.equal(lesson.points.length, 3);
    assert.ok(lesson.points.every(point => typeof point === 'string' && point.length > 20));
    const video = await readFile(new URL(`../../public/ai-demos/${lesson.id}.mp4`, import.meta.url));
    assert.equal(video.toString('ascii', 4, 8), 'ftyp');
    assert.ok(video.length > 10000);
  }
});

test('dashboard shows only a recognized pricing selection without inventing a purchase', () => {
  assert.equal(getDashboardPlanName('classes'), 'Classes');
  assert.equal(getDashboardPlanName('interactive'), 'Interactive');
  assert.equal(getDashboardPlanName('all-access'), 'All Access');
  for (const invalid of [undefined, null, '', 'unknown', '__proto__', ['classes'], {}]) {
    assert.equal(getDashboardPlanName(invalid), 'Your learning plan');
  }
});
import { quotes, quoteAt, nextQuoteDelay, QUOTE_INTERVAL_MS } from '../../app/dashboard/quotes.mjs';

test('quote collection contains 100+ unique, short single-line reflections', () => {
  assert.ok(quotes.length > 100);
  assert.equal(new Set(quotes).size, quotes.length);
  assert.ok(quotes.every(quote => quote.length <= 42 && !/[\r\n]/.test(quote)));
});

test('quotes stay stable for five hours, rotate at the boundary, and wrap', () => {
  assert.equal(QUOTE_INTERVAL_MS, 18_000_000);
  assert.equal(quoteAt(0), quotes[0]);
  assert.equal(quoteAt(QUOTE_INTERVAL_MS - 1), quotes[0]);
  assert.equal(quoteAt(QUOTE_INTERVAL_MS), quotes[1]);
  assert.equal(quoteAt(QUOTE_INTERVAL_MS * quotes.length), quotes[0]);
  const resumedAt = QUOTE_INTERVAL_MS * 7 + 4321;
  assert.equal(quoteAt(resumedAt), quotes[7]);
  assert.equal(nextQuoteDelay(resumedAt), QUOTE_INTERVAL_MS - 4321);
  assert.equal(nextQuoteDelay(QUOTE_INTERVAL_MS), QUOTE_INTERVAL_MS);
  assert.equal(nextQuoteDelay(QUOTE_INTERVAL_MS - 1), 1);
});

test('pricing previews keep plan-specific course features and reject unknown plan keys', () => {
  assert.equal(getPreviewPlan('classes').interactive, false);
  assert.equal(getPreviewPlan('classes').credits, null);
  assert.equal(getPreviewPlan('interactive').duration, '3 months');
  assert.equal(getPreviewPlan('all-access').credits, '2,000 credits / week');
  assert.equal(getPreviewPlan('__proto__').name, 'Interactive');
  assert.equal(getPreviewPlan(undefined).name, 'Interactive');
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
});
