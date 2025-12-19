import { Controller, Get, Header } from '@nestjs/common';
import client from 'prom-client';

@Controller()
export class MetricsController {
  constructor() {
    // collect default metrics if not already collecting
    try {
      client.collectDefaultMetrics({ prefix: 'inventory_' });
    } catch (err) {
      // ignore if already initialized
    }
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics() {
    return client.register.metrics();
  }
}
