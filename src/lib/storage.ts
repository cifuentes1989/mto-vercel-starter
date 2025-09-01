import { put } from '@vercel/blob';

function rand() {
  return Math.random().toString(36).slice(2);
}

export async function saveDataUrl(folder: string, dataUrl?: string|null){
  if(!dataUrl) return null;
  const [meta, base64] = String(dataUrl).split(',');
  const ext = /image\/(\w+)/.exec(meta || '')?.[1] || 'png';
  const bytes = Buffer.from(base64, 'base64');
  const key = `${folder}/${Date.now()}-${rand()}.${ext}`;
  const blob = await put(key, bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType: `image/${ext}`
  });
  return blob.url;
}

export async function savePdf(name: string, buffer: Buffer){
  const key = `pdfs/${name}.pdf`;
  const blob = await put(key, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/pdf'
  });
  return blob.url;
}
