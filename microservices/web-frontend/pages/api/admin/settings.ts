import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function base64ToBuffer(dataUrl: string) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  const base64 = matches[2];
  return Buffer.from(base64, 'base64');
}

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { title: 'Colorcom', brandColor: '#fcca19', favicon: '/favicon.ico', updatedAt: new Date().toISOString() };
  }
}

async function writeSettings(obj: Record<string, any>) {
  obj.updatedAt = new Date().toISOString();
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf8');
  return obj;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const settings = await readSettings();
    return res.status(200).json(settings);
  }

  // POST requires admin key
  const adminKey = process.env.ADMIN_KEY;
  const headerKey = req.headers['x-admin-key'];
  if (!adminKey || headerKey !== adminKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const { title, brandColor, faviconBase64 } = req.body as { title?: string; brandColor?: string; faviconBase64?: string };
    const settings = await readSettings();

    if (title) settings.title = String(title).slice(0, 200);
    if (brandColor) settings.brandColor = String(brandColor).slice(0, 20);

    if (faviconBase64) {
      const buf = base64ToBuffer(faviconBase64 as string);
      if (!buf) return res.status(400).json({ error: 'Invalid favicon data URL' });
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const fileName = `favicon-${Date.now()}.ico`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      await fs.writeFile(filePath, buf);

      // cleanup old file if under uploads
      try {
        if (settings.favicon && settings.favicon.startsWith('/uploads/')) {
          const old = path.join(process.cwd(), 'public', settings.favicon);
          await fs.unlink(old).catch(() => {});
        }
      } catch (e) {
        // ignore
      }

      settings.favicon = `/uploads/${fileName}`;
    }

    const updated = await writeSettings(settings);
    return res.status(200).json(updated);
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method Not Allowed');
}
