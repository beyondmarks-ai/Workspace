export function createDragScroll() {
  let drag = null;
  let suppressClick = false;
  function end(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    drag = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return {
    onPointerDown(event) {
      suppressClick = false;
      // Touch uses the browser's native swipe and momentum scrolling.
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
    },
    onPointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return;
      if (!event.buttons) { end(event); return; }
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 7) return;
      if (!drag.moved) {
        drag.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.dragging = 'true';
      }
      event.preventDefault();
      event.currentTarget.scrollLeft = drag.scroll - distance;
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
    onClickCapture(event) {
      if (!suppressClick || event.detail === 0) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    onDragStart(event) { event.preventDefault(); },
  };
}
