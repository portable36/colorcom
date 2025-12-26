import React, { useState, useEffect } from 'react';
import { useSettings } from '../../lib/useSettings';

export default function AdminSettings() {
  const { settings, mutate } = useSettings();
  const [title, setTitle] = useState('');
  const [brandColor, setBrandColor] = useState('#fcca19');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setTitle(settings.title || '');
      setBrandColor(settings.brandColor || '#fcca19');
    }
  }, [settings]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Saving...');

    let faviconBase64: string | undefined;
    if (faviconFile) {
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(faviconFile);
      });
      if (!dataUrl) return setStatus('Failed to read favicon file');
      faviconBase64 = dataUrl;
    }

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ title, brandColor, faviconBase64 }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus(`Error: ${body?.error || res.statusText}`);
      return;
    }

    const updated = await res.json();
    mutate(updated, false);
    setStatus('Saved ✔');
    setTimeout(() => setStatus(null), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-semibold mb-4">Admin - Site Settings</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Site Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Brand Color</label>
          <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Favicon</label>
          <input type="file" accept="image/*" onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)} className="mt-1" />
          {settings?.favicon ? (
            <div className="mt-2">
              <img src={settings.favicon} alt="current favicon" width={32} height={32} />
              <span className="ml-2 text-sm">Current</span>
            </div>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium">Admin Key (x-admin-key)</label>
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">Provide the admin key (stored in `ADMIN_KEY`).</p>
        </div>
        <div>
          <button type="submit" className="inline-flex items-center rounded bg-sky-600 text-white px-4 py-2">Save</button>
          {status ? <span className="ml-3">{status}</span> : null}
        </div>
      </form>
    </div>
  );
}
