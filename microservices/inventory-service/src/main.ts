import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3008);
  console.log(`Inventory service listening on port ${process.env.PORT || 3008}`);
}

bootstrap();
