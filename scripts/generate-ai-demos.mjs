import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { aiLessons } from '../app/dashboard/ai-lessons.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../public/ai-demos/', import.meta.url), { recursive: true });
await mkdir(new URL('../tmp/ai-demo-build/', import.meta.url), { recursive: true });
const font = "fontfile='C\\:/Windows/Fonts/arial.ttf'";
function wrap(text, width) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    if (lines[last] && lines[last].length + word.length + 1 > width) lines.push(word);
    else lines[last] += `${lines[last] ? ' ' : ''}${word}`;
  }
  return lines.join('\n');
}
for (const [index, lesson] of aiLessons.entries()) {
  const prefix = `tmp/ai-demo-build/${lesson.id}`;
  await writeFile(`${root}/${prefix}-title.txt`, wrap(lesson.title, 25));
  await writeFile(`${root}/${prefix}-label.txt`, `BEYOND MARKS AI ACADEMY  /  ${String(index + 1).padStart(2, '0')}`);
  const accent = lesson.color.replace('#', '0x');
  const filters = [
    `drawbox=x=0:y=0:w=720:h=12:color=${accent}:t=fill`,
    `drawbox=x=48:y=270:w=624:h=1:color=${accent}@0.4:t=fill`,
    `drawtext=${font}:textfile='${prefix}-label.txt':fontsize=16:fontcolor=${accent}:x=48:y=55`,
    `drawtext=${font}:textfile='${prefix}-title.txt':fontsize=44:fontcolor=0xf6f0fa:line_spacing=10:x=48:y=125`,
    `drawtext=${font}:text='18 SECOND DEMO PREVIEW':fontsize=15:fontcolor=0xa9a0b5:x=48:y=650`,
  ];
  for (const [pointIndex, point] of lesson.points.entries()) {
    await writeFile(`${root}/${prefix}-${pointIndex}.txt`, `${pointIndex + 1}.\n\n${wrap(point, 38)}`);
    filters.push(`drawtext=${font}:textfile='${prefix}-${pointIndex}.txt':fontsize=29:fontcolor=0xe5dcec:line_spacing=12:x=48:y=320:enable='gte(t,${pointIndex * 6})*lt(t,${(pointIndex + 1) * 6})'`);
  }
  filters.push('fade=t=in:st=0:d=0.3');
  const output = `public/ai-demos/${lesson.id}.mp4`;
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x19151f:s=720x720:r=15:d=18', '-vf', filters.join(','), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], { cwd: root, windowsHide: true, timeout: 60000 });
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', output], { cwd: root, windowsHide: true });
  const metadata = JSON.parse(stdout);
  if (metadata.streams[0]?.width !== 720 || metadata.streams[0]?.height !== 720 || Number(metadata.format.duration) !== 18) throw new Error(`Invalid demo output: ${lesson.id}`);
  console.log(`Verified ${lesson.id}: 720 × 720, 18 seconds`);
}
