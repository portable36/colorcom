import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Product import/export (e2e) - skeleton', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products/export (GET) returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/products/export').set('x-tenant-id', 'default');
    expect(res.status).toBe(200);
  });
});
