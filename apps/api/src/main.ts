import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true });
  app.use(helmet());
  await app.listen(process.env.PORT || 4000);
  console.log(`API running on http://localhost:${process.env.PORT || 4000}`);
}
bootstrap();
