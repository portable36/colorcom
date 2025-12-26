import handler from '../pages/api/admin/settings';
import { NextApiRequest, NextApiResponse } from 'next';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

const fs = require('fs/promises');

function createReqRes(method = 'GET', body?: any, headers?: Record<string,string>) {
  const req = { method, body, headers: headers || {} } as unknown as NextApiRequest;
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return { req, res: res as NextApiResponse };
}

describe('API /api/admin/settings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET returns settings (fallback)', async () => {
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('no file'));
    const { req, res } = createReqRes('GET');
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('POST without admin key is forbidden', async () => {
    const { req, res } = createReqRes('POST', { title: 'X' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('POST updates settings and saves favicon', async () => {
    process.env.ADMIN_KEY = 'secret-test';
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ title: 'Colorcom' }));

    const fakeDataUrl = 'data:image/x-icon;base64,AAABAAEA';
    const { req, res } = createReqRes('POST', { title: 'New title', faviconBase64: fakeDataUrl }, { 'x-admin-key': 'secret-test' });

    await handler(req, res);

    expect(fs.writeFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
