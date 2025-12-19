import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

type WebhookRecord = {
  id: string;
  tenantId: string;
  url: string;
  events: string[]; // e.g., ['product.created','product.updated','product.deleted']
  createdAt: string;
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private storePath = path.join(process.cwd(), 'data', 'webhooks.json');
  private store: WebhookRecord[] = [];

  constructor() {
    this.ensureStore();
    this.load();
  }

  private ensureStore() {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.storePath)) fs.writeFileSync(this.storePath, JSON.stringify([]));
  }

  private load() {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf8');
      this.store = JSON.parse(raw || '[]');
    } catch (err) {
      this.logger.warn('Failed to load webhook store, starting fresh');
      this.store = [];
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2));
    } catch (err) {
      this.logger.error('Failed to persist webhook store: ' + err?.message);
    }
  }

  register(tenantId: string, url: string, events: string[]): WebhookRecord {
    const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const rec: WebhookRecord = { id, tenantId, url, events, createdAt: new Date().toISOString() };
    this.store.push(rec);
    this.persist();
    this.logger.log(`Registered webhook ${id} for tenant ${tenantId} -> ${url}`);
    return rec;
  }

  list(tenantId?: string) {
    return tenantId ? this.store.filter((s) => s.tenantId === tenantId) : this.store;
  }

  remove(id: string) {
    const before = this.store.length;
    this.store = this.store.filter((s) => s.id !== id);
    this.persist();
    return before !== this.store.length;
  }

  async deliver(event: string, tenantId: string, payload: any) {
    const targets = this.store.filter((w) => w.tenantId === tenantId && w.events.includes(event));
    if (!targets.length) return;

    for (const t of targets) {
      this.sendWithRetry(t.url, { event, tenantId, data: payload }).catch((err) =>
        this.logger.error(`Failed to deliver webhook ${t.id} -> ${t.url}: ${err?.message}`),
      );
    }
  }

  private async sendWithRetry(url: string, body: any, attempts = 0): Promise<void> {
    try {
      await axios.post(url, body, { timeout: 5000 });
      this.logger.log(`Delivered webhook to ${url}`);
    } catch (err: any) {
      if (attempts >= 3) {
        this.logger.error(`Giving up webhook to ${url} after ${attempts} attempts: ${err?.message}`);
        return;
      }
      const backoff = Math.pow(2, attempts) * 500;
      this.logger.warn(`Retrying webhook to ${url} in ${backoff}ms (attempt ${attempts + 1})`);
      await new Promise((res) => setTimeout(res, backoff));
      return this.sendWithRetry(url, body, attempts + 1);
    }
  }
}
