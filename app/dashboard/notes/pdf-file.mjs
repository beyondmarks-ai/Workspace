export async function validatePdf(file) {
  if (!file || file.size === 0) throw new Error('Choose a PDF that contains at least one page.');
  if (!/\.pdf$/i.test(file.name)) throw new Error('Please choose a PDF file.');
  const header = new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer());
  if (!header.includes('%PDF-')) throw new Error('This file does not appear to be a PDF. Please try another file.');
}
