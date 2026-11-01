'use client';

import { useEffect, useRef } from 'react';

export default function PdfReveal({ label = 'Finding the right passage' } = {}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const started = performance.now();
    let frame = 0, width = 0, height = 0;

    function draw(now) {
      const elapsed = Math.max(0, now - started);
      const t = motion.matches ? 0 : elapsed / 1800;
      context.clearRect(0, 0, width, height);
      const spacing = Math.max(13, Math.max(width, height) / 42);
      const columns = Math.floor((width - 48) / spacing);
      const rows = Math.floor((height - 100) / spacing);
      const left = (width - columns * spacing) / 2;
      const top = (height - rows * spacing) / 2;
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
          const x = left + col * spacing, y = top + row * spacing;
          const wave = (Math.sin(col * .22 + t * 1.2 + Math.sin(row * .16 - t * .7) * 2) + 1) / 2;
          const sweep = (Math.cos(row * .24 - t * .9 + col * .11) + 1) / 2;
          const strength = wave * (.35 + sweep * .65);
          const edge = Math.min(1, col / 4, (columns - col) / 4, row / 3, (rows - row) / 3);
          context.fillStyle = `rgba(255,195,96,${(.32 + strength * .68) * Math.max(0, edge)})`;
          context.beginPath();
          context.arc(x, y, 1.1 + strength * spacing * .16, 0, Math.PI * 2);
          context.fill();
        }
      }

    }

    function tick(now) {
      draw(now);
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      if (document.hidden) return;
      draw(performance.now());
      if (!motion.matches) frame = requestAnimationFrame(tick);
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      resume();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    motion.addEventListener('change', resume);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
      motion.removeEventListener('change', resume);
    };
  }, []);

  return <div className="notes-pdf-reveal">
    <canvas ref={canvasRef} className="notes-pdf-particles" aria-hidden="true"/>
    <div className="notes-pdf-reveal-heading"><span role="status">{label}</span></div>
    <div className="notes-pdf-reveal-footer" aria-hidden="true"><span>BEYOND MARKS</span><span className="notes-pdf-activity"><i/><i/><i/></span></div>
  </div>;
}
