import { Controller, Post, Get, Delete, Body, Request, Param } from '@nestjs/common';
import { WebhookService } from '../webhooks/webhook.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('register')
  register(@Body() body: { url: string; events: string[] }, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.webhookService.register(tenantId, body.url, body.events || []);
  }

  @Get()
  list(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    return this.webhookService.list(tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const ok = this.webhookService.remove(id);
    return { deleted: ok };
  }
}
